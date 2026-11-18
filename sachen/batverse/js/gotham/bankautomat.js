// Batverse – Bankautomat als eigenes Modell (Nicolas 2026-11-16, PLAN-BANKAUTOMAT.md Schritt A4; Vorbild: Schraegbild von Nicolas, "noch zu blockig").
// Freistehend, vorne = -z, Boden y 0, ca. 0,92 x 0,8 x 2,35 m. Aufbau wie im Vorbild:
// - zwei blaue Seitenwangen (abgerundet, weisse Zierkante vorne), blaues Dach, darueber ein Schildkasten (grau, blaue Leuchtfront ATM, ragt seitlich etwas ueber)
// - oben eine Nische: graue Bildschirmplatte, ca. 20 Grad nach hinten geneigt, mit Bildschirm in dunklem Rahmen, je vier Seitentasten, links Karten- und Belegschlitz
// - schraeges dunkles Pult mit Tastenfeld (12 helle Tasten) und drei Farbtasten (rot, gelb, gruen)
// - unten Front mit weisser Rahmenkante und eingelassener Klappe, Ausgabeschacht
// Genutzt in der Werkstatt (aktuelles Umbauprojekt); im Spiel stehen noch die einfachen Saeulen aus gotham-orte.js.
"use strict";
// Bildschirm des Automaten = aktuelle Seite des Bankfensters (index.html #bank, style.css .atm*; Nicolas 2026-11-16 "genau diese Screens"): gleiche Koordinaten
// wie das HTML (640 x 504, Kopfzeile 62). Seite aus ATM (konto.js): start, betrag, ok; nach dem Schliessen haelt konto.js die letzte Seite ATM_HOLD ms.
const ATM_SCREENS = [], ATM_FONT = '"Segoe UI", Arial, sans-serif';
function atmScreenDraw(c, w, h) {
  const K = typeof KONTO !== "undefined" ? KONTO : null, A = typeof ATM !== "undefined" ? ATM : { page: "start" }, F = typeof atmFmt === "function" ? atmFmt : n => n + " $";
  c.save(); c.scale(w / 640, h / 504);
  const font = (wt, px) => c.font = wt + " " + px + "px " + ATM_FONT;
  const txt = (t, x, y, wt, px, col, al) => { font(wt, px); c.fillStyle = col || "#fff"; c.textAlign = al || "center"; c.fillText(t, x, y); };
  const rr = (x, y, bw, bh, r, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + bw, y, x + bw, y + bh, r); c.arcTo(x + bw, y + bh, x, y + bh, r); c.arcTo(x, y + bh, x, y, r); c.arcTo(x, y, x + bw, y, r); c.closePath(); c.fill(); };
  const btn = (x, y, bw, bh, col, t, px, off) => { c.globalAlpha = off ? 0.45 : 1; rr(x, y, bw, bh, 7, col); txt(t, x + bw / 2, y + bh / 2 + px * 0.36, "800", px); c.globalAlpha = 1; };
  c.textBaseline = "alphabetic";
  c.fillStyle = "#0b55d0"; c.fillRect(0, 0, 640, 504); c.fillStyle = "#093c99"; c.fillRect(0, 0, 640, 62);
  txt("ATM", 18, 41, "bold", 30, "#fff", "left");
  const rest = K && typeof kontoLimitRest === "function" ? kontoLimitRest() : 1, lim = typeof atmLimTxt === "function" ? atmLimTxt() : "0 $ / 10 000 $";
  for (const [l, v, col, x] of [["Einzahl-Limit (Woche)", lim, rest <= 0 ? "#ff4d4d" : "#fff", 150], ["Kontostand", F(K ? K.stand : 0), "#35d6ff", 380], ["Bargeld", F(K ? K.bar : 0), "#39f06a", 520]]) {
    txt(l, x, 23, "600", 13, "#fff", "left"); txt(v, x, 49, "bold", 21, col, "left"); }
  const Y = 62;
  if (A.page === "betrag") {
    const ok = typeof atmOk === "function" ? atmOk() : true, dep = A.mode === "ein";
    txt(dep ? "Betrag zum Einzahlen wählen" : "Betrag zum Abheben wählen", 320, Y + 93, "bold", 22);
    const fine = [["-100", 90], ["-10", 146], ["-1", 202], ["+1", 388], ["+10", 444], ["+100", 500]];
    for (const [t, x] of fine) { rr(x, Y + 120, 50, 36, 7, "#17c8f2"); txt(t, x + 25, Y + 145, "bold", 19); }
    rr(264, Y + 120, 112, 36, 18, "#0a3a96"); txt(F(A.amt), 320, Y + 145, "800", 20, ok ? "#fff" : "#ff8a7a");
    const q = [[20, 0, 0], [500, 1, 0], [50, 0, 1], [1000, 1, 1], [100, 0, 2], [5000, 1, 2]];
    for (const [v, col, row] of q) { const x = 80 + col * 248, y = Y + 186 + row * 56; rr(x, y, 232, 44, 7, "#17c8f2");
      if (v === A.amt) { c.strokeStyle = "#fff"; c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(x + 1.5, y + 1.5, 229, 41, 6) : c.rect(x + 1.5, y + 1.5, 229, 41); c.stroke(); }
      txt(F(v), x + 116, y + 29, "bold", 19); }
    btn(80, Y + 366, 232, 46, "#ff6533", "ABBRECHEN", 18); btn(328, Y + 366, 232, 46, "#1ee865", (dep ? "EINZAHLEN " : "ABHEBEN ") + F(A.amt), 18, !ok);
    const e = typeof atmErr === "function" ? atmErr() : ""; if (e) txt(e, 320, Y + 431, "600", 12, "#ffd0c8");
  } else if (A.page === "ok") {
    txt("Erfolgreich!", 320, Y + 103, "bold", 22); txt(A.msg || "", 320, Y + 128, "600", 14);
    c.fillStyle = "#0a3a96"; c.beginPath(); c.arc(320, Y + 190, 30, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#fff"; c.lineWidth = 5; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); c.moveTo(307, Y + 190); c.lineTo(316, Y + 199); c.lineTo(334, Y + 180); c.stroke();
    btn(96, Y + 300, 216, 46, "#17c8f2", "ZURÜCK ZUM MENÜ", 18); btn(328, Y + 300, 216, 46, "#1ee865", "FERTIG", 18);
  } else {
    font("bold", 24); const a1 = "Hallo, ", wa = c.measureText(a1).width; font("400", 24); const wb = c.measureText("Bruce").width, x0 = 320 - (wa + wb) / 2;
    txt(a1, x0, Y + 126, "bold", 24, "#fff", "left"); txt("Bruce", x0 + wa, Y + 126, "400", 24, "#fff", "left");
    txt("Was möchtest du tun?", 320, Y + 155, "600", 15);
    btn(192, Y + 180, 256, 50, "#b4bde8", "EINZAHLEN", 18, K && (K.bar <= 0 || rest <= 0)); txt("ODER", 320, Y + 258, "bold", 13); btn(192, Y + 275, 256, 50, "#1ee865", "ABHEBEN", 18, K && K.stand <= 0);
  }
  c.restore();
}
function atmScreenTex() { const t = canvasTex(640, 504, (c, w, h) => atmScreenDraw(c, w, h)); ATM_SCREENS.push(t); return t; }
function atmScreensUpdate() { for (const t of ATM_SCREENS) { const cv = t.image, cx = cv.getContext("2d"); cx.clearRect(0, 0, cv.width, cv.height); atmScreenDraw(cx, cv.width, cv.height); t.needsUpdate = true; } }
// o (optional, Jeton-Automat in jetons.js, Nicolas 2026-11-17: "Design lieber mehr Richtung Bankautomat, groesserer Bildschirm"): Farben { body, trim, panel, panelH, front },
// Schild { text, c0, c1, ink }, screen() = eigene Bildschirm-Textur (dann grosser Bildschirm ohne Seitentasten), extra(g, D) fuer Zusatzteile
// ---- Bankautomat aufbrechen (Nicolas 2026-11-18, N18: "beim Beschuss mit einer Waffe ca. 20 s ununterbrochen Geldscheine aus dem Schlitz (Animation), dazu eine zerstoerte 3D-Variante") ----
// Jeder Bankautomat (nicht der Jeton-Automat) steht in ATM_BRK.list. Treffer aus schusswaffen.js (atmShot) zaehlen Schaden; ab ATM_BRK.hp ist er zerstoert:
// Bildschirm gesprungen und dunkel, Schild aus, Geldklappe aufgerissen, Einschussloecher, Funken. Dann 20 s lang Geldscheine aus der Geldausgabe (flattern, bleiben liegen);
// darueberlaufen sammelt sie ein (je ATM_BRK.wert Bargeld). Nach ATM_BRK.heil s ist er wieder heil (Scheine am Boden verschwinden nach 2 min). Nicht gespeichert.
const ATM_BRK = { list: [], hp: 150, dauer: 20, rate: 12, wert: 50, heil: 180, notes: [], im: null, max: 700, sum: 0, sumT: 0 };
function atmRegister(g, screen, sign, cash, flap) { const A = { g, screen, sign, cash, flap, dmg: 0, broken: false, t: 0, emit: 0, box: null, holes: [] }; g.userData.atmBrk = A; ATM_BRK.list.push(A); g.traverse(o => { if (o.isMesh) o.userData.keep = true; }); return A; }
function atmBox(A) { if (!A.box) { A.g.updateMatrixWorld(true); A.box = new THREE.Box3().setFromObject(A.g).expandByScalar(0.4); } return A.box; }
let ATM_CRACK = null;
function atmCrackTex() { if (ATM_CRACK) return ATM_CRACK; ATM_CRACK = canvasTex(320, 252, (c, w, h) => { c.fillStyle = "#05070b"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(40,90,200,.35)"; c.fillRect(w * 0.55, h * 0.1, w * 0.4, h * 0.35);
  c.strokeStyle = "rgba(220,230,255,.75)"; c.lineWidth = 1.4; const cx = w * 0.42, cy = h * 0.46; let r = 7; for (let k = 0; k < 14; k++) { r = (r * 9301 + 49297) % 233280; const a = k / 14 * Math.PI * 2 + r / 233280, L = 60 + (r % 120);
    c.beginPath(); c.moveTo(cx, cy); let x = cx, y = cy; for (let s = 0; s < 4; s++) { x += Math.cos(a + (s % 2 ? 0.3 : -0.25)) * L / 4; y += Math.sin(a + (s % 2 ? 0.3 : -0.25)) * L / 4; c.lineTo(x, y); } c.stroke(); }
  for (const rr of [14, 30, 52]) { c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.stroke(); } c.fillStyle = "#000"; c.beginPath(); c.arc(cx, cy, 6, 0, Math.PI * 2); c.fill(); }); return ATM_CRACK; }
function atmShot(p, dmg) { for (const A of ATM_BRK.list) { if (A.broken || !atmBox(A).containsPoint(p)) continue; A.dmg += dmg || 10;
    if (A.holes.length < 12) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.012 + Math.random() * 0.008, 10), new THREE.MeshBasicMaterial({ color: 0x0a0a0a })); const l = A.g.worldToLocal(p.clone()); m.position.set(THREE.MathUtils.clamp(l.x, -0.38, 0.38), THREE.MathUtils.clamp(l.y, 0.1, 1.95), -0.415); m.rotation.y = Math.PI; A.g.add(m); A.holes.push(m); }   // Einschussloch an der Front
    if (A.dmg >= ATM_BRK.hp) atmBreak(A); return true; } return false; }
function atmBreak(A) { A.broken = true; A.t = 0; A.emit = 0; A.screen.userData.mat0 = A.screen.material; A.screen.material = new THREE.MeshBasicMaterial({ map: atmCrackTex() });
  if (A.sign) { A.sign.userData.mat0 = A.sign.material; A.sign.material = A.sign.material.clone(); A.sign.material.emissiveIntensity = 0.04; A.sign.material.color.setHex(0x555a66); }
  if (A.flap) { A.flap.userData.r0 = A.flap.rotation.x; A.flap.rotation.x = -1.1; A.flap.position.z -= 0.03; }   // Klappe der Geldausgabe aufgerissen
  if (typeof toast === "function") toast("Bankautomat aufgebrochen – Geld fliegt heraus!"); }
function atmRepair(A) { A.broken = false; A.dmg = 0; A.screen.material = A.screen.userData.mat0; if (A.sign) A.sign.material = A.sign.userData.mat0;
  if (A.flap) { A.flap.rotation.x = A.flap.userData.r0; A.flap.position.z += 0.03; } for (const m of A.holes) A.g.remove(m); A.holes = []; }
function atmBrokenNear(x, z, r = 3) { const v = new THREE.Vector3(); return ATM_BRK.list.some(A => { if (!A.broken) return false; A.g.getWorldPosition(v); return Math.hypot(v.x - x, v.z - z) < r; }); }
function atmNoteMesh() { if (ATM_BRK.im) return ATM_BRK.im; const tex = canvasTex(96, 42, (c, w, h) => { c.fillStyle = "#cfe3c4"; c.fillRect(0, 0, w, h); c.strokeStyle = "#3f6b3a"; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 4);
    c.fillStyle = "#3f6b3a"; c.beginPath(); c.ellipse(w / 2, h / 2, 11, 14, 0, 0, Math.PI * 2); c.fill(); c.font = "bold 14px Arial"; c.textAlign = "center"; c.fillText("50", 15, 17); c.fillText("50", w - 15, h - 8); });
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.156, 0.066), new THREE.MeshStandardMaterial({ map: typeof geldScheinTex === "function" ? geldScheinTex(50) : tex, side: THREE.DoubleSide, roughness: 0.9 }), ATM_BRK.max); im.count = 0; im.frustumCulled = false; im.userData.dynamic = true; scene.add(im); ATM_BRK.im = im; return im; }
const ATM_Q = new THREE.Quaternion(), ATM_E = new THREE.Euler(), ATM_M = new THREE.Matrix4(), ATM_S = new THREE.Vector3(1, 1, 1);
function atmBreakStep(dt) { const N = ATM_BRK.notes;
  for (const A of ATM_BRK.list) { if (!A.broken) continue; A.t += dt;
    if (A.t < ATM_BRK.dauer) { A.emit += dt * ATM_BRK.rate; A.g.updateMatrixWorld(true); const o = A.cash.getWorldPosition(new THREE.Vector3()), q = A.g.getWorldQuaternion(new THREE.Quaternion()), fw = new THREE.Vector3(0, 0, -1).applyQuaternion(q), sd = new THREE.Vector3(1, 0, 0).applyQuaternion(q), y0 = A.g.getWorldPosition(new THREE.Vector3()).y;
      while (A.emit >= 1) { A.emit--; if (N.length >= ATM_BRK.max) N.shift(); const sp = 1.6 + Math.random() * 2.2, s = (Math.random() - 0.5) * 1.6;
        N.push({ p: o.clone(), v: fw.clone().multiplyScalar(sp).addScaledVector(sd, s).add(new THREE.Vector3(0, 1 + Math.random() * 1.6, 0)), r: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), w: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 14), y0, rest: false, age: 0 }); }
      if (Math.random() < dt * 4 && typeof gunFx === "function") gunFx("spark", A.screen.getWorldPosition(new THREE.Vector3())); }
    if (A.t > ATM_BRK.heil) atmRepair(A); }
  if (!N.length) { if (ATM_BRK.im) ATM_BRK.im.count = 0; return; }
  const P = typeof player !== "undefined" && typeof walking !== "undefined" && walking ? player.pos : null; let got = 0;
  for (let i = N.length - 1; i >= 0; i--) { const n = N[i]; n.age += dt;
    if (!n.rest) { n.v.y -= 9.8 * dt; n.v.multiplyScalar(Math.max(0, 1 - 2.2 * dt)); if (n.v.y < -1.6) n.v.y = -1.6; n.p.addScaledVector(n.v, dt); n.r.addScaledVector(n.w, dt);   // flattert, faellt langsam
      if (n.p.y <= n.y0 + 0.01) { n.p.y = n.y0 + 0.004 + (i % 7) * 0.0012; n.rest = true; n.r.set(-Math.PI / 2, n.r.y, 0); } }
    if (P && n.age > 0.6 && Math.abs(n.p.x - P.x) < 1.2 && Math.abs(n.p.z - P.z) < 1.2 && n.p.y < P.y + 2) { N.splice(i, 1); got++; continue; }
    if (n.rest && n.age > 120) N.splice(i, 1); }
  if (got && typeof kontoBar === "function") { ATM_BRK.sum += got * ATM_BRK.wert; ATM_BRK.sumT = 0.6; kontoBar(got * ATM_BRK.wert); }
  if (ATM_BRK.sum && (ATM_BRK.sumT -= dt) <= 0) { if (typeof toast === "function") toast("Geldscheine aufgesammelt: +" + kontoFmt(ATM_BRK.sum) + " Bargeld"); ATM_BRK.sum = 0; }
  const im = atmNoteMesh(); for (let i = 0; i < N.length; i++) { const n = N[i]; ATM_E.set(n.r.x, n.r.y, n.r.z); ATM_Q.setFromEuler(ATM_E); ATM_M.compose(n.p, ATM_Q, ATM_S); im.setMatrixAt(i, ATM_M); } im.count = N.length; im.instanceMatrix.needsUpdate = true; }
function buildBankautomat(o = {}) {
  const F = o.farben || {};
  const g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.25, ...o });
  const add = (geo, m, x, y, z, rx = 0, ry = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  // abgerundeter Quader (Kanten r) aus einem Rechteck mit runden Ecken (w x h) und Fase in der Tiefe
  const rbox = (w, h, d, r) => { const s = new THREE.Shape(), a = w / 2 - r, b = h / 2 - r; s.moveTo(-a, -h / 2); s.lineTo(a, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -b); s.lineTo(w / 2, b); s.quadraticCurveTo(w / 2, h / 2, a, h / 2); s.lineTo(-a, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, b); s.lineTo(-w / 2, -b); s.quadraticCurveTo(-w / 2, -h / 2, -a, -h / 2);
    const e = Math.min(r * 0.6, d * 0.3), geo = new THREE.ExtrudeGeometry(s, { depth: d - 2 * e, bevelEnabled: true, bevelThickness: e, bevelSize: e, bevelSegments: 3, curveSegments: 6 }); geo.translate(0, 0, -(d - 2 * e) / 2); return geo; };
  const blau = M(F.body ?? 0x1f4fa3, { metalness: 0.4, roughness: 0.4 }), weiss = M(F.trim ?? 0xe9eef4, { roughness: 0.35, ...(F.trim ? { metalness: 1, roughness: 0.28, emissive: 0x3a2a08 } : {}) }), grau = M(F.panel ?? 0xa3a9b0), grauH = M(F.panelH ?? 0xc3c8ce), dunkel = M(0x2b3036), schwarz = M(0x111316);
  const W = 0.92, D = 0.8, H = 2.05, T = 0.08;                             // Breite, Tiefe, Hoehe der Wangen, Wandstaerke
  // Seitenwangen (Querschnitt in der Tiefe, rbox gedreht) mit weisser Zierkante vorne
  for (const s of [-1, 1]) { add(rbox(D, H, T, 0.04), blau, s * (W / 2 - T / 2), H / 2, 0, 0, Math.PI / 2);
    add(rbox(0.02, H - 0.08, 0.012, 0.005), weiss, s * (W / 2 - T / 2), H / 2, -D / 2 - 0.003, 0, 0); }
  add(rbox(W, T, D, 0.035), blau, 0, H - T / 2, 0);                         // Dach
  add(rbox(W - 0.04, 0.06, D - 0.02, 0.02), dunkel, 0, 0.03, 0);            // Sockel
  add(rbox(W - 0.04, H - 0.1, 0.04, 0.02), blau, 0, H / 2, D / 2 - 0.03);   // Rueckwand, ganz geschlossen (Nicolas 2026-11-16: "hinten schliessen")
  // Schildkasten: grau, ragt 3 cm seitlich ueber, vorne blaue Leuchtflaeche
  const sign = canvasTex(256, 72, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); const S = o.schild || {}; gr.addColorStop(0, S.c0 || "#3b98ff"); gr.addColorStop(1, S.c1 || "#1764d6"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = S.ink || "#fff"; c.font = "bold 46px Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(S.text || "ATM", w / 2, h / 2 + 2); });
  add(rbox(W + 0.06, 0.26, D * 0.7, 0.03), grauH, 0, H + 0.13, 0.02);
  const sf = add(new THREE.PlaneGeometry(W - 0.02, 0.2), M(0xffffff, { map: sign, emissive: 0xffffff, emissiveMap: sign, emissiveIntensity: 0.7, metalness: 0 }), 0, H + 0.13, 0.02 - D * 0.35 - 0.004); sf.rotation.y = Math.PI; sf.castShadow = false;
  // Nische oben (Nicolas 2026-11-16, Skizze: "innen schraeger, Anzeige leicht nach oben zeigend"): dunkle Rueckwand, davor eine graue Bildschirmplatte,
  // die vom Pult aus ca. 20 Grad nach hinten geneigt ist (Drehpunkt hinter dem Pult); darauf Bildschirm im Rahmen, je vier Seitentasten, Schlitze links
  const IW = W - 2 * T;                                                     // Innenbreite
  add(new THREE.BoxGeometry(IW, 0.95, 0.03), dunkel, 0, 1.55, 0.27);
  const panel = new THREE.Group(); panel.position.set(0, 1.1, -D / 2 + 0.24); panel.rotation.x = 0.36; g.add(panel);
  const Q = (geo, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; panel.add(o); return o; };
  Q(rbox(IW, 0.9, 0.05, 0.03), grau, 0, 0.45, 0.025);
  const big = !!o.screen, scr = big ? o.screen() : atmScreenTex();                                              // gleicher Aufbau wie die Startseite des Bankfensters (#bank, konto.js)
  const sw = big ? 0.62 : 0.46, sh = big ? 0.47 : 0.362, sy = big ? 0.5 : 0.57;   // eigener Bildschirm (Jeton-Automat) ueber fast die ganze Platte; Bankautomat 46 x 36 cm (N17: "Bildschirm groesser", vorher 34 x 27)
  Q(rbox(sw + (big ? 0.12 : 0.05), sh + (big ? 0.11 : 0.05), 0.04, 0.025), dunkel, 0, sy, -0.01);
  const scrM = Q(new THREE.PlaneGeometry(sw, sh), M(0xffffff, { map: scr, emissive: 0xffffff, emissiveMap: scr, emissiveIntensity: 0.6, metalness: 0 }), 0, sy, -0.032, Math.PI); scrM.castShadow = false; let cashP = null, flap = null;
  if (!big) for (const s of [-1, 1]) for (let k = 0; k < 4; k++) Q(rbox(0.035, 0.022, 0.015, 0.006), M(0xd7dbe0), s * (sw / 2 + 0.05), sy + 0.12 - k * 0.075, -0.025);   // Seitentasten
  if (!big) { // unter dem Bildschirm (Nicolas 2026-11-18, N17: "die zwei schwarzen Striche links neben dem Bildschirm sind falsch, gemeint sind Kartenschlitz und Geldausgabe … die Schlitze darunter"); von vorne gesehen links (+x) Karte, rechts Geld
    const yS = 0.2, licht = M(0x2bd65a, { emissive: 0x22c050, emissiveIntensity: 0.9 });
    Q(rbox(0.13, 0.075, 0.03, 0.012), dunkel, 0.2, yS, -0.02); Q(rbox(0.095, 0.012, 0.02, 0.004), schwarz, 0.2, yS + 0.008, -0.03); Q(rbox(0.06, 0.006, 0.01, 0.002), licht, 0.2, yS - 0.022, -0.036);   // Kartenschlitz mit gruener Leuchte
    Q(rbox(0.3, 0.09, 0.035, 0.015), dunkel, -0.09, yS, -0.022); Q(rbox(0.26, 0.032, 0.02, 0.008), schwarz, -0.09, yS + 0.004, -0.034); flap = Q(rbox(0.25, 0.012, 0.012, 0.004), M(0xb8bcc2, { metalness: 0.8, roughness: 0.3 }), -0.09, yS - 0.012, -0.041); cashP = new THREE.Object3D(); cashP.position.set(-0.09, yS + 0.004, -0.07); panel.add(cashP);   // Geldausgabe mit Klappe (cashP: dort kommen beim Aufbrechen die Scheine heraus)
    Q(rbox(0.08, 0.008, 0.012, 0.003), schwarz, 0.2, yS + 0.075, -0.012); }   // Belegschlitz ueber der Karte
  // schraeges Pult mit Tastenfeld und Farbtasten (neigt sich nach vorne unten, ca. 18 Grad)
  const tilt = -0.32, pult = new THREE.Group(); pult.position.set(0, 1.06, -D / 2 + 0.17); pult.rotation.x = tilt; g.add(pult);
  const P = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; pult.add(o); };
  P(rbox(IW, 0.04, 0.36, 0.015), dunkel, 0, 0, 0);
  const key = rbox(0.038, 0.014, 0.034, 0.006), keyM = M(0xeceff2, { roughness: 0.4 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) P(key, keyM, 0.03 - c * 0.046, 0.026, -0.08 + r * 0.042);
  [0xd8262b, 0xe9c22a, 0x29b34a].forEach((col, k) => P(rbox(0.05, 0.014, 0.034, 0.006), M(col, { roughness: 0.4 }), -0.12, 0.026, -0.08 + k * 0.042));
  // untere Front: Platte mit weisser Rahmenkante, eingelassene Klappe, Ausgabeschacht
  add(rbox(IW, 0.9, 0.04, 0.02), M(F.front ?? 0x8b9198), 0, 0.5, -D / 2 + 0.05);
  add(rbox(IW - 0.06, 0.02, 0.012, 0.005), weiss, 0, 0.94, -D / 2 + 0.028);
  add(rbox(IW - 0.18, 0.5, 0.02, 0.02), grauH, 0, 0.38, -D / 2 + 0.028);
  add(rbox(0.1, 0.015, 0.015, 0.005), schwarz, -0.18, 0.48, -D / 2 + 0.017);   // Griff
  if (o.screen) add(rbox(0.36, 0.05, 0.05, 0.015), schwarz, 0, 0.84, -D / 2 + 0.03);   // Ausgabeschacht (nur Jeton-Automat; beim Bankautomat jetzt unter dem Bildschirm)
  add(new THREE.BoxGeometry(IW, 0.02, D - 0.2), dunkel, 0, 0.95, 0.0);     // Boden der Nische hinter dem Pult
  if (o.extra) o.extra(g, D, IW);
  if (!big && cashP) atmRegister(g, scrM, sf, cashP, flap);   // aufbrechbar (N18)
  g.name = o.name || "Bankautomat"; return g;
}
