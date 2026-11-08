// Wayne Manor 3D – Felsgenerator makeRock (Passstrasse, Wasserfall)
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Felsgenerator (gemeinsam fuer Passstrasse und Wasserfall): makeRock(sx, sy, sz, seed, detail) -> Geometrie mit Vertexfarben
const rockR = rng(4243);
  const n3 = (x, y, z) => (vnoise(x + z * 0.71, y + z * 0.37) + vnoise(y * 1.13 + 7.1 + x * 0.21, z - x * 0.29 + 3.3)) / 2;
  const fbm3 = (x, y, z) => n3(x, y, z) * 0.55 + n3(x * 2.03 + 5, y * 2.03 + 1, z * 2.03 + 9) * 0.3 + n3(x * 4.1 + 2, y * 4.1 + 7, z * 4.1 + 3) * 0.15;
  const TONES = [0x8d8a84, 0x6c6964, 0x7f6f5d, 0xa59b88, 0x77736b].map(h => new THREE.Color(h));
  const cMoss = new THREE.Color(0x5b6a3c), cLichen = new THREE.Color(0xb7b29a), tmpC = new THREE.Color();
  function makeRock(sx, sy, sz, seed, detail = 4) {
    let g = new THREE.IcosahedronGeometry(1, detail);
    g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = mergeVertices(g);
    const P = g.attributes.position, a = seed * 7.31, tone = TONES[Math.floor(seed * 13.7) % TONES.length];
    // Bruchflaechen: 3-5 Ebenen schneiden die Form ab (Felsabbrueche)
    const cuts = []; for (let k = 0, n = 4 + Math.floor(rockR() * 3); k < n; k++) { const t = rockR() * 6.28, p = (rockR() - 0.35) * 1.2; cuts.push([Math.cos(t) * Math.cos(p), Math.sin(p) * 0.6, Math.sin(t) * Math.cos(p), 0.5 + rockR() * 0.28]); }
    const dip = (rockR() - 0.5) * 0.5;                                          // Schichten leicht geneigt
    const lay = [], crk = [];
    for (let i = 0; i < P.count; i++) {
      let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      // Kugel -> abgerundeter Block (massiger, kantiger Fels)
      const blk = v => Math.sign(v) * Math.pow(Math.abs(v), 0.45);
      const bl = Math.hypot(blk(x), blk(y), blk(z)); x = blk(x) / bl * 1.25; y = blk(y) / bl * 1.25; z = blk(z) / bl * 1.25;
      const ln = Math.hypot(x, y, z); x /= ln; y /= ln; z /= ln;
      let r = ln * (1 + 0.32 * (fbm3(x * 1.3 + a, y * 1.3, z * 1.3 - a) - 0.5) + 0.14 * (n3(x * 3.2 + a, y * 3.2, z * 3.2) - 0.5));
      const ly = (y + dip * x) * sy * 1.1 + 0.5 * n3(x + a, y, z), f = ly - Math.floor(ly); const ledge = sst(0.7, 0.95, f); r *= 1 - 0.1 * ledge;   // Schichten
      const ang = Math.atan2(z, x), cr = Math.pow(1 - Math.abs(Math.sin(ang * 4 + y * 2 + 3 * n3(x * 2 + a, y * 2, z * 2))), 12); r *= 1 - 0.07 * cr;   // senkrechte Risse
      if (y > 0.5) r *= lerp(1, 0.84, sst(0.5, 1, y));                      // flachere Oberseite
      x *= r; y *= r; z *= r;
      for (const [cx, cy, cz, o] of cuts) { const dd = x * cx + y * cy + z * cz; if (dd > o) { const k = (dd - o) * 0.9; x -= cx * k; y -= cy * k; z -= cz * k; } }
      P.setXYZ(i, x * sx, y * sy, z * sz); lay.push(ledge); crk.push(cr);
    }
    g.computeVertexNormals();
    const N = g.attributes.normal, col = new Float32Array(P.count * 3), uv = new Float32Array(P.count * 2);
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), ny = N.getY(i), nn = n3(x * 0.5 + a, y * 0.5, z * 0.5), sp = n3(x * 2.5, y * 2.5 + a, z * 2.5);
      tmpC.copy(tone).multiplyScalar(0.8 + 0.34 * nn - 0.18 * lay[i] - 0.3 * crk[i]);
      if (sp > 0.72) tmpC.lerp(cLichen, 0.3);
      if (ny > 0.5) tmpC.lerp(cMoss, sst(0.5, 0.9, ny) * sst(0.5, 0.75, nn) * 0.55);
      col.set([tmpC.r, tmpC.g, tmpC.b], i * 3); uv.set([(x + z) * 0.3, y * 0.3], i * 2);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return g;
  }
