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
  const sw = big ? 0.62 : 0.34, sh = big ? 0.47 : 0.27;   // eigener Bildschirm (Jeton-Automat) ueber fast die ganze Platte
  Q(rbox(sw + 0.12, sh + 0.11, 0.04, 0.03), dunkel, 0, 0.5, -0.01);
  Q(new THREE.PlaneGeometry(sw, sh), M(0xffffff, { map: scr, emissive: 0xffffff, emissiveMap: scr, emissiveIntensity: 0.6, metalness: 0 }), 0, 0.5, -0.032, Math.PI).castShadow = false;
  if (!big) for (const s of [-1, 1]) for (let k = 0; k < 4; k++) Q(rbox(0.035, 0.022, 0.015, 0.006), M(0xd7dbe0), s * 0.195, 0.6 - k * 0.065, -0.025);
  if (!big) for (const [y, w] of [[0.62, 0.09], [0.52, 0.07]]) Q(rbox(w, 0.022, 0.02, 0.008), schwarz, 0.3, y, -0.005);   // Karten- und Belegschlitz links (von vorne gesehen; vorne = -z, +x liegt links)
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
  add(rbox(0.36, 0.05, 0.05, 0.015), schwarz, 0, 0.84, -D / 2 + 0.03);       // Ausgabeschacht
  add(new THREE.BoxGeometry(IW, 0.02, D - 0.2), dunkel, 0, 0.95, 0.0);     // Boden der Nische hinter dem Pult
  if (o.extra) o.extra(g, D, IW);
  g.name = o.name || "Bankautomat"; return g;
}
