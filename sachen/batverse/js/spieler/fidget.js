// Fidget Spinner (Nicolas 2026-11-18, N36: "ein Fidget Spinner als Item waere auch cool, mit Rechtsklick kann man ihn spinnen"). Spiel und Werkstatt, nach gotham/tresor.js (HAND3D).
// In der Hand: linke Maus halten = Schwung (bis ca. 6 U/s), danach dreht er weiter und wird langsamer (ca. 20 s); kurzer Linksklick stoppt ihn. Anzeige ueber der Hotbar.
const FIDGET = { w: 0, a: 0, down: null, stop: false };
// Form wie das Bild von Nicolas (2026-11-18, Google-Fidget-Spinner): drei runde Lappen um eine runde Mitte, dazwischen weich eingezogen (glatte Vereinigung von Kreisen),
// in jedem Lappen ein Kugellager (hellblau mit dunklem Ring), Mitte gelbe Kappe (steht still, der Koerper dreht sich darum). FIDGET_F: Masse in m, Lappen bei 30/150/270 Grad.
const FIDGET_F = { D: 0.027, RL: 0.016, RC: 0.017, k: 0.008, lager: 0.0108, body: 0x0b5f5c, hell: 0x4fc3b3, gelb: 0xf4c20d };
function fidgetSdf(x, y) { const F = FIDGET_F; let d = Math.hypot(x, y) - F.RC; for (let i = 0; i < 3; i++) { const a = Math.PI / 6 + i * Math.PI * 2 / 3, e = Math.hypot(x - Math.cos(a) * F.D, y - Math.sin(a) * F.D) - F.RL, h = Math.max(F.k - Math.abs(d - e), 0) / F.k; d = Math.min(d, e) - h * h * F.k / 4; } return d; }
function fidgetUmriss(n = 180) { const P = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); let lo = 0, hi = 0.06; for (let j = 0; j < 30; j++) { const m = (lo + hi) / 2; fidgetSdf(c * m, sn * m) < 0 ? lo = m : hi = m; } P.push([c * lo, sn * lo]); } return P; }
function buildFidget() { const F = FIDGET_F, g = new THREE.Group(), rot = new THREE.Group(), M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.05, ...o });
  const sh = new THREE.Shape(); fidgetUmriss().forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath();
  const pos = i => { const a = Math.PI / 6 + i * Math.PI * 2 / 3; return [Math.cos(a) * F.D, Math.sin(a) * F.D]; };
  for (let i = 0; i < 3; i++) { const [x, y] = pos(i), h = new THREE.Path(); h.absarc(x, y, F.lager, 0, Math.PI * 2, true); sh.holes.push(h); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.0018, bevelSize: 0.0016, bevelSegments: 3, curveSegments: 24 }); geo.translate(0, 0, -0.003); rot.add(new THREE.Mesh(geo, M(F.body)));
  const hell = M(F.hell, { metalness: 0.25, roughness: 0.3 }), dunkel = M(F.body);
  for (let i = 0; i < 3; i++) { const [x, y] = pos(i), add = (geo, m, z = 0) => { const o = new THREE.Mesh(geo, m); o.rotation.x = Math.PI / 2; o.position.set(x, y, z); rot.add(o); };
    add(new THREE.CylinderGeometry(F.lager, F.lager, 0.0085, 32), hell);                                         // Lager (Aussenring)
    for (const sz of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.0062, 0.0011, 8, 28), dunkel); r.position.set(x, y, sz * 0.0043); rot.add(r); }   // dunkler Ring vorne und hinten
    add(new THREE.CylinderGeometry(0.0042, 0.0042, 0.009, 24), hell); }
  const mitte = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.0125, 32), M(F.gelb, { roughness: 0.3, emissive: 0x2a1e00 })); mitte.rotation.x = Math.PI / 2; g.add(rot, mitte); g.userData.rot = rot; return g; }
// 2D-Symbol aus derselben Form (Inventar), erst hier, weil inventar.js vorher laedt
if (typeof INV_ITEMS !== "undefined" && INV_ITEMS.fidget) { const k = 12.3 / (FIDGET_F.D + FIDGET_F.RL), p = fidgetUmriss(90).map(([x, y]) => (13 + x * k).toFixed(2) + " " + (13 - y * k).toFixed(2)).join(" L ");
  INV_ITEMS.fidget.svg = '<path d="M ' + p + ' Z" fill="#0b5f5c" stroke="#06302e" stroke-width=".6"/>' + [0, 1, 2].map(i => { const a = Math.PI / 6 + i * Math.PI * 2 / 3, x = (13 + Math.cos(a) * FIDGET_F.D * k).toFixed(2), y = (13 - Math.sin(a) * FIDGET_F.D * k).toFixed(2);
    return '<circle cx="' + x + '" cy="' + y + '" r="' + (FIDGET_F.lager * k).toFixed(2) + '" fill="#4fc3b3"/><circle cx="' + x + '" cy="' + y + '" r="' + (0.0062 * k).toFixed(2) + '" fill="none" stroke="#0b5f5c" stroke-width="1"/>'; }).join("") + '<circle cx="13" cy="13" r="' + (0.0095 * k).toFixed(2) + '" fill="#f4c20d"/>'; }
// Bedienung (Nicolas 2026-11-18: "Fidget Spinner mit Linksklick halten beschleunigen und kurz klicken stoppen"): linke Maus halten = Schwung bis ca. 6 U/s, loslassen = dreht frei weiter und wird langsam langsamer,
// kurzer Klick (unter 0,25 s) = bremst schnell bis zum Stillstand.
function fidgetStep(dt) { if (FIDGET.down !== null && FIDGET.down !== undefined) FIDGET.w = Math.min(38, FIDGET.w + 22 * dt);
  else if (FIDGET.stop) { FIDGET.w = Math.max(0, FIDGET.w - 40 * dt); if (!FIDGET.w) FIDGET.stop = false; }
  else if (FIDGET.w > 0) FIDGET.w = Math.max(0, FIDGET.w - (0.6 + FIDGET.w * 0.06) * dt);
  FIDGET.a += FIDGET.w * dt; if (FIDGET.down != null && typeof invName === "function" && (FIDGET.nT = (FIDGET.nT || 0) - dt) <= 0) { FIDGET.nT = 0.2; invName("Fidget Spinner · " + (FIDGET.w / (Math.PI * 2)).toFixed(1) + " U/s"); }
  if (FIDGET.down != null && typeof invHeld === "function" && invHeld() !== "fidget") FIDGET.down = null;
  const H = typeof HAND3D_S !== "undefined" ? HAND3D_S : null; if (H && H.g && H.id === "fidget") H.g.traverse(o => { if (o.userData.rot) o.userData.rot.rotation.z = FIDGET.a; }); }
addEventListener("mousedown", e => { if (e.button !== 0 || !document.pointerLockElement || typeof invHeld !== "function" || invHeld() !== "fidget") return; e.preventDefault(); e.stopImmediatePropagation(); FIDGET.down = performance.now(); FIDGET.stop = false; }, true);
addEventListener("mouseup", e => { if (e.button !== 0 || FIDGET.down == null) return; const kurz = performance.now() - FIDGET.down < 250; FIDGET.down = null; if (kurz) { FIDGET.stop = true; if (typeof invName === "function") invName("Fidget Spinner · Stopp"); } }, true);
if (typeof HAND3D !== "undefined") HAND3D.fidget = () => { const g = new THREE.Group(), f = buildFidget(); f.scale.setScalar(1.4); f.rotation.set(-0.35, -0.45, 0); g.add(f); g.position.set(-0.02, 0.03, 0); return g; };
