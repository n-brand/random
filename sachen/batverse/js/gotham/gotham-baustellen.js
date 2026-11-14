"use strict";
// Batverse – Gotham: Baustellen (Nicolas 2026-11-14: "die fuellbauten sollen baustellen sein", Ansatz A = einfache Baustelle ueberall).
// Plan: docs/superpowers/plans/2026-11-14-baustellen-und-gebaeude-ids.md (Task 5/6). Nach gotham-unterstrasse.js.
// Jeder Fuellbau der Karte (GOTHAM_STADT.fuell, FB-xxxx) und die acht BS-Plaetze (GOTHAM_STADT.baustellen) werden eine Baustelle auf ihrem
// Grundriss: Erdflaeche, 2-m-Bauzaun als Gitterbild (Tor 5 m zur naechsten Strasse), Baucontainer, 2-3 Stapel/Haufen; Wohlstand des Bezirks:
// reich = zwei Container, aufgeraeumt; arm = ein Container, ein Haufen mehr, Zaun mit Luecken. Hoechstens ca. 100 Dreiecke je Baustelle,
// je Material ein Netz, in 768-m-Zellen (gsplit, weit weg ausgeblendet). Zufall fest aus der ID-Nummer.
// Aufbau nach dem Start als Kachel-Aufgabe (nach den Strassen: das Tor sucht GSTR.onRoad), Zwischenspeicher IndexedDB "GBST".
const GBST = { list: [], done: false, Y: GOT.STR, maxTris: 0, CC: 128, cells: null, live: new Map() };
const gbstCKey = (i, k) => i * 100000 + k;
async function gbstCacheLoad(ck) {
  try { if (!window.TH_DB || !window.TH_HASH) throw 0;
    const hash = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
    const src = f => fetch(document.querySelector('script[src$="' + f + '"]').src).then(r => r.text());
    const [a, b, c] = await Promise.all([src("gotham/gotham-baustellen.js"), src("gotham/stadt.js"), src("gotham/gotham-strassen.js")]);   // Strassen: Einzug und Tor haengen an GSTR
    ck.key = TH_HASH + "-" + hash(a) + "-" + hash(b) + "-" + hash(c);
    const rec = await new Promise(ok => { const rq = TH_DB.transaction("cache").objectStore("cache").get("GBST"); rq.onsuccess = () => ok(rq.result); rq.onerror = () => ok(null); });
    if (rec && rec.key === ck.key && Array.isArray(rec.meshes) && Array.isArray(rec.gates) && Array.isArray(rec.ins) && Array.isArray(rec.fences)) ck.data = rec;
  } catch (e) {} ck.state = 1;
}
// Liste aller Baustellen (schnell, immer gerechnet: IDs und Register sind mit und ohne Zwischenspeicher gleich)
function gbstList() {
  const S = GOTHAM_STADT, out = [], bz = GOTHAM.bezirke;
  const inP = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
  const add = (id, cm, h) => {
    const mx = cm.reduce((a, p) => a + p[0], 0) / cm.length, mz = cm.reduce((a, p) => a + p[1], 0) / cm.length, b = bz.find(q => inP(mx, mz, q.poly));
    const poly = cm.map(([x, z]) => GOT.toGame(x, z)), gx = poly.reduce((a, p) => a + p[0], 0) / 4, gz = poly.reduce((a, p) => a + p[1], 0) / 4;
    out.push({ id, poly, h, wohl: b ? b.wohlstand : 0.5, bezirk: b ? b.name.split(" (")[0] : "Gotham", cx: gx, cz: gz, cell: Math.floor(gx / GCELL) * 100000 + Math.floor(gz / GCELL), gate: 0 });
  };
  for (const f of S.fuell) add(f.id, f.c, f.h);
  for (const b of S.baustellen || []) add(b.id, [[b.x - b.w / 2, b.z - b.d / 2], [b.x + b.w / 2, b.z - b.d / 2], [b.x + b.w / 2, b.z + b.d / 2], [b.x - b.w / 2, b.z + b.d / 2]], 0);
  return out;
}
function gbstRand(id) { let s = (+id.replace(/\D/g, "") || 1) * 2654435761 + (id[0] === "B" ? 99991 : 0); return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// Lage innerhalb des Grundrisses: Ecke P0, Achsen e1 (P0->P1) und e2 (P0->P3), Laengen L1/L2; Zaun 0,3 m innen
function gbstFrame(b) {
  const [P0, P1, , P3] = b.poly, L1 = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), L2 = Math.hypot(P3[0] - P0[0], P3[1] - P0[1]);
  const e1 = [(P1[0] - P0[0]) / L1, (P1[1] - P0[1]) / L1], e2 = [(P3[0] - P0[0]) / L2, (P3[1] - P0[1]) / L2];
  return { P0, L1, L2, e1, e2, at: (s, t) => [P0[0] + e1[0] * s + e2[0] * t, P0[1] + e1[1] * s + e2[1] * t] };
}
// Zaunseiten (lokal, im Umlauf): [s0, t0, s1, t1]; 0,3 m innen
function gbstSides(F, m = 0.3) { const a = m, b = F.L1 - m, c = m, d = F.L2 - m; return [[a, c, b, c], [b, c, b, d], [b, d, a, d], [a, d, a, c]]; }
// belegt: Fahrbahn oder Gehsteig (die Deckplatte neben zweistoeckigen Strassen darf bebaut werden: die Erde liegt darueber)
function gbstBusy(x, z) { return GSTR.onRoad(x, z, 0.3) || GSTR.walkAt(x, z); }
// Einzug je Seite [t0, s1, t1, s0] (Reihenfolge wie gbstSides)
function gbstInset(b) { const F = gbstFrame(b), I = [0, 0, 0, 0];
  for (let k = 0; k < 4; k++) for (let d = 0; d <= 8; d += 0.5) { let hit = false; I[k] = d;
    for (let i = 1; i < 12 && !hit; i++) { const f = i / 12, st = k === 0 ? [F.L1 * f, d] : k === 1 ? [F.L1 - d, F.L2 * f] : k === 2 ? [F.L1 * f, F.L2 - d] : [d, F.L2 * f]; hit = gbstBusy(...F.at(st[0], st[1])); }
    if (!hit) break; }
  if (F.L1 - I[1] - I[3] < 5 || F.L2 - I[0] - I[2] < 5) return [0, 0, 0, 0];               // zu klein geworden: Grundriss lassen
  return I; }
// Tor: Seite, deren Mitte (bis 15 m nach aussen) am naechsten an einer Fahrbahn liegt
function gbstGate(b) {
  const F = gbstFrame(b), sides = gbstSides(F, 0), out = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  let best = 0, bd = 1e9;
  sides.forEach((sd, k) => { const ms = (sd[0] + sd[2]) / 2, mt = (sd[1] + sd[3]) / 2;
    for (let d = 1; d <= 15; d += 2) { const [x, z] = F.at(ms + out[k][0] * d, mt + out[k][1] * d); if (GSTR.onRoad && GSTR.onRoad(x, z, 0)) { if (d < bd) { bd = d; best = k; } break; } } });
  return best;
}
function* gbstGen(useCache = true) {
  const ck = { state: 0, data: null, key: null }; if (useCache) gbstCacheLoad(ck); else ck.state = 1;
  GBST.list = gbstList();
  while (!ck.state) yield "wait";
  const CACHED = !!ck.data, Y = GBST.Y;
  // Grundriss auf freie Flaeche zuschneiden (Karten-Grundrisse reichen teils auf Gehsteige):
  // je Seite nach innen, bis die Kante frei ist (0,5-m-Schritte, hoechstens 8 m); Ergebnis mit im Zwischenspeicher
  if (!CACHED) { while (!GSTR.done) yield "wait"; GBST.list.forEach(b => { b.ins = gbstInset(b); }); yield; }
  else GBST.list.forEach((b, i) => { b.ins = ck.data.ins[i]; });
  for (const b of GBST.list) { const F = gbstFrame(b), [i0, i1, i2, i3] = b.ins; b.poly = [F.at(i3, i0), F.at(F.L1 - i1, i0), F.at(F.L1 - i1, F.L2 - i2), F.at(i3, F.L2 - i2)];
    bautAdd({ id: b.id, name: "Baustelle", art: "Baustelle", poly: b.poly, y0: Y - 1, y1: Y + 8, info: b.bezirk + (b.h ? " · geplant ca. " + Math.round(b.h) + " m" : "") }); }
  yield;
  // Materialien
  const erdeTex = canvasTex(256, 256, (g, w, h) => { const r = rng(71); g.fillStyle = "#6e5638"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = r(); g.fillStyle = v < .5 ? `rgba(60,44,28,${.15 + r() * .3})` : `rgba(150,120,80,${.1 + r() * .25})`; g.fillRect(r() * w, r() * h, 2 + r() * 6, 2 + r() * 5); }
    g.strokeStyle = "rgba(45,33,20,.45)"; g.lineWidth = 5; for (const x of [70, 96, 170, 196]) { g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 30, 90, x - 30, 170, x, h); g.stroke(); } });
  const zaunTex = canvasTex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = "rgba(205,210,214,1)"; g.lineWidth = 2;
    for (let x = -h; x < w + h; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); g.beginPath(); g.moveTo(x + h, 0); g.lineTo(x, h); g.stroke(); }
    g.fillStyle = "#c8ccd0"; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 8, w, 8); g.fillRect(0, 0, 6, h); g.fillStyle = "#3e4246"; g.fillRect(0, h - 4, w, 4); });
  const kisteTex = canvasTex(64, 64, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(0,0,0,.18)"; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 3, h); g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3); });
  const mats = {
    erde: M(0xffffff, { map: erdeTex, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    zaun: M(0xffffff, { map: zaunTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3 }),
    cont: M(0xffffff, { map: kisteTex, vertexColors: true, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.2 }),
    mat: M(0xffffff, { vertexColors: true, side: THREE.DoubleSide, roughness: 0.95 })
  };
  const NAMES = { erde: "Gotham-Baustellen Erde", zaun: "Gotham-Baustellen Zaun", cont: "Gotham-Baustellen Container", mat: "Gotham-Baustellen Material" };
  let D;
  if (CACHED) { D = ck.data.meshes; GBST.list.forEach((b, i) => { b.gate = ck.data.gates[i]; }); }
  else {
    const A = {}; for (const k in NAMES) A[k] = { p: [], n: [], uv: [], c: [] };
    const tri = (o, a, b, c, n, ua, ub, uc, col) => { o.p.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) o.n.push(...n); o.uv.push(...(ua || [0, 0]), ...(ub || [0, 0]), ...(uc || [0, 0])); if (col) for (let i = 0; i < 3; i++) o.c.push(...col); };
    const quad = (o, a, b, c, d, n, uvs, col) => { tri(o, a, b, c, n, uvs && uvs[0], uvs && uvs[1], uvs && uvs[2], col); tri(o, a, c, d, n, uvs && uvs[0], uvs && uvs[2], uvs && uvs[3], col); };
    // Quader (ohne Boden): Mitte x/z, Achse u (Einheitsvektor), Laenge l, Breite w, Hoehe h, Unterkante y0
    const box = (o, x, z, u, l, w, h, y0, col, uvScale = 0) => { const v = [-u[1], u[0]], hl = l / 2, hw = w / 2, y1 = y0 + h;
      const P = (s, t, y) => [x + u[0] * s + v[0] * t, y, z + u[1] * s + v[1] * t];
      const c = [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]], N = [[-v[0], 0, -v[1]], [u[0], 0, u[1]], [v[0], 0, v[1]], [-u[0], 0, -u[1]]];
      for (let k = 0; k < 4; k++) { const [s0, t0] = c[k], [s1, t1] = c[(k + 1) % 4], len = Math.hypot(s1 - s0, t1 - t0), us = uvScale ? len / uvScale : 1;
        quad(o, P(s0, t0, y0), P(s1, t1, y0), P(s1, t1, y1), P(s0, t0, y1), N[k], [[0, 0], [us, 0], [us, 1], [0, 1]], col); }
      quad(o, P(c[0][0], c[0][1], y1), P(c[1][0], c[1][1], y1), P(c[2][0], c[2][1], y1), P(c[3][0], c[3][1], y1), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], col.map(q => q * 0.9)); };
    // Haufen: niedrige Pyramide (4 Dreiecke)
    const pile = (o, x, z, r, h, col) => { const top = [x, Y + h, z], q = [[r, 0], [0, r], [-r, 0], [0, -r]].map(([a, b]) => [x + a, Y + 0.02, z + b]);
      for (let k = 0; k < 4; k++) { const a = q[k], b = q[(k + 1) % 4], nx = (a[0] + b[0]) / 2 - x, nz = (a[2] + b[2]) / 2 - z, l = Math.hypot(nx, nz, r * 0.7);
        tri(o, a, top, b, [nx / l, r * 0.7 / l, nz / l], null, null, null, col); } };
    const CONT = [[0.16, 0.38, 0.62], [0.78, 0.42, 0.12], [0.35, 0.52, 0.28]];
    let n = 0;
    for (const b of GBST.list) {
      const t0 = (A.erde.p.length + A.zaun.p.length + A.cont.p.length + A.mat.p.length) / 9, r = gbstRand(b.id), F = gbstFrame(b), rich = b.wohl > 0.6, poor = b.wohl < 0.3;
      b.gate = gbstGate(b);
      // Erde (6 cm ueber der Strasse, ueber der Deckplatte zweistoeckiger Strassen), UV in Metern (Textur 8 m)
      { const c = b.poly.map(([x, z]) => [x, Y + 0.06, z]); quad(A.erde, c[0], c[3], c[2], c[1], [0, 1, 0], b.poly.map(([x, z]) => [x / 8, z / 8])); }
      // Zaun: vier Seiten, Tor 5 m mittig auf der Torseite; arm: Felder (ca. 6 m) mit 25 % Luecken
      b.fence = [];
      gbstSides(F).forEach((sd, k) => {
        const len = Math.hypot(sd[2] - sd[0], sd[3] - sd[1]), segs = [];
        if (k === b.gate && len > 7) segs.push([0, len / 2 - 2.5], [len / 2 + 2.5, len]); else segs.push([0, len]);
        for (const [a0, a1] of segs) { const nf = poor ? Math.max(1, Math.min(4, Math.round((a1 - a0) / 6))) : 1;   // hoechstens 4 Felder je Stueck (Budget)
          for (let f = 0; f < nf; f++) { if (poor && nf > 1 && r() < 0.25) continue;
            const u0 = a0 + (a1 - a0) * f / nf, u1 = a0 + (a1 - a0) * (f + 1) / nf, p = t => F.at(sd[0] + (sd[2] - sd[0]) * t / len, sd[1] + (sd[3] - sd[1]) * t / len);
            const [x0, z0] = p(u0), [x1, z1] = p(u1), nx = -(z1 - z0), nz = x1 - x0, nl = Math.hypot(nx, nz) || 1;
            b.fence.push([x0, z0, x1, z1]);
            quad(A.zaun, [x0, Y, z0], [x1, Y, z1], [x1, Y + 2, z1], [x0, Y + 2, z0], [nx / nl, 0, nz / nl], [[u0 / 3, 0], [u1 / 3, 0], [u1 / 3, 1], [u0 / 3, 1]]); } }
      });
      // Container und Stapel auf freien Plaetzen (lokal s/t), weg vom Tor
      const m = 1.6, slots = [];
      for (const fs of [0.22, 0.5, 0.78]) for (const ft of [0.25, 0.75]) slots.push([m + (F.L1 - 2 * m) * fs, m + (F.L2 - 2 * m) * ft]);
      for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
      const gateMid = [[F.L1 / 2, 0], [F.L1, F.L2 / 2], [F.L1 / 2, F.L2], [0, F.L2 / 2]][b.gate];
      slots.sort((a, q) => Math.hypot(q[0] - gateMid[0], q[1] - gateMid[1]) - Math.hypot(a[0] - gateMid[0], a[1] - gateMid[1]));   // weit vom Tor zuerst
      const along = F.L1 >= F.L2, u = along ? F.e1 : F.e2, room = Math.min(F.L1, F.L2) - 2 * m;
      const nCont = rich ? 2 : 1, cl = Math.min(6, Math.max(2.5, (along ? F.L1 : F.L2) / 3 - 0.5)), cw = Math.min(2.5, Math.max(1.6, room / 2));
      b.cont = [];
      for (let i = 0; i < nCont && slots.length; i++) { const [s, t] = slots.shift(), [x, z] = F.at(s, t), col = CONT[Math.floor(r() * 3)];
        box(A.cont, x, z, u, cl, cw, 2.6, Y, col, 2.6); b.cont.push([x, z, u[0], u[1], cl, cw]); }
      const nStack = (r() < 0.5 ? 2 : 3) + (poor ? 1 : 0), ang = rich ? 0 : 0.6;
      for (let i = 0; i < nStack && slots.length; i++) { const [s, t] = slots.shift(), [x, z] = F.at(s, t), kind = Math.floor(r() * 3), a = Math.atan2(u[1], u[0]) + (r() - 0.5) * ang, uu = [Math.cos(a), Math.sin(a)];
        if (kind === 0) box(A.mat, x, z, uu, 1.2, 1.0, 0.95, Y, [0.62, 0.27, 0.2]);                                                                // Palette mit Ziegeln
        else if (kind === 1) pile(A.mat, x, z, Math.min(2.4, room / 3), 1.2 + r() * 0.6, r() < 0.5 ? [0.55, 0.55, 0.53] : [0.78, 0.68, 0.48]);       // Kies / Sand
        else box(A.mat, x, z, uu, Math.min(4, room), 1.0, 0.45, Y, [0.6, 0.47, 0.3]);                                                                // Bohlen
      }
      b.tris = (A.erde.p.length + A.zaun.p.length + A.cont.p.length + A.mat.p.length) / 9 - t0; if (b.tris > GBST.maxTris) GBST.maxTris = b.tris;
      if (++n % 40 === 0) yield;
    }
    D = Object.keys(NAMES).map(k => ({ k, p: new Float32Array(A[k].p), n: new Float32Array(A[k].n), uv: new Float32Array(A[k].uv), c: A[k].c.length ? new Float32Array(A[k].c) : null }));
    if (ck.key && window.TH_DB) setTimeout(() => { try { TH_DB.transaction("cache", "readwrite").objectStore("cache").put({ key: ck.key, meshes: D, gates: GBST.list.map(b => b.gate), ins: GBST.list.map(b => b.ins), conts: GBST.list.map(b => b.cont), fences: GBST.list.map(b => b.fence) }, "GBST"); } catch (e) {} }, 2500);
  }
  if (CACHED) GBST.list.forEach((b, i) => { b.cont = ck.data.conts[i] || []; b.fence = ck.data.fences[i] || []; });
  // Zellen fuer die Kollision (GBST.CC, Mitte der Baustelle)
  GBST.cells = new Map(); for (const b of GBST.list) { const k = gbstCKey(Math.floor(b.cx / GBST.CC), Math.floor(b.cz / GBST.CC)); if (!GBST.cells.has(k)) GBST.cells.set(k, []); GBST.cells.get(k).push(b); }
  GBST.meshes = [];
  for (const d of D) { const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(d.p, 3)); g.setAttribute("normal", new THREE.BufferAttribute(d.n, 3)); g.setAttribute("uv", new THREE.BufferAttribute(d.uv, 2));
    if (d.c) g.setAttribute("color", new THREE.BufferAttribute(d.c, 3));
    GBST.meshes.push(gsplit(g, mats[d.k], NAMES[d.k], { cast: d.k === "cont" })); yield; }
  GBST.tris = D.reduce((a, d) => a + d.p.length / 9, 0);
}
function gbstBuild() { if (!GSTR.done) gstrBuild(); for (const _ of gbstGen(false)); GBST.done = true; }   // Tests: alles auf einmal, ohne Zwischenspeicher
TILES.tasks.push({ gen: null, plan() {}, step() { if (GBST.done || TILES.startup || !TILES.frame || TILES.frame < 40) return false;
  if (!this.gen) this.gen = gbstGen(); const t0 = performance.now();
  while (performance.now() - t0 < 6) { const r = this.gen.next(); if (r.done) { GBST.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }   // Warten (Zwischenspeicher, Strassen): nicht 6 ms leer drehen
  return false; } });

// ---- Kollision nur in der Naehe (Nicolas 2026-11-14 "Nur in der Naehe", Task 6) ----
// Zaun und Container sind fest, aber nur fuer Baustellen in der 128-m-Zelle des Spielers bzw. aktiven Fahrzeugs und den 8 Nachbarzellen
// (Zusatzraster COLL.cellsX, collAdd/collRemove; solids/circles bleiben unberuehrt). Je Bild hoechstens eine Zelle anlegen oder entfernen (Anlegen zuerst);
// die Nachbarn sind immer schon da (mind. 128 m Vorlauf, Baustellen reichen hoechstens ca. 40 m ueber ihre Zelle hinaus).
// Gedrehte Kanten als Kette kleiner achsparalleler Quader (0,5 x 0,5 m alle 0,4 m), Hoehe Strasse - 0,2 bis Oberkante (nicht auf der unteren Strasse).
// Haufen und Stapel ohne Kollision. Container: Quader 0,3 m innerhalb der sichtbaren Wand (Regel Barrieren weiter innen).
function gbstColl(b) {
  const Y = GBST.Y, S = [], h = 0.25, chain = (x0, z0, x1, z1, top) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / 0.4));
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; S.push({ x0: x - h, x1: x + h, y0: Y - 0.2, y1: top, z0: z - h, z1: z + h, on: true }); } };
  for (const [x0, z0, x1, z1] of b.fence || []) chain(x0, z0, x1, z1, Y + 2);
  for (const [x, z, ux, uz, l, w] of b.cont || []) { const vx = -uz, vz = ux, a = l / 2 - 0.3, c = w / 2 - 0.3, P = (s, t) => [x + ux * s + vx * t, z + uz * s + vz * t];
    const q = [P(-a, -c), P(a, -c), P(a, c), P(-a, c)]; for (let k = 0; k < 4; k++) chain(q[k][0], q[k][1], q[(k + 1) % 4][0], q[(k + 1) % 4][1], Y + 2.6); }
  return { S, C: [] };
}
function gbstCollStep() {
  if (!GBST.done || !GBST.cells) return;
  const px = CAR && CAR.on ? CAR.x : player.pos.x, pz = CAR && CAR.on ? CAR.z : player.pos.z, ci = Math.floor(px / GBST.CC), ck = Math.floor(pz / GBST.CC), want = new Set();
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const k = gbstCKey(ci + a, ck + b); if (GBST.cells.has(k)) want.add(k); }
  for (const k of want) if (!GBST.live.has(k)) { const parts = GBST.cells.get(k).map(gbstColl); for (const p of parts) collAdd(p.S, p.C); GBST.live.set(k, parts); return; }
  for (const [k, parts] of GBST.live) if (!want.has(k)) { for (const p of parts) collRemove(p.S, p.C); GBST.live.delete(k); return; }
}
