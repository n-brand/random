// Muelleimer (Nicolas 2026-11-18, N26: "in der Werkstatt einen Muelleimer oder mehrere verschiedene: oeffentlich, Papierkorb und wenn dir noch eine Variante einfaellt";
// Ablauf nach OFFENE-FRAGEN 35: Gegenstaende per Rechtsklick-Fenster hineinlegen, bis zur Leerung wieder herausnehmen; Leerung beim Neuladen oder per Knopf).
// Spiel und Werkstatt, nach inventar.js und gotham/tresor.js. muellAdd(parent, typ, id, pos, rotY) mit typ "eimer" (oeffentlicher Muelleimer), "korb" (Papierkorb,
// nur kleine Dinge), "container" (Muellcontainer auf Raedern, Deckel klappt beim Oeffnen auf). Inhalt nur im Speicher der Seite (nicht in localStorage).
const MUELL = { list: [] };
const MUELL_TYP = {
  eimer: { name: "Mülleimer", slots: 9, near: 2.2 },
  korb: { name: "Papierkorb", slots: 6, near: 2.0, klein: true },
  container: { name: "Müllcontainer", slots: 27, near: 2.6 },
};
const muellKlein = id => { const it = INV_ITEMS[id]; if (!it) return false; if (it.art === "Behälter" || id === "batsuit" || id === "mantel") return false; if (it.art === "Waffe" && !["batarang", "rauchbombe"].includes(id)) return false; return true; };   // Papierkorb: keine Waffen, Koffer, Kleidung
function buildMuell(typ) {
  const g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0.3 }, o)), dunkel = M(0x0c0d0e, { roughness: 1, metalness: 0 });
  if (typ === "eimer") {   // oeffentlicher Muelleimer: dunkelgruener Lamellenkoerper auf Sockel, Kuppeldeckel mit Einwurf, Ring
    const lam = canvasTex(128, 64, (c, w, h) => { c.fillStyle = "#24402f"; c.fillRect(0, 0, w, h); c.fillStyle = "#16281d"; for (let x = 0; x < w; x += 8) c.fillRect(x, 0, 2, h); }, 4, 1);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.72, 24, 1, true), M(0xffffff, { map: lam, side: THREE.DoubleSide })); body.position.y = 0.42; g.add(body);
    const boden = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 24), M(0x1d3326)); boden.position.y = 0.07; g.add(boden);
    const sockel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.06, 20), M(0x2a2c2e)); sockel.position.y = 0.03; g.add(sockel);
    for (const y of [0.1, 0.77]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.012, 6, 28), M(0x1b3024)); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
    const dom = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(0x1b3024)); dom.scale.y = 0.45; dom.position.y = 0.78; g.add(dom);
    const ein = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.06), dunkel); ein.position.set(0, 0.83, -0.17); ein.rotation.x = -0.35; g.add(ein);   // Einwurf vorne
    const sch = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (c, w) => { c.fillStyle = "#f2f2f2"; c.beginPath(); c.arc(32, 32, 30, 0, 7); c.fill(); c.strokeStyle = "#24402f"; c.lineWidth = 4; c.beginPath(); c.moveTo(22, 20); c.lineTo(26, 48); c.lineTo(38, 48); c.lineTo(42, 20); c.closePath(); c.moveTo(18, 20); c.lineTo(46, 20); c.moveTo(28, 16); c.lineTo(36, 16); c.stroke(); }), transparent: true }));
    sch.position.set(0, 0.45, -0.206); sch.rotation.y = Math.PI; g.add(sch);   // Muellsymbol vorne
  } else if (typ === "korb") {   // Papierkorb: schwarzer Drahtkorb (Gitter durchsichtig), Rand oben
    const gitter = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "#141516"; c.lineWidth = 3; for (let i = 0; i <= w; i += 10) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } }, 6, 3);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.32, 24, 1, true), M(0xffffff, { map: gitter, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })); body.position.y = 0.16; g.add(body);
    const boden = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.008, 24), M(0x141516)); boden.position.y = 0.004; g.add(boden);
    const rand = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.007, 6, 28), M(0x141516)); rand.rotation.x = Math.PI / 2; rand.position.y = 0.32; g.add(rand);
    const papier = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), M(0xe9e6dc, { metalness: 0, roughness: 0.9, flatShading: true })); papier.position.set(0.03, 0.05, 0.01); g.add(papier); const p2 = papier.clone(); p2.position.set(-0.04, 0.06, -0.03); p2.scale.setScalar(0.8); g.add(p2);   // zerknuelltes Papier
  } else {   // Muellcontainer 1100 l: gruen, Raeder, Klappdeckel (Scharnier hinten), Griffe
    const gruen = M(0x2f5a32, { roughness: 0.55, metalness: 0.15 }), W = 1.25, D = 1.0, H = 1.05, y0 = 0.16;
    const box = (m, w, h, d, x, y, z, p = g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o; };
    box(gruen, W, 0.04, D, 0, y0 + 0.02, 0); box(gruen, W, H, 0.04, 0, y0 + H / 2, -D / 2 + 0.02); box(gruen, W, H, 0.04, 0, y0 + H / 2, D / 2 - 0.02); box(gruen, 0.04, H, D, -W / 2 + 0.02, y0 + H / 2, 0); box(gruen, 0.04, H, D, W / 2 - 0.02, y0 + H / 2, 0);
    box(dunkel, W - 0.08, 0.01, D - 0.08, 0, y0 + 0.05, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), M(0x111111, { roughness: 0.9 })); r.rotation.z = Math.PI / 2; r.position.set(sx * (W / 2 - 0.12), 0.08, sz * (D / 2 - 0.12)); g.add(r); }   // Raeder
    for (const sx of [-1, 1]) box(M(0x1d1f21), 0.04, 0.04, 0.22, sx * (W / 2 + 0.03), y0 + H - 0.15, -D / 2 + 0.15);   // Griffe seitlich
    for (let k = 0; k < 3; k++) box(M(0x28502b), W - 0.1, 0.03, 0.01, 0, y0 + 0.25 + k * 0.25, -D / 2 - 0.006);   // Rippen vorne
    const hinge = new THREE.Group(); hinge.position.set(0, y0 + H, D / 2); g.add(hinge); const lid = box(M(0x264a29), W + 0.04, 0.04, D + 0.04, 0, 0.02, -D / 2 - 0.02, hinge); g.userData.hinge = hinge;   // Deckel
    const fill = box(M(0x1e1f1c, { roughness: 1, metalness: 0 }), W - 0.1, 0.3, D - 0.1, 0, y0 + 0.2, 0); fill.visible = false; g.userData.fill = fill;   // Muellsaecke (wenn etwas drin ist)
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.name = MUELL_TYP[typ].name; return g;
}
function muellActions(B) { return [B.confirm ? { label: "Wirklich leeren? Alles ist danach weg", fn: () => { B.slots.fill(null); B.confirm = false; B.save(); B.actions = muellActions(B); invRender(); toast(B.name + " geleert"); } } : { label: "Jetzt leeren", fn: B.slots.some(Boolean) ? () => { B.confirm = true; B.actions = muellActions(B); invRender(); } : null }, { label: "wird sonst beim Neuladen geleert", fn: null }]; }
function muellAdd(parent, typ, id, pos, rotY = 0) {
  const T = MUELL_TYP[typ], g = buildMuell(typ); g.position.copy(pos); g.rotation.y = rotY; g.userData.kind = "muell"; parent.add(g);
  const B = invBox("muell-" + id, T.name, T.slots, [], 9); try { localStorage.removeItem("wm-box-muell-" + id); } catch (e) {}   // nur im Speicher der Seite
  B.slots.fill(null); B.save = () => { if (B.onChange) B.onChange(B); }; if (T.klein) B.accept = muellKlein;
  const U = { id, typ, g, B, ang: 0 }; B.onChange = () => { if (g.userData.fill) g.userData.fill.visible = B.slots.some(Boolean); if (INV.box === B) B.actions = muellActions(B); }; MUELL.list.push(U);   // Knoepfe nach jeder Aenderung neu
  g.updateMatrixWorld(true); const p = g.getWorldPosition(new THREE.Vector3());
  if (typeof gates !== "undefined") gates.push({ name: T.name, g, call: () => { const pl = typeof player !== "undefined" ? player.pos : camera.position; if (Math.hypot(pl.x - p.x, pl.z - p.z) > T.near + 0.6) return toast("Zu weit weg"); B.confirm = false; B.actions = muellActions(B); invBoxOpen(B); }, verbs: ["öffnen", "öffnen"], a: [p.x, p.z], b: [p.x, p.z], near: T.near + 0.6 });
  return U; }
function muellStep(dt) { const cp = camera.position; for (const U of MUELL.list) { if (U.weit) { const v = Math.abs(U.g.position.x - cp.x) + Math.abs(U.g.position.z - cp.z) < U.weit; if (U.g.visible !== v) U.g.visible = v; }   // im Spiel (gotham-orte.js) weit weg ausgeblendet
  const h = U.g.userData.hinge; if (!h) continue; const want = INV.box === U.B ? 1.6 : 0; if (Math.abs(U.ang - want) > 0.001) { U.ang += Math.sign(want - U.ang) * Math.min(Math.abs(want - U.ang), dt * 3); h.rotation.x = U.ang; } } }   // Containerdeckel auf, solange das Fenster offen ist
