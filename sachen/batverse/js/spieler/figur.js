// Spielfiguren, Schritt F1 (Nicolas 2026-11-18, N35: "Spielfiguren anfangen, einfach gebaut wie in Schedule I"; Plan PLAN-FIGUREN.md). Spiel und Werkstatt.
// buildFigur(o) -> Gruppe (Fuesse bei y 0, Blick nach -z, 1,78 m gross, Augen auf 1,62 m) mit Gelenken in userData: kopf, rumpf, armL/armR (Schulter), unterarmL/R (Ellbogen),
// beinL/beinR (Huefte), knieL/R. o: { haut, haar, oberteil, hose, schuhe, frisur 0-3, bart } (Farben als Zahl). Eigener Entwurf: runder Kopf, gezeichnetes Gesicht, Kapseln, flache Farben.
// Kopf 1,18-fach (verspielter Stil). figurPose(F, t, tempo, sprung): Stehen (Atmen), Gehen/Rennen (Arme und Beine schwingen gegenlaeufig, Knie beugen, Kopf wippt) aus tempo in m/s, sprung = in der Luft.
const FIGUR_STD = { haut: 0xe0b48c, haar: 0x2a1a10, oberteil: 0x22324a, hose: 0x2a2c30, schuhe: 0x15161a, frisur: 0, bart: false };
function figurGesicht(o) { return canvasTex(128, 128, (c, w, h) => { const hx = "#" + o.haut.toString(16).padStart(6, "0"); c.fillStyle = hx; c.fillRect(0, 0, w, h);
  c.fillStyle = "#ffffff"; for (const x of [44, 84]) { c.beginPath(); c.ellipse(x, 58, 10, 12, 0, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#2a1e16"; for (const x of [46, 82]) { c.beginPath(); c.arc(x, 60, 6, 0, Math.PI * 2); c.fill(); } c.fillStyle = "#fff"; for (const x of [48, 84]) { c.beginPath(); c.arc(x, 57, 2, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = "#" + o.haar.toString(16).padStart(6, "0"); c.lineWidth = 5; c.lineCap = "round"; for (const [x0, x1] of [[34, 54], [74, 94]]) { c.beginPath(); c.moveTo(x0, 42); c.lineTo(x1, 40); c.stroke(); }   // Brauen
  c.strokeStyle = "#7a3a2a"; c.lineWidth = 4; c.beginPath(); c.moveTo(52, 90); c.quadraticCurveTo(64, 98, 76, 90); c.stroke();   // Mund
  c.fillStyle = "rgba(200,90,70,.18)"; for (const x of [36, 92]) { c.beginPath(); c.arc(x, 78, 8, 0, Math.PI * 2); c.fill(); }   // Wangen
  if (o.bart) { c.fillStyle = "rgba(40,26,16,.55)"; c.beginPath(); c.ellipse(64, 100, 34, 22, 0, 0, Math.PI); c.fill(); } }); }
function buildFigur(o = {}) { o = { ...FIGUR_STD, ...o }; const g = new THREE.Group(), M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 }), haut = M(o.haut), haar = M(o.haar), ober = M(o.oberteil), hose = M(o.hose), schuh = M(o.schuhe);
  const cap = (m, r, l, par, y = -l / 2 - r) => { const k = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), m); k.position.y = y; k.castShadow = true; par.add(k); return k; };
  const gelenk = (par, x, y, z) => { const j = new THREE.Group(); j.position.set(x, y, z); par.add(j); return j; };
  const rumpf = gelenk(g, 0, 0.95, 0); { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.36, 4, 12), ober); b.scale.set(1, 1, 0.72); b.position.y = 0.3; b.castShadow = true; rumpf.add(b);
    const bk = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.08, 4, 12), hose); bk.scale.set(1.05, 1, 0.75); bk.position.y = 0.0; rumpf.add(bk); }   // Oberkoerper, Becken
  const hals = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 10), haut); hals.position.y = 0.64; rumpf.add(hals);
  const kopf = gelenk(rumpf, 0, 0.7, 0); kopf.scale.setScalar(1.18); { const k = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 16), [haut]); k.scale.set(1, 1.12, 1); k.position.y = 0.14; k.castShadow = true; kopf.add(k);
    const ges = new THREE.Mesh(new THREE.SphereGeometry(0.151, 20, 16, Math.PI * 1.12, Math.PI * 0.76, Math.PI * 0.2, Math.PI * 0.55), new THREE.MeshStandardMaterial({ map: figurGesicht(o), roughness: 0.8 })); ges.scale.set(1, 1.12, 1); ges.position.y = 0.14; ges.rotation.y = 0; kopf.add(ges);   // Gesicht vorne (-z)
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), haut); e.scale.set(0.6, 1, 1); e.position.set(sx * 0.148, 0.14, 0.01); kopf.add(e); }   // Ohren
    const fr = o.frisur, hm = haar; if (fr === 0) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.158, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), hm); h.scale.set(1, 1.12, 1); h.position.y = 0.15; h.rotation.x = 0.3; kopf.add(h); }   // kurz (nach hinten gekippt, Stirn frei)
    else if (fr === 1) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.162, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), hm); h.scale.set(1.02, 1.14, 1.05); h.position.y = 0.15; h.rotation.x = 0.55; kopf.add(h); const z = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.18, 4, 8), hm); z.position.set(0, 0.0, 0.14); kopf.add(z); }   // lang mit Zopf
    else if (fr === 2) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), hm); h.scale.set(1.1, 0.9, 1.1); h.position.y = 0.26; kopf.add(h); }   // Locken
    // fr 3: Glatze
  }
  const arm = (sx) => { const s = gelenk(rumpf, sx * 0.25, 0.5, 0); cap(ober, 0.065, 0.2, s); const e = gelenk(s, 0, -0.33, 0); cap(haut, 0.055, 0.2, e); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), haut); hd.position.y = -0.36; e.add(hd); return [s, e]; };
  const bein = (sx) => { const h = gelenk(rumpf, sx * 0.1, -0.06, 0); cap(hose, 0.08, 0.3, h); const k = gelenk(h, 0, -0.44, 0); cap(hose, 0.07, 0.3, k); const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), schuh); f.position.set(0, -0.45, -0.04); f.castShadow = true; k.add(f); return [h, k]; };
  const [armL, uaL] = arm(-1), [armR, uaR] = arm(1), [beinL, knieL] = bein(-1), [beinR, knieR] = bein(1);
  g.userData = { kopf, rumpf, armL, armR, unterarmL: uaL, unterarmR: uaR, beinL, beinR, knieL, knieR, phase: 0 }; g.name = "Spielfigur"; return g; }
// Figuren, die sich bewegen (Werkstatt-Vorfuehrung, Skateboard): FIGUREN.push({ g, tempo }) – figurStep aus tresorStep
const FIGUREN = [];
function figurStep(dt) { for (const f of FIGUREN) if (f.g.visible && f.g.parent) figurPose(f.g, dt, f.tempo || 0, f.sprung); }
function figurPose(F, dt, tempo = 0, sprung = false) { const U = F.userData; U.phase += dt * (2.2 + tempo * 1.25); U.t = (U.t || 0) + dt; const p = U.phase, k = Math.min(1, tempo / 4), run = Math.max(0, Math.min(1, (tempo - 5) / 3));
  const sw = Math.sin(p) * (0.5 * k + 0.35 * run), atm = Math.sin(U.t * 2) * 0.012;
  U.beinL.rotation.x = sw; U.beinR.rotation.x = -sw; U.knieL.rotation.x = Math.max(0, -Math.sin(p - 0.6)) * (0.7 * k + 0.4 * run); U.knieR.rotation.x = Math.max(0, Math.sin(p - 0.6)) * (0.7 * k + 0.4 * run);
  U.armL.rotation.x = -sw * 0.9; U.armR.rotation.x = sw * 0.9; U.armL.rotation.z = -0.08; U.armR.rotation.z = 0.08; U.unterarmL.rotation.x = U.unterarmR.rotation.x = -0.2 - 0.9 * run;
  U.rumpf.position.y = 0.95 + Math.abs(Math.sin(p)) * 0.035 * k + atm; U.rumpf.rotation.x = -0.12 * run; U.kopf.rotation.x = 0.1 * run;
  if (sprung) { U.beinL.rotation.x = -0.5; U.beinR.rotation.x = 0.25; U.knieL.rotation.x = 0.9; U.knieR.rotation.x = 0.5; U.armL.rotation.z = -0.6; U.armR.rotation.z = 0.6; } }

// ---- Schritt F2: dritte Person zu Fuss (Nicolas 2026-11-19 "Ja, weiter"; Taste V nach OFFENE-FRAGEN 53). Spiel und Werkstatt.
// V schaltet Ich-Sicht / Kamera hinter der Figur (ueber die rechte Schulter, 3,2 m, Maus dreht wie bisher, Kamera stoesst nicht durch Waende: shotSeg).
// Die Figur steht an der Spielerposition, dreht sich weich in Laufrichtung (mit Waffe in der Hand oder beim Zielen in Blickrichtung), Animation aus dem Tempo (figurPose),
// in der Luft Sprunghaltung. Gehaltener Gegenstand sitzt in der rechten Hand (Schusswaffen ueber gunBuild, Werkzeuge ueber HAND3D); beim Zielen hebt sie den Arm in
// Blickrichtung. Die Hand-Anzeigen der Ich-Sicht (2D-Bild, 3D-Waffe, Batarang, Jeton, Werkzeug) sind dann aus (dpAn()). Stand in localStorage wm-dritte.
const DP = { on: false, F: null, w: null, h: 0, last: null, item: null, itemId: null, cam: new THREE.Vector3(), D: 3.2, side: 0.45 };
const dpAn = () => DP.on && typeof walking !== "undefined" && walking && !(typeof ghost !== "undefined" && ghost) && !(typeof SKATE !== "undefined" && SKATE.on) && !document.body.classList.contains("drive");
try { DP.on = localStorage.getItem("wm-dritte") === "1"; } catch (e) {}
function dpEnsure() { if (DP.w) return; DP.w = new THREE.Group(); DP.F = buildFigur({ oberteil: 0x1c1f26, hose: 0x23262c, schuhe: 0x0e0f12, haar: 0x1a120c, frisur: 0 }); DP.w.add(DP.F); DP.w.visible = false; DP.w.userData.dynamic = true; scene.add(DP.w);
  DP.hand = new THREE.Group(); DP.hand.position.y = -0.37; DP.F.userData.unterarmR.add(DP.hand); }
function dpToggle() { DP.on = !DP.on; try { localStorage.setItem("wm-dritte", DP.on ? "1" : "0"); } catch (e) {} DP.last = null; if (typeof toast === "function") toast(DP.on ? "Dritte Person (V: zurück zur Ich-Sicht)" : "Ich-Sicht"); document.body.classList.toggle("dritte", DP.on); }
document.body.classList.toggle("dritte", DP.on);
addEventListener("keydown", e => { if (e.code !== "KeyV" || e.repeat || e.ctrlKey || e.metaKey) return; const t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  if (typeof walking === "undefined" || !walking || (typeof ghost !== "undefined" && ghost) || document.body.classList.contains("drive") || (typeof SKATE !== "undefined" && SKATE.on)) return;
  if (typeof modus !== "undefined" && modus !== "person") return; dpToggle(); });
// Gegenstand in der rechten Hand der Figur (nur bei Wechsel neu gebaut)
function dpItem() { const id = typeof invHeld === "function" ? invHeld() : null; if (id === DP.itemId) return DP.item; DP.itemId = id; if (DP.item) DP.hand.remove(DP.item); DP.item = null;
  let m = null; try { if (id && typeof GUN_SPEC !== "undefined" && GUN_SPEC[id] && typeof gunBuild === "function") m = gunBuild(id); else if (id && typeof HAND3D !== "undefined" && HAND3D[id]) { m = HAND3D[id](); m.position.set(0, 0, 0); } } catch (e) { m = null; }
  if (m) { m.traverse(o => { if (o.isMesh) o.castShadow = true; }); const g = new THREE.Group(); g.add(m); DP.hand.add(g); DP.item = g; } return DP.item; }
// je Bild nach der Bewegung zu Fuss: P = Spieler (pos, yaw, pitch), boden = steht auf dem Boden
function dpStep(dt, P, boden) { const an = dpAn(); if (!an) { if (DP.w) DP.w.visible = false; return false; } dpEnsure();
  const p = P.pos, F = DP.F, U = F.userData; let tempo = 0, mx = 0, mz = 0;
  if (DP.last) { mx = p.x - DP.last.x; mz = p.z - DP.last.z; tempo = Math.hypot(mx, mz) / Math.max(dt, 1e-3); if (tempo > 30) tempo = 0; } DP.last = { x: p.x, z: p.z };
  const id = typeof invHeld === "function" ? invHeld() : null, waffe = !!(id && typeof GUN_SPEC !== "undefined" && GUN_SPEC[id]), ziel = typeof AIM !== "undefined" && !!AIM.on;
  const soll = waffe || ziel ? P.yaw : tempo > 0.4 ? Math.atan2(-mx, -mz) : DP.h, d = Math.atan2(Math.sin(soll - DP.h), Math.cos(soll - DP.h)); DP.h += d * Math.min(1, dt * 10);
  DP.w.visible = true; DP.w.position.set(p.x, p.y, p.z); DP.w.rotation.set(0, DP.h, 0); figurPose(F, dt, Math.min(tempo, 9), !boden);
  const it = dpItem(), hebt = (waffe || ziel) && boden !== null;
  if (hebt) { U.armR.rotation.set(Math.PI / 2 + P.pitch, 0, 0.05); U.unterarmR.rotation.x = 0; if (waffe) { U.armL.rotation.set(Math.PI / 2 + P.pitch - 0.1, 0, -0.45); U.unterarmL.rotation.x = 0.3; } }
  if (it) it.rotation.set((hebt ? P.pitch : 0) - (U.armR.rotation.x + U.unterarmR.rotation.x), 0, 0);
  // Kamera ueber der rechten Schulter, hinter der Figur; nicht durch Waende
  const cy = Math.cos(P.yaw), sy = Math.sin(P.yaw), cp = Math.cos(P.pitch), sp = Math.sin(P.pitch), ziel3 = new THREE.Vector3(p.x + cy * DP.side, p.y + 1.62, p.z - sy * DP.side);
  const cam = ziel3.clone().add(new THREE.Vector3(sy * cp, -sp, cy * cp).multiplyScalar(DP.D));
  if (typeof shotSeg === "function") { const h = shotSeg(ziel3, cam, null, 0.25); if (h) cam.copy(h.p).lerp(ziel3, 0.12); }
  camera.position.copy(cam); camera.rotation.set(P.pitch, P.yaw, 0, "YXZ"); return true; }
