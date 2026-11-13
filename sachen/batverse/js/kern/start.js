// Batverse – Zusammenfassen, Start der Schleife, ?debug
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Statische Quader/Zylinder je Material zu einem Netz zusammenfassen (weniger Zeichenaufrufe)
const UNDERGROUND = [];
{
  scene.updateMatrixWorld(true);
  const groups = new Map(), gone = [];
  scene.traverse(o => {
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
  for (const { m, cast, recv, ug, list } of groups.values()) {
    const merged = new THREE.Mesh(mergeGeometries(list, false), m);
    merged.castShadow = cast; merged.receiveShadow = recv; if (ug) { merged.name = "Untergrund"; UNDERGROUND.push(merged); }
    scene.add(merged);
    list.forEach(g => g.dispose());
  }
}
// Untergrund oben ausblenden (Nicolas 2026-11-13: "wenn man oben ist, Hoehlen/Batcave entladen"): sichtbar nur, wenn die Kamera unter dem Gelaende ist,
// "Von unten" an ist oder die Kamera naeher als 60 m und tiefer als 20 m ueber dem Boden an einem Zugang ist (Waterfall Exit, Westweg-Tunnel, Silo, Garagenrampe, Meerestunnel; sonst saehe man
// durch die Oeffnung ins Leere). Spart oben ca. 0,2-0,8 ms und 50-120 Zeichenaufrufe.
// auch bewegliche Gruppen ganz unter der Erde (Drehscheibe, Tore und Geraete der Batcave; Fahrzeuge regelt fahren.js)
{ const bb = new THREE.Box3(), c = new THREE.Vector3(); for (const o of scene.children) { if (!o.userData.dynamic || VEH.some(v => v.g === o)) continue; bb.setFromObject(o); if (bb.isEmpty()) continue; bb.getCenter(c); if (bb.max.y < terrainH(c.x, c.z) - 1.5 && seaD(c.x, c.z) < -40) UNDERGROUND.push(o); } }
const UG_PORTALS = [[-107, -186], [HF_XP, HF_CZ], [SILO.x, SILO.z], ...SEA_TUNNEL.slice(-2)];   // Meerestunnel nur am Ausgang zur Bucht   // Garagenrampe nur, solange ihre Klappe offen ist (GRAMP.f)
let ugVis = true;
scene.onBeforeRender = (r, sc, cam) => { const p = cam.position; gHideStep(cam);   // Gotham-Zellen weit weg aus (gotham-gelaende.js)
  const want = belowView || p.y < terrainH(p.x, p.z) - 0.5 || (p.y < terrainH(p.x, p.z) + 20 && (GRAMP.f > 0.01 && (p.x - 15.5) ** 2 + (p.z - 30) ** 2 < 3600 || UG_PORTALS.some(([x, z]) => (p.x - x) ** 2 + (p.z - z) ** 2 < 3600)));   // nur nah (60 m) und tief (bis 20 m ueber dem Boden)
  if (want !== ugVis) { ugVis = want; for (const m of UNDERGROUND) m.visible = want; } };
requestAnimationFrame(() => { $("loading").remove(); });
frame();

// ?debug: Spieler und Umrechnung von aussen steuerbar (fuer Tests im Browser)
if (location.search.includes("debug")) {
  window.manorDebug = { TERR, setTerrainDetail, TILES, tilesUpdate, setTileRange, perfToggle, collNear, COLL, pushOut, supportAt, player, update: updatePlayer, setWalk, startWalk, startGhost, ghostStep, isGhost: () => ghost, terrainH, genH, forestD, LAKES, HOUSE, LIFT, updateLift, useLift, MAPS, showMap, seaD, groundAt, supportAt, SERP, serpNear, carLift: () => CAR_LIFT, WATER_CAVES, SEA_STACKS, waterCaveAt, GARAGE, HILL, plateauH, plateauSD, STOPS, caveAt, caveUpAt, toCave, LY, UY, STW, pickStop, stepStop, BOAT, useBoat, boatStep, boatReturn, WFT, MAIN, ZUF, roadNear, VEH, get CAR() { return CAR; }, ENGINE, useCar, carStep, carFrame, carReset, boatFree, waterAt, gates, toggleGate, findAimedGate, updateGates, solids, circles, camera, controls, renderer, scene, mp, mapMesh };
}
