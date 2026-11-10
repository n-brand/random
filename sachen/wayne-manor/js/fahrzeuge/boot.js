// Wayne Manor 3D – Boot fahren
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Boot fahren =====================
// E in der Naehe (4,5 m) = einsteigen, im Boot E = am Ufer aussteigen. W/S Gas/Bremse, A/D lenken.
// Faehrt nur auf Wasser (Hoehlenkanaele, Wassertunnel, Meer), geschlossene Felstore sperren.
const BOAT = world.userData.boat;
function boatWater(x, z) {
  const c = caveAt(x, z);
  if (c === 1) return false;
  const wc = waterCaveAt(x, z);
  if (wc && c === 0) return wc.big;                                       // E2: in grosse Wasserhoehlen hinein, in kleine Nischen nicht
  if (SEA_STACKS.some(s => Math.hypot(x - s.x, z - s.z) < s.r + 0.8)) return false;   // Felsnadeln
  if (c === 0 && !(seaD(x, z) > 4.5 && terrainH(x, z) < SEA_Y - 0.5)) return false;   // Felswand steht bis ca. 4,5 m vor der Kuestenlinie
  for (const t of gates) {
    if (t.open > 0.9 || (!t.anim && t.lift && (t.y0 ?? BED) + sst(0, 1, t.open) * t.lift > SEA_Y + 2.6)) continue;   // Unterkante ueber dem Boot
    const [ax, az] = t.a, [bx, bz] = t.b, dx = bx - ax, dz = bz - az, k = clamp01(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
    if (Math.hypot(x - ax - dx * k, z - az - dz * k) < 1.2) return false;
  }
  return Math.hypot(x, z) < 900;
}
function boatFree(x, z, h) {
  const s = Math.sin(h), c = Math.cos(h);
  return [[0, 0], [0, -3.6], [0, 3.0], [-1.15, -1.6], [1.15, -1.6], [-1.1, 3.0], [1.1, 3.0]].every(([lx, lz]) => boatWater(x + lx * c + lz * s, z - lx * s + lz * c));
}
function seatBoat() {
  const s = Math.sin(BOAT.h), c = Math.cos(BOAT.h);
  player.pos.set(BOAT.x + 1.6 * s, BOAT.g.position.y + 0.95, BOAT.z + 1.6 * c);
  if (BOAT.view === 1) { camera.position.set(player.pos.x, player.pos.y + 0.9, player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0, "YXZ"); return; }
  // Third Person (Nicolas 2026-11-08, Standard): Kamera hinter dem Boot wie beim Auto, Maus dreht um das Boot, V = Fahrersicht
  const D = 8.5, H = Math.max(1.2, Math.min(7, 2.6 - player.pitch * 6)), tx = BOAT.x, ty = SEA_Y + 1.4, tz = BOAT.z;
  const dx = Math.sin(player.yaw) * D, dy = H, dz = Math.cos(player.yaw) * D;
  let k = 1;
  for (let t = 0.12; t <= 1.0001; t += 0.06) if (camBlocked(tx + dx * t, ty + dy * t, tz + dz * t)) { k = Math.max(0.12, t - 0.08); break; }
  camera.position.set(tx + dx * k, ty + dy * k, tz + dz * k);
  camera.lookAt(tx, ty + 0.3, tz);
}
function useBoat() {
  if (!walking) return false;
  const p = player.pos;
  if (BOAT.on) {
    // B5: Aussteigen auf das naechste begehbare Ufer: Steg, Treppe, Podest, Weg oder Hallenboden (Oberseite ueber dem Wasser,
    // hoechstens bis zum Hallenboden), frei von Hindernissen; das naechste gewinnt
    let best = null;
    for (let r = 2.2; r <= 7.5 && !best; r += 0.5) for (let k = 0; k < 32; k++) {
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
  if (Math.hypot(p.x - BOAT.x, p.z - BOAT.z) < 4.5 && p.y > SEA_Y - 1.5 && p.y < LY + 1) {   // B1: auch vom Hallenboden (6 m darueber) bis zum Steg (B4)
    BOAT.on = true; BOAT.v = 0; keys.clear(); engineStart("Boot");                 // Motorton (Nicolas 2026-11-09)
    player.yaw = BOAT.h;
    toast("Im Boot: W/S Gas und Bremse, A/D lenken, V Kamera, Shift aussteigen");
    seatBoat();
    return true;
  }
  return false;
}
function boatStep(dt) {
  let th = 0, st = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) th += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) th -= 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) st += 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) st -= 1;
  th -= moveStick.y; st -= moveStick.x;
  look(lookStick.x * 2.6 * dt, lookStick.y * 1.8 * dt);
  const max = 14;                                                           // nur W, kein Shift (Nicolas 2026-11-09)
  BOAT.v += th * 5 * dt;
  if (!th) BOAT.v *= Math.pow(0.35, dt);
  BOAT.v = Math.max(-3, Math.min(max, BOAT.v));
  const dh = st * dt * 0.9 * Math.min(1, Math.abs(BOAT.v) / 2.5) * (BOAT.v < 0 ? -1 : 1);
  if (boatFree(BOAT.x, BOAT.z, BOAT.h + dh)) { BOAT.h += dh; player.yaw += dh; }
  const nx = BOAT.x - Math.sin(BOAT.h) * BOAT.v * dt, nz = BOAT.z - Math.cos(BOAT.h) * BOAT.v * dt;
  if (boatFree(nx, nz, BOAT.h)) { BOAT.x = nx; BOAT.z = nz; } else BOAT.v *= -0.25;
  boatPose();
  seatBoat();
  engineUpdate({ v: Math.abs(BOAT.v), throttle: Math.abs(th) > 0.1 ? 1 : 0, air: false, wet: false });   // Aussenborder dreht mit Gas und Tempo
}
// B5: Spieler mehr als 20 m weg -> Boot zurueck in die Bootsbox (schwimmt man daneben, bleibt es)
function boatReturn() {
  const H = BOAT.home;
  if (!walking || BOAT.on || (BOAT.x === H.x && BOAT.z === H.z)) return false;
  if (Math.hypot(player.pos.x - BOAT.x, player.pos.z - BOAT.z) + Math.max(0, Math.abs(player.pos.y - SEA_Y) - 8) <= 20) return false;
  const near = Math.hypot(player.pos.x - H.x, player.pos.z - H.z) < 80 && Math.abs(player.pos.y - LY) < 8;
  BOAT.x = H.x; BOAT.z = H.z; BOAT.h = H.h; BOAT.v = 0;
  if (near) toast("Das Boot ist zurück am Steg");
  return true;
}
let boatTime = 0;
function boatPose() {
  boatTime += 1 / 60;
  // Nicolas 2026-11-08: bei Tempo hebt sich der Bug (Heck tiefer, bis ca. 6 Grad) und das Schaukeln wird ruhiger (bis 75 % weniger)
  const sp = Math.min(1, Math.abs(BOAT.v) / 10), rock = 1 - 0.75 * sp;
  BOAT.trim = (BOAT.trim || 0) + ((BOAT.v > 0 ? 0.105 * sp ** 0.8 : 0) - (BOAT.trim || 0)) * Math.min(1, 1 / 60 * 2.5);   // weich ein- und auslaufen
  BOAT.g.position.set(BOAT.x, SEA_Y + 0.05 * rock * Math.sin(boatTime * 2.1) + 0.06 * sp, BOAT.z);
  BOAT.g.rotation.set(0.02 * rock * Math.sin(boatTime * 1.3) + BOAT.trim, BOAT.h, 0.03 * rock * Math.sin(boatTime * 1.7), "YXZ");
}
