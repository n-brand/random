"use strict";
// Bereiche erst in der Naehe bauen (Nicolas 2026-11-15, Plan docs/superpowers/plans/2026-11-15-bereiche-erst-in-der-naehe.md): ein Bereich hat
// Generator-Funktionen, die Netze und Kollision bauen (mit B, cyl, S, circles wie sonst) und zwischen kleinen Portionen mit yield abgeben.
// Eine Kachel-Aufgabe baut den naechsten Bereich in Reichweite (Kamera, Spieler oder aktives Fahrzeug naeher als r) im Zeitbudget (2 ms, solange der
// Ladebildschirm steht TILES.slice()); areaEnsure(x, z) baut sofort fertig (Teleport, Aufzug, Fahrzeug holen ...).
// Waehrend ein Bereich baut, landet alles, was in world kaeme, in seiner Gruppe; neue solids/circles kommen ins Zusatzraster (collAdd), also kein
// collBuild ueber alles. Fertig: statische Teile wie in start.js zusammenfassen (mergeWorldStatic), Untergrund-Teile in UNDERGROUND.
const AREAS = [];
let AREA_PARENT = null;
{ const add = world.add.bind(world); world.add = (...o) => AREA_PARENT ? AREA_PARENT.add(...o) : add(...o); }
function areaAdd({ id, x, z, r = 600, gen }) {
  let A = AREAS.find(a => a.id === id);
  if (!A) { A = { id, x, z, r, gens: [], cur: null, state: "wait", grp: new THREE.Group(), S: [], C: [], ms: 0 }; A.grp.name = "Bereich " + id; AREAS.push(A); }
  A.gens.push(gen); return A;
}
const areaState = id => { const A = AREAS.find(a => a.id === id); return A ? A.state : null; };
// Bereich A hoechstens budget ms weiterbauen; true, wenn fertig
function areaRun(A, budget) {
  if (A.state === "done") return true;
  if (A.state === "wait") { A.state = "run"; scene.add(A.grp); }
  const t0 = performance.now(), nS = solids.length, nC = circles.length; AREA_PARENT = A.grp;
  try { while (A.gens.length || A.cur) { if (!A.cur) A.cur = A.gens.shift()(); if (A.cur.next().done) A.cur = null; if (performance.now() - t0 > budget) break; } }
  finally { AREA_PARENT = null; const S2 = solids.splice(nS), C2 = circles.splice(nC); collAdd(S2, C2); A.S.push(...S2); A.C.push(...C2); A.ms += performance.now() - t0; }
  if (A.gens.length || A.cur) return false;
  const vis = typeof ugVis === "boolean" ? ugVis : true;
  for (const m of mergeWorldStatic(A.grp)) if (m.name === "Untergrund") { UNDERGROUND.push(m); m.visible = vis; }
  A.state = "done"; return true;
}
// liegt der Punkt in einem Bereich, der noch nicht fertig ist? (geparkte Fahrzeuge warten dann, sonst fielen sie durch den fehlenden Boden)
function areaPending(x, z) { for (const A of AREAS) if (A.state !== "done" && Math.hypot(x - A.x, z - A.z) < A.r) return true; return false; }
// alle Bereiche, deren Kreis den Punkt enthaelt, sofort fertig bauen
function areaEnsure(x, z) { for (const A of AREAS) if (A.state !== "done" && Math.hypot(x - A.x, z - A.z) < A.r) areaRun(A, 1e9); }
// Kachel-Aufgabe: je Bild ein Bereich (der naechste in Reichweite), im ersten Bild nur Bereiche, in denen die Kamera steht (dann ganz)
TILES.tasks.push({ plan() {}, step() {
  const pts = [camera.position]; if (typeof walking !== "undefined" && walking) pts.push(player.pos); if (typeof CAR !== "undefined" && CAR && CAR.on) pts.push({ x: CAR.x, z: CAR.z });
  let best = null, bd = 1e9;
  for (const A of AREAS) { if (A.state === "done") continue; const d = Math.min(...pts.map(p => Math.hypot(p.x - A.x, p.z - A.z))); if (d < A.r && d < bd) { bd = d; best = A; } }
  if (!best) return false;
  if (TILES.startup) { if (Math.hypot(camera.position.x - best.x, camera.position.z - best.z) < best.r) areaRun(best, 1e9); return false; }
  areaRun(best, TILES.loading() ? TILES.slice() : 2); return false;   // 2 ms: eine Portion kann darueber gehen, so bleibt das Bild unter +5 ms
} });
// Netz aus [x, y, z, u, v, ...]-Folge in Portionen bauen (Leistung 2026-11-15: die Hoehlennetze kosteten am Stueck bis 40 ms in einem Bild):
// Positionen/UV je ca. 20 000 Punkte, dann Flaechen-Normalen (wie computeVertexNormals ohne Index) je 30 000 Punkte; Netz bleibt einzeln (keep)
function* areaMesh(arr, m) {
  const n = arr.length / 5, pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), nor = new Float32Array(n * 3);
  for (let k0 = 0; k0 < n; k0 += 20000) { const k1 = Math.min(n, k0 + 20000); for (let k = k0; k < k1; k++) { pos[k * 3] = arr[k * 5]; pos[k * 3 + 1] = arr[k * 5 + 1]; pos[k * 3 + 2] = arr[k * 5 + 2]; uv[k * 2] = arr[k * 5 + 3]; uv[k * 2 + 1] = arr[k * 5 + 4]; } yield; }
  for (let t0 = 0; t0 < n; t0 += 30000) { const t1 = Math.min(n, t0 + 30000);
    for (let k = t0; k + 2 < t1 + 3 && k + 2 < n; k += 3) { const a = k * 3, b = a + 3, c = a + 6;
      const cbx = pos[c] - pos[b], cby = pos[c + 1] - pos[b + 1], cbz = pos[c + 2] - pos[b + 2], abx = pos[a] - pos[b], aby = pos[a + 1] - pos[b + 1], abz = pos[a + 2] - pos[b + 2];
      let x = cby * abz - cbz * aby, y = cbz * abx - cbx * abz, z = cbx * aby - cby * abx; const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
      for (const q of [a, b, c]) { nor[q] = x; nor[q + 1] = y; nor[q + 2] = z; } }
    yield; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.userData.keep = true; (AREA_PARENT || scene).add(mesh); return mesh;
}
// Statische Netze unter root je Material zusammenfassen (weniger Zeichenaufrufe); vorher in start.js, jetzt auch fuer fertige Bereiche.
// Liefert die neuen Netze (in der Szene); Teile ganz unter dem Gelaende (nicht an der Kueste) heissen "Untergrund".
function mergeWorldStatic(root) {
  root.updateMatrixWorld(true);
  const groups = new Map(), gone = [];
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.keep) return;
    const m = o.material;
    if (Array.isArray(m) || m.transparent || m.vertexColors) return;
    for (let q = o.parent; q; q = q.parent) if (q.userData.dynamic) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(o.matrixWorld);
    // Untergrund (Leistung 2026-11-13): ganz unter dem Gelaende liegende Teile (Hoehlen, Batcave) in eigene Netze, damit sie oben ausgeblendet werden koennen
    g.computeBoundingBox(); const bb = g.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2, ug = bb.max.y < terrainH(cx, cz) - 1.5 && seaD(cx, cz) < -40;   // an der Kueste nie (Wasserhoehlen sieht man vom Boot; seaD an Land negativ)
    const key = m.uuid + (o.castShadow ? "c" : "") + (o.receiveShadow ? "r" : "") + (ug ? "u" : "");
    if (!groups.has(key)) groups.set(key, { m, cast: o.castShadow, recv: o.receiveShadow, ug, list: [] });
    groups.get(key).list.push(g);
    gone.push(o);
  });
  for (const o of gone) { o.parent.remove(o); o.geometry.dispose(); }
  const out = [];
  for (const { m, cast, recv, ug, list } of groups.values()) {
    const merged = new THREE.Mesh(mergeGeometries(list, false), m);
    merged.castShadow = cast; merged.receiveShadow = recv; if (ug) merged.name = "Untergrund";
    scene.add(merged); out.push(merged);
    list.forEach(g => g.dispose());
  }
  return out;
}
