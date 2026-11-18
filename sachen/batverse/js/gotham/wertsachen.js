// Wertsachen in 3D (Nicolas 2026-11-18, N24: "Goldbarren und Geldstapel in 3D ueberarbeiten (eigener Schritt)"; dazu "nicht nur Geldstapel, auch einzelne Geldscheine ueberarbeiten").
// Spiel und Werkstatt, vor gotham/tresor.js (FILES, Werkstatt, ASSETS, BV_KEEP). Eigene, erfundene Gestaltung: "Gotham Reserve Note" (keine echten Banknoten nachgebildet).
//   geldScheinTex(wert)  Textur eines Scheins (Vorder- = Rueckseite), Papier gruenlich, Guilloche-Rahmen, Wert in den Ecken, Siegel, Kopf im Oval (Fledermaus-Wasserzeichen), Seriennummer
//   buildGeldschein(wert)  einzelner Schein 15,6 x 6,6 cm, leicht gewoelbt (Mesh, Front +y)
//   buildGeldbuendel(wert, n)  Buendel mit Banderole: Kante mit Papierlagen, Deckschein oben, Banderole mit Betrag; n Scheine (100 = ca. 1 cm)
//   buildGoldbarren(gross)  Barren als Pyramidenstumpf mit Fase, oben eingepraegter Stempel GOTHAM REFINERY 999.9 (gross = Standardbarren 25 cm, sonst 1-kg-Barren 12 cm)
const WS = { tex: {}, mat: {} };
function wsRand(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
function geldScheinTex(wert = 50) {
  if (WS.tex["s" + wert]) return WS.tex["s" + wert];
  const t = canvasTex(512, 218, (c, w, h) => { const R = wsRand(wert * 7 + 3), gruen = "#2f5a3a", hell = "#e6eadb";
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#dfe6d2"); g.addColorStop(0.5, "#eef0e2"); g.addColorStop(1, "#d6dfc8"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(60,110,70,.12)"; c.lineWidth = 1; for (let k = 0; k < 60; k++) { c.beginPath(); const y0 = R() * h; c.moveTo(0, y0); for (let x = 0; x <= w; x += 16) c.lineTo(x, y0 + Math.sin(x / 30 + k) * 6); c.stroke(); }   // feine Wellenlinien
    c.strokeStyle = gruen; c.lineWidth = 6; c.strokeRect(9, 9, w - 18, h - 18); c.lineWidth = 1.5; c.strokeRect(18, 18, w - 36, h - 36);
    c.strokeStyle = "rgba(47,90,58,.55)"; c.lineWidth = 1; for (let k = 0; k < 90; k++) { const a = k / 90 * Math.PI * 2; c.beginPath(); c.ellipse(w / 2, h / 2, 62 + Math.sin(a * 6) * 6, 78 + Math.cos(a * 5) * 6, a, 0, Math.PI * 2); c.stroke(); }   // Guilloche um das Oval
    c.fillStyle = hell; c.beginPath(); c.ellipse(w / 2, h / 2, 52, 68, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = gruen; c.lineWidth = 3; c.stroke();
    c.fillStyle = "#4f6f55"; c.beginPath(); c.ellipse(w / 2, h / 2 - 12, 20, 25, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(w / 2, h / 2 + 40, 38, 26, 0, Math.PI, 0); c.fill();   // Kopf und Schultern (allgemein)
    if (typeof BAT_SIGNAL_PTS !== "undefined") { const P = BAT_SIGNAL_PTS, s = 46, cx = w * 0.79, cy = h * 0.52; c.fillStyle = "rgba(47,90,58,.18)"; c.beginPath(); P.forEach(([x, y], i) => c[i ? "lineTo" : "moveTo"](cx + x * s, cy + y * s)); for (let i = P.length - 2; i >= 0; i--) c.lineTo(cx - P[i][0] * s, cy + P[i][1] * s); c.closePath(); c.fill(); }   // Wasserzeichen
    c.fillStyle = gruen; c.textAlign = "center"; c.font = "bold 17px Georgia, serif"; c.fillText("GOTHAM FEDERAL RESERVE NOTE", w / 2, 40); c.font = "italic 13px Georgia, serif"; c.fillText("THIS NOTE IS LEGAL TENDER IN GOTHAM CITY", w / 2, h - 28);
    c.font = "bold 44px Georgia, serif"; for (const [x, y] of [[52, 66], [w - 52, 66], [52, h - 34], [w - 52, h - 34]]) c.fillText(String(wert), x, y);
    c.font = "bold 22px Georgia, serif"; c.fillText(["", "ONE", "", "", "", "FIVE", "", "", "", "", "TEN"][wert] || (wert === 20 ? "TWENTY" : wert === 50 ? "FIFTY" : wert === 100 ? "ONE HUNDRED" : String(wert)), w / 2, h - 46 + 0);
    c.strokeStyle = "#1d3b6a"; c.fillStyle = "rgba(29,59,106,.12)"; c.lineWidth = 2; c.beginPath(); c.arc(w * 0.22, h * 0.52, 26, 0, Math.PI * 2); c.fill(); c.stroke(); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; c.beginPath(); c.moveTo(w * 0.22 + Math.cos(a) * 20, h * 0.52 + Math.sin(a) * 20); c.lineTo(w * 0.22 + Math.cos(a) * 26, h * 0.52 + Math.sin(a) * 26); c.stroke(); }   // Siegel
    c.fillStyle = "#2a5a8a"; c.font = "bold 14px Courier New, monospace"; c.fillText("G " + String(10000000 + Math.floor(R() * 89999999)) + " A", w * 0.22, h * 0.84); c.fillText("G " + String(10000000 + Math.floor(R() * 89999999)) + " A", w * 0.78, h * 0.22);
  }); t.anisotropy = 8; WS.tex["s" + wert] = t; return t; }
function wsMat(key, make) { return WS.mat[key] || (WS.mat[key] = make()); }
function buildGeldschein(wert = 50) {
  const geo = new THREE.PlaneGeometry(0.156, 0.066, 10, 1), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.cos(x / 0.078 * Math.PI / 2) * 0.004); } geo.computeVertexNormals(); geo.rotateX(-Math.PI / 2);   // leicht gewoelbt
  const m = new THREE.Mesh(geo, wsMat("schein" + wert, () => new THREE.MeshStandardMaterial({ map: geldScheinTex(wert), side: THREE.DoubleSide, roughness: 0.85 }))); m.castShadow = true; m.name = "Geldschein"; return m; }
function buildGeldbuendel(wert = 100, n = 100) {
  const g = new THREE.Group(), H = Math.max(0.002, n * 0.0001), W = 0.156, D = 0.066;
  const kante = wsMat("kante", () => new THREE.MeshStandardMaterial({ map: canvasTex(64, 64, (c, w, h) => { c.fillStyle = "#d9e0cc"; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { c.fillStyle = y % 4 ? "#c4cdb5" : "#eef1e4"; c.fillRect(0, y, w, 1); } }), roughness: 0.95 }));
  const top = wsMat("buendel" + wert, () => new THREE.MeshStandardMaterial({ map: geldScheinTex(wert), roughness: 0.85 }));
  const box = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [kante, kante, top, top, kante, kante]); box.position.y = H / 2; g.add(box);
  const R = wsRand(n + wert); for (let k = 0; k < 3; k++) { const s = buildGeldschein(wert); s.position.set((R() - 0.5) * 0.004, H * (0.2 + k * 0.3), (R() - 0.5) * 0.003); s.rotation.y = (R() - 0.5) * 0.04; s.scale.set(1, 0.3, 1); g.add(s); }   // einzelne Scheine stehen leicht vor
  const band = wsMat("band", () => new THREE.MeshStandardMaterial({ map: canvasTex(128, 64, (c, w, h) => { c.fillStyle = "#f3eee0"; c.fillRect(0, 0, w, h); c.fillStyle = "#b8862b"; c.fillRect(0, 6, w, 5); c.fillRect(0, h - 11, w, 5); c.fillStyle = "#6a4a12"; c.font = "bold 22px Arial"; c.textAlign = "center"; c.fillText("$", w / 2, h / 2 + 8); }), roughness: 0.7 }));
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.032, H + 0.0016, D + 0.0016), band); b.position.y = H / 2; g.add(b);   // Banderole
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.name = "Geldbuendel"; g.userData.h = H; return g; }
function goldStempelTex() { return WS.tex.gold || (WS.tex.gold = canvasTex(256, 128, (c, w, h) => { c.fillStyle = "#e3b440"; c.fillRect(0, 0, w, h);
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "rgba(255,240,180,.5)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(120,80,10,.35)"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = "rgba(110,72,8,.75)"; c.textAlign = "center"; c.font = "bold 22px Georgia, serif"; c.fillText("GOTHAM REFINERY", w / 2, 38); c.font = "bold 30px Georgia, serif"; c.fillText("FINE GOLD 999.9", w / 2, 76); c.font = "16px Courier New, monospace"; c.fillText("1 KG · No 0" + (4800 + Math.floor(Math.random() * 999)), w / 2, 104);
  c.strokeStyle = "rgba(110,72,8,.55)"; c.lineWidth = 3; c.strokeRect(10, 8, w - 20, h - 16); })); }
function buildGoldbarren(gross = false) {
  const L = gross ? 0.25 : 0.12, B = gross ? 0.07 : 0.055, H = gross ? 0.042 : 0.026, k = 0.82;   // Grundflaeche L x B, oben k-fach kleiner
  const geo = new THREE.BufferGeometry(), v = [], idx = [], q = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sz] of q) v.push(sx * L / 2, 0, sz * B / 2); for (const [sx, sz] of q) v.push(sx * L / 2 * k, H, sz * B / 2 * k);
  const f = (a, b, c, d) => idx.push(a, c, b, a, d, c); f(0, 3, 2, 1); f(4, 5, 6, 7); f(0, 1, 5, 4); f(1, 2, 6, 5); f(2, 3, 7, 6); f(3, 0, 4, 7);   // Flaechen nach aussen
  geo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); geo.setIndex(idx); const ng = geo.toNonIndexed(); ng.computeVertexNormals();
  const gold = wsMat("gold", () => new THREE.MeshStandardMaterial({ color: 0xe6b84a, metalness: 0.35, roughness: 0.32, emissive: 0x3a2806 }));   // Gold wenig metallisch: ohne Umgebungsbild sonst fast schwarz
  const g = new THREE.Group(), m = new THREE.Mesh(ng, gold); g.add(m);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(L * k * 0.92, B * k * 0.86), wsMat("goldtop", () => new THREE.MeshStandardMaterial({ map: goldStempelTex(), metalness: 0.3, roughness: 0.35, emissive: 0x3a2806 }))); top.rotation.x = -Math.PI / 2; top.position.y = H + 0.0004; g.add(top);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.name = "Goldbarren"; g.userData.h = H; g.userData.L = L; g.userData.B = B; return g; }
// 3D in der Hand: Goldbarren (tresor.js HAND3D, laedt danach: ueber HAND3D_VOR)
{ const hv = typeof HAND3D_VOR !== "undefined" ? HAND3D_VOR : (window.HAND3D_VOR = {}); hv.goldbarren = () => { const g = new THREE.Group(), b = buildGoldbarren(false); b.scale.setScalar(1.3); b.rotation.set(0.9, -0.5, 0.1); g.add(b); return g; }; }
