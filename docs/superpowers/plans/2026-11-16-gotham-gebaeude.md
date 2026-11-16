# G3/G4 Gotham-Gebäude – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die 1657 Füllbau-Flächen werden Gebäude aus 6 Vorlagen nach Wohlstand und Höhe. Fern sind es schlichte Hüllen (Skyline bis ca. 3 km), nah bekommen sie Anbauten, Schatten und Kollision. Die Baustellen BS-01 … BS-08 bleiben.

**Architecture:**
- Eine neue Vorlagen-Datei `js/gotham/gebaeude-vorlagen.js`, die auch die Werkstatt lädt. Sie enthält gemeinsame Materialien und die Geometrie je Vorlage als Eimer je Material.
- Eine neue Spiel-Datei `js/gotham/gotham-gebaeude.js` mit:
  - Liste, Vorlagenwahl, Hüllen als Kachel-Aufgabe mit Zwischenspeicher, `gsplit` in 768-m-Zellen mit eigener Fern-Ausblendung
  - Nahdetails und Schatten-Hüllen je 128-m-Zelle in Portionen
  - Kollision je 128-m-Zelle über `dkAdd`
- Die Baustellen-Datei baut nur noch BS-…

**Tech Stack:** three.js 0.160, klassische Skripte mit gemeinsamen Globals (`FILES` in `sachen/batverse/index.html`). Getestet wird mit Prüfausdrücken per `javascript_tool` in `http://localhost:4180/sachen/batverse/?debug` und `…/werkstatt/`. Vorschau „random“, Port 4180.

**Spec:** `docs/superpowers/specs/2026-11-15-gotham-gebaeude-design.md`

## Global Constraints

- **Geschosse:** mindestens 4,7 m. N = max(1, round(h / 4,7)), Höhe = N × 4,7 plus Dachkante. Fabrik und Lagerhalle haben eine Halle von clamp(h, 6, 12) m.
- **Vorlagenwahl** wie in der Spec-Tabelle, mit Wohlstand des Bezirks an der Flächenmitte.
- **Leistung:**
  - In Gotham höchstens ca. +1,5 ms je Bild (Desktop).
  - Kein Bild über ca. 4 ms durch Aufbau. Ausnahme ist die Ladezeit mit 30-ms-Scheibe.
  - Keine eigenen Texturen je Gebäude.
- **Ladebildschirm:** wartet auch auf die Hüllen (`GGEB.done`, höchstens 30 s wie heute).
- **Skyline:** Hüllen sichtbar bis ca. 3 km bzw. `camera.far`, nicht nach der `gHideStep`-Regel.
- **Schatten:** Hüllen `castShadow = false`, `receiveShadow = true`. Schatten werfen nur Nahdetails und Schatten-Hüllen im Nahradius.
- **Nahradius:** 200 m (Handy `TILES.mobile` 120 m), Abbau ab Radius + 40 m.
- **Kollision:** Wände und Dach sind fest, Anbauten nicht. Die Kollision sitzt 0,3 m innerhalb der Fassade (Regel: Barrieren weiter innen).
- **IDs** FB-… bleiben. Die Planungskarte und `stadt.js` werden nicht geändert.
- **Regeln für jeden Task:**
  - Neue Welt-Dateien kommen in `FILES`, nicht in `ASSETS`. `gebaeude-vorlagen.js` kommt zusätzlich in `ASSETS` und `BV_KEEP` (Werkstatt).
  - Nach jedem Task `CACHE` in `sw.js` +1 (jetzt `random-v341`) und `CLAUDE.md` nachführen.
  - Commit mit `git -c user.email=227780975+n-brand@users.noreply.github.com -c user.name="Nicolas Brand" commit`, ohne Co-Authored-By, ohne Erwähnung von Claude, nie pushen.
  - `js/fahrzeuge/vorlage.js` nie committen.
  - Code-Stil kompakt wie der Rest.

## Review Focus

1. **Gebäude dürfen nicht auf Fahrbahn, Gehsteig, Rampenöffnung, Deckplatte oder Wayne-Tower-Vorplatz stehen.** Grundriss wie die Baustellen eingezogen (`gbstInset`). Test in Task 2: keine Hüllen-Ecke mit `GSTR.onRoad(x, z, 0) || GSTR.walkAt(x, z)`.
2. **Ladebildschirm mit und ohne Zwischenspeicher:** Beim ersten Start wird gerechnet, beim zweiten kommt alles aus dem Speicher. Beide Male gleiche Dreiecke und gleiche Register-Einträge, kein Hängen über 30 s (Task 2).
3. **Schnell fahren oder fliegen** (150 km/h, The Bat): Die Kollision der Zelle steht, bevor man ankommt. Nahdetails dürfen kurz fehlen, aber nicht ruckeln (Task 3/4).
4. **Tag/Nacht-Wechsel:** Die Fenster leuchten nachts, und die Leuchtstärke wird nicht jedes Bild neu gesetzt, wenn sich nichts ändert (Task 2).
5. **Handy:** kleinerer Nahradius, Dreiecke und Zeichenaufrufe gemessen (Task 5).

---

### Task 1: Vorlagen (gemeinsame Materialien und Geometrie), Werkstatt

**Files:**
- Create: `js/gotham/gebaeude-vorlagen.js`
- Modify: `werkstatt/index.html` (Skriptliste: neue Datei nach `../js/gotham/fuellbau.js`), `werkstatt/werkstatt.js` (Vorlagen-Reihe statt bzw. neben `FUELLBAU`), `../../sw.js` (ASSETS, BV_KEEP, CACHE), `../../CLAUDE.md`

**Interfaces:**
- Produces:
  - `GBV` mit:
    - `GBV.TYPES = ["kratzer", "buero", "laden", "miet", "fabrik", "lager"]`
    - `GBV.GH = 4.7`
    - `GBV.mats` (gemeinsame Materialien, einmalig erzeugt bei `gbvInit()`)
    - `GBV.night(k)`: setzt die Leuchtstärke aller Fassaden-Materialien, k = 0..1
  - `gbvPick({ h, area, wohl, bezirk, id }) -> { type, N, H, glas }`: Vorlage, Geschosszahl, Hüllenhöhe in m und für Wolkenkratzer Glas oder Stein.
  - `gbvShell(o, out)` mit `o = { P0:[x,z], e1:[ux,uz], e2:[vx,vz], L1, L2, front:0..3, type, N, H, glas, seed, fire:[bool×4], y }`. Die Hülle kommt in Spielkoordinaten in `out` (Map Material-Schlüssel → { p:[], n:[], uv:[], c:[] }). Rückgabe: Anzahl Dreiecke.
  - `gbvDetails(o, out)`: dasselbe für die Anbauten.
    - Läden mit Schaufenster, Markise und Schild am Erdgeschoss der Front (Laden, Miet)
    - Feuertreppe (Miet)
    - Wassertank, Treppenhaus und Lüftung auf dem Dach (Miet, Laden, Büro)
    - Vordach (Büro, Kratzer)
    - Tore und Rampe (Fabrik, Lager)
    - Rückgabe: Dreiecke.
  - `gbvMesh(out) -> THREE.Group`: je Material ein Mesh, für Werkstatt und Tests.
- **Fassaden-Materialien:** eines je Art (Ziegel-Fenster, Stein-Büro, Glas, Fabrik, Wellblech, Brandwand, Erdgeschoss-Laden, Dach).
  - `map` und `emissiveMap` (zufällig helle Fenster, 8 × 4 Achsen wie der Entwurf), RepeatWrapping.
  - UV in Fensterachsen: u = m / 3, v = m / 4,7.
  - Die Leuchtkacheln werden je Gebäude über einen UV-Versatz aus dem `seed` verschoben.
- **Wolkenkratzer:** Rücksprung ab 40 % der Höhe, wenn L1 und L2 ≥ 30 m (oberer Teil je Seite 4 m eingezogen).
- **Brandwand:** Seiten mit `fire[k]` bekommen das Brandwand-Material.

- [ ] **Step 1: Prüfausdrücke in der Werkstatt (sollen scheitern, `GBV` fehlt).**
  ```js
  gbvInit(); const res = {}; for (const t of GBV.TYPES) { const out = new Map(); const n = gbvShell({ P0: [0, 0], e1: [1, 0], e2: [0, 1], L1: 30, L2: 24, front: 2, type: t, N: t === "kratzer" ? 30 : 6, H: t === "kratzer" ? 141 : 28.2, glas: true, seed: 5, fire: [false, true, false, false], y: 0 }, out); res[t] = [n, out.size]; } res
  // erwartet: jede Vorlage n > 0, n <= 400 (Hülle), out.size >= 2
  ```
  ```js
  [gbvPick({ h: 120, area: 1200, wohl: 0.95, bezirk: "Uptown", id: "FB-0001" }).type, gbvPick({ h: 10, area: 300, wohl: 0.3, bezirk: "Oststadt", id: "FB-0002" }).type, gbvPick({ h: 15, area: 2000, wohl: 0.25, bezirk: "Fabrikviertel", id: "FB-0003" }).type, gbvPick({ h: 27, area: 600, wohl: 0.6, bezirk: "Südseite", id: "FB-0004" }).type]
  // erwartet: ["kratzer", "laden", "fabrik" oder "lager", "buero"]
  ```
  ```js
  const p = gbvPick({ h: 26.7, area: 574, wohl: 0.45, bezirk: "Oststadt", id: "FB-0009" }); [p.N, +(p.H / p.N).toFixed(2)]   // erwartet: [6, 4.7]
  ```
- [ ] **Step 2: Umsetzen.**
  - Bauteile aus `buildFuellbau` übernehmen (Backstein-Canvas, Schaufenster, Markise, Feuertreppe, Wassertank), aber auf `GBV.mats` und Eimer umstellen.
  - Werkstatt: alle 6 Vorlagen nebeneinander (Hülle und Details), Rechtsklick-ID `GBV-<type>`.
  - Den Entwurf `buildFuellbau` lassen und als Entwurf markieren.
- [ ] **Step 3: Prüfen.**
  - Prüfausdrücke wie erwartet.
  - Bildschirmfoto der Werkstatt mit den 6 Vorlagen, Tag und Nacht (`GBV.night(1)`).
  - Verteilung über die echten Daten in der Werkstatt (stadt.js und daten.js laden): ungefähr Kratzer 338, Büro 567, Laden 372, Miet 316, Fabrik/Lager 64 (±10 %).
- [ ] **Step 4: Commit.**

### Task 2: Hüllen im Spiel, Register, Ladebildschirm, Nacht, Skyline

**Files:**
- Create: `js/gotham/gotham-gebaeude.js`
- Modify:
  - `index.html` (FILES: `gotham/gebaeude-vorlagen.js`, `gotham/gotham-gebaeude.js` nach `gotham/gotham-baustellen.js`)
  - `js/gotham/gotham-baustellen.js` (`gbstList` nur noch BS-…, die Füllbau-Hilfen `gbstFrame`/`gbstInset`/`gbstGate` bleiben gemeinsam)
  - `js/gotham/gotham-gelaende.js` (`gsplit` Option `far: true`: Mesh in `GHIDE_FAR` statt `GHIDE`; `gHideStep` blendet `GHIDE_FAR` erst ab `camera.far` aus)
  - `js/kern/start.js` (Ladebildschirm wartet auf `GBST.done && GGEB.done`; `.ld-step` zeigt „Gotham: Gebäude …“)
  - sw.js, CLAUDE.md

**Interfaces:**
- Consumes: `GBV`, `gbvPick`, `gbvShell`, `gbvMesh` (Task 1), `gbstFrame`, `gbstInset`, `gbstGate`, `gbstRand`, `gsplit`, `bautAdd`, `TILES.tasks`.
- Produces:
  - `GGEB = { list, done, Y: GOT.STR, CC: 128, cells, live, tris, meshes }`
  - `GGEB.list[i] = { id, poly (eingezogen), cx, cz, h, wohl, bezirk, type, N, H, glas, front, fire, F (gbstFrame) }`
  - `ggebBuild()`: alles auf einmal ohne Zwischenspeicher, für Tests
  - `GGEB.cells`: Map 128-m-Zelle → Gebäude
- **Zwischenspeicher** IndexedDB-Eintrag `GGEB`:
  - Schlüssel `TH_HASH` + Prüfsummen von `gotham-gebaeude.js`, `gebaeude-vorlagen.js`, `stadt.js`, `gotham-strassen.js`
  - Inhalt: Netze, Einzüge, Fronten, Brandwände
- **Brandwand-Regel:** Seite k ist Brandwand, wenn ein anderes Gebäude-Rechteck unter 2 m Abstand parallel daneben liegt. Vorschlag: Probe 1 m nach aussen an 3 Punkten der Seite liegt in einem anderen Grundriss, Suche über `GGEB.cells`.
- **Register:** `bautAdd({ id, name: <Vorlagenname>, art: "Füllbau", poly, y0: Y - 1, y1: Y + H + 2, info: bezirk + " · " + N + " Geschosse · " + Math.round(H) + " m" })`.
- **Nacht:** Je Bild aus der Aufgabe oder aus `wtStep`-artiger Funktion `ggebStep()` (schleife.js) wird `GBV.night(night)` nur bei einer Änderung aufgerufen.

- [ ] **Step 1: Prüfausdrücke im Spiel (sollen scheitern).**
  ```js
  ggebBuild(); [GGEB.list.length, GBST.list.length, GGEB.list.every(b => b.N >= 1)]   // erwartet: [1657, 8, true]
  ```
  ```js
  // nichts auf Fahrbahn/Gehsteig
  GGEB.list.filter(b => b.poly.some(([x, z]) => GSTR.onRoad(x, z, 0) || GSTR.walkAt(x, z))).length   // erwartet: 0 (oder nur Fälle mit Einzug [0,0,0,0], dann im Ledger begründen)
  ```
  ```js
  const b = GGEB.list.find(q => q.id === "FB-0001"), e = bautAt(b.cx, GOT.STR + 5, b.cz); [e && e.id, e && e.art]   // erwartet: ["FB-0001", "Füllbau"]
  ```
  ```js
  // Skyline: von der Manor (Orbit-Kamera bei 0/120/0, Blick nach Gotham) sind Hüllen-Meshes sichtbar
  camera.position.set(0, 120, 0); camera.lookAt(-2050, -12, 300); gHideStep(camera); GHIDE_FAR.filter(o => o.visible).length > 0   // erwartet: true
  ```
- [ ] **Step 2: Umsetzen** (Generator mit `yield` je ca. 40 Gebäude wie gbstGen, Aufgabe mit `TILES.slice()`, `yield "wait"` beim Warten).
- [ ] **Step 3: Prüfen.**
  - Prüfausdrücke wie erwartet.
  - Zweimal laden: beim zweiten Mal kommen die Hüllen aus dem Speicher (Messpunkt `GGEB.fromCache`), mit gleichen `GGEB.tris` und gleichen Register-Einträgen.
  - Ladebildschirm bis fertig, Zeit notieren.
  - Bildschirmfotos: Gotham von oben, von der Manor (Skyline), Strassenhöhe, Nacht.
  - Bildzeit und Zeichenaufrufe in Gotham vorher und nachher (Ziel höchstens +1,5 ms).
- [ ] **Step 4: Commit.**

### Task 3: Nahdetails und Schatten in der Nähe

**Files:**
- Modify: `js/gotham/gotham-gebaeude.js`, `js/kern/schleife.js` (Aufruf `ggebNearStep()` je Bild), sw.js, CLAUDE.md

**Interfaces:**
- Consumes: `gbvDetails`, `GGEB.cells`, `GBV.mats`.
- Produces:
  - `GGEB.near`: Map 128-m-Zelle → { grp, state }
  - `ggebNearStep()`: Fokus wie `gbstCollStep`, also Spieler bzw. aktives Fahrzeug, sonst Kamera
- **Ablauf:**
  - Zellen, deren Mitte näher als Radius + 64 m ist, werden gebaut. Ab Radius + 40 + 64 m werden sie entfernt (dispose der Geometrie).
  - Gebaut wird in Portionen: Generator je Zelle mit `yield` je Gebäude, höchstens ca. 3 ms je Bild.
  - Je Zelle eine Gruppe mit einem Mesh je Material (`castShadow = true`).
  - Dazu ein **Schatten-Hüllen-Mesh** mit den Hüllen der Zelle, Material `colorWrite: false, depthWrite: false`, `castShadow = true`. Es erscheint nur im Schattenbild.

- [ ] **Step 1: Prüfausdrücke (sollen scheitern).**
  ```js
  const [gx, gz] = GOT.toGame(-2050, 40); startWalk(gx, gz, 0); for (let i = 0; i < 120; i++) frame(); [GGEB.near.size > 0, [...GGEB.near.values()].every(c => c.state === "done")]   // erwartet: [true, true]
  ```
  ```js
  // Portionen: längster Schritt
  GGEB.nearMax < 4   // erwartet: true (gemessen über einen Teleport quer über die Insel und 200 Bilder)
  ```
  ```js
  // Abbau: weit weg
  teleportToPoint({ x: 0, y: HILL, z: 0 }); for (let i = 0; i < 200; i++) frame(); GGEB.near.size   // erwartet: 0
  ```
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.**
  - Prüfausdrücke wie erwartet.
  - Fahrt mit dem Polizeiauto 30 s mit 150 km/h quer über die Insel: `GGEB.nearMax` und die längste Bildzeit notieren.
  - Bildschirmfoto Strassenhöhe mit Läden, Feuertreppe und Schatten, Tag und Nacht.
- [ ] **Step 4: Commit.**

### Task 4: Kollision (Wände, begehbares Dach)

**Files:**
- Modify: `js/gotham/gotham-gebaeude.js`, `js/kern/schleife.js` (`ggebCollStep()` neben `gbstCollStep()`), sw.js, CLAUDE.md

**Interfaces:**
- Consumes: `dkAdd`/`dkRemove` (`kern/drehkoll.js`), `GGEB.cells`.
- Produces:
  - `GGEB.coll`: Map Zelle → Liste der dk-Teile
  - `ggebCollStep()`: 3 × 3 Zellen um Spieler bzw. aktives Fahrzeug, je Bild höchstens eine Zelle anlegen oder entfernen, Anlegen zuerst, wie `gbstCollStep`
- **Je Gebäude** `dkAdd({ cx, cy: Y + H/2, cz, ux, uz, hl: L/2 - 0.6, hw: W/2 - 0.6, hh: H/2, m: 0.3, floor: 1 })`. Das ergibt 0,3 m innerhalb der Fassade. Die Oberseite trägt als Dach. Wolkenkratzer mit Rücksprung bekommen zwei Teile.

- [ ] **Step 1: Prüfausdrücke (sollen scheitern).**
  ```js
  // gegen die Wand laufen: Spieler bleibt draussen (Front-Mitte, 3 m davor, Blick zur Wand, 2 s W)
  const b = GGEB.list.find(q => q.type === "miet"), F = b.F, sd = gbstSides(F, 0)[b.front], o = [[0, -1], [1, 0], [0, 1], [-1, 0]][b.front];
  const [mx, mz] = F.at((sd[0] + sd[2]) / 2 + o[0] * 3, (sd[1] + sd[3]) / 2 + o[1] * 3), [cx, cz] = F.at(F.L1 / 2, F.L2 / 2);
  startWalk(mx, mz, Math.atan2(-(cx - mx), -(cz - mz))); keys.add("KeyW"); for (let i = 0; i < 120; i++) frame(); keys.delete("KeyW");
  bautAt(player.pos.x, player.pos.y + 1, player.pos.z) === null   // erwartet: true (steht vor der Wand, nicht im Grundriss)
  ```
  ```js
  // auf dem Dach stehen
  startWalk(b.cx, b.cz, 0); player.pos.y = GOT.STR + b.H + 10; for (let i = 0; i < 120; i++) frame(); Math.abs(player.pos.y - (GOT.STR + b.H)) < 0.6   // erwartet: true
  ```
  ```js
  // Polizeiauto 30 m vor derselben Front, Blick zur Wand, 3 s mit 28 m/s: hält davor
  startWalk(...F.at((sd[0] + sd[2]) / 2 + o[0] * 30, (sd[1] + sd[3]) / 2 + o[1] * 30), Math.atan2(-(cx - mx), -(cz - mz))); const v = VEH.find(c => c.spec.name === "Gotham Police"); summonVehicle(v); useCar(v);
  /* 180 Bilder: CAR.v = 28 je Bild, frame() */ bautAt(CAR.x, GOT.STR + 1, CAR.z) === null   // erwartet: true
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.**
  - Prüfausdrücke wie erwartet.
  - The Bat landet auf einem Dach (`summonBat` auf dem Dach).
  - 30 s Fahrt mit 150 km/h: jede Gebäudezelle bis 128 m ist angelegt (wie der Baustellen-Test).
  - An der Manor ist `GGEB.coll.size` 0.
- [ ] **Step 4: Commit.**

### Task 5: Abschluss und Messung

**Files:**
- Modify: `gotham/umsetzung.js` (G3/G4 status "fertig"), `PLAN-GOTHAM.md` (G3/G4 erledigt), `PLAN-GOTHAM.md` Entscheidung 8 (Baustellen nur noch BS), sw.js, CLAUDE.md

- [ ] **Step 1: Messen**, Desktop und Handy-Grösse (`resize_window mobile`), Standard-Einstellungen, AUTO-Werte vorher entfernt:
  - Ladezeit erster und zweiter Start
  - Bildzeit, Zeichenaufrufe und Dreiecke an Wayne Tower, Narrows und von der Manor mit Blick auf Gotham
  - JS-Speicher
- [ ] **Step 2: Einträge nachführen, Commit.**
