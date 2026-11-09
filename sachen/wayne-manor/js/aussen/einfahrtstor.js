// Wayne Manor 3D – Einfahrtstor mit Mauern und Torhaus
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Tor an der Zufahrt (A6, versetzt in E4) =====================
const Bw = B;                                                             // Welt-Quader (im Torblock ist B lokal)
// Quer zur Zufahrt bei GATE_C (schraeg zum Anwesen, Skizze Nicolas 2026-11-08): Natursteinmauern beidseits (folgen dem Gelaende),
// zwei Pfeiler mit Laternen, zweifluegeliges Schmiedeeisentor (oeffnet nach innen/bergseitig, Rechtsklick oder E), kleines Torhaus aussen.
// Gebaut in einer gedrehten Gruppe (lokal: x = Fahrtrichtung nach aussen, z = quer); Kollision als Kreise, das Tor als kleine Quader.
// Nicolas 2026-11-09: als Bauteil fuer mehrere Tore (Einfahrtstor mit Torhaus, Westtor in der Grundstuecksmauer); wing = Laenge der Mauerstuecke je Seite
mat.gateLamp = new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: 0xffc870, emissiveIntensity: 0.15 + night * 2.6 });
function buildGate(C, U, name, gy, wing = 16, house = true) {
  const [GCX, GCZ] = C, [ux, uz] = U, toW = (lx, lz) => [GCX + lx * ux - lz * uz, GCZ + lx * uz + lz * ux], tH = (lx, lz) => terrainH(...toW(lx, lz));
  const GX = 0, zc = 0, OPEN = 4.0;
  const GG = new THREE.Group(); GG.position.set(GCX, 0, GCZ); GG.rotation.y = Math.atan2(-uz, ux); GG.userData.dynamic = true; world.add(GG);
  const GS = new THREE.Group(); GG.add(GS);                                                 // feste Teile (werden unten je Material zusammengefasst)
  const B = (x0, x1, y0, y1, z0, z1, m, solid, parent = GS, shadow = true) => Bw(x0, x1, y0, y1, z0, z1, m, false, parent, shadow);
  const ring = (lx, lz0, lz1, r, top) => { for (let z = lz0; z <= lz1 + 1e-6; z += Math.max(0.5, r)) circles.push([...toW(lx, z), r, top]); };
  const stoneM = M(0xffffff, { map: texClone(brickTex, 1 / 1.5, 1 / 1.5), roughness: 0.95 }), capM = M(0xbdb6a6, { roughness: 0.8 }), iron = M(0x1d1f22, { metalness: 0.6, roughness: 0.45 });
  for (const sd of [-1, 1]) for (let a = OPEN + 1.15; a < wing; a += 2) {                   // Mauern
    const za = zc + sd * a, zb = zc + sd * Math.min(wing, a + 2), z0 = Math.min(za, zb), z1 = Math.max(za, zb), g = tH(GX, (z0 + z1) / 2);
    B(GX - 0.35, GX + 0.35, Math.min(g, gy) - 0.8, g + 2.1, z0, z1, stoneM);
    B(GX - 0.45, GX + 0.45, g + 2.1, g + 2.3, z0 - 0.02, z1 + 0.02, capM, false);
    ring(GX, z0 + 0.25, z1 - 0.25, 0.45, g + 2.3);
  }
  for (const sd of [-1, 1]) {                                                              // Pfeiler mit Laterne
    const pz = zc + sd * (OPEN + 0.6);
    B(GX - 0.6, GX + 0.6, gy - 0.8, gy + 3.0, pz - 0.6, pz + 0.6, stoneM); circles.push([...toW(GX, pz), 0.85, gy + 3.3]);
    B(GX - 0.72, GX + 0.72, gy + 3.0, gy + 3.25, pz - 0.72, pz + 0.72, capM, false);
    B(GX - 0.16, GX + 0.16, gy + 3.25, gy + 3.36, pz - 0.16, pz + 0.16, iron, false);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.3), mat.gateLamp); lamp.position.set(GX, gy + 3.57, pz); GG.add(lamp);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.26, 4).rotateY(Math.PI / 4), iron); hat.position.set(GX, gy + 3.91, pz); GS.add(hat);
  }
  const g = GG;
  const leaves = [];
  for (const sd of [-1, 1]) {                                                              // Fluegel: Drehpunkt am Pfeiler, reicht bis zur Mitte
    const piv = new THREE.Group(); piv.position.set(GX, gy, zc + sd * OPEN); g.add(piv);
    const W = OPEN - 0.04, zA = 0, zB = -sd * W, zl = Math.min(zA, zB), zh = Math.max(zA, zB);
    const add = (x0, x1, y0, y1, z0, z1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), iron); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = true; piv.add(m); };
    add(-0.04, 0.04, 0.12, 0.2, zl, zh); add(-0.04, 0.04, 1.05, 1.11, zl, zh); add(-0.035, 0.035, 0.45, 0.5, zl, zh);
    add(-0.06, 0.06, 0.05, 2.5, zA - 0.06, zA + 0.06); add(-0.05, 0.05, 0.05, 2.75, zB - 0.05, zB + 0.05);
    for (let k = 1; k < 28; k++) {
      const u = k / 28, z = lerp(zA, zB, u), top = 2.25 + 0.45 * u * u;                  // zur Mitte hin hoeher (Bogen)
      add(-0.017, 0.017, 0.12, top, z - 0.017, z + 0.017);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 4), iron); tip.position.set(0, top + 0.07, z); piv.add(tip);
    }
    for (let k = 0; k < 7; k++) { const u = (k + 0.5) / 7, z = lerp(zA, zB, u); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 6, 16).rotateY(Math.PI / 2), iron); ring.position.set(0, 0.78, z); piv.add(ring); }
    leaves.push({ piv, sd });
  }
  // Torfluegel-Kollision: kleine Quader entlang der Torlinie (gedreht geht kein einzelner Quader), schalten gemeinsam
  const gateBoxes = []; for (let z = -OPEN; z <= OPEN + 1e-6; z += 0.4) { const [x, zz] = toW(0, z); gateBoxes.push(S(x - 0.2, x + 0.2, gy - 0.5, gy + 2.9, zz - 0.2, zz + 0.2)); }
  const solid = { set on(v) { for (const b of gateBoxes) b.on = v; }, get on() { return gateBoxes[0].on; } };
  gates.push({ name, g, open: 0, target: 0, solid, a: toW(GX, zc - OPEN), b: toW(GX, zc + OPEN), anim: f => { for (const L of leaves) L.piv.rotation.y = L.sd * f * 1.7; } });
  // Torhaus aussen, links der Zufahrt (von innen gesehen); Tuer zur Strasse, Fenster zum Tor und nach hinten (lokal gebaut)
  if (house) {
  const hx0 = 2.2, hx1 = 6.4, hz1 = zc - OPEN - 4.6, hz0 = hz1 - 4.4, T = 0.4;
  const hg = Math.max(...[[hx0, hz0], [hx1, hz0], [hx0, hz1], [hx1, hz1]].map(([x, z]) => tH(x, z))), fy = hg + 0.2, top = fy + 2.8, xm = (hx0 + hx1) / 2, zm = (hz0 + hz1) / 2;
  B(hx0 - 0.15, hx1 + 0.15, hg - 1.2, fy, hz0 - 0.15, hz1 + 0.15, capM);
  B(hx0, xm - 0.55, fy, top, hz1 - T, hz1, stoneM); B(xm + 0.55, hx1, fy, top, hz1 - T, hz1, stoneM); B(xm - 0.55, xm + 0.55, fy + 2.15, top, hz1 - T, hz1, stoneM);   // Strassenseite mit Tuer
  B(hx0, xm - 0.7, fy, top, hz0, hz0 + T, stoneM); B(xm + 0.7, hx1, fy, top, hz0, hz0 + T, stoneM); B(xm - 0.7, xm + 0.7, fy, fy + 1.0, hz0, hz0 + T, stoneM); B(xm - 0.7, xm + 0.7, fy + 1.9, top, hz0, hz0 + T, stoneM);   // hinten mit Fenster
  B(hx0, hx0 + T, fy, top, hz0 + T, zm - 0.7, stoneM); B(hx0, hx0 + T, fy, top, zm + 0.7, hz1 - T, stoneM); B(hx0, hx0 + T, fy, fy + 1.0, zm - 0.7, zm + 0.7, stoneM); B(hx0, hx0 + T, fy + 1.9, top, zm - 0.7, zm + 0.7, stoneM);   // zum Tor mit Fenster
  B(hx1 - T, hx1, fy, top, hz0 + T, hz1 - T, stoneM);
  for (const [x0, x1, z0, z1] of [[xm - 0.7, xm + 0.7, hz0 + 0.18, hz0 + 0.22], [hx0 + 0.18, hx0 + 0.22, zm - 0.7, zm + 0.7]]) B(x0, x1, fy + 1.0, fy + 1.9, z0, z1, mat.glass, false, GS, false);
  B(hx0, hx1, top, top + 0.15, hz0, hz1, capM, false);
  { const s = new THREE.Shape(), over = 0.35, rise = 1.7; s.moveTo(hz0 - over, 0); s.lineTo(hz1 + over, 0); s.lineTo((hz0 + hz1) / 2, rise); s.closePath();
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: hx1 - hx0 + 2 * over, bevelEnabled: false }), mat.slate); roof.rotation.y = -Math.PI / 2; roof.position.set(hx1 + over, top + 0.15, 0); roof.castShadow = true; GS.add(roof); }
  for (let x = hx0 + 0.6; x <= hx1 - 0.5; x += 1.0) for (let z = hz0 + 0.6; z <= hz1 - 0.5; z += 1.0) circles.push([...toW(x, z), 0.75, top]);   // Torhaus fest (innen nicht begehbar)
  const dl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), mat.gateLamp); dl.position.set(xm + 0.9, fy + 2.45, hz1 + 0.15); GG.add(dl);
  }
  // feste Teile je Material zu einem Netz zusammenfassen (die Gruppe ist "dynamisch" wegen der Fluegel und wird sonst nicht zusammengefasst)
  { GS.updateMatrix(); const byMat = new Map(); GS.children.forEach(o => { o.updateMatrix(); const gg = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); gg.applyMatrix4(o.matrix); for (const k of Object.keys(gg.attributes)) if (!["position", "normal", "uv"].includes(k)) gg.deleteAttribute(k); if (!gg.attributes.uv) gg.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2)); if (!byMat.has(o.material)) byMat.set(o.material, []); byMat.get(o.material).push(gg); });
    GS.clear(); for (const [m, list] of byMat) { const mm = new THREE.Mesh(mergeGeometries(list, false), m); mm.castShadow = mm.receiveShadow = true; GS.add(mm); } }
}
buildGate(GATE_C, GATE_U, "Einfahrtstor", ZUF.y(roadNear(ZUF, GATE_C[0], GATE_C[1], 6).s) + 0.12);
