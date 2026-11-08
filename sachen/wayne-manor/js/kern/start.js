// Wayne Manor 3D – Zusammenfassen, Start der Schleife, ?debug
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Statische Quader/Zylinder je Material zu einem Netz zusammenfassen (weniger Zeichenaufrufe)
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
    const key = m.uuid + (o.castShadow ? "c" : "") + (o.receiveShadow ? "r" : "");
    if (!groups.has(key)) groups.set(key, { m, cast: o.castShadow, recv: o.receiveShadow, list: [] });
    groups.get(key).list.push(g);
    gone.push(o);
  });
  for (const o of gone) { o.parent.remove(o); o.geometry.dispose(); }
  for (const { m, cast, recv, list } of groups.values()) {
    const merged = new THREE.Mesh(mergeGeometries(list, false), m);
    merged.castShadow = cast; merged.receiveShadow = recv;
    scene.add(merged);
    list.forEach(g => g.dispose());
  }
}
requestAnimationFrame(() => { $("loading").remove(); });
frame();

// ?debug: Spieler und Umrechnung von aussen steuerbar (fuer Tests im Browser)
if (location.search.includes("debug")) {
  window.manorDebug = { player, update: updatePlayer, setWalk, startWalk, startGhost, ghostStep, isGhost: () => ghost, terrainH, genH, forestD, LAKES, HOUSE, LIFT, updateLift, useLift, MAPS, showMap, seaD, groundAt, supportAt, SERP, serpNear, carLift: () => CAR_LIFT, WATER_CAVES, SEA_STACKS, waterCaveAt, GARAGE, HILL, plateauH, plateauSD, STOPS, caveAt, caveUpAt, toCave, LY, UY, STW, pickStop, stepStop, BOAT, useBoat, boatStep, boatReturn, WFT, MAIN, ZUF, roadNear, VEH, get CAR() { return CAR; }, ENGINE, useCar, carStep, carFrame, carReset, boatFree, waterAt, gates, toggleGate, findAimedGate, updateGates, solids, circles, camera, controls, renderer, scene, mp, mapMesh };
}
