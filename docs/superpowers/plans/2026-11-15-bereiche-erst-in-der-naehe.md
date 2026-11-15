# Batcave und Serpentine-Details erst in der Nähe – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Netze der Batcave (Höhle oben und unten) sowie Felsen, Leitplanken, Leitpfosten und Geröll der Serpentine werden erst gebaut, wenn Kamera, Spieler oder aktives Fahrzeug näher als 600 m kommen. Gebaut wird in Portionen von höchstens 3 ms je Bild. Wo man sonst fallen würde, wird sofort fertig gebaut.

**Architecture:**
- Eine kleine Bereichs-Verwaltung (`js/kern/bereiche.js`) mit Generatoren je Bereich, die als Kachel-Aufgabe im Zeitbudget laufen.
- Während ein Bereich baut, landen `B()`/`S()`/`circles` in einer eigenen Gruppe. Die Kollision wird einzeln in `COLL.cellsX` eingetragen (`collAdd`), ohne ein volles `collBuild`.
- Am Ende fasst der Bereich seine statischen Teile mit derselben Funktion zusammen wie start.js.

**Tech Stack:** three.js 0.160, klassische Skripte mit gemeinsamen Globals (`FILES` in `sachen/batverse/index.html`). Tests sind Prüfausdrücke per `javascript_tool` in `http://localhost:4180/sachen/batverse/?debug` (`LOADT`, `renderer.info`, `frame()` von Hand, falls der Browserbereich verborgen ist).

**Spec:** `docs/superpowers/specs/2026-11-15-bereiche-erst-in-der-naehe-design.md`

## Global Constraints

- **Reichweite und Budget (Spec):** Reichweite 600 m. Höchstens 3 ms Bau je Bild, solange der Ladebildschirm steht `TILES.slice()` (30 ms). Kein Bild über +5 ms durch den Bau.
- **Beim Laden bleiben:**
  - Fahrbahn der Serpentine und Grundstücksmauer.
  - Höhlenraster `CM`/`CMU`, `caveAt`, `caveUpAt`.
  - `gates`-Einträge, `caveLights`, `world.userData.*`.
  - Alles, was eine spätere Datei beim Laden liest.
- **Zeichenaufrufe:** In der Batcave höchstens +15 gegenüber vorher (gemessen 276 aus der Batcave-Ansicht der Leistungsmessung).
- **Sofortiger Fertigbau** (`areaEnsure`) nur bei:
  - Teleport (Orte, Fahrzeuge, „Hierhin teleportieren“),
  - „Fahrzeug holen“ und Einsteigen (`summonVehicle`, `useCar`),
  - Halt des Personenaufzugs bzw. des Autoaufzugs in der Höhle,
  - Wechsel vom Geist zum Begehen (`ghostToWalk`).

  Geist und „Von unten“ bauen in Portionen.
- **Regeln:** neue Datei nur in `FILES`, nicht in `ASSETS`. Nach jedem Task `CACHE` in `sw.js` +1, `CLAUDE.md` nachführen und committen mit `git -c user.email=227780975+n-brand@users.noreply.github.com -c user.name="Nicolas Brand" commit`. Kein Co-Authored-By, nie pushen.

## Review Focus

1. **Fahrzeuge in der Batcave beim Annähern:** Geparkte Fahrzeuge (Tumbler, Batpod, Concept Cars) dürfen nicht durch den Boden fallen oder in Wänden stehen, solange der Bereich noch baut. Fahrzeuge in der Nähe ruhen (`carFrame`, > 80 m). Beim ersten Wecken muss der Bereich fertig sein (Task 4).
2. **Aufzug in die Höhle mit noch nicht fertigem Bereich:** Man darf beim Ankommen nicht in eine leere Höhle treten (Task 4: `areaEnsure` beim Halt).
3. **Zufall:** Die Felsen bei Wasserfall und Steilküste dürfen sich nach Task 1 nicht noch einmal ändern, egal ob die Serpentine schon gebaut ist (Task 1/3).
4. **Untergrund ausblenden:** Gebaute Höhlennetze gehören zu `UNDERGROUND` und folgen `ugVis`. Oben auf dem Plateau sieht man sie nicht (Task 2/3).
5. **Teleport aus Gotham in die Batcave:** Ein Ruckler von etwa 0,25 s ist erlaubt. Danach steht man auf Boden, und Kollision mit Wänden ist da (Task 4).

---

### Task 1: Eigener Zufall für jeden Felsen-Nutzer

**Files:**
- Modify: `js/gelaende/felsen.js`: `makeRock(sx, sy, sz, seed, detail = 4, rnd = rockR)`, alle `rockR()` im Inneren über `rnd`.
- Modify: `js/strassen/serpentine-bau.js`, `js/gelaende/wasserfall.js`, `js/gelaende/steilkueste.js`: je ein eigener Zufall (`rng(...)` mit festem Startwert), der an `makeRock` geht.

**Interfaces:**
- Produces: `makeRock(..., rnd)`. Danach ist die Gestalt jedes Felsens unabhängig davon, ob und wann andere Felsen gebaut werden.

- [ ] **Step 1: Prüfausdruck (soll scheitern).**
  ```js
  const a = makeRock(2, 1, 2, 0.3, 3, rng(7)), b = makeRock(2, 1, 2, 0.3, 3, rng(7));
  a.attributes.position.array.every((v, i) => v === b.attributes.position.array[i])   // erwartet: true
  ```
  Expected vorher: `false`, weil der globale `rockR` weiterläuft.
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.** Prüfausdruck ergibt true. Bildschirmfotos von Serpentine, Wasserfall und Steilküste vorher und nachher. Die Felsen sehen anders aus, das ist einmalig erwartet und wird Nicolas gemeldet.
- [ ] **Step 4: Cache, CLAUDE.md, Commit.**

### Task 2: Bereichs-Verwaltung und gemeinsames Zusammenfassen

**Files:**
- Create: `js/kern/bereiche.js`, in `FILES` nach `kern/basis.js`.
- Modify: `js/kern/basis.js`:
  - `B()` und `cyl()`: Vorgabe-Eltern ist `AREA_PARENT || world`.
  - `S()` und der `solid`-Zweig gelten auch für `AREA_PARENT`.
- Modify: `js/kern/start.js`: Das Zusammenfassen wird zur Funktion `mergeStatic(root, opt) -> [netze]`. Gleiche Regel wie heute, start.js ruft sie für die Szene auf.

**Interfaces:**
- Produces:
  - `AREAS`, `areaAdd({ id, x, z, r = 600, gen })`. `gen` ist eine Generator-Funktion und baut mit `B`/`cyl`/`S`/`circles.push` wie bisher.
  - `areaEnsure(x, z)`: baut alle Bereiche, deren Kreis den Punkt enthält, sofort fertig.
  - `areaState(id) -> "wait" | "run" | "done"`.
- Ablauf eines Schritts:
  - Vorher wird `AREA_PARENT` auf die Gruppe des Bereichs gesetzt.
  - Danach werden die neuen Einträge in `solids`/`circles` herausgenommen und per `collAdd` eingetragen, sodass kein `collBuild` entsteht.
- Am Ende:
  - `mergeStatic(gruppe)` fasst die Teile zusammen.
  - Teile unter dem Gelände kommen in `UNDERGROUND` und werden auf `ugVis` gesetzt.
- Kachel-Aufgabe:
  - Im ersten Bild laufen nur Bereiche, in deren Kreis die Kamera steht, sonst Budget 3 ms (`TILES.loading()`: 30).
  - Abstand gemessen zu Kamera, Spieler und aktivem Fahrzeug, der kleinste zählt.

- [ ] **Step 1: Prüfausdruck (soll scheitern).** Testbereich mit 200 Quadern bei (5000, 5000), Kamera weit weg:
  ```js
  areaAdd({ id: "test", x: 5000, z: 5000, r: 50, gen: function* () { for (let i = 0; i < 200; i++) { B(5000 + i, 5000.5 + i, 0, 1, 5000, 5001, mat.dark); if (i % 20 === 19) yield; } } });
  [areaState("test"), (areaEnsure(5000, 5000), areaState("test")), collNear(5010, 5011, 5000, 5001)[0].length > 0, solids.some(s => s.x0 === 5010)]
  // erwartet: ["wait", "done", true, false]
  ```
  Expected vorher: `ReferenceError: areaAdd is not defined`.
- [ ] **Step 2: Umsetzen.** start.js nutzt `mergeStatic`.
- [ ] **Step 3: Prüfen.**
  - Prüfausdruck stimmt.
  - Zeichenaufrufe und Dreiecke an Manor, Gotham und Batcave sind ohne Bereiche gleich wie vorher.
  - `LOADT.merge` ist ungefähr gleich.
  - Testbereich wieder entfernen.
- [ ] **Step 4: Cache, CLAUDE.md, Commit.**

### Task 3: Batcave als Bereich

**Files:**
- Modify: `js/hoehle/hoehle-unten.js`, `js/hoehle/hoehle-oben.js`: Die Netzteile der beiden Blöcke werden zu `areaAdd({ id: "batcave", x: SHAFT.cx, z: SHAFT.cz, r: 600, gen })`, ein Bereich für beide Dateien.
- Ein Generator je Datei ist in Ordnung. Für „ein Bereich“ zählt, dass beide gemeinsam zusammengefasst werden, also eine Gruppe; der zweite `areaAdd` hängt sich an.
- Beim Laden bleiben: Raster, `caveLights`, `gates`-Einträge (Hebebühne, Felstor, Gruppen-Objekte dafür), `world.userData.*`, Teleport-relevante Werte und alles, was eine spätere Datei beim Laden liest. Prüfen: `grep` nach den Namen beider Dateien in allen späteren Dateien.
- `yield` etwa alle 1–2 ms Arbeit, also alle paar Hundert Zellen bzw. nach jedem Bauteil.

**Interfaces:**
- Consumes: `areaAdd`, `areaEnsure` (Task 2).
- Produces: `areaState("batcave")`.

- [ ] **Step 1: Prüfausdruck (soll scheitern).** Nach dem Laden mit Startansicht Gotham: `areaState("batcave")` ergibt `"wait"`, und `LOADT.times` für hoehle-unten.js plus hoehle-oben.js liegt unter 170 ms. Vorher ca. 390 ms, `areaState` fehlt.
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.**
  - Prüfausdruck stimmt.
  - Teleport „Batcave“ aus Gotham: danach `areaState` = `"done"`, Boden und Wände halten (laufen, Rand des Sees).
  - Zeichenaufrufe in der Batcave-Ansicht der Leistungsmessung: höchstens 291.
  - Bildschirmfotos gleiche Kamera vorher und nachher: Batcave unten, oben, Hangar.
  - Oben auf dem Plateau sind die Höhlennetze unsichtbar.
  - Annähern im Geist von Gotham zur Manor: längstes Bild höchstens +5 ms gegenüber ohne Bau.
- [ ] **Step 4: Cache, CLAUDE.md, Commit.**

### Task 4: Sofortiger Fertigbau an den Übergängen

**Files:**
- Modify:
  - `js/ui/teleport.js` (`teleportToPoint`, `teleportTo`),
  - `js/fahrzeuge/fahren.js` (`summonVehicle`, `useCar`),
  - `js/aufzuege/personenaufzug.js` (Halt Höhle oben bzw. unten, beim Losfahren dorthin),
  - `js/aufzuege/autoaufzug.js` (Losfahren zu einem Halt in der Höhle),
  - `js/spieler/laufen.js` (`ghostToWalk`).
- Geparkte Fahrzeuge: Ein Fahrzeug, das in einem nicht fertigen Bereich steht, wird vor dem Wecken (`carFrame`, Bodenprüfung) fertig gebaut, per `areaEnsure` an seiner Stelle.

- [ ] **Step 1: Prüfausdrücke (sollen scheitern).** Jeweils frisch geladen, Startansicht Gotham:
  - (a) `teleportToPoint` in die Halle der unteren Höhle: Danach steht `player.pos.y` auf dem Hallenboden ±0,2, und `areaState` ist `"done"`.
  - (b) Personenaufzug vom EG zur Höhle unten (`pickStop` und Fahrt mit `walkStep`/`updateLift`): beim Ankommen `"done"`.
  - (c) „Fahrzeug holen“ Tumbler (steht in der Batcave) aus Gotham: Er erscheint und fährt.
  - (d) Geist bis 20 m über die Hebebühne fliegen, dann `ghostToWalk`: Man steht auf Boden.
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.** Alle Prüfausdrücke stimmen. Zusätzlich vom Garagenplatz in den Autoaufzug fahren und hinunter in die Batcave: Man fährt hinaus und fällt nicht.
- [ ] **Step 4: Cache, CLAUDE.md, Commit.**

### Task 5: Serpentine-Details als Bereich, Messung

**Files:**
- Modify: `js/strassen/serpentine-bau.js`: Felsen (ab „---- Felsen“), Geröll, Leitplanken, Brüstung und Leitpfosten werden zu `areaAdd({ id: "serpentine", x: <Mitte SERP>, z: <Mitte SERP>, r: 600, gen })`. Asphalt, Bankett, Hauptstrasse und Zufahrt bleiben beim Laden (Spec, Nicolas).

**Interfaces:**
- Consumes: Task 1 (eigener Felsen-Zufall), Task 2.

- [ ] **Step 1: Prüfausdruck (soll scheitern).** Nach dem Laden: `areaState("serpentine")` ergibt `"wait"`, und `LOADT.times` für serpentine-bau.js liegt unter 40 ms (vorher ca. 113 ms).
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.**
  - Prüfausdruck stimmt.
  - Teleport an die Serpentine: Felsen und Planken sind da und halten. Das ist die alte Prüfung „Felsen mit voller Kollision“, mit dem Batpod quer gegen einen Felsen.
  - Fahrt von Gotham zur Manor mit dem Polizeiauto: kein Bild über +5 ms.
  - **Gesamtmessung:** `LOADT`-Summe und `LOADT.frame1` vorher und nachher, erstes Bild und Ladebildschirm über die Uhr bei sichtbarem Browserbereich, Zeichenaufrufe an Manor und Batcave.
- [ ] **Step 4: Cache, CLAUDE.md (Abschnitt Bereiche komplett), Commit, Zahlen an Nicolas.**
