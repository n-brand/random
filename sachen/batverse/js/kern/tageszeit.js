// Batverse – Tageszeit: Sonne, Mond, Sterne, Tag-Nacht-Zyklus (Nicolas 2026-11-16: "10 min Tag, 10 min Nacht, im Orbit-Menue umstellbar").
// Nach kern/tag-nacht.js. DAY.t = Anteil am Zyklus (0 Sonnenaufgang 06:00, 0,25 Mittag, 0,5 Sonnenuntergang 18:00, 0,75 Mitternacht), ein Zyklus = 20 min.
// Das gerichtete Licht ist tagsueber die Sonne, nachts der Mond (Richtung gegenueber); night (tag-nacht.js) folgt der Sonnenhoehe weich,
// Morgen- und Abendrot faerben Himmel und Nebel. Sonne und Mond als Sprites am Himmel, Sterne als Punkte (folgen der Kamera, kein Nebel).
// Orbit-Leiste: Regler Uhrzeit, Knopf Zeit laeuft/steht, Knopf "Nacht" springt auf Mitternacht bzw. Mittag. Stand im Browser (wm-time, wm-time-run).
"use strict";
const DAY = { t: 0.25, run: true, len: 1200, last: -1 };
try { const v = parseFloat(localStorage.getItem("wm-time")); if (v >= 0 && v < 1) DAY.t = v; DAY.run = localStorage.getItem("wm-time-run") !== "0"; } catch (e) {}
const DAY_SUNSET = new THREE.Color(0xf08a4a), DAY_SUNC = new THREE.Color(0xffd9a0), DAY_tmp = new THREE.Color();
const dayClock = t => { const m = Math.round(((6 + 24 * t) % 24) * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
// Himmelskoerper
const DAY_SKY = (() => {
  const disc = (inner, outer, r0) => canvasTex(128, 128, (c, w) => { const r = w / 2, g = c.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, inner); g.addColorStop(r0, inner); g.addColorStop(r0 + 0.08, outer); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, w, w); });
  const sunM = new THREE.SpriteMaterial({ map: disc("#fff6d8", "rgba(255,200,120,0.35)", 0.32), fog: false, depthWrite: false, transparent: true });
  const moonT = canvasTex(128, 128, (c, w) => { const r = w / 2; const g = c.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, "rgba(200,215,255,0.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, w, w);
    c.beginPath(); c.arc(r, r, r * 0.42, 0, 7); c.fillStyle = "#e8ecf2"; c.fill(); c.fillStyle = "rgba(150,158,170,0.55)"; for (const [x, y, s] of [[-0.12, -0.1, 0.1], [0.14, 0.05, 0.07], [0.02, 0.18, 0.06], [-0.18, 0.12, 0.05], [0.1, -0.2, 0.05]]) { c.beginPath(); c.arc(r + x * w, r + y * w, s * w, 0, 7); c.fill(); } });
  const moonM = new THREE.SpriteMaterial({ map: moonT, fog: false, depthWrite: false, transparent: true });
  const sunS = new THREE.Sprite(sunM), moonS = new THREE.Sprite(moonM); sunS.renderOrder = moonS.renderOrder = -1; sunS.userData.noLift = moonS.userData.noLift = true; scene.add(sunS, moonS);
  const N = 900, P = new Float32Array(N * 3); let s = 9; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) { const u = rnd(), v = rnd() * 0.95, th = u * Math.PI * 2, y = v, r = Math.sqrt(1 - y * y); P[i * 3] = Math.cos(th) * r; P[i * 3 + 1] = y; P[i * 3 + 2] = Math.sin(th) * r; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3));
  const starM = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(g, starM); stars.renderOrder = -2; stars.userData.noLift = true; stars.frustumCulled = false; scene.add(stars);
  return { sunS, moonS, stars, starM };
})();
const DAY_DIR = new THREE.Vector3();
function dayApply() {
  const a = DAY.t * Math.PI * 2, alt = Math.sin(a);                             // Sonnenhoehe -1..1
  DAY_DIR.set(Math.cos(a), alt, 0.35).normalize();                             // Sonne: Osten (+x) -> oben -> Westen, leicht nach Sueden
  const day = alt > 0, L = day ? DAY_DIR.clone() : DAY_DIR.clone().negate();   // Licht: Sonne oder Mond (gegenueber)
  if (L.y < 0.15) { L.y = 0.15; L.normalize(); } SUN_DIR.copy(L);
  const n = 1 - THREE.MathUtils.smoothstep(alt, -0.12, 0.16); nightTarget = n; night = n; applyNight();
  // Morgen-/Abendrot: nahe am Horizont, tagsueber und in der Daemmerung
  const w = Math.max(0, 1 - Math.abs(alt) / 0.28) * (1 - under);
  if (w > 0) { scene.background.lerp(DAY_SUNSET, w * 0.45); scene.fog.color.copy(scene.background); if (day) sun.color.lerp(DAY_SUNSET, w * 0.5); }
  const k = document.getElementById("btn-night"); if (k) k.setAttribute("aria-pressed", String(n > 0.5));
}
// je Bild (schleife.js): Zeit weiter, Licht nur bei merklicher Aenderung, Himmelskoerper an die Kamera
function dayStep(dt) {
  if (DAY.run) DAY.t = (DAY.t + dt / DAY.len) % 1;
  if (Math.abs(DAY.t - DAY.last) > 0.0004 || DAY.last < 0) { DAY.last = DAY.t; dayApply(); daySave(); dayUI(); }
  const S = DAY_SKY, cp = camera.position, R = Math.min(camera.far * 0.85, 2400), sz = R * 0.07;
  S.sunS.position.copy(cp).addScaledVector(DAY_DIR, R); S.sunS.scale.set(sz, sz, 1); S.sunS.visible = DAY_DIR.y > -0.05 && under < 0.5;
  S.moonS.position.copy(cp).addScaledVector(DAY_DIR, -R); S.moonS.scale.set(sz * 0.8, sz * 0.8, 1); S.moonS.visible = DAY_DIR.y < 0.05 && under < 0.5;
  S.stars.position.copy(cp); S.stars.scale.setScalar(R * 0.95); S.starM.opacity = Math.max(0, night - 0.3) / 0.7 * (1 - under);
}
let daySaveT = 0; function daySave() { const now = performance.now(); if (now - daySaveT < 3000) return; daySaveT = now; try { localStorage.setItem("wm-time", DAY.t.toFixed(4)); localStorage.setItem("wm-time-run", DAY.run ? "1" : "0"); } catch (e) {} }
function daySet(t) { DAY.t = ((t % 1) + 1) % 1; DAY.last = -1; daySaveT = 0; }
function dayUI() { const sl = document.getElementById("time-slider"), lb = document.getElementById("time-label"); if (!sl) return; if (document.activeElement !== sl) sl.value = String(Math.round(((6 + 24 * DAY.t) % 24) * 60)); lb.textContent = dayClock(DAY.t); }
{ const sl = document.getElementById("time-slider"), run = document.getElementById("btn-time-run");
  if (sl) sl.addEventListener("input", () => { daySet(((+sl.value / 60 - 6 + 24) % 24) / 24); });
  if (run) { const sync = () => { run.setAttribute("aria-pressed", String(DAY.run)); run.textContent = DAY.run ? "Zeit läuft" : "Zeit steht"; }; sync(); run.addEventListener("click", e => { e.currentTarget.blur(); DAY.run = !DAY.run; daySaveT = 0; daySave(); sync(); }); } }
