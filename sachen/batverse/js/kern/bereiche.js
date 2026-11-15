"use strict";
// Bereiche erst in der Naehe bauen (Nicolas 2026-11-15, Plan docs/superpowers/plans/2026-11-15-bereiche-erst-in-der-naehe.md): ein Bereich hat
// Generator-Funktionen, die Netze und Kollision bauen (mit B, cyl, S, circles wie sonst) und zwischen kleinen Portionen mit yield abgeben.
// Eine Kachel-Aufgabe baut den naechsten Bereich in Reichweite (Kamera, Spieler oder aktives Fahrzeug naeher als r) im Zeitbudget (1 ms, solange der
// Ladebildschirm steht TILES.slice()); areaEnsure(x, z) baut sofort fertig (Teleport, Aufzug, Fahrzeug holen ...).
// Waehrend ein Bereich baut, landet alles, was in world kaeme, in seiner Gruppe; neue solids/circles kommen ins Zusatzraster (collAdd), also kein
// collBuild ueber alles. Fertig: statische Teile wie in start.js zusammenfassen (mergeWorldStatic), Untergrund-Teile in UNDERGROUND.
// Ablauf je Bereich: wait -> run (Generatoren, Kollision waechst) -> merge (zusammenfassen) -> warm (Shader und Texturen vorbereiten, Gruppe noch
// ausserhalb der Szene) -> done (sichtbar). Kollision ist ab "merge" vollstaendig (areaReady). Nach dem Review (2026-11-15): eigene feste Zeitscheibe je Bild
// (areaStep aus tilesUpdate, unabhaengig vom Kachelbudget), Sicherheitsnetz fuer Spieler/Fahrzeug/Boot/Flugzeug, Shader vor dem Zeigen (sonst
// ca. 190 ms beim ersten Bild mit der Hoehle), Fehler im Generator abgefangen, Untergrund-Bereiche (ug) ganz in UNDERGROUND.
const AREAS = [];
let AREA_PARENT = null;
{ const add = world.add.bind(world); world.add = (...o) => AREA_PARENT ? AREA_PARENT.add(...o) : add(...o); }
function areaAdd({ id, x, z, r = 600, ug = false, gen }) {
  let A = AREAS.find(a => a.id === id);
  if (!A) { A = { id, x, z, r, ug, gens: [], cur: null, state: "wait", grp: new THREE.Group(), S: [], C: [], ms: 0 }; A.grp.name = "Bereich " + id; AREAS.push(A); }
  A.gens.push(gen); return A;
}
const areaState = id => { const A = AREAS.find(a => a.id === id); return A ? A.state : null; };
const areaReady = A => A.state !== "wait" && A.state !== "run";
// Generatoren von A hoechstens budget ms weiterlaufen lassen; true, wenn die Kollision fertig ist
function areaRun(A, budget) {
  if (areaReady(A)) return true;
  A.state = "run";
  const t0 = performance.now(), nS = solids.length, nC = circles.length; AREA_PARENT = A.grp;
  try { while (A.gens.length || A.cur) { if (!A.cur) A.cur = A.gens.shift()(); try { if (A.cur.next().done) A.cur = null; } catch (e) { console.error("Bereich " + A.id, e); A.cur = null; } if (performance.now() - t0 > budget) break; } }
  finally { AREA_PARENT = null; const S2 = solids.splice(nS), C2 = circles.splice(nC); collAdd(S2, C2); A.S.push(...S2); A.C.push(...C2); A.ms += performance.now() - t0; }
  if (A.gens.length || A.cur) return false;
  A.state = "merge"; return true;
}
// zusammenfassen, Shader/Texturen vorbereiten, Netze hochladen, zeigen; sync: alles jetzt (Teleport usw.), sonst je Aufruf ein Schritt.
// Shader im Hintergrund (compileAsync), dann je Bild ein Netz einmal in ein 1x1-Ziel zeichnen (laedt Punktdaten auf die Grafikkarte; gemessen
// erstes Bild mit der Hoehle: sofort gezeigt 44 ms, nur Shader vorbereitet 26 ms)
const AREA_RT = new THREE.WebGLRenderTarget(1, 1), AREA_UPM = new THREE.MeshBasicMaterial();   // Ersatzmaterial: ein fertiger Shader, Punktdaten werden trotzdem alle hochgeladen
{ const sc = new THREE.Scene(); sc.add(new THREE.Mesh(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3)), AREA_UPM)); renderer.compile(sc, camera); }   // Shader des Ersatzmaterials schon beim Laden
function areaFinish(A, sync) {
  if (A.state === "merge") { mergeWorldStatic(A.grp, A.grp); A.state = "warm"; if (!sync) return; }
  const show = () => { if (A.state === "done") return; scene.add(A.grp); if (A.ug) { UNDERGROUND.push(A.grp); A.grp.visible = typeof ugVis === "boolean" ? ugVis : true; } A.state = "done"; };
  if (A.state === "warm") {
    if (A.warming && !sync) return;
    if (!A.warming) { A.tmp = new THREE.Scene(); A.tmp.add(A.grp);
      A.grp.traverse(o => { if (o.material) for (const m of [].concat(o.material)) for (const k of ["map", "bumpMap", "normalMap", "emissiveMap"]) if (m[k]) renderer.initTexture(m[k]); }); }
    const up = () => { A.up = []; A.grp.traverse(o => { if (o.isMesh) A.up.push(o); }); A.state = "upload"; };
    if (sync || !renderer.compileAsync) { renderer.compile(A.tmp, camera, scene); up(); }
    else { A.warming = true; renderer.compileAsync(A.tmp, camera, scene).then(() => { if (A.state === "warm") up(); }, () => { if (A.state === "warm") up(); }); return; }
  }
  if (A.state === "upload") {
    const rt = renderer.getRenderTarget(), one = new THREE.Scene(), shadow = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false; one.overrideMaterial = AREA_UPM;
    try { do { const o = A.up.shift(); if (!o) break; const p = o.parent; const fc = o.frustumCulled; o.frustumCulled = false; one.add(o); renderer.setRenderTarget(AREA_RT); renderer.render(one, camera); o.frustumCulled = fc; p.add(o); } while (sync && A.up.length); }
    finally { renderer.setRenderTarget(rt); renderer.shadowMap.autoUpdate = shadow; }
    if (!A.up.length) show();
  }
}
// liegt der Punkt in einem Bereich, dessen Kollision noch nicht fertig ist? (geparkte Fahrzeuge warten dann, sonst fielen sie durch den fehlenden Boden)
function areaPending(x, z) { for (const A of AREAS) if (!areaReady(A) && Math.hypot(x - A.x, z - A.z) < A.r) return true; return false; }
// alle Bereiche, deren Kreis den Punkt enthaelt, sofort fertig bauen
function areaEnsure(x, z) { for (const A of AREAS) if (A.state !== "done" && Math.hypot(x - A.x, z - A.z) < A.r) { areaRun(A, 1e9); areaFinish(A, true); } }
// je Bild aus tilesUpdate (eigene Zeitscheibe, nicht vom Kachelbudget abhaengig)
function areaStep() {
  if (!AREAS.some(A => A.state !== "done")) return;
  // Sicherheitsnetz: wer selbst hinkommt (zu Fuss, Auto, Boot, The Bat, Jet), findet die Kollision fertig vor
  const who = []; if (walking && !ghost) who.push(player.pos);
  for (const o of [typeof CAR !== "undefined" && CAR, typeof BOAT !== "undefined" && BOAT, typeof FLY !== "undefined" && FLY, typeof JET !== "undefined" && JET]) if (o && o.on && o.x !== undefined) who.push({ x: o.x, y: o.y ?? SEA_Y, z: o.z });   // Boot hat kein y: Wasserhoehe
  for (const A of AREAS) if (!areaReady(A)) for (const p of who) { const d = Math.hypot(p.x - A.x, p.z - A.z); if (d < 150 || (d < A.r && p.y < terrainH(p.x, p.z) - 1.5)) { areaEnsure(p.x, p.z); break; } }
  // naechster Bereich in Reichweite (Kamera, Spieler, aktives Fahrzeug)
  const pts = [camera.position, ...who];
  let best = null, bd = 1e9;
  for (const A of AREAS) { if (A.state === "done") continue; const d = Math.min(...pts.map(p => Math.hypot(p.x - A.x, p.z - A.z))); if (d < A.r && d < bd) { bd = d; best = A; } }
  if (!best) return;
  if (TILES.startup) { if (Math.hypot(camera.position.x - best.x, camera.position.z - best.z) < best.r) { areaRun(best, 1e9); areaFinish(best, true); } return; }
  if (!areaReady(best)) areaRun(best, TILES.loading() ? TILES.slice() : 1);   // 1 ms: die letzte Portion geht darueber (bis ca. 4 ms), so bleibt das Bild unter +5 ms
  else areaFinish(best, false);
}
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
function mergeWorldStatic(root, target = scene) {
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
    target.add(merged); out.push(merged);
    list.forEach(g => g.dispose());
  }
  return out;
}
