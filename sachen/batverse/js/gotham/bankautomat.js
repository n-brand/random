// Batverse – Bankautomat als eigenes Modell (Nicolas 2026-11-16, PLAN-BANKAUTOMAT.md Schritt A4; Vorbild: Schraegbild von Nicolas, "noch zu blockig").
// Freistehend, vorne = -z, Boden y 0, ca. 0,92 x 0,8 x 2,35 m. Aufbau wie im Vorbild:
// - zwei blaue Seitenwangen (abgerundet, weisse Zierkante vorne), blaues Dach, darueber ein Schildkasten (grau, blaue Leuchtfront ATM, ragt seitlich etwas ueber)
// - oben eine Nische: graue Bildschirmplatte, ca. 20 Grad nach hinten geneigt, mit Bildschirm in dunklem Rahmen, je vier Seitentasten, links Karten- und Belegschlitz
// - schraeges dunkles Pult mit Tastenfeld (12 helle Tasten) und drei Farbtasten (rot, gelb, gruen)
// - unten Front mit weisser Rahmenkante und eingelassener Klappe, Ausgabeschacht
// Genutzt in der Werkstatt (aktuelles Umbauprojekt); im Spiel stehen noch die einfachen Saeulen aus gotham-orte.js.
"use strict";
function buildBankautomat() {
  const g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.25, ...o });
  const add = (geo, m, x, y, z, rx = 0, ry = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  // abgerundeter Quader (Kanten r) aus einem Rechteck mit runden Ecken (w x h) und Fase in der Tiefe
  const rbox = (w, h, d, r) => { const s = new THREE.Shape(), a = w / 2 - r, b = h / 2 - r; s.moveTo(-a, -h / 2); s.lineTo(a, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -b); s.lineTo(w / 2, b); s.quadraticCurveTo(w / 2, h / 2, a, h / 2); s.lineTo(-a, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, b); s.lineTo(-w / 2, -b); s.quadraticCurveTo(-w / 2, -h / 2, -a, -h / 2);
    const e = Math.min(r * 0.6, d * 0.3), geo = new THREE.ExtrudeGeometry(s, { depth: d - 2 * e, bevelEnabled: true, bevelThickness: e, bevelSize: e, bevelSegments: 3, curveSegments: 6 }); geo.translate(0, 0, -(d - 2 * e) / 2); return geo; };
  const blau = M(0x1f4fa3, { metalness: 0.4, roughness: 0.4 }), weiss = M(0xe9eef4, { roughness: 0.35 }), grau = M(0xa3a9b0), grauH = M(0xc3c8ce), dunkel = M(0x2b3036), schwarz = M(0x111316);
  const W = 0.92, D = 0.8, H = 2.05, T = 0.08;                             // Breite, Tiefe, Hoehe der Wangen, Wandstaerke
  // Seitenwangen (Querschnitt in der Tiefe, rbox gedreht) mit weisser Zierkante vorne
  for (const s of [-1, 1]) { add(rbox(D, H, T, 0.04), blau, s * (W / 2 - T / 2), H / 2, 0, 0, Math.PI / 2);
    add(rbox(0.02, H - 0.08, 0.012, 0.005), weiss, s * (W / 2 - T / 2), H / 2, -D / 2 - 0.003, 0, 0); }
  add(rbox(W, T, D, 0.035), blau, 0, H - T / 2, 0);                         // Dach
  add(rbox(W - 0.04, 0.06, D - 0.02, 0.02), dunkel, 0, 0.03, 0);            // Sockel
  // Schildkasten: grau, ragt 3 cm seitlich ueber, vorne blaue Leuchtflaeche
  const sign = canvasTex(256, 72, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#3b98ff"); gr.addColorStop(1, "#1764d6"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "bold 46px Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ATM", w / 2, h / 2 + 2); });
  add(rbox(W + 0.06, 0.26, D * 0.7, 0.03), grauH, 0, H + 0.13, 0.02);
  const sf = add(new THREE.PlaneGeometry(W - 0.02, 0.2), M(0xffffff, { map: sign, emissive: 0xffffff, emissiveMap: sign, emissiveIntensity: 0.7, metalness: 0 }), 0, H + 0.13, 0.02 - D * 0.35 - 0.004); sf.rotation.y = Math.PI; sf.castShadow = false;
  // Nische oben (Nicolas 2026-11-16, Skizze: "innen schraeger, Anzeige leicht nach oben zeigend"): dunkle Rueckwand, davor eine graue Bildschirmplatte,
  // die vom Pult aus ca. 20 Grad nach hinten geneigt ist (Drehpunkt hinter dem Pult); darauf Bildschirm im Rahmen, je vier Seitentasten, Schlitze links
  const IW = W - 2 * T;                                                     // Innenbreite
  add(new THREE.BoxGeometry(IW, 0.95, 0.03), dunkel, 0, 1.55, 0.27);
  const panel = new THREE.Group(); panel.position.set(0, 1.1, -D / 2 + 0.24); panel.rotation.x = 0.36; g.add(panel);
  const Q = (geo, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; panel.add(o); return o; };
  Q(rbox(IW, 0.9, 0.05, 0.03), grau, 0, 0.45, 0.025);
  const scr = canvasTex(256, 192, (c, w, h) => { c.fillStyle = "#0d55d0"; c.fillRect(0, 0, w, h); c.fillStyle = "#0a3f9e"; c.fillRect(0, 0, w, 30); c.fillStyle = "#fff"; c.font = "bold 18px Arial, sans-serif"; c.fillText("ATM", 10, 21);
    c.textAlign = "center"; c.font = "bold 22px Arial, sans-serif"; c.fillText("Hallo, Bruce", w / 2, 78); c.fillStyle = "#b9c2ea"; c.fillRect(58, 98, 140, 30); c.fillStyle = "#22e06a"; c.fillRect(58, 142, 140, 30); });
  Q(rbox(0.46, 0.38, 0.04, 0.03), dunkel, 0, 0.5, -0.01);
  Q(new THREE.PlaneGeometry(0.34, 0.27), M(0xffffff, { map: scr, emissive: 0xffffff, emissiveMap: scr, emissiveIntensity: 0.6, metalness: 0 }), 0, 0.5, -0.032, Math.PI).castShadow = false;
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) Q(rbox(0.035, 0.022, 0.015, 0.006), M(0xd7dbe0), s * 0.195, 0.6 - k * 0.065, -0.025);
  for (const [y, w] of [[0.62, 0.09], [0.52, 0.07]]) Q(rbox(w, 0.022, 0.02, 0.008), schwarz, 0.3, y, -0.005);   // Karten- und Belegschlitz links (von vorne gesehen; vorne = -z, +x liegt links)
  // schraeges Pult mit Tastenfeld und Farbtasten (neigt sich nach vorne unten, ca. 18 Grad)
  const tilt = -0.32, pult = new THREE.Group(); pult.position.set(0, 1.06, -D / 2 + 0.17); pult.rotation.x = tilt; g.add(pult);
  const P = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; pult.add(o); };
  P(rbox(IW, 0.04, 0.36, 0.015), dunkel, 0, 0, 0);
  const key = rbox(0.038, 0.014, 0.034, 0.006), keyM = M(0xeceff2, { roughness: 0.4 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) P(key, keyM, 0.03 - c * 0.046, 0.026, -0.08 + r * 0.042);
  [0xd8262b, 0xe9c22a, 0x29b34a].forEach((col, k) => P(rbox(0.05, 0.014, 0.034, 0.006), M(col, { roughness: 0.4 }), -0.12, 0.026, -0.08 + k * 0.042));
  // untere Front: Platte mit weisser Rahmenkante, eingelassene Klappe, Ausgabeschacht
  add(rbox(IW, 0.9, 0.04, 0.02), M(0x8b9198), 0, 0.5, -D / 2 + 0.05);
  add(rbox(IW - 0.06, 0.02, 0.012, 0.005), weiss, 0, 0.94, -D / 2 + 0.028);
  add(rbox(IW - 0.18, 0.5, 0.02, 0.02), grauH, 0, 0.38, -D / 2 + 0.028);
  add(rbox(0.1, 0.015, 0.015, 0.005), schwarz, -0.18, 0.48, -D / 2 + 0.017);   // Griff
  add(rbox(0.36, 0.05, 0.05, 0.015), schwarz, 0, 0.84, -D / 2 + 0.03);       // Ausgabeschacht
  add(new THREE.BoxGeometry(IW, 0.02, D - 0.1), dunkel, 0, 0.95, 0.04);     // Boden der Nische hinter dem Pult
  g.name = "Bankautomat"; return g;
}
