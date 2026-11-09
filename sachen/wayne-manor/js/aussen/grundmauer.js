// Wayne Manor 3D – Grundstuecksmauer mit Westtor und zwei Luecken
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Grundstuecksmauer (Nicolas 2026-11-09) =====================
// Natursteinmauer wie am Einfahrtstor (ca. 2,4 m, folgt dem Gelaende) entlang WALL_LINES (Verlauf in strassen/hauptstrasse.js), Kollision als Kreise
// mit Hoehe. Westtor wie das Einfahrtstor (ohne Torhaus). Luecke Nord: eingestuerzte Stelle mit Schutt, Luecke West: umgestuerzter Baum hat die
// Mauer eingedrueckt (man klettert ueber den Stamm). Neben den Luecken ist die Mauer abgebroeckelt (niedriger).
{
  const stoneM = M(0xffffff, { map: texClone(brickTex, 1 / 1.5, 1 / 1.5), roughness: 0.95 }), capM = M(0xbdb6a6, { roughness: 0.8 });
  const barkM = M(0x4a3626, { roughness: 0.95, flatShading: true }), rootM = M(0x6a5038, { roughness: 1, flatShading: true }), leafM = M(0x2f5a2a, { roughness: 0.9, flatShading: true });
  const parts = new Map(), add = (geo, m) => { if (!parts.has(m)) parts.set(m, []); parts.get(m).push(geo); };
  const G2 = WALL_GATE2, gapD = (x, z) => Math.min(...WALL_GAPS.map(G => Math.hypot(x - G.x, z - G.z)));
  // Westtor: Fahrtrichtung nach aussen = Normale zur Mauer am Tor, weg von der Anwesensmitte
  { const L = WALL_LINES[0], a = L[L.length - 4], b = WALL_LINES[1][3]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    let ux = dz, uz = -dx; if (ux * (G2[0] + 25) + uz * (G2[1] - 30) < 0) { ux = -ux; uz = -uz; }
    buildGate(G2, [ux, uz], "Westtor", terrainH(G2[0], G2[1]) + 0.12, 5.6, false); }
  for (const L of WALL_LINES) {
    let s = 0;
    for (let i = 0; i < L.length - 1; i++) {
      const [ax, az] = L[i], [bx, bz] = L[i + 1], len = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2; s += len;
      if (Math.hypot(mx - G2[0], mz - G2[1]) < 5.6) continue;                // Westtor (eigene Mauerstuecke)
      const gd = gapD(mx, mz); if (gd < 2.4) continue;                       // Luecke
      const ga = terrainH(ax, az), gb = terrainH(bx, bz), base = Math.min(ga, gb) - 0.8, crumble = gd < 7 ? (7 - gd) / 4.6 * 1.5 : 0;
      const top = (ga + gb) / 2 + 2.1 - crumble - (crumble ? 0.25 * Math.sin(i * 2.7) : 0), ang = Math.atan2(-(bz - az), bx - ax);
      const box = (w, y0, y1, m, s0) => { const g = new THREE.BoxGeometry(len + 0.08, y1 - y0, w).toNonIndexed(), P = g.attributes.position, U = g.attributes.uv;
        for (let k = 0; k < P.count; k++) U.setXY(k, (s0 + P.getX(k)) + (P.getZ(k) * 0.7), (P.getY(k) + (y0 + y1) / 2));   // UV in Metern
        g.rotateY(ang).translate(mx, (y0 + y1) / 2, mz); add(g, m); };
      box(0.7, base, top, stoneM, s);
      if (!crumble) box(0.9, top, top + 0.2, capM, s);                         // Abdeckung (fehlt an den abgebroeckelten Stuecken)
      for (let t = 0; t <= 1; t += 0.34) circles.push([ax + (bx - ax) * t, az + (bz - az) * t, 0.45, top + (crumble ? 0 : 0.2)]);
    }
  }
  // Luecken: Schutt (Nord) und umgestuerzter Baum (West)
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const G of WALL_GAPS) {
    const gy = terrainH(G.x, G.z);
    for (let k = 0; k < (G.kind === "ruin" ? 16 : 7); k++) {                  // Steine verstreut, flach im Boden (keine Kollision)
      const a = rnd() * 6.28, r = 0.6 + rnd() * 4, x = G.x + Math.cos(a) * r, z = G.z + Math.sin(a) * r, sz = 0.18 + rnd() * 0.32;
      const g = new THREE.DodecahedronGeometry(sz, 0).toNonIndexed(); g.scale(1.3, 0.7, 1); g.rotateY(rnd() * 3).translate(x, terrainH(x, z) + sz * 0.3, z); add(g, k % 3 ? stoneM : capM);
    }
    if (G.kind !== "tree") continue;
    // Stamm quer durch die Luecke (ca. 35 Grad zur Mauer), Wurzelteller draussen hochgestellt, Krone innen am Boden
    const L = WALL_LINES[0]; let bi = 0, bd = 1e9; L.forEach(([x, z], i) => { const d = Math.hypot(x - G.x, z - G.z); if (d < bd) { bd = d; bi = i; } });
    const [p, q] = [L[Math.max(0, bi - 1)], L[Math.min(L.length - 1, bi + 1)]], wa = Math.atan2(q[1] - p[1], q[0] - p[0]), ta = wa + 0.6;
    const dir = [Math.cos(ta), Math.sin(ta)]; let out = [dir[1], -dir[0]]; if (out[0] * (G.x + 25) + out[1] * (G.z - 30) < 0) out = [-out[0], -out[1]];
    const sgn = Math.sign(dir[0] * out[0] + dir[1] * out[1]) || 1, root = [G.x + dir[0] * 5 * sgn, G.z + dir[1] * 5 * sgn], tip = [G.x - dir[0] * 6 * sgn, G.z - dir[1] * 6 * sgn];
    const ry = terrainH(...root) + 1.0, ty = terrainH(...tip) + 0.35, A = new THREE.Vector3(root[0], ry, root[1]), Bv = new THREE.Vector3(tip[0], ty, tip[1]), mid = A.clone().add(Bv).multiplyScalar(0.5), axis = Bv.clone().sub(A);
    const trunk = new THREE.CylinderGeometry(0.22, 0.38, axis.length(), 10, 1).toNonIndexed(); trunk.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), axis.clone().normalize())); trunk.translate(mid.x, mid.y, mid.z); add(trunk, barkM);
    const disc = new THREE.CylinderGeometry(1.35, 1.2, 0.45, 9).toNonIndexed(); disc.rotateX(Math.PI / 2).rotateY(Math.atan2(axis.x, axis.z)).translate(A.x, A.y + 0.25, A.z); add(disc, rootM);
    for (let k = 0; k < 5; k++) { const u = 0.55 + k * 0.1, c = A.clone().lerp(Bv, u), side = k % 2 ? 1 : -1;                       // Aeste
      const br = new THREE.CylinderGeometry(0.05, 0.1, 2.2, 6).toNonIndexed(); br.rotateZ(side * 1.0).rotateY(-ta).translate(c.x, c.y + 0.5, c.z); add(br, barkM); }
    for (let k = 0; k < 6; k++) { const c = A.clone().lerp(Bv, 0.7 + rnd() * 0.35), s = 0.9 + rnd() * 0.8;                       // Krone (welkes Laub)
      const lf = new THREE.IcosahedronGeometry(s, 0).toNonIndexed(); lf.scale(1, 0.6, 1).translate(c.x + (rnd() - 0.5) * 2.4, c.y + 0.4, c.z + (rnd() - 0.5) * 2.4); add(lf, leafM); }
  }
  for (const [m, list] of parts) { for (const g of list) for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    for (const g of list) if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    const mesh = new THREE.Mesh(mergeGeometries(list, false), m); mesh.castShadow = mesh.receiveShadow = true; mesh.userData.noLift = true; mesh.userData.dynamic = true; scene.add(mesh); }
}
