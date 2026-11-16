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
// Rumpf als Loft aus Querschnitten wie beim Spectre (Nicolas 2026-11-16 "Schiffe zu eckig - Regel wie beim Rolls Spectre"): Stationen alle L/80,
// Querschnitt mit runder Kimm, Bug spitz zulaufend (Wurzelkurve) mit hochgezogenem Vorfuss, Heck abgerundet; weich schattiert (mergeVertices). Vorne = -z, y relativ zur Wasserlinie.
// o: { L, W, keel (y Kiel), split (y Farbwechsel), deck (y Deck), bow (Laenge Bugzulauf), stern (Laenge Heckrundung), sheer (Deckanstieg am Bug), lower, upper (Materialien) }
function shipHull(g, o) {
  const hw = f => { const ub = Math.max(0, (f - (o.L / 2 - o.bow)) / o.bow), us = Math.max(0, ((-o.L / 2 + o.stern) - f) / o.stern); return Math.max(0.25, o.W / 2 * Math.sqrt(Math.max(0, 1 - ub ** 1.6)) * Math.sqrt(1 - 0.45 * us * us)); };
  const keel = f => { const ub = Math.max(0, (f - (o.L / 2 - o.bow)) / o.bow); return o.keel + (o.split - o.keel) * 0.85 * ub * ub; };
  const dk = f => { const ub = Math.max(0, (f - (o.L / 2 - o.bow * 1.4)) / (o.bow * 1.4)); return o.deck + o.sheer * ub * ub; };
  const n = 80, st = [], up = [];
  for (let i = 0; i <= n; i++) { const f = -o.L / 2 + o.L * i / n, h = hw(f), yb = keel(f), rb = Math.min(h * 0.9, (o.split - o.keel) * 0.6, o.W * 0.12), p = [[0, yb]];
    for (let k = 0; k <= 5; k++) { const a = -Math.PI / 2 + k / 5 * Math.PI / 2; p.push([h - rb + rb * Math.cos(a), yb + rb + rb * Math.sin(a)]); }
    p.push([h, o.split - 0.6], [h, o.split]); st.push([f, p]);
    const yd = dk(f); const e = Math.min(0.25, h * 0.2); up.push([f, [[0, o.split - 0.01], [h - e, o.split - 0.01], [h, o.split + 0.25], [h, o.split + 0.8], [h + 0.02, yd - 0.8], [h + 0.02, yd - 0.25], [h - e, yd], [0, yd]]]); }   // Zwischenpunkte an den Kanten: sonst mittelt mergeVertices die ganze Seite mit Boden/Deck (grauer Streifen)
  for (const [S, m] of [[st, o.lower], [up, o.upper]]) { const mesh = loftIn(g, S.slice().reverse(), m),   /* Reihenfolge umgedreht: sonst zeigen die Flaechen nach innen (Nicolas: man konnte von unten hineinschauen) */ geo = mergeVertices(mesh.geometry); geo.computeVertexNormals(); mesh.geometry = geo; mesh.castShadow = true; mesh.receiveShadow = true; }
  return { hw, dk };
}
// Quader mit runden Kanten (Grundriss gerundet, oben gefast) fuer Aufbauten; Mitte unten bei (x, y, z)
function shipRBox(g, m, x, y, z, w, h, d, r = 1) {
  const sh = new THREE.Shape(), a = w / 2 - r, b = d / 2 - r; sh.moveTo(-a, -d / 2); sh.lineTo(a, -d / 2); sh.quadraticCurveTo(w / 2, -d / 2, w / 2, -b); sh.lineTo(w / 2, b); sh.quadraticCurveTo(w / 2, d / 2, a, d / 2);
  sh.lineTo(-a, d / 2); sh.quadraticCurveTo(-w / 2, d / 2, -w / 2, b); sh.lineTo(-w / 2, -b); sh.quadraticCurveTo(-w / 2, -d / 2, -a, -d / 2);
  const bv = Math.min(r * 0.5, h * 0.2), geo = new THREE.ExtrudeGeometry(sh, { depth: h - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv * 0.8, bevelSegments: 3, curveSegments: 6 });
  geo.rotateX(-Math.PI / 2); geo.translate(x, y + bv, z); const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; g.add(o); return o;
}
const shipMat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.2, ...o });
// Containerschiff (Rumpf, Aufbau mit Fensterbaendern und Bruecke, Schornstein); Container setzt gotham-hafen.js. zs/zf: z von Aufbau/Schornstein
function buildCargoShip(L, W, deck, zs, zf) {
  const g = new THREE.Group(), red = shipMat(0x8c2a22, { roughness: 0.85, metalness: 0.05 }), hull = shipMat(0x1d2836, { roughness: 0.85, metalness: 0.05 }), wht = shipMat(0xe8e6df), dark = shipMat(0x1d242c, { metalness: 0.5, roughness: 0.2 }), fun = shipMat(0x2b2e33);
  shipHull(g, { L, W, keel: -6, split: 1, deck, bow: 34, stern: 14, sheer: 2.5, lower: red, upper: hull });
  shipRBox(g, wht, 0, deck, zs, W - 6, 26, 14, 2); shipRBox(g, wht, 0, deck + 26, zs, W + 4, 2, 15, 1.2);
  for (let k = 0; k < 7; k++) shipRBox(g, dark, 0, deck + 2.6 + k * 3.5, zs, W - 5.8, 1, 14.2, 2);
  shipRBox(g, dark, 0, deck + 26.4, zs, W + 4.2, 1.1, 15.2, 1.2);
  const f = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3, 32, 24), fun); f.scale.z = 1.5; f.position.set(0, deck + 16, zf); f.castShadow = true; g.add(f);
  const fb = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.65, 2.4, 24), red); fb.scale.z = 1.5; fb.position.set(0, deck + 30, zf); g.add(fb);
  return g;
}
// Hafenschlepper (eigener Entwurf): 26 x 9 m, Loft-Rumpf rot/schwarz, Holzdeck, weisser Aufbau und Steuerhaus mit runden Kanten, gelb-schwarzer Schornstein, Fender; vorne = -z
function buildTug() {
  const g = new THREE.Group(), red = shipMat(0xa3221c, { roughness: 0.8, metalness: 0.05 }), blk = shipMat(0x1c1d20, { roughness: 0.8, metalness: 0.05 }), wht = shipMat(0xeeeeea), yel = shipMat(0xe8b52a), win = shipMat(0x1d2a38, { metalness: 0.5, roughness: 0.15 }), wood = shipMat(0x6a5a48, { roughness: 0.9, metalness: 0 });
  const H = shipHull(g, { L: 26, W: 9, keel: -2.6, split: 0.6, deck: 2.4, bow: 9, stern: 6, sheer: 1.2, lower: red, upper: blk });
  { const sh = new THREE.Shape(), P = []; for (let i = 0; i <= 40; i++) { const f = -13 + 26 * i / 40; P.push([H.hw(f) * 0.9, -f]); } sh.moveTo(-P[0][0], P[0][1]); for (const [x, z] of P) sh.lineTo(-x, z); for (let i = P.length - 1; i >= 0; i--) sh.lineTo(P[i][0], P[i][1]);
    const geo = new THREE.ShapeGeometry(sh); geo.rotateX(Math.PI / 2); geo.translate(0, 2.42, 0); const d = new THREE.Mesh(geo, wood); d.material.side = THREE.DoubleSide; d.receiveShadow = true; g.add(d); }   // Holzdeck (folgt dem Rumpf)
  shipRBox(g, wht, 0, 2.4, -1.5, 6.4, 3, 9, 1.4); shipRBox(g, wht, 0, 5.4, -2.6, 5.4, 2.4, 5, 1.2); shipRBox(g, win, 0, 6.2, -2.6, 5.75, 1.2, 5.35, 1.3); shipRBox(g, blk, 0, 7.8, -2.6, 6, 0.3, 5.6, 1.3);
  const fn = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 3.5, 20), yel); fn.position.set(0, 8.4, 3.2); g.add(fn); const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.9, 20), blk); ft.position.set(0, 10.5, 3.2); g.add(ft);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4, 8), blk); mast.position.set(0, 10, -3.6); g.add(mast);
  for (let i = 0; i < 10; i++) { const f = 9 - Math.floor(i / 2) * 4.5, fz = -f, x = (H.hw(f) + 0.2) * (i % 2 ? 1 : -1), t = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.22, 8, 16), blk); t.position.set(x, 1.3, fz); t.rotation.y = Math.PI / 2; g.add(t); }
  const bf = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.6, 16), blk); bf.rotation.z = Math.PI / 2; bf.position.set(0, 1.4, -13); g.add(bf);   // Bugfender
  const po = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.2, 14), yel); po.position.set(0, 3, 8); g.add(po);   // Poller
  return g;
}
// Verlassen von aussen (Teleport, Geist, Orbit): wie bei den anderen Fahrzeugen ueber world.userData.car.leave
{ const prev = world.userData.car.leave; world.userData.car.leave = () => { prev(); const S = SHIP.cur; if (S) { SHIP.cur = null; S.v = 0; S.rud = 0; engineStop(); shipPark(S); } }; }
