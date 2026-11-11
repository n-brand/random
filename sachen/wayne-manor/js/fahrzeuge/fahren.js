// Wayne Manor 3D – Fahrzeuge: Fahrphysik, Kollision, Ein-/Aussteigen, Holen, Kamera, Bildschleifen-Teil
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

const CAR_STEP = 0.6, CAR_G = 14, SLOPE_G = 9.81, WALL_TAN = Math.tan(65 * Math.PI / 180);   // Hangabtrieb, ab 65 Grad gilt Gelaende als Wand
const carW = (lx, lz) => { const s = Math.sin(CAR.h), c = Math.cos(CAR.h); return [CAR.x + lx * c + lz * s, CAR.z - lx * s + lz * c]; };
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
// Nur Hindernisse im Umkreis von 14 m pruefen (einmal pro Bild gefiltert), sonst kostet ein Fahrzeug ca. 1 ms pro Bild
let nearS = solids, nearC = circles;
function carNear() {
  const x = CAR.x, z = CAR.z, R = 14;
  [nearS, nearC] = collNear(x - R, x + R, z - R, z + R);                    // K2: Kollisions-Raster statt alle durchsehen
}
function carSupport(x, z, feet) {
  let top = groundAt(x, z, feet);
  for (const s of nearS) { if (!s.on || s.y1 > feet + CAR_STEP || s.y1 <= top) continue; if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) top = s.y1; }
  return top;
}
// Wie pushOut, aber mit Radius R, Stufe 0,6 m, Fahrzeughoehe; die eigenen Parkkreise zaehlen nicht
function carPush(p, feet, R) {
  const body = CAR.spec.bodyH;
  for (const s of nearS) {
    if (!s.on || s.y1 <= feet + CAR_STEP || s.y0 >= feet + body) continue;
    const cx = Math.max(s.x0, Math.min(p.x, s.x1)), cz = Math.max(s.z0, Math.min(p.z, s.z1)), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= R * R) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + dx / d * R; p.z = cz + dz / d * R; }
    else { const out = [[p.x - s.x0, -1, 0], [s.x1 - p.x, 1, 0], [p.z - s.z0, 0, -1], [s.z1 - p.z, 0, 1]].sort((a, b) => a[0] - b[0])[0]; p.x += out[1] * (out[0] + R); p.z += out[2] * (out[0] + R); }
  }
  for (const c of nearC) {
    if (CAR.circ && CAR.circ.includes(c)) continue;
    const [cx, cz, r, top] = c;
    if (r <= 0 || (top !== undefined && (feet + CAR_STEP >= top || feet < top - 8))) continue;
    const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz), min = r + R;
    if (d < min && d > 1e-6 && !(top === undefined && feet < terrainH(cx, cz) - 3)) { p.x = cx + dx / d * min; p.z = cz + dz / d * min; }
  }
}
const carSlopeG = (x, z, y) => GRAMP.inF(x, z) ? GRAMP.y(z) : (y < HILL - 0.2 && GRAMP.inP(x, z)) || (y < HILL - 3 && (inRect(HF_TUN, x, z) || inRect(CSH_OUT, x, z))) || (y < terrainH(x, z) - 1.5 && wfInTunnel(x, z)) || (y < 3 && inRect(WF_PORTAL, x, z)) || (y < -20 && waterCaveAt(x, z)) || (y < HILL - 1 && inPoly(GARAGE, x, z)) || y < -8 ? -100 : terrainH(x, z);
// Bodenhoehe unter dem Fahrzeug: Mitte oder Mittel der Raeder (Hebebuehne: Raeder auf den Schienen), dazu Neigung
function carGround(feet) {
  const sp = CAR.spec, hs = sp.wheels.map(([lx, lz]) => { const [x, z] = carW(lx, lz); return carSupport(x, z, feet); });
  const mean = f => { let t = 0, n = 0; hs.forEach((h, i) => { if (f(sp.wheels[i])) { t += h; n++; } }); return n ? t / n : 0; };
  const hc = carSupport(CAR.x, CAR.z, feet), avg = mean(() => true);
  return { y: Math.max(hc, avg), pitch: Math.atan2(mean(([, lz]) => lz < 0) - mean(([, lz]) => lz > 0), sp.wb), roll: sp.track > 0 ? Math.atan2(mean(([lx]) => lx > 0) - mean(([lx]) => lx < 0), sp.track) : 0 };
}
const tankDir = new THREE.Vector3(), tankQ = new THREE.Quaternion();
function carPose(dt) {
  const C = CAR;
  C.g.position.set(C.x, C.y, C.z);
  C.g.rotation.set(C.pitch, C.h, C.spec.bike ? C.lean : C.roll, "YXZ"); C.g.updateMatrix();
  for (const w of C.wheels) { w.spin.rotation.x -= C.v * dt / w.r; if (w.front) w.piv.rotation.y = C.steer; }
  // Panzerturm (Nicolas 2026-11-11): zielt in Weltrichtung (Blickrichtung), Lenken dreht nur die Wanne darunter; geparkt dreht er langsam nach vorne
  if (C.turret) {
    if (C.tw === undefined) C.tw = C.h + C.turret.rotation.y;
    if (C.on) C.tw = player.yaw; else C.tw += Math.max(-1.2 * dt, Math.min(1.2 * dt, wrapA(C.h - C.tw)));   // Turm folgt der Maus ohne Verzoegerung
    // Stabilisiert (Nicolas 2026-11-11): Turm-Richtung und Rohrhoehe gelten in der Welt (C.tw, C.elev), egal wie die Wanne am Hang steht.
    // Gewuenschte Richtung in den Wannen-Rahmen drehen: daraus Turmdrehung (um die Wannen-Hochachse) und Rohrwinkel (-26 bis +34 Grad, damit es auch an steilen Haengen waagrecht bleibt)
    const ce = Math.cos(C.elev), d = tankDir.set(-Math.sin(C.tw) * ce, Math.sin(C.elev), -Math.cos(C.tw) * ce).applyQuaternion(tankQ.copy(C.g.quaternion).invert());
    C.turret.rotation.y = Math.atan2(-d.x, -d.z);
    if (C.gun) C.gun.rotation.x = Math.max(-0.45, Math.min(0.6, Math.atan2(d.y, Math.hypot(d.x, d.z))));
  }
  if (C.beacon) { const t = clock.elapsedTime * 6, k = C.on ? 1 : 0; C.beacon[0].emissiveIntensity = 0.2 + k * 2.4 * (Math.sin(t) > 0 ? 1 : 0); C.beacon[1].emissiveIntensity = 0.2 + k * 2.4 * (Math.sin(t) > 0 ? 0 : 1); }   // Blaulicht
  if (C.jetM) { C.jet = Math.max(0, C.jet - dt); C.jetM.emissiveIntensity = Math.min(2.5, C.jet * 4); }
  if (C.flame) { const k = C.boostOn ? 0.85 + 0.3 * Math.random() : Math.min(1, C.jet * 2); C.flame.visible = k > 0.02; C.flame.scale.set(0.8 + 0.3 * k, 0.8 + 0.3 * k, k); }
}
function carCircles(on) {
  const sp = CAR.spec;
  if (!CAR.circ) CAR.circ = sp.pts.map(() => { const c = [0, 0, 0, 0]; c.dyn = true; circles.push(c); return c; });
  sp.pts.forEach((lz, i) => { const [x, z] = carW(0, lz), c = CAR.circ[i]; c[0] = x; c[1] = z; c[2] = on ? sp.circR : 0; c[3] = CAR.y + sp.bodyH - 0.1; });
}
function carMsg(t) { if (clock.elapsedTime - CAR.msgT > 2.5) { CAR.msgT = clock.elapsedTime; toast(t); } }
function useCar(want) {
  if (!walking || ghost) return false;
  const p = player.pos;
  if (CAR && CAR.on) {
    // Aussteigen: links (Fahrerseite), sonst rechts, sonst vorne/hinten
    const C = CAR, s = Math.sin(C.h), c = Math.cos(C.h);
    for (const [lx, lz] of C.spec.exits) {
      const q = new THREE.Vector3(C.x + lx * c + lz * s, C.y + 0.4, C.z - lx * s + lz * c), top = supportAt(q, C.y + 0.4);
      if (Math.abs(top - C.y) > 0.6) continue;
      q.y = top; const t2 = q.clone(); pushOut(t2, top);
      if (Math.hypot(t2.x - q.x, t2.z - q.z) > 0.05) continue;
      C.on = false; C.v = 0; speedEl.hidden = true; engineStop();
      player.pos.copy(q); player.vy = 0; player.pitch = 0.05;
      camera.fov = 70; camera.updateProjectionMatrix();
      carCircles(true);
      toast(C.spec.bike ? "Abgestiegen" : "Ausgestiegen");
      return true;
    }
    toast("Hier ist kein Platz zum Aussteigen");
    return true;
  }
  let best = null, bd = 1e9;
  for (const v of VEH) { const d = Math.hypot(p.x - v.x, p.z - v.z); if ((!want || v === want) && d < v.spec.enter + (want ? 1.5 : 0) && d < bd && Math.abs(p.y - v.y) < 2) { best = v; bd = d; } }   // want: das angezielte Fahrzeug (Rechtsklick)
  if (!best) return false;
  CAR = best; const C = best;
  C.on = true; C.v = 0; keys.clear(); player.yaw = C.h; player.pitch = -0.12; carCircles(false);
  toast(C.spec.msg + ", M Ton an/aus");
  speedEl.hidden = false;
  engineStart(C.spec.name);
  return true;
}
// Fahrzeug zum Spieler holen (Teleport-Menue): vor den Spieler in Blickrichtung auf freien Boden (sonst seitlich/weiter weg)
function summonVehicle(v) {
  if (!v) return false;
  if (!walking || ghost) { toast("Zuerst „Begehen“ starten, dann das Fahrzeug holen"); return false; }
  if (CAR && CAR.on) { if (CAR === v) return toast(v.label + ": du sitzt schon drin"), false; useCar(); if (CAR.on) return false; }
  const p = player.pos, yaw = player.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const len = Math.max(...v.spec.pts.map(Math.abs)) + v.spec.R, prev = CAR, saved = { x: v.x, z: v.z, y: v.y, h: v.h };
  CAR = v;
  for (const [f, r] of [[len + 1.2, 0], [len + 2.5, 0], [len + 1.2, 2], [len + 1.2, -2], [0, len + 1.2], [0, -(len + 1.2)], [len + 5, 0], [-(len + 1.2), 0]]) {
    v.x = p.x + fx * f + rx * r; v.z = p.z + fz * f + rz * r; v.h = yaw; v.y = p.y;
    carNear();
    const gr = carGround(p.y + 0.3);
    if (Math.abs(gr.y - p.y) > 1.2) continue;
    v.y = gr.y;
    const s = Math.sin(v.h), c = Math.cos(v.h);
    let ok = true;
    for (const lz of v.spec.pts) { const q = { x: v.x + lz * s, z: v.z + lz * c }, qx = q.x, qz = q.z; carPush(q, v.y, v.spec.R); if (Math.hypot(q.x - qx, q.z - qz) > 0.05) { ok = false; break; } }
    if (!ok) continue;
    const surf = waterAt(v.x, v.z); if (surf !== null && v.y < surf - 0.3) continue;
    Object.assign(v, { v: 0, vy: 0, air: false, wet: false, settled: false, steer: 0, lean: 0, pitch: gr.pitch, roll: gr.roll, safe: { x: v.x, z: v.z, y: v.y, h: v.h } });
    carCircles(true); carPose(0); v.g.visible = true;
    CAR = prev;
    toast(v.label + " steht vor dir (Rechtsklick einsteigen)");
    return true;
  }
  Object.assign(v, saved); CAR = prev;
  toast("Hier ist kein Platz für " + v.spec.name);
  return false;
}
function carReset() {
  const s = CAR.safe || CAR.home;
  Object.assign(CAR, { x: s.x, z: s.z, y: s.y, h: s.h, v: 0, vy: 0, air: false, wet: false }); player.yaw = s.h;
  toast(CAR.spec.name + " zurückgesetzt");
}
function carStep(dt) {
  const C = CAR, sp = C.spec; carNear();
  let th = 0, st = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) th += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) th -= 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) st += 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) st -= 1;
  th -= moveStick.y; st -= moveStick.x;
  C.throttle = th > 0.1 ? 1 : 0;
  look(lookStick.x * 2.6 * dt, lookStick.y * 1.8 * dt);
  // Nitro (Nachtfalke, Nicolas 2026-11-09: statt Sprung): Leertaste halten = Schub aus der Duese, die Leiste leert sich (ca. 4 s Vorrat);
  // nach dem Loslassen 2 s Pause, dann laedt sie Stueck fuer Stueck nach (alle 0,6 s ein Zehntel)
  if (C.boostE === undefined) { C.boostE = 1; C.boostT = 0; }
  const boosting = !!sp.boost && (player.jump || jumpHeld) && !C.air && !C.wet && th >= 0 && C.boostE > 0;
  if (sp.boost) {
    if (boosting && !C.boostOn) engineJet();
    C.boostOn = boosting;
    if (boosting) { C.boostE = Math.max(0, C.boostE - dt / 4); C.boostT = -2; C.jet = Math.max(C.jet, 0.5); }
    else if (C.boostE < 1) { C.boostT += dt; if (C.boostT >= 0.6) { C.boostT -= 0.6; C.boostE = Math.min(1, Math.floor(C.boostE * 10 + 1e-6) / 10 + 0.1); } }
    C.boostLock = C.boostE <= 0;
    if (player.jump && C.boostE <= 0) carMsg("Nitro leer – lädt nach");
  }
  const max = C.wet ? 0.3 : sp.maxF + (boosting ? 40 / 3.6 : 0);   // Nitro: 40 km/h ueber dem Hoechsttempo ; sonst nur W bis zum Hoechsttempo, im Wasser steckt man fest
  // Lenken (Fahrradmodell, bei Tempo weniger Einschlag), Gas/Bremse
  const steerT = st * sp.steer / (1 + Math.abs(C.v) / 14);   // bei Tempo etwas williger (Serpentine r 11 mit ca. 40 km/h)
  C.steer += (steerT - C.steer) * Math.min(1, dt * 8);
  if (!C.air) {
    const dh = C.v * Math.tan(C.steer) / sp.wb * dt;
    C.h = wrapA(C.h + dh); if (!C.turret) player.yaw += dh;   // Panzer: Lenken dreht nur die Wanne, Blick und Turm bleiben
    // Hang (Nicolas 2026-11-08): Hangabtrieb statt harter Sperre. Steigung aus dem Gelaende vor/hinter dem Fahrzeug (nur auf freiem
    // Gelaende; Tunnel, Hallen, Hoehle liefern -100 bzw. liegen weit weg). Bergauf bremst die Schwerkraft, bergab wird man schneller;
    // ueber der Grenzsteigung des Fahrzeugs (spec.grade) drehen die Raeder durch: kein Vortrieb mehr, man rollt mit Schwung weiter und dann zurueck.
    const hx = -Math.sin(C.h), hz = -Math.cos(C.h), gF = carSlopeG(C.x + hx * 1.2, C.z + hz * 1.2, C.y), gB = carSlopeG(C.x - hx * 1.2, C.z - hz * 1.2, C.y);
    const onTerrain = gF > -50 && gB > -50 && Math.abs(gF - C.y) < 2 && Math.abs(gB - C.y) < 2;
    const slope = onTerrain ? Math.atan2(gF - gB, 2.4) : 0, maxG = (sp.grade || 40) * Math.PI / 180;
    const grip = boosting ? 1 : th > 0 && slope > 0 ? clamp01((maxG - slope) / 0.14) : 1;   // 8 Grad Uebergang bis zum Durchdrehen
    const held = th === 0 && Math.abs(C.v) < 0.6 && slope < maxG;            // Stillstand ohne Gas: Bremse haelt
    if (held) C.v = 0; else C.v -= SLOPE_G * Math.sin(slope) * dt;
    C.slope = slope;
    const brk = (sp.brake || 28) + Math.abs(C.v) * 0.2;                     // Bremse (Nicolas 2026-11-11: Bremsweg zu lang; vorher 16 m/s²): 100 km/h -> ca. 13 m, 200 km/h -> ca. 45 m
    if (th > 0) C.v += (C.v < -0.2 ? brk : sp.acc * (1 - Math.max(0, C.v) / (max + 8))) * grip * dt;
    else if (th < 0) C.v -= (C.v > 0.2 ? brk : sp.revMax ? sp.acc * (1 - Math.max(0, -C.v) / (sp.revMax + 8)) : 6) * dt;   // spec.revMax: rueckwaerts wie vorwaerts (Panzer, Nicolas 2026-11-11)
    else C.v -= Math.sign(C.v) * Math.min(Math.abs(C.v), (3 + Math.abs(C.v) * 0.06) * dt);   // Ausrollen ohne Gas etwas kuerzer
    if (boosting && C.v < max) C.v = Math.min(max, C.v + 80 * dt);                                            // Nitro 5-mal so stark (Nicolas 2026-11-09)
    if (C.v > max) C.v = Math.max(max, C.v - (C.slope < -0.05 ? 4 : 14) * dt);   // bergab darf man etwas ueber das Hoechsttempo rollen
    C.v = Math.max(th < 0 ? -(sp.revMax || 8) : -Math.max(16, sp.revMax || 0), C.v);                                     // rueckwaerts den Hang hinunter auch schneller
    // Sprung mit Schub (nur Tumbler: ohne Rampe)
    if (sp.jump && (player.jump || jumpHeld)) {
      if (C.v >= 14 && !C.wet) { C.air = true; C.vy = 7.5; C.v += C.jetM ? 6 : 3; C.jet = 0.9; toast("Sprung!"); if (C.jetM) engineJet(); }   // Batpod: Sprung ohne Duese/Schub
      else if (player.jump) carMsg("Für den Sprung schneller fahren (ab 50 km/h)");
    }
  }
  player.jump = false;
  // Bewegen mit Kollision (Kreise entlang der Karosserie)
  const fx = -Math.sin(C.h), fz = -Math.cos(C.h), x0 = C.x, z0 = C.z;
  let nx = C.x + fx * C.v * dt, nz = C.z + fz * C.v * dt;
  for (let it = 0; it < 2; it++) {
    let sx = 0, sz = 0;
    for (const lz of sp.pts) {
      const s = Math.sin(C.h), c = Math.cos(C.h), px = nx + lz * s, pz = nz + lz * c, q = { x: px, z: pz };
      carPush(q, C.y, sp.R); sx += q.x - px; sz += q.z - pz;
    }
    nx += sx; nz += sz;
  }
  const moved = Math.hypot(nx - x0, nz - z0);
  if (!C.air) {
    const g0 = carSlopeG(x0, z0, C.y), g1 = carSlopeG(nx, nz, C.y);
    if (!boosting && moved > 1e-6 && g1 - g0 > WALL_TAN * moved && C.y < g0 + 0.3) {   // mit Nitro kommt man jede Gelaendewand hoch
      // Echte Wand (ueber ca. 65 Grad): nicht hart stoppen, sondern entlang der Hoehenlinie abgleiten (Anteil bergauf entfernen)
      const e = 0.4, gx = carSlopeG(x0 + e, z0, C.y) - carSlopeG(x0 - e, z0, C.y), gz = carSlopeG(x0, z0 + e, C.y) - carSlopeG(x0, z0 - e, C.y), gl = Math.hypot(gx, gz);
      let mx = nx - x0, mz = nz - z0;
      if (gl > 1e-6 && Math.abs(gx) < 50 && Math.abs(gz) < 50) { const ux = gx / gl, uz = gz / gl, up = mx * ux + mz * uz; if (up > 0) { mx -= ux * up; mz -= uz * up; } }
      const sx = x0 + mx * 0.9, sz = z0 + mz * 0.9;
      if (carSlopeG(sx, sz, C.y) - g0 <= WALL_TAN * Math.hypot(mx, mz) + 0.02) { nx = sx; nz = sz; } else { nx = x0; nz = z0; }
    }
    if (C.y > -3 && seaD(nx, nz) > -40 && terrainH(nx, nz) < WATER_Y - 0.5 && carSupport(nx, nz, C.y) < WATER_Y - 0.5) { nx = x0; nz = z0; }   // Steilkueste
  }
  if (C.y > -3 && coastEdge(nx, nz, x0, z0, 6)) { nx = x0; nz = z0; if (!C.air) C.v *= 0.3; }   // Klippenkante: Fahrzeuge halten 6 m vor der Kuestenlinie (auch im Flug)
  const far = Math.hypot(nx, nz); if (far > LIMIT) { nx *= LIMIT / far; nz *= LIMIT / far; }
  C.x = nx; C.z = nz;
  if (dt > 0) { const along = ((nx - x0) * fx + (nz - z0) * fz) / dt; if (Math.abs(along) < Math.abs(C.v) - 0.5) C.v = C.air ? along * 0.9 : along; }   // an Hindernissen abbremsen
  // Hoehe: am Boden haften, ueber Kanten abheben, im Flug Schwerkraft
  const gr = carGround(C.y);
  if (!C.air) {
    if (gr.y >= C.y - 0.5) { C.y = gr.y; C.vy = 0; C.pitch += (gr.pitch - C.pitch) * Math.min(1, dt * 10); C.roll += (gr.roll - C.roll) * Math.min(1, dt * 10); }
    else { C.air = true; C.vy = 0; }
  } else {
    C.vy -= CAR_G * dt; C.y += C.vy * dt;
    const g2 = carGround(C.y);
    if (C.y <= g2.y) { C.y = g2.y; C.air = false; C.vy = 0; C.pitch = g2.pitch; C.roll = g2.roll; }
    else { const tp = Math.max(-0.12, Math.min(0.2, Math.atan2(C.vy, Math.max(8, Math.abs(C.v))) * 0.4));   // im Flug nur leicht neigen (Nicolas: nach tiefen Spruengen kippte die Nase stark nach vorne)
      C.pitch += (tp - C.pitch) * Math.min(1, dt * 2); C.roll *= 0.95; }
  }
  if (sp.bike) { const tl = C.steer * Math.min(1, Math.abs(C.v) / 6) * 0.9; C.lean += (tl - C.lean) * Math.min(1, dt * 5); }   // Motorrad legt sich in die Kurve
  // Wasser: Teich, See, Meer
  const surf = waterAt(C.x, C.z), wet = surf !== null && C.y < surf - 0.6;
  if (wet && !C.wet) toast(sp.name + " steckt im Wasser – R setzt zurück");
  C.wet = wet;
  if (wet) C.v *= Math.pow(0.15, dt);
  // sicheren Punkt merken (fuer R)
  C.safeT += dt;
  if (C.safeT > 0.5 && !C.air && !C.wet) { C.safeT = 0; C.safe = { x: C.x, z: C.z, y: C.y, h: C.h }; }
  // Blick folgt dem Kurs; rueckwaerts schwenkt die Kamera nach vorne und schaut nach hinten (Nicolas 2026-11-10)
  if (Math.abs(C.v) > 3 && !C.air && !C.turret) player.yaw +=   // Panzer: Kamera bleibt beim Turm (Maus zielt)
    wrapA(C.h + (C.v < 0 ? Math.PI : 0) - player.yaw) * Math.min(1, dt * 1.2);
  speedEl.textContent = Math.round(Math.abs(C.v) * 3.6) + " km/h";
  nitroEl.hidden = !C.spec.boost;
  if (C.spec.boost) { const b = nitroEl.lastChild.firstChild; b.style.width = Math.round((C.boostE ?? 1) * 100) + "%"; nitroEl.className = C.boostOn ? "on" : C.boostLock ? "lock" : (C.boostE ?? 1) < 1 ? "load" : ""; }
  carPose(dt);
}
// Kamera: hinter dem Fahrzeug (stoesst nicht durch Waende/Gelaende) oder Fahrersicht
const camBlocked = (x, y, z) => {
  for (const s of nearS) if (s.on && x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && y > s.y0 && y < s.y1) return true;
  for (const [cx, cz, r, top] of nearC) if (r > 0 && (x - cx) ** 2 + (z - cz) ** 2 < r * r && (top === undefined ? y > terrainH(cx, cz) - 3 : y < top && y > top - 8)) return true;
  if (y >= terrainH(x, z) + 0.2) return false;                           // ueber dem Gelaende frei
  // unter der Erde nur in Hohlraeumen: Garage, Hangfuss-Tunnel, Schacht, Haus, Waterfall-Exit-Roehre, Hoehlen
  // Garage: nur in Garagenhoehe und mind. 1,2 m vom Rand (der Umriss schliesst die Waende ein; Nicolas: man sah durch die Wand)
  if (y < HILL - 0.6 && y > GY + HILL - 0.5 && [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].every(([a, b]) => inPoly(GARAGE, x + a, z + b))) return false;
  if (y < HILL - 0.6 && y > GY + HILL - 0.5 && GRAMP.inP(x, z, -1.2)) return false;   // Garagenrampe: Wendeplatz
  if (GRAMP.door && GRAMP.door.open > 0.9 && x > 2 && x < 7.5 && z > GRAMP.D0 + 0.8 && z < GRAMP.D1 - 0.8 && y > GY + HILL - 0.5 && y < GY + HILL + 3) return false;   // durchs offene Rampentor
  if (GRAMP.inF(x, z, -0.5) && y > GRAMP.y(z) + 0.3) return false;                  // ueber der (offenen) Klappe frei bis zum Himmel (Nicolas: Kamera wackelte)
  if (y < HILL - 0.6 && y > HF_Y - 0.5 && (inRect(HF_TUN, x, z) || inRect(CSH_OUT, x, z))) return false;
  if (inSilo(x, z, -0.8) && y > UY - 1) return false;
  if (y > UY - 1 && y < UY + UH + 1.2 && (axtIn(x, z, -1.2) || inRect(HGX, x, z, -1.2))) return false;   // Gang und Hangar-Erweiterung (hoehere Decke)                     // Flugzeug-Silo (offene Klappen; geschlossen sperren ihre Quader)
  if (inPoly(HOUSE, x, z) && y > HILL + FL0 + 0.3) return false;                   // Haus nur ueber dem Plateau (darunter Garage/Hoehle)
  // Grenzen bewusst weiter innen als die sichtbaren Flaechen (Decken sind unregelmaessig; Nicolas: lieber weiter innen)
  const w = wfNear(x, z, WF_HW - 0.8); if (w && y > w.y - 0.5 && y < w.y + 4.8) return false;
  if (y > LY - 1 && y < LY + 5.4 && caveAt(x, z) !== 0 && caveAt(x + 0.9, z) !== 0 && caveAt(x - 0.9, z) !== 0 && caveAt(x, z + 0.9) !== 0 && caveAt(x, z - 0.9) !== 0) return false;   // Hoehlendecke hängt bis ca. 3,8 m tiefer als LY+LH
  if (y > UY - 1 && y < UY + UH - 1.8 && caveUpAt(x, z)) return false;
  if (y > SEA_Y + 0.3 && y < SEA_Y + 8.5 && [[0, 0], [0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9]].every(([a, b]) => { const c = caveAt(x + a, z + b); return c === 2 || c === 4 || c === 3; })) return false;   // ueber dem Hoehlenwasser (Boot-Kamera)
  return true;
};
function carCamera() {
  const C = CAR, sp = C.spec;
  player.pos.set(C.x, C.y + 0.6, C.z);
  if (C.view === 1) {
    const [sx, sy, sz] = sp.seat, s = Math.sin(C.h), c = Math.cos(C.h);
    camera.position.set(C.x + sx * c + sz * s, C.y + sy, C.z - sx * s + sz * c);
    camera.rotation.set(player.pitch, player.yaw, 0, "YXZ");
    return;
  }
  const D = sp.camD, H = Math.max(0.9, Math.min(7, 2.2 - player.pitch * 6)), tx = C.x, ty = C.y + sp.camH, tz = C.z;
  const dx = Math.sin(player.yaw) * D, dy = H - 1.3 + 0.9, dz = Math.cos(player.yaw) * D;
  let k = 1;
  for (let t = 0.12; t <= 1.0001; t += 0.06) if (camBlocked(tx + dx * t, ty + dy * t, tz + dz * t)) { k = Math.max(0.12, t - 0.08); break; }
  camera.position.set(tx + dx * k, ty + dy * k, tz + dz * k);
  camera.lookAt(tx, ty + 0.3, tz);
}
// Jede Bildschleife: Drehscheibe und Autoaufzug mitnehmen, geparkte Fahrzeuge am Boden halten (Hebebuehne), Kreise, Sichtbarkeit, Kamera
let vehFrame = 0;
function carFrame(dt) {
  const active = VEH.find(v => v.on) || null, L = CAR_LIFT && CAR_LIFT.L, tt = world.userData.turntable, ttR = 60 * CAVE_SC, w = dt * 0.05, bay = world.userData.liftBay;
  vehFrame++;
  const prev = CAR;
  for (const v of VEH) {
    v.g.visible = v.on || Math.hypot(camera.position.x - v.x, camera.position.z - v.z) + Math.abs(camera.position.y - v.y) * 0.5 < 160;   // weit weg ausblenden
    v.spun = Math.abs(v.y - LY) < 0.5 && Math.hypot(v.x - tt.position.x, v.z - tt.position.z) < ttR;
    if (v.spun && dt > 0) {                                                // Drehscheibe: mitdrehen (wie der Spieler)
      const c = Math.cos(w), s = Math.sin(w), dx = v.x - tt.position.x, dz = v.z - tt.position.z;
      v.x = tt.position.x + dx * c + dz * s; v.z = tt.position.z - dx * s + dz * c; v.h += w; if (v.on) player.yaw += w;
    }
    if (v.on) continue;
    const lifting = L && L.state === "moving" && CAR_LIFT.inCar({ x: v.x, y: v.y, z: v.z }), atBay = (bay && Math.hypot(v.x - bay.x, v.z - bay.z) < 4) || GRAMP.inF(v.x, v.z, 1.5);   // Hebebuehne, Garagenrampe: jedes Bild
    let run = lifting || atBay || !v.settled || (vehFrame + v.idx) % 15 === 0;
    if (run && !lifting && v.settled && Math.hypot(player.pos.x - v.x, player.pos.z - v.z) > 80) run = false;   // geparkt und weit weg
    if (!run && !v.spun) continue;
    CAR = v;
    if (lifting) { v.y = L.y; v.air = false; v.vy = 0; v.settled = false; }
    else if (run) {
      carNear();
      const gr = carGround(v.y);
      if (gr.y >= v.y - 0.8 && gr.y <= v.y + CAR_STEP) { v.settled = Math.abs(gr.y - v.y) < 0.005; v.y = gr.y; v.pitch = gr.pitch; v.roll = gr.roll; }
      else if (gr.y < v.y) { v.settled = false; v.y = Math.max(gr.y, v.y - 9 * dt); }
      else v.settled = true;
    }
    v.v = 0; v.lean = 0; carCircles(true); carPose(dt);
  }
  CAR = active || prev;
  if (active) {
    if (L && L.state === "moving" && CAR_LIFT.inCar({ x: active.x, y: active.y, z: active.z })) { active.y = L.y; active.air = false; active.vy = 0; }
    if (walking) { carNear(); carPose(0); carCamera(); engineUpdate(active); }
  }
}
