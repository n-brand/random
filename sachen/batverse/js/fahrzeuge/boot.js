// Batverse – Boote fahren (Boot, Schnellboot, U-Boot)
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Boote fahren =====================
// Rechtsklick oder E in der Naehe = einsteigen, im Boot E/Shift = am Ufer aussteigen. W/S Gas/Bremse, A/D lenken, V Kamera.
// Fahren nur auf Wasser (Hoehlensee, Wassertunnel, Meer), geschlossene Felstore und Stege sperren (BOAT_BLOCKS).
// Mehrere Boote (Nicolas 2026-11-16, Phase 7): BOATS = alle, BOAT = das aktive bzw. zuletzt benutzte; je Boot eine Spezifikation b.spec
// (Tempo, Rumpfpunkte fuer die Wasserpruefung, Sitz, Kamera, Ton). Das U-Boot (spec.sub) taucht: Leertaste hoch, C runter (fahrzeuge/boote.js).
// Schnellzone (Nicolas 2026-11-23: "von der Batcave soll man mit dem Boot schnell zur Militaerinsel kommen - eine Wasserzone 400 m von allem Festland etc. weg, wo man
// automatisch schneller fahren kann"): Abstand zum naechsten Land = kleinster von seaD (Manor-Kueste, Insel-Welt mit Inselchen und grossen Inseln) und dem Gotham-Feld
// (Abstand zur Stadtinsel GOT.di, im Gotham-Wasser zum Festland -GOT.dw). Ab 400 m weich bis 600 m: Hoechsttempo und Beschleunigung x BOAT_ZONE_K. Getaucht nicht (U-Boot).
const BOAT_ZONE_K = 3, BOAT_ZONE = { t: 0, d: 0, k: 1, an: false };
function boatLandD(x, z) { let d = seaD(x, z); if (typeof GOT !== "undefined") { const di = GOT.di(x, z); if (di < 1e4) { d = Math.min(d, di); const dw = GOT.dw(x, z); if (dw < 0) d = Math.min(d, -dw); } } return d; }
function boatZone(B, dt) { const Z = BOAT_ZONE; Z.t -= dt; if (Z.t <= 0) { Z.t = 0.25; Z.d = boatLandD(B.x, B.z); }
  const under = B.spec.sub && B.y < SEA_Y - 1, ziel = under ? 1 : 1 + (BOAT_ZONE_K - 1) * sst(400, 600, Z.d); Z.k += (ziel - Z.k) * Math.min(1, dt * 1.5);
  const an = ziel > 1.5; if (an !== Z.an) { Z.an = an; toast(an ? "Schnellzone: weit vor der Küste – Boot " + BOAT_ZONE_K + "-mal so schnell" : "Schnellzone verlassen"); }
  return Z.k; }
const BOAT_SPEC_STD = { name: "Boot", max: 14, acc: 5, rev: 3, turn: 0.9, enter: 4.5, trim: 0.105, camD: 8.5, camH: 1.4, seat: [1.6, 0.95], engine: "Boot",
  hull: [[0, 0], [0, -3.6], [0, 3.0], [-1.15, -1.6], [1.15, -1.6], [-1.1, 3.0], [1.1, 3.0]] };
let BOAT = world.userData.boat; Object.assign(BOAT, { name: "Boot", spec: BOAT_SPEC_STD, y: SEA_Y });
const BOATS = [BOAT];
const BOAT_BLOCKS = [];                                                     // Stege usw.: { x0, x1, z0, z1, deep } (achsparallel, deep = Tiefgang unter dem Wasser)
function boatWater(x, z, y = SEA_Y) {
  const c = caveAt(x, z);
  if (c === 1) return false;
  const wc = waterCaveAt(x, z);
  if (wc && c === 0) return wc.big;                                       // E2: in grosse Wasserhoehlen hinein, in kleine Nischen nicht
  if (SEA_STACKS.some(s => Math.hypot(x - s.x, z - s.z) < s.r + 0.8)) return false;   // Felsnadeln
  if (c === 0 && !(seaD(x, z) > 4.5 && terrainH(x, z) < SEA_Y - 0.5)) return false;   // Felswand steht bis ca. 4,5 m vor der Kuestenlinie
  for (const b of BOAT_BLOCKS) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y > SEA_Y - (b.deep || 1) - 1.6) return false;   // getaucht darunter durch
  for (const t of gates) {
    if (t.open > 0.9 || (!t.anim && t.lift && (t.y0 ?? BED) + sst(0, 1, t.open) * t.lift > Math.max(SEA_Y, y) + 2.6)) continue;   // Unterkante ueber dem Boot
    const [ax, az] = t.a, [bx, bz] = t.b, dx = bx - ax, dz = bz - az, k = clamp01(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
    if (Math.hypot(x - ax - dx * k, z - az - dz * k) < 1.2) return false;
  }
  return Math.hypot(x, z) < (typeof WELT_R !== "undefined" ? WELT_R - 60 : 900);   // ganze Insel-Welt (2026-11-23, vorher 900 m um die Manor; das Gotham-Becken liegt hoeher und sperrt ueber terrainH)
}
// Grund unter dem Wasser (U-Boot): Hoehlengrund bzw. Gelaende
const boatFloor = (x, z) => caveAt(x, z) !== 0 ? BED : terrainH(x, z);
function boatFree(x, z, h, B = BOAT, y = B.y ?? SEA_Y) {
  const s = Math.sin(h), c = Math.cos(h), sub = B.spec.sub;
  return B.spec.hull.every(([lx, lz]) => { const px = x + lx * c + lz * s, pz = z - lx * s + lz * c; return boatWater(px, pz, y) && (!sub || boatFloor(px, pz) < y - sub.r - 0.4); });
}
function seatBoat() {
  const B = BOAT, sp = B.spec, s = Math.sin(B.h), c = Math.cos(B.h), y = B.g.position.y;
  player.pos.set(B.x + sp.seat[0] * s, y + sp.seat[1], B.z + sp.seat[0] * c);
  if (B.view === 1) { camera.position.set(player.pos.x, player.pos.y + 0.9, player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0, "YXZ"); return; }
  // Third Person (Nicolas 2026-11-08, Standard): Kamera hinter dem Boot wie beim Auto, Maus dreht um das Boot, V = Fahrersicht
  const D = sp.camD, H = Math.max(1.2, Math.min(7, 2.6 - player.pitch * 6)), tx = B.x, ty = y + sp.camH, tz = B.z;
  const dx = Math.sin(player.yaw) * D, dy = H, dz = Math.cos(player.yaw) * D, under = ty < SEA_Y - 0.5;
  let k = 1;
  for (let t = 0.12; t <= 1.0001; t += 0.06) { const px = tx + dx * t, py = ty + dy * t, pz = tz + dz * t; if (under ? py < boatFloor(px, pz) + 0.6 || caveAt(px, pz) === 1 : camBlocked(px, py, pz)) { k = Math.max(0.12, t - 0.08); break; } }   // getaucht: nur Grund und Fels
  camera.position.set(tx + dx * k, ty + dy * k, tz + dz * k);
  camera.lookAt(tx, ty + 0.3, tz);
}
function useBoat(want) {
  if (!walking) return false;
  const p = player.pos;
  if (BOAT.on) {
    if (BOAT.spec.sub && BOAT.y < SEA_Y - 0.6) { toast("Erst auftauchen (Leertaste)"); return true; }
    // B5: Aussteigen auf das naechste begehbare Ufer: Steg, Treppe, Podest, Weg oder Hallenboden (Oberseite ueber dem Wasser,
    // hoechstens bis zum Hallenboden), frei von Hindernissen; das naechste gewinnt
    let best = null;
    for (let r = 2.2; r <= 7.5 + (BOAT.spec.exitR || 0) && !best; r += 0.5) for (let k = 0; k < 32; k++) {
      const a = k / 32 * Math.PI * 2, q = new THREE.Vector3(BOAT.x + Math.cos(a) * r, LY + 0.5, BOAT.z + Math.sin(a) * r);
      const top = supportAt(q, LY + 0.5);
      if (top < SEA_Y + 0.3 || top > LY + 0.6) continue;                    // Wasser/Grund oder zu hoch
      const t2 = q.clone(); t2.y = top; pushOut(t2, top);
      if (Math.hypot(t2.x - q.x, t2.z - q.z) > 0.05) continue;               // Hindernis (Poller, Pfahl, Wand)
      best = [q.x, top, q.z]; break;
    }
    if (!best) { toast("Zum Aussteigen näher ans Ufer fahren"); return true; }
    BOAT.on = false; BOAT.v = 0; engineStop();
    player.pos.set(best[0], best[1], best[2]); player.vy = 0;
    toast("Ausgestiegen");
    return true;
  }
  let B = null, bd = 1e9;
  for (const b of BOATS) { const d = Math.hypot(p.x - b.x, p.z - b.z); if ((!want || b === want) && d < b.spec.enter + (want ? 1.5 : 0) && d < bd) { B = b; bd = d; } }
  if (B && p.y > SEA_Y - 1.5 && p.y < LY + 1) {   // B1: auch vom Hallenboden (6 m darueber) bis zum Steg (B4)
    BOAT = B; B.on = true; B.v = 0; keys.clear(); engineStart(B.spec.engine);   // Motorton (Nicolas 2026-11-09)
    player.yaw = B.h;
    toast(B.name + ": W/S Gas und Bremse, A/D lenken" + (B.spec.sub ? ", Leertaste auftauchen, C tauchen" : "") + ", V Kamera, Shift aussteigen");
    seatBoat();
    return true;
  }
  return false;
}
function boatStep(dt) {
  const B = BOAT, sp = B.spec;
  let th = 0, st = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) th += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) th -= 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) st += 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) st -= 1;
  th -= moveStick.y; st -= moveStick.x;
  look(lookStick.x * 2.6 * dt, lookStick.y * 1.8 * dt);
  const zk = boatZone(B, dt), vmax = sp.max * zk;                           // Schnellzone weit vor der Kueste (2026-11-23)
  B.v += th * sp.acc * zk * dt;                                             // nur W, kein Shift (Nicolas 2026-11-09)
  if (!th) B.v *= Math.pow(0.35, dt);
  B.v = Math.max(-sp.rev, Math.min(vmax, B.v));
  // U-Boot: Tiefe (Leertaste hoch, C runter), getaucht langsamer; nur so tief, wie der Grund unter dem ganzen Rumpf erlaubt
  if (sp.sub) { const up = (keys.has("Space") || jumpHeld ? 1 : 0) - (keys.has("KeyC") || downHeld ? 1 : 0); B.vy = (B.vy || 0) + (up * sp.sub.climb - (B.vy || 0)) * Math.min(1, dt * 1.5);
    const ny = Math.min(sp.sub.top, B.y + B.vy * dt); if (boatFree(B.x, B.z, B.h, B, ny)) B.y = ny; else B.vy = 0;   // nicht in den Grund und nicht unter einem Steg auftauchen
    if (B.y < SEA_Y - 1) B.v = Math.max(-sp.rev, Math.min(sp.sub.vUnder, B.v)); }
  const dh = st * dt * sp.turn * Math.min(1, Math.abs(B.v) / 2.5) * (B.v < 0 ? -1 : 1);
  if (boatFree(B.x, B.z, B.h + dh)) { B.h += dh; player.yaw += dh; }
  const nx = B.x - Math.sin(B.h) * B.v * dt, nz = B.z - Math.cos(B.h) * B.v * dt;
  if (boatFree(nx, nz, B.h)) { B.x = nx; B.z = nz; } else B.v *= -0.25;
  boatPose(B, dt);
  seatBoat();
  engineUpdate({ v: Math.abs(B.v), throttle: Math.abs(th) > 0.1 ? 1 : 0, air: false, wet: false });   // Motor dreht mit Gas und Tempo
}
// B5: Spieler mehr als 20 m weg -> Boot zurueck an seinen Platz (schwimmt man daneben, bleibt es)
function boatReturn(B = BOAT) {
  const H = B.home;
  if (!walking || B.on || (B.x === H.x && B.z === H.z && (B.y ?? SEA_Y) === (H.y ?? B.y))) return false;
  if (Math.hypot(player.pos.x - B.x, player.pos.z - B.z) + Math.max(0, Math.abs(player.pos.y - SEA_Y) - 8) <= 20) return false;
  const near = Math.hypot(player.pos.x - H.x, player.pos.z - H.z) < 80 && Math.abs(player.pos.y - LY) < 8;
  B.x = H.x; B.z = H.z; B.h = H.h; B.v = 0; if (H.y !== undefined) { B.y = H.y; B.vy = 0; }
  if (near) toast(B.name + " ist zurück am Steg");
  return true;
}
let boatTime = 0;
function boatPose(B = BOAT, dt = 1 / 60) {
  if (B === BOAT || !B.on) boatTime += dt / BOATS.length;
  // Nicolas 2026-11-08: bei Tempo hebt sich der Bug (Heck tiefer) und das Schaukeln wird ruhiger (bis 75 % weniger); getaucht kein Schaukeln
  const sp = Math.min(1, Math.abs(B.v) / (B.spec.max * 0.7)), wet = B.spec.sub && B.y < SEA_Y - 0.6, rock = wet ? 0 : (1 - 0.75 * sp) * (B.spec.rock ?? 1);
  B.trim = (B.trim || 0) + ((B.v > 0 && !wet ? B.spec.trim * sp ** 0.8 : 0) - (B.trim || 0)) * Math.min(1, dt * 2.5);   // weich ein- und auslaufen
  B.g.position.set(B.x, (B.spec.sub ? B.y : SEA_Y) + 0.05 * rock * Math.sin(boatTime * 2.1) + (wet ? 0 : 0.06 * sp), B.z);
  B.g.rotation.set(0.02 * rock * Math.sin(boatTime * 1.3) + B.trim, B.h, 0.03 * rock * Math.sin(boatTime * 1.7), "YXZ");
  if (B.spin) B.spin(dt);                                                   // Schraube
}
