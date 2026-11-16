// Batverse – Zusammenfassen, Start der Schleife, ?debug
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Statische Quader/Zylinder je Material zu einem Netz zusammenfassen (weniger Zeichenaufrufe)
const UNDERGROUND = [];
{ const tM = performance.now();                                         // Messung (Leistung 2026-11-15): LOADT.merge
  for (const m of mergeWorldStatic(scene)) if (m.name === "Untergrund") UNDERGROUND.push(m);   // mergeWorldStatic: kern/bereiche.js
  if (window.LOADT) LOADT.merge = Math.round(performance.now() - tM); }
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
// Ladebildschirm bis die Gotham-Baustellen stehen (Nicolas 2026-11-15: sie laden als Letztes; Strassen und Baustellen bauen sich als Kachel-Aufgabe
// in den ersten Bildern auf, die Schleife laeuft darunter weiter). Hoechstens 30 s, dann geht er trotzdem weg.
{ const t0 = performance.now(), st = document.querySelector("#loading .ld-step");
  const tick = () => { const L = $("loading"); if (!L) return; if ((GBST.done && GGEB.done) || performance.now() - t0 > 30000) return L.remove();
    if (st) st.textContent = !GSTR.done ? "Gotham: Straßen …" : !GGEB.done ? "Gotham: Gebäude …" : "Gotham: Baustellen …"; requestAnimationFrame(tick); };
  requestAnimationFrame(tick); }
{ const L = window.LOADT || {}, tu = tilesUpdate, rr = renderer.render; L.tiles1 = 0; L.render1 = 0;   // erstes Bild aufschluesseln
  tilesUpdate = function (...a) { const t = performance.now(), r = tu.apply(this, a); L.tiles1 += performance.now() - t; return r; };
  renderer.render = function (...a) { const t = performance.now(), r = rr.apply(this, a); L.render1 += performance.now() - t; return r; };
  const t = performance.now(); frame(); L.frame1 = Math.round(performance.now() - t); L.tiles1 = Math.round(L.tiles1); L.render1 = Math.round(L.render1); tilesUpdate = tu; renderer.render = rr; }

// ?debug: Spieler und Umrechnung von aussen steuerbar (fuer Tests im Browser)
if (location.search.includes("debug")) {
  window.manorDebug = { TERR, setTerrainDetail, TILES, tilesUpdate, setTileRange, perfToggle, collNear, COLL, pushOut, supportAt, player, update: updatePlayer, setWalk, startWalk, startGhost, ghostStep, isGhost: () => ghost, terrainH, genH, forestD, LAKES, HOUSE, LIFT, updateLift, useLift, MAPS, showMap, seaD, groundAt, supportAt, SERP, serpNear, carLift: () => CAR_LIFT, WATER_CAVES, SEA_STACKS, waterCaveAt, GARAGE, HILL, plateauH, plateauSD, STOPS, caveAt, caveUpAt, toCave, LY, UY, STW, pickStop, stepStop, BOAT, useBoat, boatStep, boatReturn, WFT, MAIN, ZUF, roadNear, VEH, get CAR() { return CAR; }, ENGINE, useCar, carStep, carFrame, carReset, boatFree, waterAt, gates, toggleGate, findAimedGate, updateGates, solids, circles, camera, controls, renderer, scene, mp, mapMesh };
}
