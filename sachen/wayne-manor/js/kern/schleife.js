// Wayne Manor 3D – Bildschleife und Plateau-Anheben (liftPlateau)
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Schleife =====================
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (walking) walkStep(dt);
  else { controls.update(); const gy = terrainH(camera.position.x, camera.position.z) + 3; if (!belowView && camera.position.y < gy) camera.position.y = gy; }
  // Unter Wasser: blauer, dichter Nebel (wie im Pool der Villa)
  {
    const cw = walking && !ghost ? waterAt(camera.position.x, camera.position.z) : null, uw = cw !== null && camera.position.y < cw;
    if (uw) { scene.fog.color.set(0x0c3d55); scene.background.set(0x0c3d55); scene.fog.near = 0.5; scene.fog.far = 12; }
    else if (scene.fog.far < 100) { scene.fog.near = 350; scene.fog.far = 1500; applyNight(); }
  }
  updateLift(dt);
  updateLiftPanel();
  updateGates(dt);
  // Wasser bewegen (A7): Texturen laufen, Schaum dreht, Nebel pulsiert
  for (const [o, v, kind] of waterAnim) {
    if (kind === "spin") o.rotation.y += dt * v;
    else if (kind === "mist") { const tt = clock.elapsedTime + v; o.material.opacity = 0.35 + 0.2 * Math.sin(tt * 1.3); o.position.y += Math.sin(tt * 0.9) * dt * 0.3; }
    else o.offset.y = (o.offset.y + dt * v / 2.2) % 1;
  }
  if (CAR_LIFT) {
    CAR_LIFT.update(dt);
    if (walking && !ghost && !CAR.on && CAR_LIFT.L.state === "moving" && CAR_LIFT.inCar(player.pos)) { player.pos.y = CAR_LIFT.L.y; player.vy = 0; player.onGround = true; camera.position.y = CAR_LIFT.L.y + EYE; }
  }
  carFrame(dt);
  if (walking && !ghost && LIFT.state === "moving" && inCar(player.pos)) { player.pos.y = LIFT.y; player.vy = 0; player.onGround = true; camera.position.y = LIFT.y + EYE; }
  const pc = caveAt(player.pos.x, player.pos.z), inCave = pc === 1 || pc === 2 || pc === 4 || caveUpAt(player.pos.x, player.pos.z);
  const ut = (!walking && belowView) ? 0.6 : walking && ((player.pos.y < terrainH(player.pos.x, player.pos.z) - 2 && wfInTunnel(player.pos.x, player.pos.z)) || (player.pos.y < HILL - 2 && (inRect(HF_TUN, player.pos.x, player.pos.z) || inRect(CSH_OUT, player.pos.x, player.pos.z))) || (player.pos.y < GY + HILL + 2 && inPoly(GARAGE, player.pos.x, player.pos.z)) || (player.pos.y < -8 && inCave)) ? 1 : 0;
  if (!BOAT.on) { boatReturn(); boatPose(); }
  // Drehende Tiefgarage: langsam (eine Runde in ca. 2 Minuten), wer darauf steht, dreht mit
  {
    const tt = world.userData.turntable, w = dt * 0.05;
    tt.rotation.y += w;
    if (walking && !ghost && player.onGround) {
      const p = player.pos, dx = p.x - tt.position.x, dz = p.z - tt.position.z;
      if (Math.abs(p.y - LY) < 0.3 && dx * dx + dz * dz < (60 * CAVE_SC) ** 2) {
        const c = Math.cos(w), s = Math.sin(w);
        p.x = tt.position.x + dx * c + dz * s; p.z = tt.position.z - dx * s + dz * c; player.yaw += w;
      }
    }
  }
  if (ut !== under) { under = ut > under ? Math.min(ut, under + dt * 2) : Math.max(ut, under - dt * 2); applyNight(); }
  const rn = night < nightTarget ? Math.min(nightTarget, night + dt * 0.8) : Math.max(nightTarget, night - dt * 0.8);
  if (rn !== night) { night = rn; applyNight(); }
  const focus = walking ? player.pos : controls.target;
  sun.position.copy(focus).addScaledVector(SUN_DIR, 90);
  sun.target.position.copy(focus);
  sun.target.updateMatrixWorld();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
// A2: alles auf dem Plateau (ueber y -6, also nicht die Hoehlen) um die Plateauhoehe an seiner Mitte anheben, samt Kollision.
// Ausgenommen: Gelaende, Wald, Meer (zu gross), Teile auf dem Gelaende (ribbon) und schon in Endhoehe gebaute Teile (noLift).
{
  const bb = new THREE.Box3(), lifted = [0, 0, 0];
  const tops = [...world.children, ...scene.children.filter(o => o !== world)];
  for (const o of tops) {
    if (o.userData.noLift || o === sun || o === sun.target || o.isHemisphereLight || o.isAmbientLight) continue;
    let cx, cz, minY;
    if (o.isLight) { cx = o.position.x; cz = o.position.z; minY = o.position.y; }
    else {
      bb.setFromObject(o);
      if (bb.isEmpty() || bb.max.x - bb.min.x > 300 || bb.max.z - bb.min.z > 300) continue;
      cx = (bb.min.x + bb.max.x) / 2; cz = (bb.min.z + bb.max.z) / 2; minY = bb.min.y;
    }
    if (minY < -6) continue;
    const d = plateauH(cx, cz);
    if (d > 0.01) { o.position.y += d; lifted[0]++; }
  }
  for (const s of solids) {
    if (s.noLift || s.y0 < -6.5) continue;
    const d = plateauH((s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2);
    if (d > 0.01) { s.y0 += d; s.y1 += d; lifted[1]++; }
  }
  for (const c of circles) {
    if (c[3] === undefined || c[3] < -6) continue;
    const d = plateauH(c[0], c[1]);
    if (d > 0.01) { c[3] += d; lifted[2]++; }
  }
  world.userData.lifted = lifted;
}
