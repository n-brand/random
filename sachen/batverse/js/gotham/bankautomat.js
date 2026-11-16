// Batverse – Bankautomat als eigenes Modell (Nicolas 2026-11-16, PLAN-BANKAUTOMAT.md Schritt A4; erster Stand, wird dort ueberarbeitet).
// Freistehende Saeule: blauer Rahmen, leuchtendes ATM-Schild oben, graues Gehaeuse, blauer Bildschirm mit je vier Seitentasten, Kartenschlitz,
// Tastenfeld mit drei Farbtasten, Ausgabeschacht, untere Klappe. Vorne = -z, Boden y 0, ca. 0,9 x 0,75 x 2,25 m.
// Genutzt in der Werkstatt (aktuelles Umbauprojekt); im Spiel stehen noch die einfachen Saeulen aus gotham-orte.js.
"use strict";
function buildBankautomat() {
  const g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.2, ...o });
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  const blau = M(0x1d4f9e, { metalness: 0.35 }), grau = M(0x8d939a), dunkel = M(0x30353b), schwarz = M(0x121417);
  const W = 0.9, D = 0.75, H = 2.05;
  // Rahmen (blau) und Gehaeuse (grau)
  for (const s of [-1, 1]) box(0.07, H, D, blau, s * (W / 2 - 0.035), H / 2, 0);
  box(W, 0.08, D, blau, 0, 0.04, 0); box(W, 0.07, D, blau, 0, H - 0.035, 0);
  box(W - 0.14, H - 0.15, D - 0.06, grau, 0, H / 2, 0.02);
  // Oberteil schraeg nach hinten (Bildschirmbereich) und Schild
  const sign = canvasTex(256, 64, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#2f8cff"); gr.addColorStop(1, "#1556c8"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "bold 44px Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ATM", w / 2, h / 2 + 2); });
  box(W, 0.26, D * 0.62, M(0xffffff, { map: sign, emissive: 0xffffff, emissiveMap: sign, emissiveIntensity: 0.6, metalness: 0 }), 0, H + 0.13, -0.08);
  // Bildschirm mit Rahmen und Seitentasten
  const scr = canvasTex(256, 192, (c, w, h) => { c.fillStyle = "#0b4fc4"; c.fillRect(0, 0, w, h); c.fillStyle = "#083a94"; c.fillRect(0, 0, w, 30); c.fillStyle = "#fff"; c.font = "bold 20px Arial, sans-serif"; c.fillText("ATM", 10, 22);
    c.font = "bold 22px Arial, sans-serif"; c.textAlign = "center"; c.fillText("Hallo, Bruce", w / 2, 80); c.fillStyle = "#b9c2ea"; c.fillRect(58, 100, 140, 30); c.fillStyle = "#22e06a"; c.fillRect(58, 145, 140, 30); });
  box(0.62, 0.5, 0.06, dunkel, 0, 1.45, -D / 2 + 0.02);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), M(0xffffff, { map: scr, emissive: 0xffffff, emissiveMap: scr, emissiveIntensity: 0.55, metalness: 0 })); sc.position.set(0, 1.47, -D / 2 - 0.012); sc.rotation.y = Math.PI; g.add(sc);
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) box(0.06, 0.035, 0.02, grau, s * 0.255, 1.6 - k * 0.075, -D / 2 - 0.015);
  // Kartenschlitz, Tastenfeld mit Farbtasten, Ausgabeschacht, Klappe
  box(0.12, 0.03, 0.03, schwarz, 0.22, 1.12, -D / 2 - 0.005);
  box(0.36, 0.05, 0.22, dunkel, 0, 1.08, -D / 2 - 0.06);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) box(0.045, 0.012, 0.04, M(0xe6e8ea), -0.1 + c * 0.055, 1.112, -D / 2 - 0.12 + r * 0.05);
  [0xd8262b, 0xe9c22a, 0x29b34a].forEach((col, k) => box(0.06, 0.012, 0.04, M(col), 0.1, 1.112, -D / 2 - 0.12 + k * 0.05));
  box(0.4, 0.06, 0.05, schwarz, 0, 0.92, -D / 2 - 0.005);
  box(0.62, 0.55, 0.02, M(0x5d636a), 0, 0.45, -D / 2 - 0.0);
  box(0.08, 0.02, 0.02, schwarz, 0.2, 0.62, -D / 2 - 0.015);
  g.name = "Bankautomat"; return g;
}
