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
function kofferGive(k, id = "koffer") { for (let i = 0; i < 36; i++) if (!INV.slots[i]) { INV.slots[i] = { id, n: 1, k }; invSave(); invRender(); return true; } toast("Kein Platz im Inventar für " + INV_ITEMS[id].name); return false; }
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
function kofferNehmen(W) { if (!kofferGive(W.k, W.id)) return; W.g.parent && W.g.parent.remove(W.g); KOFFER.welt.splice(KOFFER.welt.indexOf(W), 1); if (W.gate && typeof gates !== "undefined") { const i = gates.indexOf(W.gate); if (i >= 0) gates.splice(i, 1); }
  try { localStorage.setItem("wm-koffer-weg-" + W.k, "1"); } catch (e) {} toast((W.id === "sporttasche" ? "Sporttasche" : "Koffer") + " aufgenommen"); }
// Aufnehmen: linke Maus auf einem Koffer halten (Bildmitte, bis 2,5 m), Kreis in der Mitte; Loslassen oder Wegschauen bricht ab
const KOFFER_RC = new THREE.Raycaster();
function kofferZiel() { if (!KOFFER.welt.length) return null; KOFFER_RC.setFromCamera({ x: 0, y: 0 }, camera); KOFFER_RC.far = 2.5; const h = KOFFER_RC.intersectObjects(KOFFER.welt.map(w => w.g), true)[0]; if (!h) return null; let o = h.object; while (o && !KOFFER.welt.some(w => w.g === o)) o = o.parent; return KOFFER.welt.find(w => w.g === o) || null; }
function kofferHoldStart(W) { const el = holdRingEl(); KOFFER.hold = { W, t: 0, el }; el.querySelector("span").textContent = "Aufnehmen …"; el.hidden = false; }
function kofferHoldEnd(done) { const H = KOFFER.hold; if (!H) return; H.el.hidden = true; KOFFER.hold = null; if (done) kofferNehmen(H.W); }
function kofferStep(dt) { const H = KOFFER.hold; if (!H) return; if (kofferZiel() !== H.W) return kofferHoldEnd(false); H.t += dt; H.el.querySelector(".hr-fg").style.strokeDashoffset = String(100 - Math.min(100, H.t / 0.8 * 100)); if (H.t >= 0.8) kofferHoldEnd(true); }
addEventListener("mousedown", e => { if (e.button === 0 && document.pointerLockElement && (typeof onFoot !== "function" || onFoot()) && !(typeof weaponHeld === "function" && weaponHeld())) { const W = kofferZiel(); if (W) kofferHoldStart(W); }
  if (e.button === 2 && document.pointerLockElement && typeof invHeld === "function" && (invHeld() === "koffer" || invHeld() === "sporttasche")) { const S = INV.slots[INV.sel]; if (S && !S.k) { S.k = "k" + Date.now().toString(36); invSave(); }   // Koffer ohne Kennung bekommt eine (leer)
    if (S && S.k) { e.preventDefault(); e.stopImmediatePropagation(); if (document.pointerLockElement) document.exitPointerLock(); S.id === "sporttasche" ? tascheOpen(S) : kofferOpen(S.k); } } }, true);
addEventListener("mouseup", e => { if (e.button === 0 && KOFFER.hold) kofferHoldEnd(false); });
// in der Hand: Koffer zu, am Griff gehalten
if (typeof HAND3D !== "undefined") HAND3D.koffer = () => { const g = new THREE.Group(), m = buildKoffer({ offen: false }); m.rotation.set(Math.PI / 2, 0.25, 0); m.position.set(0, -0.05, 0.05); m.scale.setScalar(0.8); g.add(m); g.position.y = -0.1; return g; };

// ---- Sporttasche (Nicolas 2026-11-20: "mach auf den Tisch eine Tasche in der Werkstatt – eine längliche Sporttasche – kann man in Hand, Schulter oder sogar über Rücken anziehen").
// Gegenstand "sporttasche" (Stapel 1, Kennung k wie der Koffer, Inhalt im Behaelter "tasche-<k>", 18 Plaetze). In der Welt: tascheWelt(parent, k, pos, rotY, { init }) – Rechtsklick
// oeffnet (von allen Seiten), linke Maus 0,8 s halten nimmt sie auf (wie der Koffer). Tragen: in der Hand (gewaehlter Hotbar-Platz, am Griff), oder auf dem Ausruestungsplatz
// "Ruecken" (inventar.js INV.equip.ruecken, Feld trag = "schulter" | "ruecken"): ueber der linken Schulter (Gurt, Tasche an der Huefte) bzw. quer auf dem Ruecken (zwei Gurte
// ueber die Schultern). Sichtbar an der Figur in der dritten Person (figur.js dpStep -> tascheTrag). In der Hand: Rechtsklick oeffnet, Linksklick haengt sie um.
function buildSporttasche() { const g = new THREE.Group(), L = 0.64, Rr = 0.15, SY = 0.92, SZ = 0.8, H = 2 * Rr * SY, M = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const stoff = M(0x1b1e24, 0.88), ende = M(0x2e333c, 0.8), gold = M(0xc9a23a, 0.45, 0.3), gurt = M(0x0e0f12, 0.7), met = M(0xb8bcc2, 0.3, 0.85);
  const b = new THREE.Group(); b.scale.set(1, SY, SZ); b.position.y = H / 2; g.add(b);   // Koerper: Zylinder quer (x), etwas flach gedrueckt
  const zyl = (r, l, m, x) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 28), m); c.rotation.z = Math.PI / 2; c.position.x = x; b.add(c); return c; };
  zyl(Rr, L - 0.08, stoff, 0); for (const sx of [-1, 1]) { zyl(Rr * 1.01, 0.04, ende, sx * (L / 2 - 0.02)); zyl(Rr * 1.03, 0.014, gold, sx * (L / 2 - 0.075)); zyl(Rr * 1.015, 0.03, gurt, sx * 0.13); }   // Enden, Goldstreifen, Griffbaender
  const box = (m, w, h, d, x, y, z) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); q.position.set(x, y, z); g.add(q); return q; };
  box(gurt, L - 0.12, 0.008, 0.03, 0, H + 0.002, 0); box(met, 0.03, 0.01, 0.018, 0.16, H + 0.008, 0);   // Reissverschluss mit Zipper
  box(gold, 0.13, 0.05, 0.004, 0, H * 0.5, -Rr * SZ - 0.002);   // Schild vorne
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.011, 6, 16, Math.PI), gurt); t.rotation.y = Math.PI / 2; t.position.set(sx * 0.13, H - 0.05, 0); t.scale.set(1, 0.9, 0.95); g.add(t);   // Griffe
    const ri = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 12), met); ri.rotation.y = Math.PI / 2; ri.position.set(sx * (L / 2 + 0.006), H * 0.8, 0); g.add(ri); }   // Ringe fuer den Schultergurt
  { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 10), gurt); w.rotation.z = Math.PI / 2; w.position.y = H - 0.05 + 0.088; g.add(w); }   // Griffwickel oben
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); g.userData.H = H; g.name = "Sporttasche"; return g; }
function tascheBox(k, init) { const B = invBox("tasche-" + k, "Sporttasche", 18, init || [], 6); B.self = k; return B; }
function tascheOpen(S) { if (!S.k) { S.k = "t" + Date.now().toString(36); invSave(); } invBoxOpen(tascheBox(S.k)); }
function tascheWelt(parent, k, pos, rotY = 0, o = {}) {
  try { if (localStorage.getItem("wm-koffer-weg-" + k)) { tascheBox(k, o.init); return null; } } catch (e) {}   // schon aufgenommen
  const g = buildSporttasche(); g.position.copy(pos); g.rotation.y = rotY; parent.add(g); tascheBox(k, o.init);
  const W = { k, g, id: "sporttasche", gate: null }; KOFFER.welt.push(W); g.updateMatrixWorld(true); const p = g.getWorldPosition(new THREE.Vector3());
  if (typeof gates !== "undefined") { W.gate = { name: "Sporttasche", g, call: () => tascheOpen({ k }), verbs: ["öffnen · linke Maus halten: aufnehmen", "öffnen · linke Maus halten: aufnehmen"], a: [p.x, p.z], b: [p.x, p.z], near: 2.5 }; gates.push(W.gate); }
  return W; }
// in der Hand: am Griff, Tasche haengt darunter (Laenge nach vorne); Ich-Sicht kleiner und weiter unten
if (typeof HAND3D !== "undefined") HAND3D.sporttasche = () => { const g = new THREE.Group(), m = buildSporttasche(), dp = typeof dpAn === "function" && dpAn(), H = m.userData.H;
  m.rotation.y = Math.PI / 2; m.position.y = -(H + 0.13); if (dp) { m.position.y -= 0.02; g.add(m); return g; } const w = new THREE.Group(); w.add(m); w.scale.setScalar(0.42); w.position.set(0.02, -0.02, 0.05); w.rotation.set(0.15, -0.5, 0.05); g.add(w); return g; };
// Linksklick mit der Tasche in der Hand: umhaengen (auf den Platz Ruecken, eine umgehaengte kommt in die Hand)
addEventListener("mousedown", e => { if (e.button !== 0 || !document.pointerLockElement || typeof invHeld !== "function" || invHeld() !== "sporttasche" || (typeof onFoot === "function" && !onFoot()) || kofferZiel()) return;
  const S = INV.slots[INV.sel], alt = INV.equip.ruecken; INV.equip.ruecken = S; INV.slots[INV.sel] = alt || null; invSave(); invRender(); toast("Sporttasche umgehängt (" + (S.trag === "ruecken" ? "Rücken" : "Schulter") + ") – wechseln im Inventar, Platz Rücken"); });
// umgehaengt an der Figur (dritte Person): an den Rumpf gehaengt, neu gebaut nur bei Wechsel
function tascheTrag(F) { const S = typeof INV !== "undefined" && INV.equip ? INV.equip.ruecken : null, U = F.userData, mode = S ? (S.trag === "ruecken" ? "ruecken" : "schulter") : null;
  if (U.taschMode === mode) return; U.taschMode = mode; if (U.taschG) U.rumpf.remove(U.taschG); U.taschG = null; if (!mode) return;
  const g = new THREE.Group(), t = buildSporttasche(), H = t.userData.H, gm = new THREE.MeshStandardMaterial({ color: 0x0e0f12, roughness: 0.7 }), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const band = (A, C, w = 0.045) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, A.distanceTo(C), 0.012), gm); m.position.copy(A).add(C).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), C.clone().sub(A).normalize()); m.castShadow = true; g.add(m); };
  if (mode === "ruecken") { t.rotation.y = Math.PI; t.position.set(0, 0.17, 0.28); g.add(t);   // quer auf dem Ruecken, Schild nach aussen
    for (const sx of [-1, 1]) { const top = V(sx * 0.11, 0.17 + H - 0.02, 0.22), sh = V(sx * 0.13, 0.6, 0.02), vo = V(sx * 0.14, 0.52, -0.17), un = V(sx * 0.17, 0.22, -0.15), se = V(sx * 0.22, 0.2, 0.08), bo = V(sx * 0.2, 0.2, 0.2);
      band(top, sh); band(sh, vo); band(vo, un); band(un, se); band(se, bo); } }
  else { t.rotation.y = Math.PI / 2; t.position.set(-0.36, -0.12, 0.06); g.add(t);   // ueber der linken Schulter, Tasche an der Huefte (Laenge nach vorne)
    const sh = V(-0.2, 0.62, 0), vo = V(-0.36, -0.12 + H * 0.8, -0.26), hi = V(-0.36, -0.12 + H * 0.8, 0.38); band(vo, V(-0.25, 0.5, -0.16)); band(V(-0.25, 0.5, -0.16), sh); band(sh, V(-0.25, 0.5, 0.15)); band(V(-0.25, 0.5, 0.15), hi); }
  U.rumpf.add(g); U.taschG = g; }

// ---- Beute am Boden (N21 "Aufnehmen mit Kreis" fuer Geld und Gold; 2026-11-19): beuteAdd(pos, id, n) legt ein 3D-Modell (Geldbuendel bzw. Goldbarren) hin; darauf zielen
// (bis 3 m, Bildmitte) und linke Maus halten: Kreis 0,6 s, dann ins Inventar (invAdd). Zum Beispiel beim Aufsprengen eines Geldtransporters (gotham-bus.js).
const BEUTE = { welt: [], hold: null, rc: new THREE.Raycaster() };
function beuteAdd(pos, id, n = 1) { const g = new THREE.Group();
  if (id === "goldbarren") { const m = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.1), new THREE.MeshStandardMaterial({ color: 0xe0b03a, metalness: 0.9, roughness: 0.25, emissive: 0x3a2a08 })); m.position.y = 0.03; g.add(m); }
  else { const m = typeof HAND3D !== "undefined" && HAND3D["geld-bar"] ? HAND3D["geld-bar"]() : new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.07), new THREE.MeshStandardMaterial({ color: 0x9ccf8a })); m.rotation.set(0, 0, 0); m.position.set(0, 0.02, 0); m.scale.setScalar(1.3); g.add(m); }
  g.position.copy(pos); g.rotation.y = Math.random() * 6.28; g.userData.beute = { id, n }; g.userData.dynamic = true; scene.add(g); BEUTE.welt.push(g); return g; }
function beuteZiel() { if (!BEUTE.welt.length) return null; BEUTE.rc.setFromCamera({ x: 0, y: 0 }, camera); BEUTE.rc.far = 3.2; const h = BEUTE.rc.intersectObjects(BEUTE.welt, true)[0]; if (!h) return null; let o = h.object; while (o && !o.userData.beute) o = o.parent; return o; }
function beuteStep(dt) { const H = BEUTE.hold; if (!H) return; if (beuteZiel() !== H.g) { H.el.hidden = true; BEUTE.hold = null; return; } H.t += dt; H.el.querySelector(".hr-fg").style.strokeDashoffset = String(100 - Math.min(100, H.t / 0.6 * 100));
  if (H.t < 0.6) return; H.el.hidden = true; BEUTE.hold = null; const B = H.g.userData.beute, put = invAdd(B.id, B.n); if (!put) return toast("Kein Platz im Inventar");
  if (put < B.n) { B.n -= put; toast(INV_ITEMS[B.id].name + " × " + put + " aufgenommen (kein Platz für den Rest)"); return; } scene.remove(H.g); BEUTE.welt.splice(BEUTE.welt.indexOf(H.g), 1); toast(INV_ITEMS[B.id].name + (B.n > 1 ? " × " + B.n : "") + " aufgenommen"); }
addEventListener("mousedown", e => { if (e.button !== 0 || !document.pointerLockElement || (typeof onFoot === "function" && !onFoot()) || (typeof weaponHeld === "function" && weaponHeld()) || KOFFER.hold) return; const g = beuteZiel(); if (!g) return;
  const el = holdRingEl(); el.querySelector("span").textContent = "Aufnehmen …"; el.hidden = false; BEUTE.hold = { g, t: 0, el }; }, true);
addEventListener("mouseup", e => { if (e.button === 0 && BEUTE.hold) { BEUTE.hold.el.hidden = true; BEUTE.hold = null; } });
