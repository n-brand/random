// Batverse – Gotham: Gebaeude auf den Fuellbau-Flaechen (G3/G4, Nicolas 2026-11-15/16; Design docs/superpowers/specs/2026-11-15-gotham-gebaeude-design.md)
// Klassisches Skript nach gotham-baustellen.js (braucht gbstList/gbstFrame/gbstInset/gbstGate, gsplit, bautAdd, GBV aus gebaeude-vorlagen.js).
// Huellen aller 1657 Gebaeude als Kachel-Aufgabe (Zwischenspeicher IndexedDB "GGEB"), zusammengefasst je Material in 768-m-Zellen (gsplit, Option far:
// sichtbar bis zur Kamera-Fernebene, Skyline auch von der Manor), ohne Schattenwurf (Schatten nur nah, Task 3). Register: Art "Füllbau".
"use strict";
// Nicolas 2026-11-16: FB-0563 verdeckte das Polizeipraesidium (dort jetzt Vorplatz, gotham-polizei.js)
const GGEB_SKIP = new Set(["FB-0563"]);
const GGEB = { list: [], done: false, Y: GOT.STR, CC: 128, cells: null, tris: 0, meshes: [], fromCache: false, _n: -1 };
const ggebCKey = (i, k) => i * 100000 + k;
async function ggebCacheLoad(ck) {
  try { if (!window.TH_DB || !window.TH_HASH) throw 0;
    const hash = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
    const src = f => fetch(document.querySelector('script[src$="' + f + '"]').src).then(r => r.text());
    const T = await Promise.all(["gotham/gotham-gebaeude.js", "gotham/gebaeude-vorlagen.js", "gotham/stadt.js", "gotham/gotham-strassen.js", "gotham/gotham-baustellen.js"].map(src));   // Strassen: Einzug und Front haengen an GSTR
    ck.key = TH_HASH + "-" + T.map(hash).join("-");
    const rec = await new Promise(ok => { const rq = TH_DB.transaction("cache").objectStore("cache").get("GGEB"); rq.onsuccess = () => ok(rq.result); rq.onerror = () => ok(null); });
    if (rec && rec.key === ck.key && Array.isArray(rec.meshes) && Array.isArray(rec.ins) && Array.isArray(rec.fronts) && Array.isArray(rec.fires)) ck.data = rec;
  } catch (e) {} ck.state = 1;
}
// Punkt im Viereck
const ggebIn = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
// Lage-Objekt fuer gbvShell/gbvDetails
const ggebO = b => ({ P0: b.F.P0, e1: b.F.e1, e2: b.F.e2, L1: b.F.L1, L2: b.F.L2, front: b.front, type: b.type, N: b.N, H: b.H, glas: b.glas, seed: +b.id.replace(/\D/g, ""), fire: b.fire, y: GGEB.Y });
// Einzug fuer Gebaeude (strenger als bei den Baustellen: auch Ecken und Kantenpunkte direkt an der Kante frei von Fahrbahn und Gehsteig);
// je Seite in 0,5-m-Schritten nach innen, bis frei; zu klein (unter 5 m) -> null (kein Gebaeude, Flaeche bleibt leer)
function ggebInset(b) {
  const F = gbstFrame(b), I = gbstInset(b).slice(), ok = () => F.L1 - I[1] - I[3] >= 5 && F.L2 - I[0] - I[2] >= 5;
  for (let it = 0; it < 40 && ok(); it++) { let moved = false;
    for (let k = 0; k < 4; k++) { const s0 = I[3] + 0.02, s1 = F.L1 - I[1] - 0.02, t0 = I[0] + 0.02, t1 = F.L2 - I[2] - 0.02;
      for (let i = 0; i <= 12; i++) { const f = i / 12, st = k === 0 ? [s0 + (s1 - s0) * f, t0] : k === 1 ? [s1, t0 + (t1 - t0) * f] : k === 2 ? [s0 + (s1 - s0) * f, t1] : [s0, t0 + (t1 - t0) * f];
        if (gbstBusy(...F.at(st[0], st[1]))) { I[k] += 0.5; moved = true; break; } } }
    if (!moved) return I; }
  return null;
}
// Brandwand: Seite k grenzt an ein anderes Gebaeude, wenn 2 von 3 Proben 1 oder 2,2 m vor der Seite in dessen Grundriss liegen (Abstand unter ca. 2 m)
function ggebFire(b) {
  const F = b.F, out = [[0, -1], [1, 0], [0, 1], [-1, 0]], sides = gbstSides(F, 0), ci = Math.floor(b.cx / GGEB.CC), ck = Math.floor(b.cz / GGEB.CC), near = [];
  for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) for (const q of GGEB.cells.get(ggebCKey(ci + a, ck + c)) || []) if (q !== b) near.push(q);
  return sides.map((sd, k) => { let hit = 0; for (const f of [0.2, 0.5, 0.8]) for (const d of [1, 2.2]) { const [x, z] = F.at(sd[0] + (sd[2] - sd[0]) * f + out[k][0] * d, sd[1] + (sd[3] - sd[1]) * f + out[k][1] * d); if (near.some(q => ggebIn(x, z, q.poly))) { hit++; break; } } return hit >= 2; });
}
function* ggebGen(useCache = true) {
  const ck = { state: 0, data: null, key: null }; if (useCache) ggebCacheLoad(ck); else ck.state = 1;
  GGEB.list = gbstList().filter(b => b.id.startsWith("FB") && !GGEB_SKIP.has(b.id));   // GGEB_SKIP: entfernte Fuellbauten (Platz fuer Orte)
  while (!ck.state) yield "wait";
  const CACHED = GGEB.fromCache = !!ck.data, Y = GGEB.Y;
  if (!CACHED) { while (!GSTR.done) yield "wait"; let n = 0; for (const b of GGEB.list) { b.ins = ggebInset(b); if (++n % 100 === 0) yield; } }
  else GGEB.list.forEach((b, i) => { b.ins = ck.data.ins[i]; });
  GGEB.all = GGEB.list; GGEB.dropped = GGEB.list.filter(b => !b.ins).map(b => b.id); GGEB.list = GGEB.list.filter(b => b.ins);   // passt kein Gebaeude: Flaeche bleibt leer
  // eingezogener Grundriss, Lage, Vorlage
  for (const b of GGEB.list) { const F0 = gbstFrame(b), [i0, i1, i2, i3] = b.ins; b.poly = [F0.at(i3, i0), F0.at(F0.L1 - i1, i0), F0.at(F0.L1 - i1, F0.L2 - i2), F0.at(i3, F0.L2 - i2)]; b.F = gbstFrame(b);
    Object.assign(b, gbvPick({ h: b.h, area: b.F.L1 * b.F.L2, wohl: b.wohl, bezirk: b.bezirk, id: b.id })); }
  GGEB.cells = new Map(); for (const b of GGEB.list) { const k = ggebCKey(Math.floor(b.cx / GGEB.CC), Math.floor(b.cz / GGEB.CC)); if (!GGEB.cells.has(k)) GGEB.cells.set(k, []); GGEB.cells.get(k).push(b); }
  if (CACHED) GGEB.list.forEach((b, i) => { b.front = ck.data.fronts[i]; b.fire = ck.data.fires[i]; });
  else { let n = 0; for (const b of GGEB.list) { b.front = gbstGate(b); b.fire = ggebFire(b); if (++n % 100 === 0) yield; } }
  for (const b of GGEB.list) bautAdd({ id: b.id, name: GBV.NAMES[b.type], art: "Füllbau", poly: b.poly, y0: Y - 1, y1: Y + b.H + 2, info: b.bezirk + " · " + (b.N > 1 ? b.N + " Geschosse · " : "") + Math.round(b.H) + " m" });
  yield;
  const mats = gbvInit(); let D;
  if (CACHED) D = ck.data.meshes;
  else { const out = new Map(); let n = 0; for (const b of GGEB.list) { gbvShell(ggebO(b), out); if (++n % 40 === 0) yield; }
    D = [...out].map(([k, o]) => ({ k, p: new Float32Array(o.p), n: new Float32Array(o.n), uv: new Float32Array(o.uv) }));
    if (ck.key && window.TH_DB) setTimeout(() => { try { TH_DB.transaction("cache", "readwrite").objectStore("cache").put({ key: ck.key, meshes: D, ins: GGEB.all.map(b => b.ins), fronts: GGEB.list.map(b => b.front), fires: GGEB.list.map(b => b.fire) }, "GGEB"); } catch (e) {} }, 3000); }
  GGEB.meshes = [];
  for (const d of D) { const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(d.p, 3)); g.setAttribute("normal", new THREE.BufferAttribute(d.n, 3)); g.setAttribute("uv", new THREE.BufferAttribute(d.uv, 2));
    GGEB.meshes.push(gsplit(g, mats[d.k], "Gotham-Gebäude " + d.k, { far: true, cast: false })); yield; }
  GGEB.tris = D.reduce((a, d) => a + d.p.length / 9, 0);
}
function ggebBuild() { if (!GSTR.done) gstrBuild(); for (const _ of ggebGen(false)); GGEB.done = true; }   // Tests: alles auf einmal, ohne Zwischenspeicher
TILES.tasks.push({ gen: null, plan() {}, step() { if (GGEB.done || TILES.startup || !TILES.frame || TILES.frame < 40) return false;
  if (!this.gen) this.gen = ggebGen(); const t0 = performance.now();
  while (performance.now() - t0 < TILES.slice()) { const r = this.gen.next(); if (r.done) { GGEB.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
// je Bild (schleife.js): Fenster nachts, nur bei Aenderung
function ggebStep() { if (!GBV.mats) return; const n = typeof night === "number" ? night : 0; if (GGEB._n !== n) { GGEB._n = n; GBV.night(n); } }

// ---- Nahdetails und Schatten in der Naehe (Task 3) ----
// Anbauten (gbvDetails) und Schatten-Huellen je 256-m-Zelle (groesser als die Kollisionszellen: weniger Zeichenaufrufe) im Umkreis R (Handy 120 m) plus halbe
// Zelldiagonale um Spieler/aktives Fahrzeug bzw. Kamera; Abbau erst 40 m weiter (kein Flackern am Rand). Aufbau in Portionen (je next() 2 Gebaeude, hoechstens
// ca. 3 ms je Bild), immer nur eine Zelle zugleich, die naechste zuerst. Schatten-Huellen: die Huellen der Zelle nur fuers Schattenbild (colorWrite aus).
GGEB.NC = 256; GGEB.R = TILES.mobile ? 120 : 200; GGEB.near = new Map(); GGEB.nearMax = 0; GGEB.nearCells = null; GGEB.nearCur = null;
const ggebShadowM = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
function ggebFocus() { if (CAR && CAR.on) return { x: CAR.x, y: CAR.y, z: CAR.z }; if (walking && !ghost) return player.pos; return camera.position; }
function* ggebNearGen(c) {
  const out = new Map(), sh = new Map(); let n = 0;
  for (const b of c.list) { const o = ggebO(b); gbvDetails(o, out); gbvShell(o, sh); if (++n % 2 === 0) yield; }
  const grp = new THREE.Group(); grp.name = "Gotham-Gebäude nah " + c.key; grp.userData.keep = true; grp.userData.noLift = true;
  for (const [key, o] of out) { if (!o.p.length) continue; const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(o.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(o.n, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(o.uv, 2));
    if (o.c.length) g.setAttribute("color", new THREE.Float32BufferAttribute(o.c, 3));
    const m = new THREE.Mesh(g, GBV.mats[key]); m.castShadow = m.receiveShadow = true; m.name = "Gotham-Gebäude nah " + key; m.userData.keep = true; m.userData.noLift = true; grp.add(m); yield; }
  { const P = []; for (const o of sh.values()) for (let i = 0; i < o.p.length; i++) P.push(o.p[i]);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    const m = new THREE.Mesh(g, ggebShadowM); m.castShadow = true; m.receiveShadow = false; m.name = "Gotham-Gebäude Schatten"; m.userData.keep = true; m.userData.noLift = true; grp.add(m); }
  c.grp = grp; scene.add(grp); c.state = "done";
}
function ggebNearStep() {
  if (!GGEB.done) return;
  if (!GGEB.nearCells) { GGEB.nearCells = new Map(); for (const b of GGEB.list) { const i = Math.floor(b.cx / GGEB.NC), j = Math.floor(b.cz / GGEB.NC), k = ggebCKey(i, j); if (!GGEB.nearCells.has(k)) GGEB.nearCells.set(k, { i, j, list: [] }); GGEB.nearCells.get(k).list.push(b); } }
  const p = ggebFocus(), NC = GGEB.NC, half = NC * 0.7072, R = GGEB.R, Y = GGEB.Y;
  const dist = k => { const q = GGEB.nearCells.get(k); return Math.hypot((q.i + 0.5) * NC - p.x, Math.max(0, (p.y ?? Y) - Y - 10), (q.j + 0.5) * NC - p.z); };
  // Abbau (eine Zelle je Bild)
  for (const [k, c] of GGEB.near) if (dist(k) > R + half + 40) { if (c.grp) { scene.remove(c.grp); c.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } if (GGEB.nearCur === c) GGEB.nearCur = null; GGEB.near.delete(k); break; }
  // naechste fehlende Zelle anfangen
  if (!GGEB.nearCur) { let best = null, bd = 1e9; for (const k of GGEB.nearCells.keys()) { if (GGEB.near.has(k)) continue; const d = dist(k); if (d < R + half && d < bd) { bd = d; best = k; } }
    if (best !== null) { const c = { key: best, list: GGEB.nearCells.get(best).list, state: "build", grp: null }; c.gen = ggebNearGen(c); GGEB.near.set(best, c); GGEB.nearCur = c; } }
  // Portionen
  const c = GGEB.nearCur; if (!c) return; const t0 = performance.now();
  while (performance.now() - t0 < 3) { const a = performance.now(), r = c.gen.next(); GGEB.nearMax = Math.max(GGEB.nearMax, performance.now() - a); if (r.done) { GGEB.nearCur = null; break; } }
}

// ---- Kollision nur in der Naehe (Task 4) ----
// Je Gebaeude ein gedrehter Quader (dkAdd, kern/drehkoll.js): wirksam 0,3 m innerhalb der Fassade (hl = L/2 - 0,6 plus Rand m 0,3; Regel Barrieren weiter innen),
// Oberseite = Dach (begehbar, The Bat kann landen). Wolkenkratzer mit Ruecksprung: zwei Teile. Anbauten ohne Kollision (nur Optik).
// Wie die Baustellen: 128-m-Zellen um Spieler bzw. aktives Fahrzeug und die 8 Nachbarn, je Bild hoechstens eine Zelle anlegen oder entfernen (Anlegen zuerst).
GGEB.coll = new Map();
function ggebColl(b) {
  const F = b.F, Y = GGEB.Y, [cx, cz] = F.at(F.L1 / 2, F.L2 / 2), part = (ins, y0, y1) => dkAdd({ cx, cy: (y0 + y1) / 2, cz, ux: F.e1[0], uz: F.e1[1], hl: F.L1 / 2 - ins - 0.6, hw: F.L2 / 2 - ins - 0.6, hh: (y1 - y0) / 2, m: 0.3 });
  if (b.type === "kratzer" && F.L1 >= 30 && F.L2 >= 30) { const yk = Y + Math.round(b.H * 0.4 / GBV.GH) * GBV.GH; return [part(0, Y - 0.2, yk), part(4, yk, Y + b.H)]; }
  return [part(0, Y - 0.2, Y + b.H)];
}
const GGEB_NB = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
// sofort anlegen (Teleport: sonst steht man nach dem Teleport auf ein Dach auf der Strasse, Review)
function ggebCollEnsure(x, z) { if (!GGEB.done || !GGEB.cells) return; const ci = Math.floor(x / GGEB.CC), ck = Math.floor(z / GGEB.CC);
  for (const [a, b] of GGEB_NB) { const k = ggebCKey(ci + a, ck + b); if (GGEB.cells.has(k) && !GGEB.coll.has(k)) GGEB.coll.set(k, GGEB.cells.get(k).flatMap(ggebColl)); } }
function ggebCollStep() {
  if (!GGEB.done || !GGEB.cells) return;
  const px = CAR && CAR.on ? CAR.x : player.pos.x, pz = CAR && CAR.on ? CAR.z : player.pos.z, ci = Math.floor(px / GGEB.CC), ck = Math.floor(pz / GGEB.CC), want = new Set();
  for (const [a, b] of GGEB_NB) { const k = ggebCKey(ci + a, ck + b); if (GGEB.cells.has(k)) want.add(k); }   // Mitte zuerst
  for (const k of want) if (!GGEB.coll.has(k)) { GGEB.coll.set(k, GGEB.cells.get(k).flatMap(ggebColl)); return; }
  for (const [k, parts] of GGEB.coll) if (!want.has(k)) { for (const o of parts) dkRemove(o); GGEB.coll.delete(k); return; }
}

// ---- G6: Baustellen in den Luecken zwischen den Gebaeuden (Nicolas 2026-11-12 "Baustellen fuellen die Luecken zwischen den Fuellbauten") ----
// Entlang jeder Strasse beidseits (1 m hinter dem Gehsteig, alle 2 m) freie Laeufe suchen: frei = keine Fahrbahn/Gehsteig, kein Gebaeude, kein Ort aus
// daten.js (Gebaeude mit Bedeutung kommen spaeter), keine BS-Baustelle, nicht am Kai, auch 8 m tiefer frei. Nur Laeufe ab 12 m, die an mind. einem Ende an
// ein Gebaeude grenzen (echte Luecken, keine Parks/Wiesen); lange Laeufe in Grundstuecke bis 30 m geteilt, Tiefe bis zum naechsten Hindernis (8-25 m).
// Ergebnis: Liste { id: "BL-0001" .., poly (Spiel), wohl, bezirk } in Strassen-Reihenfolge (fest, solange Strassen und Gebaeude gleich bleiben).
function* ggebGaps() {
  const G = GOTHAM, bz = G.bezirke, out = [], taken = [];
  const orte = G.orte.filter(o => o.typ !== "baustelle").map(o => { const big = o.id === "gcpd", W = big ? 52 : Math.max(o.w, 18) / 2 + 4, D = big ? 60 : Math.max(o.d, 18) / 2 + 4,   // gcpd: mit Vorplatz, Zufahrt und Verwahrstelle (gotham-polizei.js)
    a = (o.dreh || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => GOT.toGame(o.x + u * W * c - v * D * s, o.z + u * W * s + v * D * c)); });
  const inB = (x, z) => { const i = Math.floor(x / GGEB.CC), k = Math.floor(z / GGEB.CC); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const q of GGEB.cells.get(ggebCKey(i + a, k + b)) || []) if (ggebIn(x, z, q.poly)) return true; return false; };
  for (const b of gbstList()) if (GGEB_SKIP.has(b.id)) orte.push(b.poly);   // entfernte Fuellbauten: dort keine Luecken-Baustelle
  const bs = gbstList().filter(b => b.id[0] === "B" && b.id[1] === "S");   // alle BS, auch belegte (GBST.skip, Casino)
  const busy = (x, z) => GSTR.onRoad(x, z, 0.5) || GSTR.walkAt(x, z) || GOT.edgeSD(x, z) > -8 || inB(x, z) || orte.some(P => ggebIn(x, z, P)) || bs.some(b => ggebIn(x, z, b.poly)) || taken.some(P => ggebIn(x, z, P));
  const inP = (x, z, P) => ggebIn(x, z, P);
  for (const r of GSTR.roads) { const P = r.pts; if (!P || P.length < 2) continue;
    for (const side of [-1, 1]) { const off = r.w / 2 + r.walk + 1; let run = [], startB = false, prevB = false;
      const flush = endB => { const len = run.length * 2;
        if (len >= 12 && (startB || endB)) { const n = Math.ceil(len / 30), per = Math.floor(run.length / n);
          for (let q = 0; q < n; q++) { const a = run[q * per + 1], b = run[Math.min(run.length - 2, (q + 1) * per - 1)]; if (!a || !b) continue;
            const fl = Math.hypot(b[0] - a[0], b[1] - a[1]); if (fl < 8) continue;
            const nx = (a[2] + b[2]) / 2, nz = (a[3] + b[3]) / 2, nl = Math.hypot(nx, nz) || 1, ux = nx / nl, uz = nz / nl;
            let d = 25; for (const f of [0, 0.5, 1]) { const x0 = a[0] + (b[0] - a[0]) * f, z0 = a[1] + (b[1] - a[1]) * f; for (let t = 1; t <= 25; t++) if (busy(x0 + ux * t, z0 + uz * t)) { d = Math.min(d, t - 1.5); break; } }
            if (d < 8) continue;
            const poly = [[a[0], a[1]], [b[0], b[1]], [b[0] + ux * d, b[1] + uz * d], [a[0] + ux * d, a[1] + uz * d]], cx = poly.reduce((s, p) => s + p[0], 0) / 4, cz = poly.reduce((s, p) => s + p[1], 0) / 4;
            if (poly.some(([x, z]) => busy(x, z)) || busy(cx, cz)) continue;
            const [mx, mz] = GOT.toMap(cx, cz), bzk = bz.find(q => inP(mx, mz, q.poly));
            taken.push(poly); out.push({ id: "BL-" + String(out.length + 1).padStart(4, "0"), poly, h: 0, wohl: bzk ? bzk.wohlstand : 0.5, bezirk: bzk ? bzk.name.split(" (")[0] : "Gotham", cx, cz, cell: Math.floor(cx / GCELL) * 100000 + Math.floor(cz / GCELL), gate: 0, ins: [0, 0, 0, 0] }); } }
        run = []; };
      for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz2] = P[i + 1], L = Math.hypot(bx - ax, bz2 - az); if (!L) continue; const ux = (bx - ax) / L, uz = (bz2 - az) / L, nx = -uz * side, nz = ux * side;
        for (let s = 0; s < L; s += 2) { const x = ax + ux * s + nx * off, z = az + uz * s + nz * off, hitB = inB(x, z) || inB(x + nx * 4, z + nz * 4);
          if (!busy(x, z) && !busy(x + nx * 8, z + nz * 8)) { if (!run.length) startB = prevB; run.push([x, z, nx, nz]); } else flush(hitB);
          prevB = hitB; } }
      flush(false); }
    yield; }
  return out;
}
