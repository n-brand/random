// Koffer (Nicolas 2026-11-18, N25: "Die Kiste mit den Batarangs soll ein Koffer werden, den man mit der Kreisanimation aufnehmen kann; schwarzer Aktenkoffer/Geldkoffer;
// eine zweite Variante mit Geld; als Item in der Hand zu; im Inventar beim Hovern keine Hinweise zum Inhalt"). Spiel und Werkstatt, nach inventar.js, konto.js, gotham/tresor.js.
// Gegenstand "koffer" (Stapel 1): der Platz traegt zusaetzlich k = Kennung des Koffers; der Inhalt liegt im Behaelter "koffer-<k>" (inventar.js invBox, mit Bargeld B.cash).
// In der Welt: kofferWelt(parent, k, pos, rotY, { offen, inhalt, cash }) -> Rechtsklick oeffnet (nur von vorne), linke Maus 0,8 s halten nimmt ihn auf (Fortschrittskreis).
// In der Hand: 3D-Koffer zu (HAND3D.koffer), Rechtsklick oeffnet ihn. Ein Koffer kann nicht in sich selbst gelegt werden.
const KOFFER = { welt: [], hold: null };
function buildKoffer(o = {}) {
  const g = new THREE.Group(), L = 0.46, D = 0.34, HB = 0.065, HL = 0.045, schale = new THREE.MeshStandardMaterial({ color: 0x121315, roughness: 0.45, metalness: 0.25 }),
    chrom = new THREE.MeshStandardMaterial({ color: 0xc9ccd1, metalness: 0.9, roughness: 0.22 }), futter = new THREE.MeshStandardMaterial({ color: 0x1c1d21, roughness: 0.95 }), griffM = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.6 });
  const box = (m, w, h, d, x, y, z, p = g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); p.add(b); return b; };
  const T = 0.008;   // Wandstaerke
  box(schale, L, T, D, 0, T / 2, 0); box(schale, L, HB, T, 0, HB / 2, -D / 2 + T / 2); box(schale, L, HB, T, 0, HB / 2, D / 2 - T / 2); box(schale, T, HB, D, -L / 2 + T / 2, HB / 2, 0); box(schale, T, HB, D, L / 2 - T / 2, HB / 2, 0);   // Unterschale
  for (const sz of [-1, 1]) box(chrom, L + 0.004, 0.006, 0.012, 0, HB - 0.003, sz * (D / 2 - 0.004)); for (const sx of [-1, 1]) box(chrom, 0.012, 0.006, D, sx * (L / 2 - 0.004), HB - 0.003, 0);   // Chromkante (4 Leisten)
  const inn = new THREE.Group(); g.add(inn); box(futter, L - 2 * T, 0.004, D - 2 * T, 0, HB - 0.02, 0, inn);   // Einlage
  if (o.inhalt === "batarang" && typeof AIM_M !== "undefined") { AIM_M.bat.computeBoundingBox(); const bc = (AIM_M.bat.boundingBox.min.z + AIM_M.bat.boundingBox.max.z) / 2;
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(AIM_M.bat, AIM_M.batM); b.scale.setScalar(1.15); b.rotation.y = Math.PI; b.position.set(0, HB - 0.015, -0.1 + k * 0.1 + bc * 1.15); inn.add(b); } }   // drei Batarangs, Spitze nach vorne
  if (o.inhalt === "geld") { const schein = new THREE.MeshStandardMaterial({ color: 0x6f9a62, roughness: 0.8 }), band = new THREE.MeshStandardMaterial({ color: 0xf2efe4, roughness: 0.7 });
    for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) for (let h = 0; h < 2; h++) { const x = -0.105 + i * 0.21, z = -0.12 + j * 0.08, y = 0.012 + h * 0.022; if (typeof buildGeldbuendel === "function") { const b = buildGeldbuendel(100, 200); b.position.set(x, y, z); inn.add(b); continue; } box(schein, 0.155, 0.02, 0.068, x, y + 0.01, z, inn); box(band, 0.03, 0.021, 0.07, x, y + 0.01, z, inn); } }   // Geldbuendel (wertsachen.js, N24)   // Geldbuendel mit Banderole
  const hinge = new THREE.Group(); hinge.position.set(0, HB, D / 2); g.add(hinge); const lid = new THREE.Group(); hinge.add(lid);   // Deckel, Scharnier hinten oben
  box(schale, L, T, D, 0, HL - T / 2, -D / 2, lid); box(schale, L, HL, T, 0, HL / 2, -D + T / 2, lid); box(schale, L, HL, T, 0, HL / 2, -T / 2, lid); box(schale, T, HL, D, -L / 2 + T / 2, HL / 2, -D / 2, lid); box(schale, T, HL, D, L / 2 - T / 2, HL / 2, -D / 2, lid);
  box(futter, L - 2 * T, 0.004, D - 2 * T, 0, HL - T - 0.003, -D / 2, lid);   // Futter im Deckel
  for (const sx of [-1, 1]) { box(chrom, 0.032, 0.02, 0.008, sx * 0.13, HB - 0.002, -D / 2 - 0.004); box(chrom, 0.028, 0.016, 0.006, sx * 0.13, 0.008, -D + 0.002 - 0.004, lid); }   // Schloesser
  { const gr = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 8, 18, Math.PI), griffM); gr.rotation.x = Math.PI / 2; gr.rotation.z = Math.PI; gr.position.set(0, HB, -D / 2 - 0.012); g.add(gr); for (const sx of [-1, 1]) box(chrom, 0.012, 0.016, 0.012, sx * 0.045, HB, -D / 2 - 0.006); }   // Griff vorne
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(chrom, 0.018, 0.018, 0.018, sx * (L / 2 - 0.006), 0.009, sz * (D / 2 - 0.006));   // Eckbeschlaege
  hinge.rotation.x = o.offen ? 1.85 : 0; inn.visible = !!o.offen;
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); g.userData = { hinge, inn }; g.name = "Koffer"; return g;
}
// Inventar: Koffer mit Kennung hinzufuegen (eigener Platz, Stapel 1)
function kofferGive(k) { for (let i = 0; i < 36; i++) if (!INV.slots[i]) { INV.slots[i] = { id: "koffer", n: 1, k }; invSave(); invRender(); return true; } toast("Kein Platz im Inventar für den Koffer"); return false; }
function kofferBox(k, init, cash) { const B = invBox("koffer-" + k, "Koffer", 12, init || [], 6); if (cash && B.cash === undefined) B.cash = cash; if (B.cash === undefined) B.cash = 0; B.self = k; return B; }
function kofferActions(B) { const K = typeof KONTO !== "undefined" ? KONTO : null, a = [];
  if (B.cash > 0) a.push({ label: "Bargeld nehmen (" + kontoFmt(B.cash) + ")", fn: () => { kontoBar(B.cash, "Aus dem Koffer"); B.cash = 0; B.save(); B.actions = kofferActions(B); invRender(); } });
  a.push({ label: "1 000 $ hineinlegen", fn: K && K.bar >= 1000 ? () => { kontoBar(-1000, "In den Koffer"); B.cash += 1000; B.save(); B.actions = kofferActions(B); invRender(); } : null });
  if (!(B.cash > 0)) a.unshift({ label: "Kein Bargeld darin", fn: null }); return a; }
function kofferOpen(k) { const B = kofferBox(k); B.actions = kofferActions(B); invBoxOpen(B); }
// in der Welt
function kofferWelt(parent, k, pos, rotY = 0, o = {}) {
  try { if (localStorage.getItem("wm-koffer-weg-" + k)) { kofferBox(k, o.init, o.cash); return null; } } catch (e) {}   // schon aufgenommen
  const g = buildKoffer({ offen: o.offen, inhalt: o.inhalt }); g.position.copy(pos); g.rotation.y = rotY; parent.add(g); const B = kofferBox(k, o.init, o.cash);
  const W = { k, g, B, gate: null }; KOFFER.welt.push(W); g.updateMatrixWorld(true); const p = g.getWorldPosition(new THREE.Vector3());
  if (typeof gates !== "undefined") { W.gate = { name: "Koffer", g, call: () => { if (typeof invBoxFront === "function" && !invBoxFront(g, 2.4)) return; kofferOpen(k); }, verbs: ["öffnen · linke Maus halten: aufnehmen", "öffnen · linke Maus halten: aufnehmen"], a: [p.x, p.z], b: [p.x, p.z], near: 2.5 }; gates.push(W.gate); }
  return W; }
function kofferNehmen(W) { if (!kofferGive(W.k)) return; W.g.parent && W.g.parent.remove(W.g); KOFFER.welt.splice(KOFFER.welt.indexOf(W), 1); if (W.gate && typeof gates !== "undefined") { const i = gates.indexOf(W.gate); if (i >= 0) gates.splice(i, 1); }
  try { localStorage.setItem("wm-koffer-weg-" + W.k, "1"); } catch (e) {} toast("Koffer aufgenommen"); }
// Aufnehmen: linke Maus auf einem Koffer halten (Bildmitte, bis 2,5 m), Kreis in der Mitte; Loslassen oder Wegschauen bricht ab
const KOFFER_RC = new THREE.Raycaster();
function kofferZiel() { if (!KOFFER.welt.length) return null; KOFFER_RC.setFromCamera({ x: 0, y: 0 }, camera); KOFFER_RC.far = 2.5; const h = KOFFER_RC.intersectObjects(KOFFER.welt.map(w => w.g), true)[0]; if (!h) return null; let o = h.object; while (o && !KOFFER.welt.some(w => w.g === o)) o = o.parent; return KOFFER.welt.find(w => w.g === o) || null; }
function kofferHoldStart(W) { const el = holdRingEl(); KOFFER.hold = { W, t: 0, el }; el.querySelector("span").textContent = "Aufnehmen …"; el.hidden = false; }
function kofferHoldEnd(done) { const H = KOFFER.hold; if (!H) return; H.el.hidden = true; KOFFER.hold = null; if (done) kofferNehmen(H.W); }
function kofferStep(dt) { const H = KOFFER.hold; if (!H) return; if (kofferZiel() !== H.W) return kofferHoldEnd(false); H.t += dt; H.el.querySelector(".hr-fg").style.strokeDashoffset = String(100 - Math.min(100, H.t / 0.8 * 100)); if (H.t >= 0.8) kofferHoldEnd(true); }
addEventListener("mousedown", e => { if (e.button === 0 && document.pointerLockElement && (typeof onFoot !== "function" || onFoot()) && !(typeof weaponHeld === "function" && weaponHeld())) { const W = kofferZiel(); if (W) kofferHoldStart(W); }
  if (e.button === 2 && document.pointerLockElement && typeof invHeld === "function" && invHeld() === "koffer") { const S = INV.slots[INV.sel]; if (S && !S.k) { S.k = "k" + Date.now().toString(36); invSave(); }   // Koffer ohne Kennung bekommt eine (leer)
    if (S && S.k) { e.preventDefault(); e.stopImmediatePropagation(); if (document.pointerLockElement) document.exitPointerLock(); kofferOpen(S.k); } } }, true);
addEventListener("mouseup", e => { if (e.button === 0 && KOFFER.hold) kofferHoldEnd(false); });
// in der Hand: Koffer zu, am Griff gehalten
if (typeof HAND3D !== "undefined") HAND3D.koffer = () => { const g = new THREE.Group(), m = buildKoffer({ offen: false }); m.rotation.set(Math.PI / 2, 0.25, 0); m.position.set(0, -0.05, 0.05); m.scale.setScalar(0.8); g.add(m); g.position.y = -0.1; return g; };
