// Wayne Manor 3D – Batcave-Ausbau bei der Medical Bay: Batcomputer auf einem Podest, Anzug-Vitrinen, Riesenmuenze, Licht
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Nicolas 2026-11-08: "beim Medizin-Dings kann die Batcave ordentlich ausgebaut werden". Die Hoehle ist dafuer nach Westen
// (x -64..-47, z -24..11) und Norden (x -49..-24, z -29..-17) erweitert (caveCell in hoehle-unten.js).
{
  const steel = M(0x2a2d33, { metalness: 0.6, roughness: 0.4 }), dark = M(0x15171b, { roughness: 0.6, metalness: 0.3 });
  const edge = M(0x3a8fd8, { emissive: 0x2a7fd0, emissiveIntensity: 1.2 });
  // ---- Batcomputer: Podest an der Westwand, Bildschirmwand im Halbkreis, Pult, Sessel ----
  const PX = -61.0, PZ = -6, top = LY + 0.6;                                  // Hoehlenraster beginnt bei x -62 (Westwand dort)
  B(PX, PX + 7.5, LY, top, PZ - 8, PZ + 8, steel);                                        // Podest
  for (let k = 0; k < 3; k++) B(PX + 7.5 + k * 0.4, PX + 7.9 + k * 0.4, LY, top - (k + 1) * 0.2, PZ - 2.5, PZ + 2.5, steel);   // drei Stufen nach Osten
  B(PX + 7.4, PX + 7.5, top, top + 0.03, PZ - 8, PZ + 8, edge, false);                     // Leuchtkante
  const screenTex = seed => canvasTex(256, 160, (g, w, h) => {
    const r = rng(seed), bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#0e4a78"); bg.addColorStop(1, "#072a46"); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = "#5fd0ff"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    g.strokeStyle = "rgba(120,200,255,.35)"; g.lineWidth = 1; for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    const kind = seed % 4;
    if (kind === 0) { g.strokeStyle = "#9ff0ff"; g.lineWidth = 4; g.beginPath(); for (let x = 0; x < w; x += 4) g.lineTo(x, h / 2 + Math.sin(x / 14 + seed) * 30 * r()); g.stroke(); }
    else if (kind === 1) { for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(110,${190 + r() * 60},255,.95)`; const bh = r() * h * 0.8; g.fillRect(12 + i * 17, h - bh - 8, 11, bh); } }
    else if (kind === 2) { g.strokeStyle = "#8ff7b0"; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w / 2, h / 2, 12 + i * 12, 0, 7); g.stroke(); } g.fillStyle = "#ff5a4a"; g.beginPath(); g.arc(w / 2 + 30, h / 2 - 20, 5, 0, 7); g.fill(); }
    else { g.fillStyle = "#d8f4ff"; g.font = "bold 22px monospace"; for (let i = 0; i < 6; i++) g.fillText(Array.from({ length: 16 }, () => "0123456789ABCDEF"[Math.floor(r() * 16)]).join(""), 14, 30 + i * 24); }
  });
  for (let k = -3; k <= 3; k++) {                                                          // sieben Bildschirme im Bogen, Mitte gross
    const a = k * 0.27, R = 7.2, cx = PX + 7.6 - Math.cos(a) * R, cz = PZ + Math.sin(a) * R, big = k === 0;
    const w = big ? 5.2 : 3.0, h = big ? 2.9 : 1.75, y = top + (big ? 2.5 : (Math.abs(k) % 2 ? 1.9 : 3.9));
    const t = screenTex(11 + k * 7); t.repeat.set(1, 1);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); scr.position.set(cx + Math.cos(a) * 0.06, y, cz - Math.sin(a) * 0.06); scr.rotation.y = Math.PI / 2 + a; scr.userData.keep = true; world.add(scr);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.1, h + 0.12, w + 0.12), dark); fr.position.set(cx, y, cz); fr.rotation.y = a; world.add(fr);
  }
  B(PX + 0.05, PX + 0.3, top, top + 3.8, PZ - 1.0, PZ + 1.0, dark);                         // Traeger hinter der Bildschirmwand
  B(PX + 3.4, PX + 4.2, top, top + 0.85, PZ - 3.2, PZ + 3.2, dark);                        // Pult
  B(PX + 3.38, PX + 4.22, top + 0.85, top + 0.9, PZ - 3.2, PZ + 3.2, edge, false);
  cyl(0.45, 0.45, 0.5, M(0x111111, { roughness: 0.8 }), PX + 5.3, top + 0.45, PZ, world, 16); circles.push([PX + 5.3, PZ, 0.5, top + 1.2]);   // Sessel
  B(PX + 5.6, PX + 5.75, top + 0.5, top + 1.4, PZ - 0.45, PZ + 0.45, M(0x111111, { roughness: 0.8 }), false);
  // ---- Anzug-Vitrinen an der Nordwand ----
  const glassV = M(0xbfe3f2, { transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1 }), suit = M(0x1b1d22, { roughness: 0.55, metalness: 0.2, flatShading: true });
  for (const x of [-46, -41.5, -37, -32.5]) {
    const z = -27.3;
    B(x - 0.9, x + 0.9, LY, LY + 0.35, z - 0.9, z + 0.9, steel);                           // Sockel
    B(x - 0.85, x + 0.85, LY + 0.35, LY + 3.0, z - 0.85, z + 0.85, glassV, false);          // Glas
    B(x - 0.9, x + 0.9, LY + 3.0, LY + 3.15, z - 0.9, z + 0.9, steel, false);
    B(x - 0.5, x + 0.5, LY + 3.0, LY + 3.03, z - 0.5, z + 0.5, M(0xffffff, { emissive: 0xfff2d0, emissiveIntensity: 1.5 }), false);   // Licht oben
    // Anzug: Beine, Rumpf, Arme, Kopf mit spitzen Ohren, Umhang
    for (const sd of [-1, 1]) { B(x + sd * 0.12 - 0.09, x + sd * 0.12 + 0.09, LY + 0.35, LY + 1.25, z - 0.1, z + 0.1, suit, false); B(x + sd * 0.33 - 0.07, x + sd * 0.33 + 0.07, LY + 1.35, LY + 2.05, z - 0.08, z + 0.08, suit, false); }
    B(x - 0.27, x + 0.27, LY + 1.25, LY + 2.1, z - 0.15, z + 0.15, suit, false);
    B(x - 0.12, x + 0.12, LY + 2.12, LY + 2.42, z - 0.12, z + 0.12, suit, false);
    for (const sd of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 4), suit); ear.position.set(x + sd * 0.08, LY + 2.49, z); world.add(ear); }
    B(x - 0.34, x + 0.34, LY + 0.5, LY + 2.05, z - 0.2, z - 0.17, M(0x0c0d10, { roughness: 0.9 }), false);   // Umhang (Rueckseite)
    circles.push([x, z, 1.0, LY + 3.2]);
  }
  // ---- Trophaee: Riesenmuenze auf einem Staender (westlicher Teil) ----
  { const x = -60.5, z = 6.5, coin = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.4, 48).rotateZ(Math.PI / 2), M(0xb87333, { metalness: 0.85, roughness: 0.35 }));
    coin.position.set(x, LY + 2.9, z); coin.rotation.y = 0.35; coin.castShadow = true; world.add(coin);
    B(x - 0.7, x + 0.7, LY, LY + 0.5, z - 1.4, z + 1.4, steel);
    for (let k = -2; k <= 2; k++) circles.push([x + Math.sin(0.35) * k * 0.9, z + Math.cos(0.35) * k * 0.9, 0.5, LY + 5.4]); }
  // ---- Licht ----
  for (const [x, z, I] of [[-58, -6, 45], [-39, -24, 40], [-57, 6, 30]]) { const l = new THREE.PointLight(0xdfe9ff, 0, 30, 1.6); l.position.set(x, LY + 6, z); l.userData.I = I; scene.add(l); caveLights.push(l); }
}
