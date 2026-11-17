// Batverse – Spielautomat "einarmiger Bandit" als 3D-Modell (Nicolas 2026-11-17: "die einarmigen Banditen sollen einen eigenen Bauschritt bekommen, aehnlich wie beim
// Bankautomaten, und die UI direkt anpassen"; Plan PLAN-SPIELAUTOMAT.md). Klassisches Skript, Spiel (FILES vor gotham/gotham-casino.js) und Werkstatt (Projekt).
// buildSpielautomat(farbe) -> Gruppe, Front nach -z, Boden y 0, ca. 0,76 x 0,72 x 2,05 m: Sockel, Unterschrank mit Muenzschale, schraeges Tastenpult mit grossem
// Dreh-Knopf, Bildschirm mit drei Walzen hinter Chromrahmen, gewoelbter Aufsatz mit JACKPOT-Schild und Lauflicht, Lichtleisten seitlich, Hebel rechts (der "eine Arm").
// Teile mit userData.tint tragen die Gehaeusefarbe (fuer Instanzen: instanceColor). spielautomatInstanzen(parent, liste) baut viele davon als InstancedMesh.
"use strict";
const SLOT_SYM = [   // Symbole der Walzen (Reihenfolge = Index), auch fuer das Spielfenster (ui/spielautomat.js)
  { id: "7", farbe: "#e0102a" }, { id: "D", farbe: "#5fd3ff" }, { id: "B", farbe: "#111" }, { id: "G", farbe: "#ffc93a" }, { id: "S", farbe: "#ffd23a" }, { id: "L", farbe: "#f4e04a" }, { id: "C", farbe: "#d0102a" }];
// Symbol zeichnen (Mitte x, y, Groesse s) – eigene Formen statt Emoji, damit es ueberall gleich aussieht
function slotSymDraw(c, id, x, y, s) {
  c.save(); c.translate(x, y); const k = s / 100; c.scale(k, k); c.lineJoin = "round"; c.lineCap = "round";
  if (id === "7") { c.font = "900 92px 'Arial Black', Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineWidth = 10; c.strokeStyle = "#5a0008"; c.strokeText("7", 0, 4); c.fillStyle = "#e0102a"; c.fillText("7", 0, 4); c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(-18, -34, 26, 8); }
  // Diamant (Nicolas 2026-11-17: "ueberarbeiten"): Brillantschliff mit Tafel, Krone und Pavillon, jede Facette eigener Blauton, weisse Kanten, Glanzstern
  else if (id === "D") { const F = (pts, col) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = col; c.fill(); };
    const T = [-20, -36], T2 = [20, -36], L = [-44, -14], R = [44, -14], B = [0, 42], m1 = [-26, -14], m2 = [0, -14], m3 = [26, -14];
    F([T, T2, [12, -14], [-12, -14]], "#bff3ff"); F([L, T, [-12, -14]], "#7fdcff"); F([R, T2, [12, -14]], "#4fb8ea"); F([T, [-12, -14], m1], "#9fe8ff"); F([T2, [12, -14], m3], "#62c8f2");
    F([L, m1, B], "#3aa6e0"); F([m1, m2, B], "#8ee4ff"); F([m2, m3, B], "#2f8fcc"); F([m3, R, B], "#1d6fa8"); F([L, [-12, -14], m1], "#5cc6f2"); F([R, [12, -14], m3], "#2f9ad6");
    c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 2; c.beginPath(); for (const [a, b] of [[T, T2], [L, R], [T, [-12, -14]], [T2, [12, -14]], [T, m1], [T2, m3], [m1, B], [m2, B], [m3, B]]) { c.moveTo(...a); c.lineTo(...b); } c.stroke();
    c.beginPath(); c.moveTo(...T); c.lineTo(...T2); c.lineTo(...R); c.lineTo(...B); c.lineTo(...L); c.closePath(); c.lineWidth = 5; c.strokeStyle = "#0f4f80"; c.stroke();
    c.fillStyle = "#fff"; c.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 3 : 11, a = k * Math.PI / 4; c.lineTo(-22 + Math.cos(a) * r, -26 + Math.sin(a) * r); } c.closePath(); c.fill(); }
  // Glocke: goldene Glocke mit Kuppel, geschwungener Flanke, breitem Rand, Kloeppel, Oese oben, Verlauf und Glanzstreifen
  else if (id === "G") { const gr = c.createLinearGradient(-40, 0, 40, 0); gr.addColorStop(0, "#b8730a"); gr.addColorStop(0.28, "#ffe27a"); gr.addColorStop(0.55, "#f5b81c"); gr.addColorStop(1, "#9a5a04");
    c.lineWidth = 4.5; c.strokeStyle = "#5a3200";
    c.beginPath(); c.arc(0, -40, 7, 0, 7); c.fillStyle = "#e0a020"; c.fill(); c.stroke();                                            // Oese
    c.beginPath(); c.moveTo(-6, -33); c.bezierCurveTo(-26, -32, -28, -12, -30, 6); c.bezierCurveTo(-31, 16, -38, 20, -40, 26); c.lineTo(40, 26); c.bezierCurveTo(38, 20, 31, 16, 30, 6); c.bezierCurveTo(28, -12, 26, -32, 6, -33); c.closePath(); c.fillStyle = gr; c.fill(); c.stroke();   // Koerper
    const rim = c.createLinearGradient(-44, 0, 44, 0); rim.addColorStop(0, "#9a5a04"); rim.addColorStop(0.3, "#ffd65a"); rim.addColorStop(1, "#8a4e02");
    c.beginPath(); c.moveTo(-44, 24); c.lineTo(44, 24); c.quadraticCurveTo(47, 32, 40, 34); c.lineTo(-40, 34); c.quadraticCurveTo(-47, 32, -44, 24); c.closePath(); c.fillStyle = rim; c.fill(); c.stroke();   // Rand
    c.beginPath(); c.moveTo(-22, 10); c.lineTo(22, 10); c.lineWidth = 3; c.strokeStyle = "rgba(90,50,0,.55)"; c.stroke();                // Zierlinie
    c.beginPath(); c.arc(0, 41, 7, 0, 7); c.fillStyle = "#c98a10"; c.fill(); c.lineWidth = 4; c.strokeStyle = "#5a3200"; c.stroke();     // Kloeppel
    c.fillStyle = "rgba(255,255,255,.6)"; c.beginPath(); c.moveTo(-16, -22); c.bezierCurveTo(-21, -10, -22, 2, -22, 14); c.lineTo(-15, 14); c.bezierCurveTo(-15, 2, -13, -10, -10, -24); c.closePath(); c.fill(); }   // Glanz
  // Zitrone: Ellipse mit Spitzen an beiden Enden, Verlauf mit Glanz, Poren, Blatt mit Mittelrippe und kurzer Stiel
  else if (id === "L") { c.save(); c.rotate(-0.35);
    const gr = c.createRadialGradient(-10, -12, 4, 0, 0, 46); gr.addColorStop(0, "#fffbc0"); gr.addColorStop(0.45, "#ffe63a"); gr.addColorStop(1, "#d9a800");
    c.beginPath(); c.moveTo(-46, 0); c.quadraticCurveTo(-42, -4, -36, -12); c.bezierCurveTo(-24, -34, 24, -34, 36, -12); c.quadraticCurveTo(42, -4, 46, 0); c.quadraticCurveTo(42, 4, 36, 12); c.bezierCurveTo(24, 34, -24, 34, -36, 12); c.quadraticCurveTo(-42, 4, -46, 0); c.closePath();
    c.fillStyle = gr; c.fill(); c.lineWidth = 4.5; c.strokeStyle = "#8a6a00"; c.stroke();
    c.fillStyle = "rgba(160,120,0,.35)"; for (const [x, y] of [[-14, 10], [-4, 16], [8, 12], [18, 4], [-22, 0], [4, 2], [-8, -4], [14, -8], [24, 12]]) { c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill(); }
    c.fillStyle = "rgba(255,255,255,.75)"; c.beginPath(); c.ellipse(-12, -14, 12, 5, -0.25, 0, 7); c.fill();
    c.restore();
    c.fillStyle = "#5a3a10"; c.fillRect(30, -32, 4, 9);                                                                            // Stiel
    c.beginPath(); c.moveTo(32, -30); c.bezierCurveTo(40, -46, 56, -44, 58, -36); c.bezierCurveTo(52, -26, 40, -24, 32, -30); c.closePath(); c.fillStyle = "#4caa36"; c.fill(); c.lineWidth = 3; c.strokeStyle = "#1f5a14"; c.stroke();   // Blatt
    c.beginPath(); c.moveTo(33, -30); c.quadraticCurveTo(45, -36, 56, -36); c.lineWidth = 2; c.strokeStyle = "#1f5a14"; c.stroke(); }
  else if (id === "B") { c.fillStyle = "#111"; c.fillRect(-44, -24, 88, 48); c.strokeStyle = "#e8c547"; c.lineWidth = 5; c.strokeRect(-44, -24, 88, 48); c.fillStyle = "#e8c547"; c.font = "900 34px 'Arial Black', Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("BAR", 0, 2); }
  else if (id === "S") { c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 18 : 42, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = "#ffd23a"; c.fill(); c.lineWidth = 5; c.strokeStyle = "#9a6a00"; c.stroke(); }
  else if (id === "C") { c.strokeStyle = "#3a7a2a"; c.lineWidth = 5; c.beginPath(); c.moveTo(-16, 8); c.quadraticCurveTo(-6, -30, 14, -40); c.moveTo(18, 12); c.quadraticCurveTo(14, -20, 14, -40); c.stroke();
    for (const [x, y] of [[-18, 18], [18, 20]]) { c.beginPath(); c.arc(x, y, 20, 0, 7); c.fillStyle = "#d0102a"; c.fill(); c.lineWidth = 4; c.strokeStyle = "#6a0010"; c.stroke(); c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.arc(x - 6, y - 7, 5, 0, 7); c.fill(); } }
  c.restore(); }
// Bildschirm des Automaten (3D): drei Walzen mit je drei Symbolen, Gewinnlinie, Schriftzug
function slotScreenTex(syms = [[1, 0, 3], [5, 0, 2], [4, 0, 6]]) { return canvasTex(320, 240, (c, w, h) => {
  const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1a0630"); gr.addColorStop(1, "#06020e"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.fillStyle = "#ffd23a"; c.font = "bold 20px Arial"; c.textAlign = "center"; c.fillText("GOTHAM FORTUNE", w / 2, 24);
  for (let r = 0; r < 3; r++) { const x = 18 + r * 96; const g2 = c.createLinearGradient(0, 36, 0, 226); g2.addColorStop(0, "#9a9a9a"); g2.addColorStop(0.5, "#ffffff"); g2.addColorStop(1, "#9a9a9a"); c.fillStyle = g2; c.fillRect(x, 36, 88, 190);
    for (let k = 0; k < 3; k++) slotSymDraw(c, SLOT_SYM[syms[r][k]].id, x + 44, 68 + k * 62, 52); }
  c.strokeStyle = "#e0102a"; c.lineWidth = 4; c.beginPath(); c.moveTo(8, 130); c.lineTo(w - 8, 130); c.stroke(); }); }
function buildSpielautomat(farbe = 0x6a1ab0, opt = {}) {
  const g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.3, ...o });
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const lack = M(farbe, { metalness: 0.55, roughness: 0.25 }), chrom = M(0xd8dde4, { metalness: 1, roughness: 0.18 }), schwarz = M(0x111216, { roughness: 0.35 }), dunkel = M(0x24262c);
  const W = 0.76, D = 0.72, F = -D / 2;
  const tint = o => { o.userData.tint = true; return o; };
  add(B(W, 0.12, D), schwarz, 0, 0.06, 0);                                                     // Sockel
  tint(add(B(W, 0.8, D), lack, 0, 0.52, 0));                                                   // Unterschrank
  add(B(W - 0.12, 0.6, 0.02), dunkel, 0, 0.52, F - 0.005);                                     // Frontplatte
  for (const y of [0.22, 0.82]) add(B(W - 0.1, 0.03, 0.03), chrom, 0, y, F - 0.01);            // Chromleisten
  add(B(0.44, 0.12, 0.16), chrom, 0, 0.3, F - 0.07); add(B(0.38, 0.08, 0.12), schwarz, 0, 0.33, F - 0.08);   // Muenzschale
  // Tastenpult (schraeg zum Spieler) mit vier Tasten und grossem Dreh-Knopf
  const pult = new THREE.Group(); pult.position.set(0, 0.95, F - 0.08); pult.rotation.x = -0.35; g.add(pult);
  { const p = new THREE.Mesh(B(W, 0.06, 0.3), schwarz); p.castShadow = true; pult.add(p); const e = new THREE.Mesh(B(W, 0.02, 0.02), chrom); e.position.set(0, 0.03, -0.15); pult.add(e);
    [0xffd23a, 0x3ad0ff, 0x3aff7a, 0xff8a2a].forEach((cc, i) => { const k = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.06), new THREE.MeshBasicMaterial({ color: cc })); k.position.set(-0.28 + i * 0.11, 0.04, 0.02); pult.add(k); });
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.04, 24), new THREE.MeshBasicMaterial({ color: 0xff2a3a })); sp.position.set(0.24, 0.045, 0.02); pult.add(sp); }
  // Oberschrank mit Bildschirm (leicht nach hinten geneigt) im Chromrahmen
  tint(add(B(W, 0.7, D - 0.08), lack, 0, 1.33, 0.04));
  const scr = new THREE.Group(); scr.position.set(0, 1.34, F + 0.02); scr.rotation.x = 0.1; g.add(scr);
  { const fr = new THREE.Mesh(B(0.66, 0.54, 0.04), chrom); fr.castShadow = true; scr.add(fr); const bl = new THREE.Mesh(B(0.6, 0.48, 0.02), schwarz); bl.position.z = -0.016; scr.add(bl);
    const t = opt.screen || slotScreenTex(); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.42), new THREE.MeshBasicMaterial({ map: t })); s.position.z = -0.028; s.rotation.y = Math.PI; scr.add(s); g.userData.screen = s; }
  // Aufsatz: gewoelbt (halber Zylinder) mit JACKPOT-Schild und Lauflicht
  { const sign = canvasTex(256, 96, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#2a0418"); gr.addColorStop(1, "#0c0208"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? "#ffe9a0" : "#ffb02e"; c.beginPath(); c.arc(8 + i * 16, 8, 4, 0, 7); c.fill(); c.beginPath(); c.arc(8 + i * 16, h - 8, 4, 0, 7); c.fill(); }
      c.font = "900 46px 'Arial Black', Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.shadowColor = "#ff2a55"; c.shadowBlur = 14; c.fillStyle = "#ffd23a"; c.fillText("JACKPOT", w / 2, h / 2 + 2); });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, W, 24, 1, false, 0, Math.PI), lack); top.rotation.z = Math.PI / 2; top.scale.set(0.75, 1, 1); top.position.set(0, 1.68, 0.04); top.castShadow = true; g.add(top); tint(top);   // Kuppel: Achse quer, Rundung oben
    tint(add(B(W, 0.32, 0.06), lack, 0, 1.84, F + 0.08));
    const sp = add(new THREE.PlaneGeometry(W - 0.04, 0.3), new THREE.MeshBasicMaterial({ map: sign }), 0, 1.84, F + 0.045, 0, Math.PI); sp.castShadow = false; }
  // Lichtleisten an den Seiten vorne (Gehaeusefarbe, leuchtend)
  for (const s of [-1, 1]) { const l = add(B(0.03, 1.2, 0.03), new THREE.MeshBasicMaterial({ color: new THREE.Color(farbe).lerp(new THREE.Color(0xffffff), 0.45) }), s * (W / 2 + 0.005), 1.2, F + 0.02); l.castShadow = false; tint(l); }
  // Hebel rechts (von vorne gesehen: -x... vorne = -z, darum +x links; Hebel auf der rechten Seite = -x)
  const hebel = new THREE.Group(); hebel.position.set(-W / 2 - 0.05, 1.1, 0.02); g.add(hebel); g.userData.hebel = hebel;
  { const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 20), chrom); hub.rotation.z = Math.PI / 2; hebel.add(hub);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.5, 10), chrom); rod.position.set(-0.04, 0.25, 0); hebel.add(rod);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 14), M(0xd0102a, { metalness: 0.2, roughness: 0.25 })); knob.position.set(-0.04, 0.52, 0); hebel.add(knob); }
  g.name = "Spielautomat"; return g;
}
// viele Automaten als InstancedMesh (ein Netz je Teil): liste = [[x, y, z, ry, farbe], ...] in den Koordinaten von parent; Bildschirm-Texturen in 3 Varianten
function spielautomatInstanzen(parent, liste) {
  if (!liste.length) return [];
  const tpl = buildSpielautomat(0xffffff), O = new THREE.Object3D(), out = [], col = new THREE.Color(); tpl.updateMatrixWorld(true);
  const meshes = []; tpl.traverse(o => { if (o.isMesh) meshes.push(o); });
  const screens = [slotScreenTex([[0, 2, 4], [6, 0, 1], [3, 0, 5]]), slotScreenTex([[2, 1, 6], [4, 1, 0], [5, 1, 3]]), slotScreenTex()];
  for (const m of meshes) { const isScr = m === tpl.userData.screen;
    for (let v = 0; v < (isScr ? 3 : 1); v++) { const sub = isScr ? liste.filter((_, i) => i % 3 === v) : liste; if (!sub.length) continue;
      const mat = isScr ? new THREE.MeshBasicMaterial({ map: screens[v] }) : m.material, im = new THREE.InstancedMesh(m.geometry, mat, sub.length);
      sub.forEach((t, i) => { O.position.set(t[0], t[1], t[2]); O.rotation.set(0, t[3] || 0, 0); O.scale.setScalar(1); O.updateMatrix(); O.matrix.multiply(m.matrixWorld); im.setMatrixAt(i, O.matrix); if (m.userData.tint) im.setColorAt(i, col.set(t[4] ?? 0x6a1ab0)); });
      if (im.instanceColor) im.instanceColor.needsUpdate = true; im.castShadow = m.castShadow; im.receiveShadow = true; parent.add(im); out.push(im); } }
  return out;
}
