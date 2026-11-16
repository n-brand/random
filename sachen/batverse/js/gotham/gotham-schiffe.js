// Batverse – Gotham: fahrbare Schiffe (Nicolas 2026-11-16 "Schiffe sollen fahrbar sein beim Hafen"). Klassisches Skript vor gotham-hafen.js.
// SHIP.list: Containerschiff am Kai (gotham-hafen.js meldet es an) und ein Hafenschlepper. Rechtsklick aufs Schiff = einsteigen (wie die anderen Fahrzeuge),
// W/S Gas/Rueckwaerts, A/D Ruder, V Kamera, Shift aussteigen (an den Kai in der Naehe, sonst aufs Deck).
// Wasser: GOT.water + Abstand zum Ufer (GOT.dw, 8-m-Raster): ein Zug ist erlaubt, wenn alle Rumpfpunkte mind. 1 m im Wasser liegen oder er weg vom Ufer fuehrt.
// Das Containerschiff ist hoeher als die Bruecken (22 m ueber dem Wasser) und kommt nicht darunter durch; der Schlepper schon.
// Geparkt: Deck als dkAdd begehbar; beim Fahren wird es entfernt. Nur Optik gegen andere Schiffe (keine Kollision Schiff-Schiff).
"use strict";
const SHIP = { list: [], cur: null, view: 0, t: 0 };
const shipOn = () => !!SHIP.cur;
// Schiff anmelden: g (Gruppe, Pivot = Drehpunkt in Weltkoordinaten, Rotation 0 bei h0), h (Kurs: vorne = (-sin h, -cos h)), Masse und Fahrwerte
function shipAdd(o) {
  const S = Object.assign({ v: 0, rud: 0, bob: 0, dk: null, deckY: GOT.WY + 2, label: "Schiff", maxV: 8, acc: 1, turn: 0.3, tall: false, cam: [30, 12] }, o);
  S.x = S.g.position.x; S.z = S.g.position.z; S.pts = shipPts(S); S.home = { x: S.x, z: S.z, h: S.h }; S.isShip = true; SHIP.list.push(S); shipPark(S); return S;
}
const shipPts = S => { const hl = S.L / 2, hw = S.W / 2; return [[0, -hl], [-hw * 0.5, -hl * 0.8], [hw * 0.5, -hl * 0.8], [-hw, -hl * 0.4], [hw, -hl * 0.4], [-hw, 0], [hw, 0], [-hw, hl * 0.4], [hw, hl * 0.4], [-hw, hl], [hw, hl], [0, hl]]; };   // [quer, laengs], Bug bei -L/2
function shipScore(S, x, z, h) {   // Abstand zum Ufer am kritischsten Rumpfpunkt (GOT.dw, negativ = im Wasser); 99 = gesperrt
  const s = Math.sin(h), c = Math.cos(h); let worst = -1e9;
  for (const [q, l] of S.pts) { const px = x + q * c + l * s, pz = z - q * s + l * c, dw = GOT.dw(px, pz);
    if (dw > 4 || GOT.edgeSD(px, pz) < 0.5) return 99;                                     // Festland (8-m-Raster) bzw. Insel (Kaikante genau)
    if (S.tall && gothamBridgeAt(px, pz, GBR.Y) !== null) return 99; worst = Math.max(worst, dw); }
  return worst;
}
function shipPark(S) { if (S.dk) dkRemove(S.dk); const fx = -Math.sin(S.h), fz = -Math.cos(S.h); S.dk = dkAdd({ cx: S.x, cy: (GOT.WY - 6 + S.deckY) / 2, cz: S.z, ux: fx, uz: fz, hl: S.L / 2 - 1, hw: S.W / 2 - 0.4, hh: (S.deckY - GOT.WY + 6) / 2, m: 0.3 }); }
function shipPose(S) { S.g.position.set(S.x, Math.sin(SHIP.t * 0.9 + S.x * 0.01) * (S.L > 60 ? 0.04 : 0.12), S.z); S.g.rotation.set(0, S.h - S.h0, (S.L > 60 ? 0.2 : 1) * 0.01 * Math.sin(SHIP.t * 1.3) - S.rud * Math.min(1, Math.abs(S.v) / S.maxV) * (S.L > 60 ? 0.01 : 0.05), "YXZ"); }
function useShip(S) {
  if (!walking) return false;
  if (SHIP.cur) {   // aussteigen: Kai in der Naehe (Strassenhoehe, kein Wasser), sonst aufs Deck
    const C = SHIP.cur; let best = null;
    for (let r = C.W / 2 + 2; r <= C.L / 2 + 40 && !best; r += 2) for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2, x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r;
      if (GOT.water(x, z) || GOT.edgeSD(x, z) > -1.5) continue; const g = groundAt(x, z, GOT.STR + 2); if (Math.abs(g - GOT.STR) > 1.6) continue; const q = new THREE.Vector3(x, g, z); pushOut(q, g); if (Math.hypot(q.x - x, q.z - z) > 0.05) continue; best = [x, g, z]; break; }
    SHIP.cur = null; C.v = 0; C.rud = 0; engineStop(); shipPark(C);
    if (best) { player.pos.set(best[0], best[1], best[2]); toast("Ausgestiegen am Kai"); }
    else { player.pos.set(C.x, C.deckY + 0.1, C.z); toast("Ausgestiegen aufs Deck (kein Kai in der Nähe)"); }
    player.vy = 0; return true;
  }
  if (!S) return false;
  const p = player.pos, s = Math.sin(S.h), c = Math.cos(S.h), dx = p.x - S.x, dz = p.z - S.z, q = dx * c - dz * s, l = dx * s + dz * c;
  if (Math.abs(q) > S.W / 2 + 14 || Math.abs(l) > S.L / 2 + 14) return false;
  if (S.dk) { dkRemove(S.dk); S.dk = null; }
  SHIP.cur = S; S.v = 0; keys.clear(); engineStart("Boot"); player.yaw = S.h; player.pitch = -0.2;
  toast(S.label + ": W/S Gas und Rückwärts, A/D Ruder, V Kamera, Shift aussteigen" + (S.tall ? " · zu hoch für die Brücken" : ""));
  shipSeat(S); return true;
}
function shipSeat(S) {
  const s = Math.sin(S.h), c = Math.cos(S.h);
  if (SHIP.view === 1) { const br = S.bridge || [0, S.L * 0.3, 10]; player.pos.set(S.x + br[0] * c + br[1] * s, GOT.WY + br[2], S.z - br[0] * s + br[1] * c); camera.position.set(player.pos.x, player.pos.y, player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0, "YXZ"); return; }
  const [D, H0] = S.cam, H = Math.max(H0 * 0.4, Math.min(H0 * 2.2, H0 - player.pitch * H0 * 2)), tx = S.x, ty = GOT.WY + S.cam[1] * 0.35, tz = S.z;
  camera.position.set(tx + Math.sin(player.yaw) * D, GOT.WY + H, tz + Math.cos(player.yaw) * D); camera.lookAt(tx, ty, tz);
  player.pos.set(S.x, S.deckY + 0.1, S.z);
}
function shipStep(dt) {
  const S = SHIP.cur; if (!S) return; SHIP.t += dt;
  let th = 0, st = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) th += 1; if (keys.has("KeyS") || keys.has("ArrowDown")) th -= 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) st += 1; if (keys.has("KeyD") || keys.has("ArrowRight")) st -= 1;
  th -= moveStick.y; st -= moveStick.x; look(lookStick.x * 2.6 * dt, lookStick.y * 1.8 * dt);
  S.v += th * S.acc * dt; if (!th) S.v *= Math.pow(0.7, dt); S.v = Math.max(-S.maxV * 0.35, Math.min(S.maxV, S.v));
  S.rud += (st - S.rud) * Math.min(1, dt * (S.L > 60 ? 0.6 : 2.5));
  const cur = shipScore(S, S.x, S.z, S.h), ok = sc => sc < 99 && (sc < -1 || sc <= cur + 0.2);
  const dh = S.rud * S.turn * dt * Math.min(1, Math.abs(S.v) / (S.maxV * 0.3)) * Math.sign(S.v || 1);
  if (dh && ok(shipScore(S, S.x, S.z, S.h + dh))) { S.h += dh; player.yaw += dh; }
  const nx = S.x - Math.sin(S.h) * S.v * dt, nz = S.z - Math.cos(S.h) * S.v * dt;
  if (S.v && ok(shipScore(S, nx, nz, S.h))) { S.x = nx; S.z = nz; } else if (S.v) { if (Math.abs(S.v) > 1.5) toast(S.tall && shipScore({ ...S, tall: false }, nx, nz, S.h) < 99 ? "Zu hoch für die Brücke" : "Zu nah am Ufer"); S.v *= -0.2; }
  shipPose(S); shipSeat(S);
  engineUpdate({ v: Math.abs(S.v) * (S.L > 60 ? 1.6 : 1.3), throttle: Math.abs(th) > 0.1 ? 1 : 0, air: false, wet: false });
}
// je Bild (schleife.js): nicht gefahrene Schiffe schaukeln leicht
function shipIdle(dt) { SHIP.t += SHIP.cur ? 0 : dt; for (const S of SHIP.list) if (S !== SHIP.cur && Math.abs(camera.position.x - S.x) < 1500 && Math.abs(camera.position.z - S.z) < 1500) shipPose(S); }
// Hafenschlepper (eigener Entwurf): 26 x 9 m, roter Rumpf, schwarzes Schanzkleid, weisser Aufbau mit Steuerhaus, gelb-schwarzer Schornstein, Fender; vorne = -z
function buildTug() {
  const g = new THREE.Group(), M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.15 }), red = M(0xa3221c), blk = M(0x1c1d20), wht = M(0xeeeeea), yel = M(0xe8b52a), win = M(0x1d2a38), wood = M(0x6a5a48);
  const box = (m, x, y, z, w, h, d) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  const hull = (m, y0, y1, w, inset) => { const sh = new THREE.Shape(), L = 26, b = w / 2; sh.moveTo(-b, L / 2); sh.lineTo(b, L / 2); sh.lineTo(b, -L / 2 + 7); sh.quadraticCurveTo(b * 0.8, -L / 2 + 1, 0, -L / 2 + inset); sh.quadraticCurveTo(-b * 0.8, -L / 2 + 1, -b, -L / 2 + 7); sh.lineTo(-b, L / 2);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false }); geo.rotateX(Math.PI / 2); geo.translate(0, y1, 0); const o = new THREE.Mesh(geo, m); o.castShadow = true; g.add(o); return o; };
  hull(red, -2.4, 0.6, 9, 0); hull(blk, 0.6, 2.4, 9.1, 0.2); hull(wood, 2.4, 2.5, 8.4, 1.2);
  box(wht, 0, 4, -1.5, 6.4, 3, 9); box(wht, 0, 6.6, -2.6, 5.4, 2.2, 5); box(win, 0, 6.8, -2.6, 5.5, 1.1, 5.1); box(blk, 0, 7.85, -2.6, 6, 0.3, 5.6);
  box(yel, 0, 8.4, 3.2, 1.8, 3.5, 1.8); box(blk, 0, 10.5, 3.2, 1.85, 0.9, 1.85); box(blk, 0, 10.2, -3.6, 0.15, 4, 0.15);
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.22, 6, 12), blk); f.position.set(i % 2 ? 4.6 : -4.6, 1.2, -9 + Math.floor(i / 2) * 4.5); f.rotation.y = Math.PI / 2; g.add(f); }
  box(blk, 0, 1.4, -13.2, 3, 2.4, 1.2);   // Bugfender
  box(yel, 0, 3.1, 8, 1.2, 1.2, 1.2);    // Schlepphaken-Poller
  return g;
}
// Verlassen von aussen (Teleport, Geist, Orbit): wie bei den anderen Fahrzeugen ueber world.userData.car.leave
{ const prev = world.userData.car.leave; world.userData.car.leave = () => { prev(); const S = SHIP.cur; if (S) { SHIP.cur = null; S.v = 0; S.rud = 0; engineStop(); shipPark(S); } }; }
