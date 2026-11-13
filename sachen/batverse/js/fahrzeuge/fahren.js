// Batverse – Fahrzeuge: Fahrphysik, Kollision, Ein-/Aussteigen, Holen, Kamera, Bildschleifen-Teil
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
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
    if (inSilo(cx, cz, 1)) { const tg = terrainH(cx, cz); if (feet > tg - 3 && s.y1 <= tg + 0.5) continue; }   // Silo-Wandkrone und Rasenklappe liegen buendig im Rasen (nur hier, Stuetzmauern sperren weiter; Nicolas 2026-11-11: Panzer kam am Hang nicht drauf, gemessen wird ab der Fahrzeugmitte)
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
const carSlopeG = (x, z, y) => gothamBridgeAt(x, z, y) ?? gothamDeckAt(x, z, y) ?? carSlopeG0(x, z, y);   // G2e: zweistoeckige Strassen   // Gotham-Bruecken: Fahrbahn statt Gelaende darunter (G2c)
const carSlopeG0 = (x, z, y) => GRAMP.inF(x, z) ? GRAMP.y(z) : hfCap(x, z) !== null && y > (x > HF_XP ? HF_Y + 5.3 : hfCap(x, z) - 2) ? Math.max(terrainH(x, z), hfCap(x, z)) + 0.04 : (y < HILL - 0.2 && GRAMP.inP(x, z)) || inHfTun(x, z, y) || (y < HILL - 3 && inRect(CSH_OUT, x, z)) || (y < terrainH(x, z) - 1.5 && wfInTunnel(x, z)) || (y < 3 && inRect(WF_PORTAL, x, z)) || (y < -20 && waterCaveAt(x, z)) || (y < HILL - 1 && inPoly(GARAGE, x, z)) || y < -8 ? -100 : terrainH(x, z);
// Bodenhoehe unter dem Fahrzeug: Mitte oder Mittel der Raeder (Hebebuehne: Raeder auf den Schienen), dazu Neigung
const hullE = new THREE.Euler(), hullV = new THREE.Vector3();
// Mit der tatsaechlichen (weich nachgefuehrten) Neigung nochmals pruefen, dass kein Punkt unter der Wanne im Boden steckt
function hullLift(C) { const sp = C.spec; if (!sp.hull) return; hullE.set(C.pitch, C.h, C.roll, "YXZ"); for (const [lx, ly, lz] of sp.hull) { const o = hullV.set(lx, ly, lz).applyEuler(hullE); C.y = Math.max(C.y, carSupport(C.x + o.x, C.z + o.z, C.y + o.y) - o.y); } }
function carGround(feet) {
  // unter der Erde (Silo, Hoehle, Garage) zaehlt ein Rad, das weit ueber dem Fahrzeug Halt findet, nicht: es steckt in Wand oder Fels (Nicolas 2026-11-11:
  // im Silo las das Hinterrad die Rasenhoehe draussen, der Panzer stand senkrecht). An der Oberflaeche (auch steile Haenge) unveraendert.
  const deep = feet < terrainH(CAR.x, CAR.z) - 3, hc0 = carSupport(CAR.x, CAR.z, feet);
  const sp = CAR.spec, hs = sp.wheels.map(([lx, lz]) => { const [x, z] = carW(lx, lz), h = carSupport(x, z, feet); return deep && h > feet + CAR_STEP + 0.5 ? hc0 : h; });
  const mean = f => { let t = 0, n = 0; hs.forEach((h, i) => { if (f(sp.wheels[i])) { t += h; n++; } }); return n ? t / n : 0; };
  const hc = carSupport(CAR.x, CAR.z, feet), avg = mean(() => true);
  const r = { hc, y: Math.max(hc, avg), pitch: Math.atan2(mean(([, lz]) => lz < 0) - mean(([, lz]) => lz > 0), sp.wb), roll: sp.track > 0 ? Math.atan2(mean(([lx]) => lx > 0) - mean(([lx]) => lx < 0), sp.track) : 0 };
  // spec.hull (Panzer, Nicolas 2026-11-11): Punkte unter der Wanne; liegt dort das Gelaende hoeher als die Ebene durch die Raeder (Kuppe, Kante,
  // Tunnelmund), wird das Fahrzeug so weit angehoben, dass nichts im Boden steckt
  if (sp.hull) {
    hullE.set(r.pitch, CAR.h, r.roll, "YXZ");
    for (const [lx, ly, lz] of sp.hull) { const o = hullV.set(lx, ly, lz).applyEuler(hullE); r.y = Math.max(r.y, carSupport(CAR.x + o.x, CAR.z + o.z, feet + o.y) - o.y); }
  }
  return r;
}
// Offenes Silo: Bodenfahrzeuge (nicht The Bat/Jet) halten am Rand, solange die Rasenklappe nicht ganz zu ist; Pruefpunkte = Kollisionskreise
// des Fahrzeugs (Mitte + vorne/hinten) mit Radius und 0,5 m Abstand. Wer schon drin ist (Klappe unter ihm geoeffnet), darf hinaus.
let siloGate = null;
function siloEdge(nx, nz, x0, z0, C) {
  if (siloGate === null) siloGate = gates.find(t => t.name === "Rasenklappe (Silo)") || false;
  if (!siloGate || siloGate.open < 0.01 || C.y < SILO.rim - 4) return false;
  const sp = C.spec, m = sp.R + 0.5, fx = Math.sin(C.h), fz = Math.cos(C.h), hit = (x, z) => sp.pts.some(lz => inSilo(x + fx * lz, z + fz * lz, m));
  return hit(nx, nz) && !hit(x0, z0);
}
const tankDir = new THREE.Vector3(), tankQ = new THREE.Quaternion();
function carPose(dt) {
  const C = CAR;
  C.g.position.set(C.x, C.y, C.z);
  C.g.rotation.set(C.pitch, C.h, C.spec.bike ? C.lean : C.roll, "YXZ"); C.g.updateMatrix();
  for (const w of C.wheels) { w.spin.rotation.x -= C.v * dt / w.r * (1 - (C.fold || 0)); if (w.front) w.piv.rotation.y = C.steer; }
  if (C.wheelGlow) C.wheelGlow.emissiveIntensity = 0.35 + 1.4 * Math.min(1, Math.abs(C.v) / 20);   // Terzo: Felgen leuchten mit dem Tempo
  if (C.folds) { const f = C.fold || 0, e = f * f * (3 - 2 * f); for (const q of C.folds) q.g.rotation.z = -q.sd * Math.PI / 2 * e;   // DeLorean: Raeder flach geklappt, Aussenseite unten
    if (C.glowM) C.glowM.opacity = e * (0.55 + 0.2 * Math.sin(clock.elapsedTime * 9)); }
  // Panzerturm (Nicolas 2026-11-11): zielt in Weltrichtung (Blickrichtung), Lenken dreht nur die Wanne darunter; geparkt dreht er langsam nach vorne
  if (C.turret) {
    if (C.tw === undefined) C.tw = C.h + C.turret.rotation.y;
    // Turm dreht hoechstens spec.turretSpeed Grad/s zum Zielpunkt (C.twWant aus schiessen.js; Nicolas 2026-11-12, Variante A zum Testen: Turm laeuft nach)
    if (C.on) { const tv = (C.spec.turretSpeed || 40) * Math.PI / 180 * dt; C.tw += Math.max(-tv, Math.min(tv, wrapA((C.twWant ?? player.yaw) - C.tw))); }
    else C.tw += Math.max(-1.2 * dt, Math.min(1.2 * dt, wrapA(C.h - C.tw)));
    // Stabilisiert (Nicolas 2026-11-11): Turm-Richtung und Rohrhoehe gelten in der Welt (C.tw, C.elev), egal wie die Wanne am Hang steht.
    // Gewuenschte Richtung in den Wannen-Rahmen drehen: daraus Turmdrehung (um die Wannen-Hochachse) und Rohrwinkel (-26 bis +34 Grad, damit es auch an steilen Haengen waagrecht bleibt)
    const ce = Math.cos(C.elev), d = tankDir.set(-Math.sin(C.tw) * ce, Math.sin(C.elev), -Math.cos(C.tw) * ce).applyQuaternion(tankQ.copy(C.g.quaternion).invert());
    C.turret.rotation.y = Math.atan2(-d.x, -d.z);
    if (C.gun) { const ad = ((C.turret.rotation.y * 180 / Math.PI) % 360 + 360) % 360, a0 = Math.floor(ad) % 360, fr = ad - Math.floor(ad), lo = C.gunMin ? C.gunMin[a0] * (1 - fr) + C.gunMin[(a0 + 1) % 360] * fr : -0.45;   // zwischen den Graden weich   // nie in die Wanne: tiefster Winkel je Turmdrehung
      C.gun.rotation.x = Math.max(lo, Math.min(0.6, Math.atan2(d.y, Math.hypot(d.x, d.z)))); }
  }
  if (C.dumpG) dumpPose(C.dumpG, C, C.on && (keys.has("Space") || jumpHeld), dt);   // Muldenkipper: Leertaste halten kippt die Mulde (modelle.js)
  if (C.beacon) { const t = clock.elapsedTime * 6, k = C.on ? 1 : 0; C.beacon[0].emissiveIntensity = 0.2 + k * 2.4 * (Math.sin(t) > 0 ? 1 : 0); C.beacon[1].emissiveIntensity = 0.2 + k * 2.4 * (Math.sin(t) > 0 ? 0 : 1); }   // Blaulicht
  if (C.jetM) { C.jet = Math.max(0, C.jet - dt); C.jetM.emissiveIntensity = Math.min(2.5, C.jet * 4); }
  if (C.flame) { const k = C.boostOn ? 0.85 + 0.3 * Math.random() : Math.min(1, C.jet * 2); C.flame.visible = k > 0.02; C.flame.scale.set(0.8 + 0.3 * k, 0.8 + 0.3 * k, k); }
}
function carCircles(on) {
  const sp = CAR.spec;
  if (!CAR.circ) CAR.circ = sp.pts.map(() => { const c = [0, 0, 0, 0]; c.dyn = true; circles.push(c); return c; });
  sp.pts.forEach((lz, i) => { const [x, z] = carW(0, lz), c = CAR.circ[i]; c[0] = x; c[1] = z; c[2] = on ? sp.circR : 0; c[3] = CAR.y + sp.bodyH - 0.1; });
}
// Schaufel schiebt Fahrzeuge (Nicolas 2026-11-12): Punkte entlang der Schaufelkante (spec.push: z, halbe Breite w), jedes andere Bodenfahrzeug als
// Kapsel (Laengsachse, circR). Beruehrt die Kante die Kapsel, wird es um die Eindringtiefe weggeschoben, in Richtung der Beruehrnormalen (von jeder
// Seite); an einem Ende getroffen dreht es sich mit. Steht dahinter eine Wand oder ein anderes Fahrzeug, bleibt es stehen (dann blockiert es wie bisher).
function vehPushStep(C, nx, nz) {
  const P = C.spec.push, s = Math.sin(C.h), c = Math.cos(C.h); let pushed = false;
  for (const v of VEH) {
    if (v === C || v.on || v.dead || !v.g.visible || Math.abs(v.y - C.y) > 2.5) continue;
    const L = Math.max(...v.spec.pts.map(Math.abs)), r = v.spec.circR + 0.1, ax = Math.sin(v.h), az = Math.cos(v.h);
    if (Math.hypot(v.x - nx, v.z - nz) > L + r + Math.abs(P.z) + P.w + 1) continue;
    let mx = 0, mz = 0, pmax = 0, tq = 0;                                         // alle Beruehrpunkte zusammen (sonst dreht es durch die Reihenfolge)
    for (let k = -2; k <= 2; k++) {
      const lx = P.w * k / 2, bx = nx + lx * c + P.z * s, bz = nz - lx * s + P.z * c;
      const t = Math.max(-L, Math.min(L, (bx - v.x) * ax + (bz - v.z) * az)), qx = v.x + ax * t, qz = v.z + az * t, d = Math.hypot(qx - bx, qz - bz);
      if (d >= r) continue;
      const nnx = d > 1e-4 ? (qx - bx) / d : -s, nnz = d > 1e-4 ? (qz - bz) / d : -c, pen = r - d;
      mx += nnx * pen; mz += nnz * pen; pmax = Math.max(pmax, pen); tq += (nnx * -az + nnz * ax) * pen * t;
    }
    if (pmax <= 0) continue;
    const ml = Math.hypot(mx, mz) || 1, saved = { x: v.x, z: v.z, h: v.h };
    v.x += mx / ml * pmax; v.z += mz / ml * pmax; v.h = wrapA(v.h + tq / (L * L + 1) * 0.35);
    const prev = CAR; CAR = v; carNear(); let ok = true;
    const vs = Math.sin(v.h), vc = Math.cos(v.h);
    for (const lz of v.spec.pts) { const q = { x: v.x + lz * vs, z: v.z + lz * vc }, qx0 = q.x, qz0 = q.z; carPush(q, v.y, v.spec.R); if (Math.hypot(q.x - qx0, q.z - qz0) > 0.05) { ok = false; break; } }
    if (ok) { v.settled = false; carCircles(true); carPose(0); pushed = true; } else Object.assign(v, saved);
    CAR = prev; carNear();
  }
  return pushed;
}
// Abschleppen (modelle.js TOW/towFind/towFollow): das gezogene Auto hat keine Kollisionskreise (sonst blockiert es den Abschleppwagen), seine
// Rollachse folgt dem Gelaende, die gegriffene Achse ist TOW.lift angehoben. Geparkt bleibt es am Haken haengen.
function towToggle(C) {
  if (C.towed) { const n = C.towed.v.label; towDrop(C); return toast(n + " abgesetzt"); }
  if (Math.abs(C.v) > 3) return carMsg("Zum Anhängen anhalten");
  const t = towFind(C, VEH);
  if (!t || typeof t === "string") return carMsg(t ? t + " lässt sich nicht abschleppen (nur Autos)" : "Kein Auto am Haken – rückwärts an eine Achse fahren");
  C.towed = t; t.v.towBy = C; t.v.yG = t.v.y; const prev = CAR; CAR = t.v; carCircles(false); CAR = prev;
  toast(t.v.label + " hängt am Haken – Leertaste setzt es ab");
}
function towDrop(C) {
  const v = C.towed.v; C.towed = null; v.towBy = null; v.v = 0; v.settled = false; v.y = v.yG ?? v.y;
  const prev = CAR; CAR = v; carCircles(true); CAR = prev;
}
function towStep(C, dt) {
  const v = C.towed.v; if (C.dead || v.dead) return towDrop(C);
  const p = towFollow(C, C.towed), prev = CAR; CAR = v; carNear();
  const gr = carGround(v.yG ?? v.y); v.yG = gr.y; v.y = gr.y + TOW.lift * 0.5; v.pitch = gr.pitch + p; v.roll = gr.roll; v.air = false; v.v = C.v; carPose(dt); v.v = 0;
  CAR = prev; carNear();
}
function carMsg(t) { if (clock.elapsedTime - CAR.msgT > 2.5) { CAR.msgT = clock.elapsedTime; toast(t); } }
function useCar(want) {
  if (!walking || ghost) return false;
  const p = player.pos;
  if (CAR && CAR.on) {
    // Aussteigen: links (Fahrerseite), sonst rechts, sonst vorne/hinten
    const C = CAR, s = Math.sin(C.h), c = Math.cos(C.h);
    if (C.flying) { toast("Erst landen (C unten halten oder H)"); return true; }   // DeLorean in der Luft
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
  for (const v of VEH) { const d = Math.hypot(p.x - v.x, p.z - v.z); if (!v.dead && (!want || v === want) && d < v.spec.enter + (want ? 1.5 : 0) && d < bd && Math.abs(p.y - v.y) < 2) { best = v; bd = d; } }   // want: das angezielte Fahrzeug (Rechtsklick)
  if (!best) return false;
  if (best.towBy) towDrop(best.towBy);                                       // Einsteigen in ein Auto am Haken: es wird abgesetzt
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
  if (v.towBy) towDrop(v.towBy); if (v.towed) towDrop(v);                   // Holen loest den Haken
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
// DeLorean schwebt (Nicolas 2026-11-12): Leertaste beim Fahren (oder im Stand) klappt die Raeder in einer fluessigen Animation (1 s) flach ein, ohne
// zu bremsen; dabei hebt er im gleichen Takt sanft ab (Schwebehoehe 0,6 m waechst mit dem Einklappen). Im Flug: W/S vor/zurueck (bis 30 m/s), A/D drehen,
// Leertaste halten hoch, C halten runter (6 m/s), sonst haelt er die Hoehe (hoechstens 400 m). Landen: Leertaste doppelt tippen (innerhalb 0,35 s), C unten halten (0,4 s am Boden) oder H; beim Sinken
// klappen die Raeder in den letzten 1,5 m wieder aus, er setzt mit seiner Geschwindigkeit auf und faehrt weiter. Aussteigen erst nach dem Landen.
function hoverStep(C, dt, th, st) {
  C.fold = C.fold || 0;
  if (!C.flying && player.jump && !C.wet) { C.hoverWant = true; C.flying = true; C.air = true; C.vy = Math.max(0, C.vy || 0); C.lowT = 0; player.jump = false; toast("Räder klappen ein – Leertaste hoch, C runter, Leertaste doppelt = landen"); }
  if (!C.flying) { C.hoverWant = false; if (C.fold > 0) C.fold = Math.max(0, C.fold - dt / 1.0); return false; }
  if (C.hoverWant && player.jump) { const now = clock.elapsedTime; if (now - (C.tapT ?? -9) < 0.35) { C.hoverWant = false; C.tapT = -9; toast("Landen – Räder klappen aus"); } else C.tapT = now; player.jump = false; }   // Leertaste doppelt tippen = landen (Nicolas 2026-11-12)
  const sp = C.spec, up = keys.has("Space") || jumpHeld ? 1 : 0, dn = keys.has("KeyC") || downHeld ? 1 : 0;
  if (C.hoverWant) C.fold = Math.min(1, C.fold + dt / 1.0);
  const e = C.fold * C.fold * (3 - 2 * C.fold);
  C.v += (th * 30 - C.v) * Math.min(1, dt * (th ? 0.7 : 0.25)); C.h += st * 1.3 * dt; player.yaw += st * 1.3 * dt;
  C.vy += ((C.hoverWant ? (C.fold < 1 ? 0 : (up - dn) * 6) : -4) - C.vy) * Math.min(1, dt * 3);
  let nx = C.x - Math.sin(C.h) * C.v * dt, nz = C.z - Math.cos(C.h) * C.v * dt;
  for (let it = 0; it < 2; it++) { let sx = 0, sz = 0; for (const lz of sp.pts) { const px = nx + lz * Math.sin(C.h), pz = nz + lz * Math.cos(C.h), q = { x: px, z: pz }; carPush(q, C.y, sp.R); sx += q.x - px; sz += q.z - pz; } nx += sx; nz += sz; }
  const far = Math.hypot(nx, nz); if (far > LIMIT) { nx *= LIMIT / far; nz *= LIMIT / far; }
  C.x = nx; C.z = nz;
  let ny = Math.min(400, C.y + C.vy * dt); const floor = carGround(Math.max(C.y, ny) + 0.3).y;
  if (floor < terrainH(C.x, C.z) - 2) ny = Math.min(ny, floor + 1.5);   // unter der Erde (Garage, Tunnel, Hoehle): nur knapp ueber dem Boden schweben
  if (C.hoverWant) {
    const min = floor + 0.6 * e;                                          // Abheben im Takt der Klapp-Animation
    if (ny < min) { ny = Math.min(min, Math.max(ny, C.y) + 1.2 * dt + (min - Math.max(ny, C.y)) * Math.min(1, dt * 4)); if (C.vy < 0) C.vy = 0; }
    C.lowT = dn && ny <= floor + 0.65 ? (C.lowT || 0) + dt : 0;           // C unten halten = landen
    if (C.lowT > 0.4) { C.hoverWant = false; toast("Landen – Räder klappen aus"); }
  } else {
    C.fold = Math.min(C.fold, Math.max(0, (ny - floor) / 1.5));          // Raeder klappen beim Sinken wieder aus
    if (ny <= floor + 0.02) { ny = floor; C.flying = false; C.air = false; C.vy = 0; C.fold = 0; C.lowT = 0; toast("Gelandet"); }
  }
  C.y = ny;
  C.pitch += (-th * 0.08 - C.pitch) * Math.min(1, dt * 2); C.roll += (st * 0.22 * Math.min(1, Math.abs(C.v) / 8) - C.roll) * Math.min(1, dt * 3);
  if (Math.abs(C.v) > 3) player.yaw += wrapA(C.h + (C.v < 0 ? Math.PI : 0) - player.yaw) * Math.min(1, dt * 1.2);
  C.throttle = th > 0.1 ? 1 : 0; player.jump = false;
  speedEl.textContent = Math.round(Math.abs(C.v) * 3.6) + " km/h" + (C.fold < 1 && C.hoverWant ? " · Räder klappen ein" : C.hoverWant ? " · schwebt" : " · landet"); nitroEl.hidden = true;
  carPose(dt);
  return true;
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
  if (sp.hover && hoverStep(C, dt, th, st)) return;                         // DeLorean: einklappen / schweben
  // Nitro (Nachtfalke, Nicolas 2026-11-09: statt Sprung): Leertaste halten = Schub aus der Duese, die Leiste leert sich (ca. 4 s Vorrat);
  // nach dem Loslassen 2 s Pause, dann laedt sie Stueck fuer Stueck nach (alle 0,6 s ein Zehntel)
  if (C.boostE === undefined) { C.boostE = 1; C.boostT = 0; }
  const boostKey = player.jump || jumpHeld || keys.has("Space");   // Leertaste gedrueckt halten (Nicolas 2026-11-12: vorher nur der Moment des Drueckens)
  const boosting = !!sp.boost && boostKey && !C.air && !C.wet && th >= 0 && C.boostE > 0;
  if (sp.boost) {
    if (boosting && !C.boostOn) engineJet();
    C.boostOn = boosting;
    if (boosting) { C.boostE = Math.max(0, C.boostE - dt / 4); C.boostT = -2; C.jet = Math.max(C.jet, 0.5); }
    else if (C.boostE < 1) { C.boostT += dt; if (C.boostT >= 0.6) { C.boostT -= 0.6; C.boostE = Math.min(1, Math.floor(C.boostE * 10 + 1e-6) / 10 + 0.1); } }
    C.boostLock = C.boostE <= 0;
    if (boostKey && C.boostE <= 0) carMsg("Nitro leer – lädt nach");
  }
  const max = C.wet ? 0.3 : sp.maxF * (C.towed ? TOW.slow : 1) + (boosting ? 40 / 3.6 : 0);   // mit Auto am Haken langsamer   // Nitro: 40 km/h ueber dem Hoechsttempo ; sonst nur W bis zum Hoechsttempo, im Wasser steckt man fest
  // Lenken (Fahrradmodell, bei Tempo weniger Einschlag), Gas/Bremse
  // Anlaufzeit (Nicolas 2026-11-11): kurz A/D tippen lenkt nur leicht, erst gehalten voller Einschlag (25 % -> 100 % in 0,45 s, weich)
  if (st && Math.sign(st) === C.stDir) C.stHold = (C.stHold || 0) + dt; else { C.stHold = 0; C.stDir = Math.sign(st); }
  const hk = Math.min(1, C.stHold / 0.45), stF = st ? 0.25 + 0.75 * hk * hk * (3 - 2 * hk) : 0;
  const steerT = st * stF * sp.steer / (1 + Math.abs(C.v) / 14);   // bei Tempo etwas williger (Serpentine r 11 mit ca. 40 km/h)
  C.steer += (steerT - C.steer) * Math.min(1, dt * 8);
  if (!C.air) {
    const KP = C.wet ? { k: Math.tan(C.steer) / sp.wb, dec: 0, thF: 1 } : kurvenPhysik(sp, C.v, C.steer, th, max);   // Haftgrenze, Kurvenwiderstand (modelle.js)
    C.aLat = C.v * C.v * Math.abs(KP.k);
    const dh = C.v * KP.k * dt;
    C.h = wrapA(C.h + dh); if (!C.turret) player.yaw += dh;   // Panzer: Lenken dreht nur die Wanne, Blick und Turm bleiben
    // Hang (Nicolas 2026-11-08): Hangabtrieb statt harter Sperre. Steigung aus dem Gelaende vor/hinter dem Fahrzeug (nur auf freiem
    // Gelaende; Tunnel, Hallen, Hoehle liefern -100 bzw. liegen weit weg). Bergauf bremst die Schwerkraft, bergab wird man schneller;
    // ueber der Grenzsteigung des Fahrzeugs (spec.grade) drehen die Raeder durch: kein Vortrieb mehr, man rollt mit Schwung weiter und dann zurueck.
    const hx = -Math.sin(C.h), hz = -Math.cos(C.h), gF = carSlopeG(C.x + hx * 1.2, C.z + hz * 1.2, C.y), gB = carSlopeG(C.x - hx * 1.2, C.z - hz * 1.2, C.y);
    const onTerrain = gF > -50 && gB > -50 && Math.abs(gF - C.y) < 2 && Math.abs(gB - C.y) < 2;
    const slope = onTerrain ? Math.atan2(gF - gB, 2.4) : 0, maxG = (sp.grade || 40) * Math.PI / 180;
    const grip = boosting ? 1 : th > 0 && slope > 0 ? clamp01((maxG - slope) / 0.14) : 1;   // 8 Grad Uebergang bis zum Durchdrehen
    const held = th === 0 && Math.abs(C.v) < 0.6 && slope < maxG;            // Stillstand ohne Gas: Bremse haelt
    const crawl = sp.tracks && th > 0 && slope > 0.05;                        // Ketten (Panzer, Nicolas 2026-11-11): mit Gas kein Zurueckrollen, steil nur im Kriechtempo
    if (held) C.v = 0; else if (crawl) C.v = Math.min(C.v, Math.max(1.5, max * (1 - slope / maxG))); else C.v -= SLOPE_G * Math.sin(slope) * dt;
    C.slope = slope;
    const brk = (sp.brake || 28) + Math.abs(C.v) * 0.2;                     // Bremse (Nicolas 2026-11-11: Bremsweg zu lang; vorher 16 m/s²): 100 km/h -> ca. 13 m, 200 km/h -> ca. 45 m
    if (th > 0) C.v += (C.v < -0.2 ? brk : sp.acc * (1 - Math.max(0, C.v) / (max + 8)) * KP.thF) * grip * dt;
    else if (th < 0) C.v -= (C.v > 0.2 ? brk : sp.revMax ? sp.acc * (1 - Math.max(0, -C.v) / (sp.revMax + 8)) : 6) * dt;   // spec.revMax: rueckwaerts wie vorwaerts (Panzer, Nicolas 2026-11-11)
    else C.v -= Math.sign(C.v) * Math.min(Math.abs(C.v), (3 + Math.abs(C.v) * 0.06) * dt);   // Ausrollen ohne Gas etwas kuerzer
    C.v -= Math.sign(C.v) * Math.min(Math.abs(C.v), KP.dec * dt);                                      // Kurvenwiderstand / Radieren
    if (boosting && C.v < max) C.v = Math.min(max, C.v + 80 * dt);                                            // Nitro 5-mal so stark (Nicolas 2026-11-09)
    if (C.v > max) C.v = Math.max(max, C.v - (C.slope < -0.05 ? 4 : 14) * dt);   // bergab darf man etwas ueber das Hoechsttempo rollen
    C.v = Math.max(th < 0 ? -(sp.revMax || 8) : -Math.max(16, sp.revMax || 0), C.v);                                     // rueckwaerts den Hang hinunter auch schneller
    // Sprung mit Schub (nur Tumbler: ohne Rampe)
    if (sp.jump && (player.jump || jumpHeld)) {
      if (C.v >= 14 && !C.wet) { C.air = true; C.vy = 7.5; C.v += C.jetM ? 6 : 3; C.jet = 0.9; toast("Sprung!"); if (C.jetM) engineJet(); }   // Batpod: Sprung ohne Duese/Schub
      else if (player.jump) carMsg("Für den Sprung schneller fahren (ab 50 km/h)");
    }
  }
  if (sp.tow && player.jump) towToggle(C);                                     // Abschleppwagen: Leertaste = Auto anhaengen / absetzen
  player.jump = false;
  // Bewegen mit Kollision (Kreise entlang der Karosserie)
  const fx = -Math.sin(C.h), fz = -Math.cos(C.h), x0 = C.x, z0 = C.z;
  let nx = C.x + fx * C.v * dt, nz = C.z + fz * C.v * dt;
  if (sp.push && vehPushStep(C, nx, nz)) C.v *= Math.max(0, 1 - dt * 1.2);                 // Schaufel schiebt Fahrzeuge (etwas Widerstand)
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
    const wallT = CAR.spec.tracks ? Math.tan(80 * Math.PI / 180) : WALL_TAN;   // Ketten: erst ab 80 Grad Wand
    if (!boosting && moved > 1e-6 && g1 - g0 > wallT * moved && C.y < g0 + 0.3) {   // mit Nitro kommt man jede Gelaendewand hoch
      // Echte Wand (ueber ca. 65 Grad): nicht hart stoppen, sondern entlang der Hoehenlinie abgleiten (Anteil bergauf entfernen)
      const e = 0.4, gx = carSlopeG(x0 + e, z0, C.y) - carSlopeG(x0 - e, z0, C.y), gz = carSlopeG(x0, z0 + e, C.y) - carSlopeG(x0, z0 - e, C.y), gl = Math.hypot(gx, gz);
      let mx = nx - x0, mz = nz - z0;
      if (gl > 1e-6 && Math.abs(gx) < 50 && Math.abs(gz) < 50) { const ux = gx / gl, uz = gz / gl, up = mx * ux + mz * uz; if (up > 0) { mx -= ux * up; mz -= uz * up; } }
      const sx = x0 + mx * 0.9, sz = z0 + mz * 0.9;
      if (carSlopeG(sx, sz, C.y) - g0 <= wallT * Math.hypot(mx, mz) + 0.02) { nx = sx; nz = sz; } else { nx = x0; nz = z0; }
    }
    if (C.y > -3 && seaD(nx, nz) > -40 && terrainH(nx, nz) < WATER_Y - 0.5 && carSupport(nx, nz, C.y) < WATER_Y - 0.5) { nx = x0; nz = z0; }   // Steilkueste
  }
  if (C.y > -3 && coastEdge(nx, nz, x0, z0, 6)) { nx = x0; nz = z0; if (!C.air) C.v *= 0.3; }   // Klippenkante: Fahrzeuge halten 6 m vor der Kuestenlinie (auch im Flug)
  if (siloEdge(nx, nz, x0, z0, C)) { nx = x0; nz = z0; if (!C.air) C.v *= 0.3; }                 // offenes Silo: am Rand anhalten (Nicolas 2026-11-11)
  const far = Math.hypot(nx, nz); if (far > LIMIT) { nx *= LIMIT / far; nz *= LIMIT / far; }
  C.x = nx; C.z = nz;
  if (dt > 0) { const along = ((nx - x0) * fx + (nz - z0) * fz) / dt; if (Math.abs(along) < Math.abs(C.v) - 0.5) C.v = C.air ? along * 0.9 : along; }   // an Hindernissen abbremsen
  // Hoehe: am Boden haften, ueber Kanten abheben, im Flug Schwerkraft
  // Kippschutz (Nicolas 2026-11-11, Panzer stand senkrecht im Silo): liegt der Boden unter der Mitte mehr als 35 % des Radstands (mind. 0,6 m) unter der Ebene der Raeder und
  // steht das Fahrzeug schraeg, haengt es ueber einer Kante (kein Hang): dann faellt es (Flug mit begrenzter Neigung) bis die Mitte aufsetzt
  const overEdge = q => q.hc < q.y - Math.max(0.6, 0.35 * sp.wb) &&   // Schwelle mit dem Radstand (Nicolas 2026-11-11: am Hangfuss zuckte der Panzer, eine Mulde ist keine Kante)
    Math.max(Math.abs(q.pitch), Math.abs(q.roll)) > 0.35;
  const gr = carGround(C.y);
  if (!C.air) {
    if (gr.y >= C.y - 0.5 && !overEdge(gr)) { const lim = ((sp.grade || 40) + 10) * Math.PI / 180, cg = v => Math.max(-lim, Math.min(lim, v));   // Neigung hoechstens Steigvermoegen + 10 Grad (Kante statt Hang)
      C.y = gr.y; C.vy = 0; C.pitch += (cg(gr.pitch) - C.pitch) * Math.min(1, dt * 10); C.roll += (cg(gr.roll) - C.roll) * Math.min(1, dt * 10); hullLift(C); }
    else { C.air = true; C.vy = 0; }
  } else {
    C.vy -= CAR_G * dt; C.y += C.vy * dt;
    const g2 = carGround(C.y), e2 = overEdge(g2), land = e2 ? g2.hc : g2.y, cl = v => e2 ? Math.max(-0.35, Math.min(0.35, v)) : v;
    if (C.y <= land) { C.y = land; C.air = false; C.vy = 0; C.pitch = cl(g2.pitch); C.roll = cl(g2.roll); if (!e2) hullLift(C); }
    if (C.y <= land + 0.01 && e2) {   // haengt nach dem Fallen noch an der Kante: zur tieferen Seite schieben (in 25-cm-Schritten, hoechstens 6 m), bis es ganz aufsetzt
      const a = -Math.sign(g2.pitch), b = Math.abs(g2.roll) > 0.1 ? -Math.sign(g2.roll) : 0, n = Math.hypot(a, b) || 1, dx = (-Math.sin(C.h) * a + Math.cos(C.h) * b) / n, dz = (-Math.cos(C.h) * a - Math.sin(C.h) * b) / n;
      for (let k = 0; k < 24; k++) { C.x += dx * 0.25; C.z += dz * 0.25; const g3 = carGround(C.y); if (!overEdge(g3)) { C.y = Math.max(C.y, g3.y); C.pitch = g3.pitch; C.roll = g3.roll; break; } } }
    else { const tp = Math.max(-0.12, Math.min(0.2, Math.atan2(C.vy, Math.max(8, Math.abs(C.v))) * 0.4));   // im Flug nur leicht neigen (Nicolas: nach tiefen Spruengen kippte die Nase stark nach vorne)
      C.pitch += (tp - C.pitch) * Math.min(1, dt * 2); C.roll *= 0.95; }
  }
  if (sp.bike) { const tl = C.steer * Math.min(1, Math.abs(C.v) / 6) * 0.9; C.lean += (tl - C.lean) * Math.min(1, dt * 5); }   // Motorrad legt sich in die Kurve
  // Wasser: Teich, See, Meer
  const surf = waterAt(C.x, C.z), wet = surf !== null && C.y < surf - 0.6;
  if (wet && !C.wet) toast(sp.name + " steckt im Wasser – R setzt zurück");
  C.wet = wet;
  if (wet) C.v *= Math.pow(0.15, dt);
  // steht es trotzdem lange sehr steil (Raupen ab 80, sonst ab 60 Grad), zurueck an den letzten sicheren Punkt
  C.tipT = Math.max(Math.abs(C.pitch), Math.abs(C.roll)) > (sp.tracks ? 1.4 : 1.05) ? (C.tipT || 0) + dt : 0;
  if (C.tipT > 1.5) { C.tipT = 0; carReset(); return; }
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
  { const b = gothamDeckCam(x, y, z); if (b !== undefined) return b; }   // zweistoeckige Strassen (G2e): Platte und Waende
  for (const s of nearS) if (s.on && x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && y > s.y0 && y < s.y1) return true;
  for (const [cx, cz, r, top] of nearC) if (r > 0 && (x - cx) ** 2 + (z - cz) ** 2 < r * r && (top === undefined ? y > terrainH(cx, cz) - 3 : y < top && y > top - 8)) return true;
  if (y >= terrainH(x, z) + 0.2) return false;                           // ueber dem Gelaende frei
  // unter der Erde nur in Hohlraeumen: Garage, Hangfuss-Tunnel, Schacht, Haus, Waterfall-Exit-Roehre, Hoehlen
  // Garage: nur in Garagenhoehe und mind. 1,2 m vom Rand (der Umriss schliesst die Waende ein; Nicolas: man sah durch die Wand)
  if (y < HILL - 0.6 && y > GY + HILL - 0.5 && [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].every(([a, b]) => inPoly(GARAGE, x + a, z + b))) return false;
  if (y < HILL - 0.6 && y > GY + HILL - 0.5 && GRAMP.inP(x, z, -1.2)) return false;   // Garagenrampe: Wendeplatz
  if (GRAMP.door && GRAMP.door.open > 0.9 && x > 2 && x < 7.5 && z > GRAMP.D0 + 0.8 && z < GRAMP.D1 - 0.8 && y > GY + HILL - 0.5 && y < GY + HILL + 3) return false;   // durchs offene Rampentor
  if (GRAMP.inF(x, z, -0.5) && y > GRAMP.y(z) + 0.3) return false;                  // ueber der (offenen) Klappe frei bis zum Himmel (Nicolas: Kamera wackelte)
  if (y > HF_Y - 0.5 && (inHfTun(x, z, y) || (y < HILL - 0.6 && inRect(CSH_OUT, x, z)))) return false;
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
function carCamera(dt = 1 / 60) {
  const C = CAR, sp = C.spec;
  player.pos.set(C.x, C.y + 0.6, C.z);
  // Tempo-Gefuehl (modelle.js): Sichtfeld, Kamera naeher/tiefer, Vibrieren; nicht mit Turm (Zielen/Zoom setzen den Sichtwinkel)
  // Kamera-Tempo geglaettet (Nicolas 2026-11-12: beim Abheben/Landen des DeLorean sprang die Kamera): Sichtfeld, Abstand und Hoehe gleiten in ca. 0,4 s;
  // in der Luft zaehlt 0 (Sprung), Schweben zaehlt als Fahrt
  const camT = C.air && !C.flying ? 0 : Math.abs(C.v); C.camV = C.camV === undefined ? camT : C.camV + (camT - C.camV) * Math.min(1, dt * 2.5);
  const TG = tempoGefuehl(C.camV, clock.elapsedTime);
  if (!C.turret && Math.abs(camera.fov - TG.fov) > 0.05) { camera.fov = TG.fov; camera.updateProjectionMatrix(); }
  if (C.view === 1) {
    const [sx, sy, sz] = sp.seat, s = Math.sin(C.h), c = Math.cos(C.h);
    camera.position.set(C.x + sx * c + sz * s, C.y + sy, C.z - sx * s + sz * c);
    camera.rotation.set(player.pitch + TG.sy * 0.15, player.yaw + TG.sx * 0.1, 0, "YXZ");
    return;
  }
  const D = sp.camD * TG.dK, H = Math.max(0.9, Math.min(7, 2.2 - player.pitch * 6)), tx = C.x, ty = C.y + sp.camH, tz = C.z;
  const dx = Math.sin(player.yaw) * D, dy = Math.max(0.5, H - 1.3 + 0.9 + TG.hK), dz = Math.cos(player.yaw) * D;
  let k = 1;
  for (let t = 0.12; t <= 1.0001; t += 0.06) if (camBlocked(tx + dx * t, ty + dy * t, tz + dz * t)) { k = Math.max(0.12, t - 0.08); break; }
  camera.position.set(tx + dx * k + TG.sx, ty + dy * k + TG.sy, tz + dz * k);
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
    if (v.on || v.towBy) continue;                                         // am Haken: Lage kommt aus towStep
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
    if (active.towed) towStep(active, dt);
    if (walking) { carNear(); carPose(0); carCamera(dt); engineUpdate(active); }
  }
}
