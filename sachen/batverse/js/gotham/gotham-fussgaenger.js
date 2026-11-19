// Batverse – Gotham: Fussgaenger (F4 Teil 2, "Ja, weiter" 2026-11-19; PLAN-FIGUREN F4). Nur im Spiel, nach gotham-bus.js.
// GFUSS.N Figuren (js/spieler/figur.js, zufaellige Kleidung) gehen in der Naehe der Kamera die Gehsteige der Inselstrassen (GSTR.roads, nur mit Gehsteig) entlang,
// 1,1-1,6 m/s, mit Gehanimation (figurPose); am Ende der Strasse oder wo der Gehsteig aufhoert (GSTR.walkAt) drehen sie um. Wer weiter als 170 m von der Kamera weg ist,
// wird 40-120 m entfernt neu gesetzt (nicht im Blickfeld nah vor einem). Nur bei Kamera in Gotham (ueber der Strasse) sichtbar; ohne Kollision.
"use strict";
const GFUSS = { N: 12, list: [], bau: false };
const GFUSS_HAUT = [0xe0b48c, 0xf0cca8, 0xc68a60, 0x8a5a3a, 0x5a3a24, 0xd8a880], GFUSS_HAAR = [0x2a1a10, 0x0e0a08, 0x6a3a1a, 0xb03a20, 0xd8d8d8, 0xc9a640, 0x1a1a1a];
const GFUSS_ZEUG = [0x22324a, 0x8a2a2a, 0x2a6a3a, 0x6a6a5a, 0xd8d0c0, 0x3a3d46, 0x7a4a8a, 0xc8a040, 0x1c1f26, 0xe07a1a, 0x4a6a8a], GFUSS_HOSE = [0x2a2c30, 0x2a3a5a, 0x4a4038, 0x1a1a1a, 0x5a8aa0, 0x6a5a48];
const gfussW = A => A[Math.floor(Math.random() * A.length)];
function gfussStrassen() { return GFUSS.roads || (GFUSS.roads = GSTR.roads.filter(r => r.walk > 1 && r.pts.length > 1).map(r => { const L = [0]; for (let i = 1; i < r.pts.length; i++) L.push(L[i - 1] + Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1])); return { r, L, len: L[L.length - 1] }; }).filter(q => q.len > 30)); }
// Punkt auf dem Gehsteig: Strasse q, Weg s, Seite sd -> [x, z, ux, uz]
function gfussAt(q, s, sd) { const L = q.L, P = q.r.pts; let j = 1; while (j < L.length - 1 && L[j] < s) j++; const a = P[j - 1], b = P[j], l = L[j] - L[j - 1] || 1, t = Math.max(0, Math.min(1, (s - L[j - 1]) / l)), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l, o = q.r.w / 2 + q.r.walk * 0.5;
  return [a[0] + (b[0] - a[0]) * t - uz * sd * o, a[1] + (b[1] - a[1]) * t + ux * sd * o, ux, uz]; }
function gfussSetzen(F, cam) { const R = gfussStrassen(); if (!R.length) return false;
  for (let k = 0; k < 60; k++) { const q = R[Math.floor(Math.random() * R.length)], s = Math.random() * q.len, sd = Math.random() < 0.5 ? 1 : -1, [x, z] = gfussAt(q, s, sd), d = Math.hypot(x - cam.x, z - cam.z);
    if (d < 40 || d > 120 || !GSTR.walkAt(x, z)) continue; Object.assign(F, { q, s, sd, dir: Math.random() < 0.5 ? 1 : -1, v: 1.1 + Math.random() * 0.5 }); F.g.visible = true; return true; }
  F.g.visible = false; return false; }
function gfussStep(dt) { if (typeof GSTR === "undefined" || !GSTR.done || typeof buildFigur !== "function") return; const cam = camera.position, inG = typeof inGothamG === "function" && inGothamG(cam.x, cam.z) && cam.y > GOT.STR - 3 && cam.y < GOT.STR + 400;
  if (!GFUSS.bau) { GFUSS.bau = true; for (let i = 0; i < GFUSS.N; i++) { const o = { haut: gfussW(GFUSS_HAUT), haar: gfussW(GFUSS_HAAR), oberteil: gfussW(GFUSS_ZEUG), hose: gfussW(GFUSS_HOSE), schuhe: Math.random() < 0.4 ? 0xeeeeee : 0x15161a, frisur: Math.floor(Math.random() * 4), bart: Math.random() < 0.2,
      schulter: 0.85 + Math.random() * 0.3, bauch: Math.random() < 0.2 ? 1.3 : 1, groesse: 0.92 + Math.random() * 0.1 }, g = buildFigur(o); g.name = "Fussgänger"; g.visible = false; g.userData.dynamic = true; scene.add(g); GFUSS.list.push({ g, q: null }); } }
  for (const F of GFUSS.list) { if (!inG) { F.g.visible = false; F.q = null; continue; }
    if (!F.q || Math.hypot(F.g.position.x - cam.x, F.g.position.z - cam.z) > 170) { if (!gfussSetzen(F, cam)) continue; }
    let s = F.s + F.dir * F.v * dt; if (s < 2 || s > F.q.len - 2) { F.dir = -F.dir; s = F.s; }
    const [x, z, ux, uz] = gfussAt(F.q, s, F.sd); if (!GSTR.walkAt(x, z)) { F.dir = -F.dir; } else F.s = s;   // Gehsteig zu Ende (Kreuzung, Einfahrt): umdrehen
    const [px, pz] = gfussAt(F.q, F.s, F.sd); F.g.position.set(px, GOT.STR + GSTR.RAISE, pz); F.g.rotation.y = Math.atan2(-ux * F.dir, -uz * F.dir);
    if (Math.hypot(px - cam.x, pz - cam.z) < 90) figurPose(F.g, dt, F.v, false); } }
