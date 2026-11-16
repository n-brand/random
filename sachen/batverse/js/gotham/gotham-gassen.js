// Batverse – Gotham: Seitengassen der Narrows ausstatten (G5, Nicolas 2026-11-16 "mach weiter naechster Schritt"; PLAN-GOTHAM G5:
// "Muellcontainer, Saecke, Waescheleinen, Feuertreppen, Pfuetzen, Dampf aus Gullys"). Klassisches Skript nach gotham-gebaeude.js.
// Gassen = Strassen bis 6,5 m Breite (GSTR.roads, nur Narrows). Alles nur Optik (keine Kollision), fester Zufall je Gasse.
// Feuertreppen kommen von den Mietshaeusern (G3). Netze je Material ueber gsplit (768-m-Zellen, normale Ausblendung), Dampf als ein Punktwolken-Objekt.
"use strict";
const GGAS = { done: false, vents: [], steam: null, n: 0 };
function* ggasGen() {
  while (!GSTR.done || !GGEB.done) yield "wait";
  const mats = gbvInit(), out = new Map(), Y = GOT.STR, alleys = GSTR.roads.filter(r => r.w <= 6.5 && r.pts && r.pts.length > 1);
  const cloth = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
  const puddle = new THREE.MeshStandardMaterial({ color: 0x15191d, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.5, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const M = { ...mats, waesche: cloth, pfuetze: puddle };
  let ai = 0;
  for (const r of alleys) {
    const rnd = gbvRand(++ai * 977 + 13), P = r.pts, off = r.w / 2 + r.walk;
    // Abschnitte entlang der Gasse (alle 4 m ein Punkt mit Richtung)
    const S = []; for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az); if (!L) continue; const ux = (bx - ax) / L, uz = (bz - az) / L; for (let s = 0; s < L; s += 4) S.push([ax + ux * s, az + uz * s, ux, uz]); }
    const frameAt = (x, z, ux, uz) => gbvFrame({ P0: [x, z], e1: [ux, uz], e2: [-uz, ux], L1: 1, L2: 1 });   // lokal s laengs, t quer (+ = links)
    for (let k = 2; k < S.length - 2; k++) { const [x, z, ux, uz] = S[k], f = frameAt(x, z, ux, uz), v = rnd();
      for (const side of [-1, 1]) { if (rnd() > 0.38) continue; const t = side * (off - 0.7), q = rnd();
        if (q < 0.3) { const col = rnd() < 0.5 ? [0.16, 0.36, 0.22] : [0.15, 0.25, 0.45];   // Muellcontainer mit Deckel
          gbvBox(out, "farbe", f, 0, t, 1.9, 1.1, Y, Y + 1.15, col); gbvBox(out, "farbe", f, 0, t + side * -0.05, 2.0, 1.25, Y + 1.15, Y + 1.25, col.map(c => c * 0.7)); }
        else if (q < 0.7) { for (let b = 0, n = 2 + Math.floor(rnd() * 4); b < n; b++) { const ss = (rnd() - 0.5) * 2.2, tt = t - side * rnd() * 0.6, s = 0.35 + rnd() * 0.25, c = 0.05 + rnd() * 0.08;   // Muellsaecke
            gbvBox(out, "farbe", f, ss, tt, s * 1.3, s, Y, Y + s * 1.1, [c, c, c + 0.02]); } }
        else { for (let b = 0, n = 1 + Math.floor(rnd() * 3); b < n; b++) { const s = 0.4 + rnd() * 0.4, c = 0.45 + rnd() * 0.15; gbvBox(out, "farbe", f, (rnd() - 0.5) * 2, t - side * rnd() * 0.5, s, s, Y + b * 0.05, Y + s + b * 0.05, [c, c * 0.75, c * 0.45]); } }   // Kartons
      }
      // Pfuetze auf der Fahrbahn
      if (v < 0.22) { const o = gbvBucket(out, "pfuetze"), rr = 0.5 + rnd() * 1.0, t0 = (rnd() - 0.5) * (r.w - 2 * rr), n = 10, c = f.W(0, t0, Y + 0.075);
        for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, w0 = rr * (0.75 + 0.25 * Math.sin(a0 * 3 + ai)), w1 = rr * (0.75 + 0.25 * Math.sin(a1 * 3 + ai));
          gbvTri(o, c, f.W(Math.cos(a0) * w0 * 1.4, t0 + Math.sin(a0) * w0, Y + 0.075), f.W(Math.cos(a1) * w1 * 1.4, t0 + Math.sin(a1) * w1, Y + 0.075), [0, 1, 0], [0.5, 0.5], [0, 0], [1, 0]); } }
      // Waescheleine quer ueber die Gasse (6,5-10 m hoch) mit Waeschestuecken
      if (k % 5 === 0 && rnd() < 0.6) { const h = Y + 6.5 + rnd() * 3.5, L = off - 0.2;
        gbvBox(out, "eisen", f, 0, 0, 0.03, 2 * L, h, h + 0.03);
        const o = gbvBucket(out, "waesche"); for (let tt = -L + 0.6; tt < L - 0.6; tt += 0.9 + rnd() * 0.8) { if (rnd() < 0.25) continue; const w = 0.5 + rnd() * 0.5, hh = 0.5 + rnd() * 0.6, col = [[0.85, 0.85, 0.82], [0.7, 0.2, 0.2], [0.25, 0.35, 0.6], [0.8, 0.7, 0.3], [0.4, 0.55, 0.4]][Math.floor(rnd() * 5)];
          gbvQuad(o, f.W(-0.01, tt, h), f.W(-0.01, tt + w, h), f.W(-0.01, tt + w, h - hh), f.W(-0.01, tt, h - hh), f.dirW(-1, 0), [[0, 0], [1, 0], [1, 1], [0, 1]], col); } }
      // Gully mit Dampf (Deckel + Punktwolke)
      if (k % 9 === 4) { const t0 = (rnd() - 0.5) * 1.2; gbvCyl(out, "eisen", f, 0, t0, 0.35, Y + 0.02, Y + 0.08, 10); const [vx, , vz] = f.W(0, t0, Y); GGAS.vents.push([vx, vz]); }
    }
    GGAS.n++; if (ai % 6 === 0) yield;
  }
  for (const [key, o] of out) { if (!o.p.length) continue; const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(o.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(o.n, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(o.uv, 2));
    if (o.c.length) g.setAttribute("color", new THREE.Float32BufferAttribute(o.c, 3));
    gsplit(g, M[key], "Gotham-Gassen " + key, { cast: false }); yield; }
  // Dampf: je Gully 8 Punkte, steigen 0-4 m und blassen aus (Groesse waechst), eine Punktwolke fuer alle
  const NV = GGAS.vents.length, PP = 8, pos = new Float32Array(NV * PP * 3);
  const tex = canvasTex(64, 64, (c, w, h) => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2.6, map: tex, transparent: true, opacity: 0.32, depthWrite: false, color: 0xd8dde2, sizeAttenuation: true }));
  pts.name = "Gotham-Gassen Dampf"; pts.frustumCulled = false; pts.userData.keep = true; pts.userData.noLift = true; scene.add(pts); GGAS.steam = pts;
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (GGAS.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = ggasGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { GGAS.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
function ggasBuild() { for (const _ of ggasGen()); GGAS.done = true; }   // Tests
// je Bild (schleife.js): Dampf steigen lassen, nur wenn ein Gully naeher als 300 m an der Kamera ist
function ggasStep() {
  const S = GGAS.steam; if (!S) return; const p = camera.position, V = GGAS.vents; let near = false;
  for (const [x, z] of V) if (Math.abs(x - p.x) < 300 && Math.abs(z - p.z) < 300) { near = true; break; }
  S.visible = near; if (!near) return;
  const a = S.geometry.attributes.position.array, t = performance.now() / 1000, Y = GOT.STR, PP = 8;
  for (let i = 0; i < V.length; i++) for (let j = 0; j < PP; j++) { const q = (i * PP + j) * 3, ph = (t * 0.35 + j / PP + i * 0.37) % 1;
    a[q] = V[i][0] + Math.sin(ph * 5 + j) * 0.5 * ph; a[q + 1] = Y + 0.2 + ph * 4; a[q + 2] = V[i][1] + Math.cos(ph * 4 + j) * 0.5 * ph; }
  S.geometry.attributes.position.needsUpdate = true;
}
