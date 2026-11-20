// Batverse – Gotham: U-Bahn mitfahren und Abfahrtsanzeigen (Nicolas 2026-11-20 zu OFFENE-FRAGEN 8: "auch mitfahren und Anzeige bei den Stationen, wann er abfaehrt,
// und wenn Tueren immer wieder geoeffnet werden, obwohl er schon abfahren sollte, darf er Verspaetung bekommen und auf der Anzeige auch anzeigen – U-Bahn soll bei Verspaetung
// schneller fahren koennen; sobald sie wieder im Zeitplan liegt, soll die Zeitanzeige sich anpassen, erst wenn sie wieder normal schnell faehrt, die Verspaetung entfernen").
// Nach gotham-ubahn.js (Fahrplan, Tueren, Verspaetung dort in ubTrainStep). Hier:
// - Einsteigen: zu Fuss auf dem Bahnsteig an eine offene Tuer gehen (Tuerfluegel offen) -> man steht im Wagen und faehrt mit (UBR); im Zug WASD gehen (alle drei Wagen),
//   Maus schaut; an einer offenen Tuer zur Bahnsteigseite hinausgehen = aussteigen. bedienung.js walkStep: ubRideMove statt Laufen, ubEinsteigenCheck nach dem Laufen.
// - Tueren aufhalten: wer beim Schliessen in einer Tuer steht (drinnen oder auf dem Bahnsteig davor), laesst sie wieder aufgehen (ubTuerBlock) -> Verspaetung.
// - Innenraum: Boden, Waende mit Fensterband, Baenke, Haltestangen, Licht (je Wagen eine Gruppe, nur waehrend man mitfaehrt).
// - Anzeige oben im Bild (#ub-hud): Linie, naechster Halt, Ankunft bzw. Abfahrt, Tueren, Verspaetung.
// - Abfahrtsanzeigen: je Bahnsteig zwei Tafeln an der Decke (beidseitig), je Richtung der naechste Zug mit Ziel (naechste Station), Abfahrt in m:ss bzw. "jetzt" /
//   "Tueren schliessen", rot "+m:ss" bei Verspaetung, "holt auf", solange er noch schneller faehrt. Neu gezeichnet je Sekunde, nur nah (200 m) und wenn man unten ist.
"use strict";
const UBR = { on: false, t: null, along: 0, lat: 0, yaw0: 0, innen: [], hud: null, hudT: 0, tafeln: [], tafT: 0, blockT: 0 };
const ubZugPunkt = (t, along, lat) => { const p = ubPose(t.r, t.s - t.d * along, t.d); return { x: p.x + Math.sin(p.yaw) * lat, z: p.z + Math.cos(p.yaw) * lat, yaw: p.yaw }; };
const ubTuerAlong = () => { const A = []; for (let c = 0; c < 3; c++) for (const D of UB.TUER) A.push(c * UB.CAR + UB.CAR / 2 + D); return A; };
const ubTuerNah = (a, w = 0.65) => ubTuerAlong().some(x => Math.abs(a - x) < w);
const ubMm = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
function ubStName(r, s) { const L = r.P.length * r.ds; let best = null, bd = 1e9; for (const e of r.st) { let d = Math.abs(e.i * r.ds - (((s % L) + L) % L)); d = Math.min(d, L - d); if (d < bd) { bd = d; best = e; } } return best ? best.name.replace(/^Umsteigen /, "") : "?"; }
// Abfahrt eines Zuges an der Station sS (Sekunden ab jetzt), geschaetzt wie der Zug faehrt: kuerzerer Halt und schneller, solange er verspaetet ist
function ubEta(t, sS) { const L = t.r.P.length * t.r.ds, T = UB.T, eq = (a, b) => { const d = Math.abs(a - b); return Math.min(d, L - d) < 1; };
  let cur = ((t.s % L) + L) % L, plan = t.plan, time = T, v = t.v, late = t.late > 0.5;
  if (t.halt) { if (eq(cur, sS)) return { dep: t.ab - T, late: Math.max(0, t.ab - t.plan), hier: true, t }; time = t.ab; v = 0; }
  for (let k = 0; k < 16; k++) { const [nx, dd] = k === 0 && !t.halt ? [t.next, (() => { let x = t.d > 0 ? t.next - cur : cur - t.next; if (x < 0) x += L; return x; })()] : ubNaechste(t, cur);
    const arr = time + ubFahrzeit(dd, v, late ? UB.VFAST : UB.VMAX), pl = (t.halt || k > 0) ? plan + ubFahrzeit(dd) + UB.DWELL : plan, dep = Math.max(arr + UB.DMIN, pl);
    if (eq(nx, sS)) return { dep: dep - T, ank: arr - T, late: Math.max(0, dep - pl), t };
    time = dep; plan = pl; cur = nx; v = 0; late = dep - pl > 0.5; }
  return null; }
// ---- Ein- und Aussteigen, Bewegen im Zug ----
function ubEinsteigenCheck() { if (!UB.inst || UBR.on || typeof walking === "undefined" || !walking || ghost) return; const p = player.pos; if (Math.abs(p.y - UB.Y) > 0.6) return;
  for (const t of UB.trains) { if (!t.halt || t.offen < 0.9) continue; const m = ubZugPunkt(t, 1.5 * UB.CAR, 0); if (Math.hypot(p.x - m.x, p.z - m.z) > 32) continue;
    for (const a of ubTuerAlong()) { const q = ubZugPunkt(t, a, t.d * 1.4); if (Math.hypot(p.x - q.x, p.z - q.z) < 0.75) return ubEinsteigen(t, a); } } }
function ubEinsteigen(t, a) { ubInnenBau(); Object.assign(UBR, { on: true, t, along: a, lat: t.d * 0.9 }); UBR.yaw0 = ubZugPunkt(t, a, 0).yaw; for (const g of UBR.innen) g.visible = true;
  if (typeof keys !== "undefined") keys.clear?.(); const L = t.r.P.length * t.r.ds, [nx] = ubNaechste(t, ((t.s % L) + L) % L);
  toast("Eingestiegen: " + t.r.name + " → nächster Halt " + ubStName(t.r, nx)); ubRidePose(); }
function ubAussteigen(a) { const t = UBR.t, q = ubZugPunkt(t, a, t.d * 1.95); UBR.on = false; for (const g of UBR.innen) g.visible = false; if (UBR.hud) UBR.hud.hidden = true;
  player.pos.set(q.x, UB.Y, q.z); player.vy = 0; player.onGround = true; camera.position.set(q.x, UB.Y + EYE, q.z); toast("Ausgestiegen: " + ubStName(t.r, t.s)); }
function ubRidePose() { const t = UBR.t, q = ubZugPunkt(t, UBR.along, UBR.lat); let dy = q.yaw - UBR.yaw0; if (dy > Math.PI) dy -= 2 * Math.PI; if (dy < -Math.PI) dy += 2 * Math.PI; player.yaw += dy; UBR.yaw0 = q.yaw;
  player.pos.set(q.x, UB.Y, q.z); player.vy = 0; player.onGround = true; camera.position.set(q.x, UB.Y + EYE, q.z); camera.rotation.set(player.pitch, player.yaw, 0, "YXZ"); }
function ubRideMove(dt, mx, mz, run) { const t = UBR.t; if (!t) { UBR.on = false; return; }
  const sy = Math.sin(player.yaw), cy = Math.cos(player.yaw), wx = -sy * mz + cy * mx, wz = -cy * mz - sy * mx, l = Math.hypot(wx, wz);
  if (l > 0.01) { const sp = (run ? 4.5 : 2.4) * dt, p0 = ubPose(t.r, t.s - t.d * UBR.along, t.d), ux = Math.cos(p0.yaw), uz = -Math.sin(p0.yaw), nx = Math.sin(p0.yaw), nz = Math.cos(p0.yaw);
    const dx = wx / l * sp, dz = wz / l * sp, na = UBR.along - t.d * (dx * ux + dz * uz); let nl = UBR.lat + dx * nx + dz * nz; const tn = ubTuerNah(na);
    if (t.halt && t.offen > 0.9 && tn && nl * t.d > 1.15) return ubAussteigen(na);
    nl = Math.max(tn ? -1.25 : -0.95, Math.min(tn ? 1.25 : 0.95, nl)); UBR.along = Math.max(0.6, Math.min(3 * UB.CAR - 0.6, na)); UBR.lat = nl; }
  ubRidePose(); }
// Tuer aufgehalten? (aus ubTrainStep beim Schliessen)
function ubTuerBlock(t) { let b = false;
  if (UBR.on && UBR.t === t) b = ubTuerNah(UBR.along, 0.8) && UBR.lat * t.d > 0.75;
  else if (typeof walking !== "undefined" && walking && !UBR.on && Math.abs(player.pos.y - UB.Y) < 0.6) for (const a of ubTuerAlong()) { const q = ubZugPunkt(t, a, t.d * 1.4); if (Math.hypot(player.pos.x - q.x, player.pos.z - q.z) < 0.9) { b = true; break; } }
  if (b) UBR.blockT = UB.T; return b; }
function ubTuerAuf(t) { if (UB.T - UBR.blockT < 0.2) toast("Tür aufgehalten – die U-Bahn fährt später ab (+" + ubMm(Math.max(0, t.ab - t.plan)) + ")"); }
function ubTuerSignal(t) { const p = player.pos, m = ubZugPunkt(t, 1.5 * UB.CAR, 0); if (!(UBR.on && UBR.t === t) && Math.hypot(p.x - m.x, p.z - m.z) > 70) return;
  if (typeof gerCtx === "function" && typeof gerTon === "function") { const c = gerCtx(); if (c) for (let i = 0; i < 3; i++) gerTon(c, 880, c.currentTime + 0.05 + i * 0.32, 0.22, 0.07, "triangle"); }
  if (UBR.on && UBR.t === t) toast("Türen schließen"); }
// ---- Innenraum (ein Wagen: x laengs +-7,7, z quer +-1,4, y ab Boden = UB.Y) ----
function ubInnenBau() { if (UBR.innen.length) return; const DS = THREE.DoubleSide, M = o => new THREE.MeshStandardMaterial({ roughness: 0.7, side: DS, ...o });
  const mBoden = M({ color: 0x3a3d42, emissive: 0x15161a, emissiveIntensity: 1 }), mWand = M({ color: 0xd7d9dc, emissive: 0x55575a, emissiveIntensity: 1 }), mGlas = new THREE.MeshStandardMaterial({ color: 0x9fb8c9, transparent: true, opacity: 0.22, roughness: 0.1, side: DS, depthWrite: false });
  const mSitz = M({ color: 0x2b4f8a, emissive: 0x0e1a30, emissiveIntensity: 1 }), mStange = M({ color: 0xc8ccd0, metalness: 0.6, roughness: 0.3, emissive: 0x333333, emissiveIntensity: 1 }), mLicht = new THREE.MeshBasicMaterial({ color: 0xf6f3e8 }), mGelb = M({ color: 0xe6c229, emissive: 0x3d3410, emissiveIntensity: 1 });
  const proto = new THREE.Group(), box = (m, w, h, d, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); proto.add(o); return o; }, HL = (UB.CAR - UB.GAP) / 2, ZW = 1.36;
  box(mBoden, 2 * HL, 0.04, 2 * ZW, 0, -0.02, 0); box(mWand, 2 * HL, 0.04, 2 * ZW, 0, 2.32, 0);
  for (const z of [-0.55, 0.55]) box(mLicht, 2 * HL - 1, 0.02, 0.22, 0, 2.29, z);
  const tuerX = UB.TUER, seg = [[-HL, tuerX[0] - 0.65], [tuerX[0] + 0.65, tuerX[1] - 0.65], [tuerX[1] + 0.65, HL]];
  for (const sd of [-1, 1]) for (const [a, b] of seg) { const L = b - a, x = (a + b) / 2; box(mWand, L, 0.9, 0.04, x, 0.45, sd * ZW); box(mGlas, L, 1.0, 0.02, x, 1.4, sd * ZW); box(mWand, L, 0.42, 0.04, x, 2.11, sd * ZW);
    box(mSitz, L - 0.3, 0.1, 0.48, x, 0.45, sd * (ZW - 0.26)); box(mSitz, L - 0.3, 0.5, 0.08, x, 0.75, sd * (ZW - 0.05)); box(mStange, L, 0.03, 0.03, x, 1.95, sd * 0.75); }
  for (const x of tuerX) { box(mStange, 0.04, 2.3, 0.04, x, 1.15, 0); for (const sd of [-1, 1]) box(mGelb, 1.3, 0.005, 0.12, x, 0.003, sd * (ZW - 0.06)); }
  for (const sd of [-1, 1]) { box(mWand, 0.04, 2.32, 0.8, sd * HL, 1.16, -0.98); box(mWand, 0.04, 2.32, 0.8, sd * HL, 1.16, 0.98); box(mWand, 0.04, 0.35, 1.2, sd * HL, 2.15, 0); }   // Stirnwaende mit Durchgang
  for (let c = 0; c < 3; c++) { const g = c ? proto.clone() : proto; g.name = "U-Bahn Innenraum " + (c + 1); g.visible = false; g.userData.keep = true; g.userData.noLift = true; UB.grp.add(g); UBR.innen.push(g); } }
// ---- Abfahrtsanzeigen: je Bahnsteig (Ring-Eintrag) ein Bild 512 x 160 fuer vier Flaechen (zwei Tafeln, je beidseitig) ----
function ubTafelnBau() { const geo = new THREE.PlaneGeometry(3.4, 1.06), pole = new THREE.MeshStandardMaterial({ color: 0x2a2d31, emissive: 0x111111, emissiveIntensity: 1 });
  for (const r of UB.rings) for (const e of r.st) { const cv = document.createElement("canvas"); cv.width = 512; cv.height = 160; const tex = new THREE.CanvasTexture(cv); if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex }), T = { r, e, cv, tex, pos: [] };
    for (const off of [-22, 44]) { const q = ubRingAt(r, e.i * r.ds + off), th = Math.atan2(q[2], q[3]);
      for (const k of [0, Math.PI]) { const m = new THREE.Mesh(geo, mat); m.position.set(q[0], UB.Y + 3.0, q[1]); m.rotation.y = th + k; m.userData.keep = true; m.userData.noLift = true; UB.grp.add(m); }
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.06, UB.BED + UB.H - UB.Y - 3.53, 0.06), pole); st.position.set(q[0], (UB.Y + 3.53 + UB.BED + UB.H) / 2, q[1]); UB.grp.add(st); T.pos.push(q); }
    UBR.tafeln.push(T); ubTafelZeichnen(T); } }
function ubTafelZeichnen(T) { const c = T.cv.getContext("2d"), r = T.r, sS = T.e.i * r.ds, srt = [...r.st].sort((a, b) => a.i - b.i), k = srt.indexOf(T.e);
  c.fillStyle = "#0b0d10"; c.fillRect(0, 0, 512, 160); c.fillStyle = "#" + r.col.getHexString(); c.fillRect(0, 0, 512, 34); c.fillStyle = "#fff"; c.font = "bold 22px Arial, sans-serif"; c.textBaseline = "middle"; c.textAlign = "left";
  c.fillText(r.name, 12, 18); c.textAlign = "right"; c.font = "bold 18px Arial, sans-serif"; c.fillText(T.e.name.replace(/^Umsteigen /, ""), 500, 18);
  [1, -1].forEach((d, row) => { const y = 58 + row * 60, ziel = srt[(k + d + srt.length) % srt.length]; let best = null;
    for (const t of UB.trains) if (t.r === r && t.d === d) { const e = ubEta(t, sS); if (e && (!best || e.dep < best.dep)) best = e; }
    c.textAlign = "left"; c.fillStyle = "#ffd54a"; c.font = "bold 24px Arial, sans-serif"; c.fillText("→ " + (ziel ? ziel.name.replace(/^Umsteigen /, "") : "?"), 12, y);
    if (!best) return; const t = best.t; let txt = "in " + ubMm(best.dep);
    if (best.hier) txt = t.tuer === "offen" ? "jetzt" : "Türen schließen"; else if (best.ank < 25) txt = "fährt ein";
    c.textAlign = "right"; c.fillStyle = "#ffd54a"; c.fillText(txt, 500, y);
    c.font = "bold 17px Arial, sans-serif"; c.textAlign = "left";
    if (t.anz) { c.fillStyle = "#ff5a4a"; c.fillText(best.late > 0.5 ? "Verspätung +" + ubMm(best.late) : "Verspätung wird aufgeholt", 12, y + 25); }
    else { c.fillStyle = "#8fa0b0"; c.fillText("pünktlich", 12, y + 25); } });
  T.tex.needsUpdate = true; }
// ---- je Bild (aus ubTrainStep): Mitfahren (Lage nach dem Zug), Anzeige, Tafeln ----
function ubFahrtStep(dt) {
  if (UBR.on) { if (typeof walking === "undefined" || !walking || ghost || !UBR.t) { UBR.on = false; for (const g of UBR.innen) g.visible = false; if (UBR.hud) UBR.hud.hidden = true; }
    else { const t = UBR.t; for (let c = 0; c < 3; c++) { const p = ubPose(t.r, t.s - t.d * (c * UB.CAR + UB.CAR / 2), t.d); UBR.innen[c].position.set(p.x, UB.Y, p.z); UBR.innen[c].rotation.y = p.yaw; } ubRidePose(); ubHud(dt); } }
  if (!UB.grp || !UB.grp.visible) return; if (!UBR.tafeln.length) ubTafelnBau();
  if ((UBR.tafT -= dt) > 0) return; UBR.tafT = 1; const p = camera.position;
  for (const T of UBR.tafeln) if (T.pos.some(q => Math.abs(q[0] - p.x) + Math.abs(q[1] - p.z) < 220)) ubTafelZeichnen(T); }
function ubHud(dt) { if (!UBR.hud) { const d = document.createElement("div"); d.id = "ub-hud"; d.style.cssText = "position:fixed;top:calc(env(safe-area-inset-top,0px) + 58px);left:50%;transform:translateX(-50%);z-index:30;background:rgba(10,12,16,.82);color:#fff;border-radius:10px;padding:8px 16px;font:600 14px system-ui,sans-serif;text-align:center;pointer-events:none;min-width:260px;box-shadow:0 4px 14px rgba(0,0,0,.4)"; document.body.appendChild(d); UBR.hud = d; }
  UBR.hud.hidden = false; if ((UBR.hudT -= dt) > 0) return; UBR.hudT = 0.25; const t = UBR.t, r = t.r, L = r.P.length * r.ds, cur = ((t.s % L) + L) % L;
  let z1, z2; if (t.halt) { z1 = "Halt: " + ubStName(r, cur); z2 = t.tuer === "offen" ? "Türen offen · Abfahrt in " + ubMm(t.ab - UB.T) : t.tuer === "schliesst" ? "Türen schließen …" : "Abfahrt"; }
  else { const e = ubEta(t, t.next); z1 = "Nächster Halt: " + ubStName(r, t.next); z2 = e ? "Ankunft in " + ubMm(e.ank) : ""; z2 += " · " + Math.round(t.v * 3.6) + " km/h"; }
  const v = t.anz ? '<div style="color:#ff6a5a;font-size:13px">' + (t.late > 0.5 ? "Verspätung +" + ubMm(t.late) : "Verspätung wird aufgeholt") + "</div>" : '<div style="color:#8fa0b0;font-size:13px">pünktlich</div>';
  UBR.hud.innerHTML = '<div style="font-size:12px;color:#' + r.col.getHexString() + '">' + r.name + " · Gleis " + (t.d > 0 ? 1 : 2) + "</div><div>" + z1 + '</div><div style="font-weight:500;font-size:13px;color:#cfd6de">' + z2 + "</div>" + v; }
