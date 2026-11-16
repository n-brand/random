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
  const sh = new THREE.Shape(), P = [[0, -0.16], [0.05, -0.3], [0.09, -0.18], [0.3, -0.24], [0.62, -0.34], [1, -0.05], [0.78, 0.02], [0.66, 0.24], [0.5, 0.08], [0.36, 0.3], [0.22, 0.12], [0, 0.36]];
  P.forEach(([x, y], i) => sh[i ? "lineTo" : "moveTo"](x * 0.16, -y * 0.16)); for (let i = P.length - 2; i >= 0; i--) sh.lineTo(-P[i][0] * 0.16, -P[i][1] * 0.16);
  const bat = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false }); bat.rotateX(-Math.PI / 2);
  const smokeT = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, "rgba(200,200,205,0.9)"); g.addColorStop(0.6, "rgba(170,172,178,0.45)"); g.addColorStop(1, "rgba(150,150,155,0)"); c.fillStyle = g; c.fillRect(0, 0, w, w); });
  const rope = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x222222 })); rope.visible = false; rope.frustumCulled = false; scene.add(rope);
  return { bat, batM: new THREE.MeshStandardMaterial({ color: 0x1b1d21, metalness: 0.7, roughness: 0.35 }), bomb: new THREE.SphereGeometry(0.09, 10, 8), bombM: new THREE.MeshStandardMaterial({ color: 0x4a4e55, roughness: 0.6 }), smokeT, rope };
})();
// Blickstrahl aus der Bildmitte: erster Treffer bis max m -> { p, hit } oder null
function aimHit(max) { AIM_ray.setFromCamera({ x: 0, y: 0 }, camera); const o = AIM_ray.ray.origin, d = AIM_ray.ray.direction, a = o.clone().addScaledVector(d, 0.6), b = new THREE.Vector3();
  for (let s = 0.6; s < max; s += 3) { b.copy(o).addScaledVector(d, Math.min(max, s + 3)); const h = shotSeg(a, b, null, 0.25); if (h) return h; a.copy(b); } return null; }
function weaponUse() {
  const id = weaponHeld(); if (!id || !onFoot() || AIM.cd > 0 || AIM.grap) return;
  AIM_ray.setFromCamera({ x: 0, y: 0 }, camera); const d = AIM_ray.ray.direction.clone(), o = camera.position.clone().addScaledVector(d, 0.5); o.y -= 0.15;
  if (id === "batarang" || id === "rauchbombe") {
    if (!invTake(id, 1)) return; AIM.cd = 0.35; const bat = id === "batarang", m = new THREE.Mesh(bat ? AIM_M.bat : AIM_M.bomb, bat ? AIM_M.batM : AIM_M.bombM);
    m.position.copy(o); m.userData.dynamic = true; scene.add(m); const v = d.multiplyScalar(bat ? 42 : 17); if (!bat) v.y += 3.5;
    AIM.proj.push({ id, m, v, t: 0, stuck: 0 }); if (!invHas(id)) toast(INV_ITEMS[id].name + ": das war der letzte");
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
function aimSmoke(p) { const S = { t: 0, s: [] }; for (let k = 0; k < 26; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: AIM_M.smokeT, transparent: true, depthWrite: false, opacity: 0.75 }));
    s.position.copy(p); s.position.y += 0.4; const a = Math.random() * 6.28, r = Math.random(); s.userData.v = new THREE.Vector3(Math.cos(a) * 3 * r, 0.6 + Math.random() * 1.6, Math.sin(a) * 3 * r); s.userData.r = 0.5 + r; s.userData.dynamic = true; scene.add(s); S.s.push(s); }
  AIM.smoke.push(S); shotSound?.(0.25, 0.4); }
// Maus: rechts halten = zielen, links (gefangen) = benutzen. Laeuft vor dem Rechtsklick in tore.js (dort wird bei Waffe abgebrochen).
renderer.domElement.addEventListener("mousedown", e => { if (touch || !onFoot() || !weaponHeld()) return;
  if (e.button === 2) { e.preventDefault(); AIM.on = true; } else if (e.button === 0 && dragging) weaponUse(); });
addEventListener("mouseup", e => { if (e.button === 2) AIM.on = false; });
document.getElementById("btn-aim")?.addEventListener("click", e => { e.currentTarget.blur(); AIM.on = !AIM.on && onFoot() && !!weaponHeld(); });
document.getElementById("btn-use")?.addEventListener("click", e => { e.currentTarget.blur(); weaponUse(); });
