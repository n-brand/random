# T6 Gotham-Karte im Spiel – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine kleine, mitdrehende Karte unten rechts und eine grosse Karte auf Taste K, beide aus den Gotham-Daten, mit eigener Position.

**Architecture:**
- Eine neue Datei `js/ui/stadtkarte.js` mit dem Präfix `SK`.
- Sie baut einmal `Path2D`-Pfade in Kartenkoordinaten aus `GOTHAM` und `GOTHAM_STADT`. Farben und Strichstärken stammen aus `gotham/index.html`.
- **Minikarte:** Ein Hintergrundbild (0,5 px/m) wird nach dem Ladebildschirm als Kachel-Aufgabe in Portionen vorgezeichnet. Je Bild zeigt sie davon einen gedrehten, runden Ausschnitt.
- **Grosse Karte:** Ein Vollbild-Canvas zeichnet die Pfade als Vektoren, aber nur, wenn sich etwas ändert.

**Tech Stack:** Canvas 2D, klassische Skripte mit gemeinsamen Globals (`FILES` in `sachen/batverse/index.html`). Getestet wird mit Prüfausdrücken per `javascript_tool` in `http://localhost:4180/sachen/batverse/?debug` (Vorschau „random“).

**Spec:** `docs/superpowers/specs/2026-11-15-gotham-karte-im-spiel-design.md`

## Global Constraints

- **Datei und Namen:** neue Datei `js/ui/stadtkarte.js` in `FILES` direkt nach `ui/karten-overlay.js`, nicht in `ASSETS`. Alle globalen Namen beginnen mit `SK` oder `sk` (vorher mit `grep` prüfen, dass es sie noch nicht gibt).
- **Tasten:**
  - **K** öffnet und schliesst die grosse Karte, **Esc** schliesst sie.
  - **Umschalt+K** blendet die Minikarte ein und aus. Der Zustand steht in localStorage `wm-minikarte` („0“ = aus), Standard ist an.
- **Leistung:**
  - Die Minikarte kostet höchstens 0,3 ms je Bild.
  - Beim Laden kommen höchstens 10 ms dazu (nur die Pfade, kein Zeichnen).
  - Das Vorzeichnen läuft erst nach dem Ladebildschirm (`TILES.startup`/`#loading` weg), mit höchstens ca. 4 ms je Bild.
- **Planungsseite:** `gotham/index.html` wird nicht geändert.
- **Regeln für jeden Task:** Nach jedem Task `CACHE` in `sw.js` +1 (jetzt `random-v335`), `CLAUDE.md` nachführen (Abschnitt Batverse, neuer Punkt „T6 Gotham-Karte im Spiel“) und committen mit `git -c user.email=227780975+n-brand@users.noreply.github.com -c user.name="Nicolas Brand" commit`. Kein Co-Authored-By, keine Erwähnung von Claude, nie pushen, `js/fahrzeuge/vorlage.js` nie committen.

## Review Focus

1. **Tasten bei offener grosser Karte:** WASD, E, T und die Leertaste dürfen nicht ins Spiel durchgehen, und die gefangene Maus wird freigegeben. Nach dem Schliessen geht Begehen bzw. Fahren normal weiter, ohne Klick ins Leere (Task 3).
2. **Minikarte im Ladebildschirm und vor dem Vorzeichnen:** Das Laden darf nicht hängen und es darf keine Fehlermeldung geben. Solange das Bild nicht fertig ist, ist die Minikarte versteckt (Task 2).
3. **Position in jedem Modus:** Begehen, Geist, Orbit, Auto, Boot, The Bat und Jet zeigen jeweils die richtige Stelle und Richtung (Task 1).
4. **Fenstergrösse ändern / Handy hoch-quer:** Die grosse Karte füllt den Bildschirm neu, die Minikarte bleibt rund und scharf (devicePixelRatio) (Task 2/3).
5. **Ausserhalb der Karte (Manor-Wald hinter dem Anwesen, Meer) und in der Batcave:** Es gibt einen Randpfeil bzw. den Hinweis „unter Tage“, keine leere oder schwarze Karte (Task 2).

---

### Task 1: Daten, Pfade und Position

**Files:**
- Create: `js/ui/stadtkarte.js`
- Modify: `index.html` (FILES), `../../sw.js`, `../../CLAUDE.md`

**Interfaces:**
- Produces:
  - `SK` (Objekt) mit `SK.paths`: Liste von `{ p: Path2D, fill?, stroke?, w?, alpha? }` in Zeichenreihenfolge, in Kartenkoordinaten. Die Reihenfolge ist: Grund, Insel mit Ufer, Bezirke, Füllbauten, Nebenstrassen, Hauptstrassen, Brücken, Baustellen, Orte, Manor.
  - `SK.labels`: `{ x, z, text, size }` für Bezirke und Orte mit `big`.
  - `SK.view` = `GOTHAM.ansicht`.
  - `skPos()` gibt `{ mx, mz, ang, mode, under }` zurück. `ang` ist die Blickrichtung in der Karte, Bogenmass, 0 = Karten-Norden (−z), im Uhrzeigersinn. `under` ist true, wenn man unter dem Gelände ist (Batcave, Tiefgarage, untere Strasse).
- Position je Modus: Begehen (nicht Geist) `player.pos`, aktives `CAR`/`BOAT`/`FLY`/`JET` mit `.on` deren x/z, sonst `camera.position`. Richtung immer aus `camera.getWorldDirection` (x/z), umgerechnet über `GOT.toMap` zweier Punkte (Position und Position + Richtung).

- [ ] **Step 1: Prüfausdrücke (sollen scheitern, `SK` fehlt noch).**
  ```js
  // Wayne Tower: Spielpunkt aus der Karte, Position zurück
  const [gx, gz] = GOT.toGame(-2050, -100); startWalk(gx, gz, 0); frame();
  const p = skPos(); [Math.round(p.mx), Math.round(p.mz)]       // erwartet: [-2050, -100] (±2)
  ```
  ```js
  SK.paths.length > 8 && SK.paths.every(e => e.p instanceof Path2D)   // erwartet: true
  ```
  ```js
  // Richtung: Blick zu einem Kartenpunkt genau nördlich (-z) -> ang ≈ 0
  const [ax, az] = GOT.toGame(-2050, -100), [bx, bz] = GOT.toGame(-2050, -400);
  camera.lookAt(bx, camera.position.y, bz); Math.abs(Math.atan2(Math.sin(skPos().ang), Math.cos(skPos().ang))) < 0.05   // erwartet: true (nach startWalk am Punkt a)
  ```
  Expected vorher: `ReferenceError: skPos is not defined`.
- [ ] **Step 2: `stadtkarte.js` anlegen.**
  - Pfade aus `GOTHAM.insel.umriss`, `GOTHAM.bezirke`, `GOTHAM_STADT.fuell` (`c`), `neben`, `haupt`, `bruecken`, `baustellen`, `GOTHAM.orte` und `GOTHAM.manorLage` bauen.
  - Farben aus `gotham/index.html` übernehmen: Grund `#2f3d28`, Ufer `#b8a77c`, Insel `#3a3f45` mit Rand `#58606a`, Bezirke `wealthCol` mit Deckkraft 0,45, Füllbauten nach Höhe wie dort, Strassen-Rand `#15171a` und Fläche wie dort, Brücken `#b9bfc7`.
  - Wasser ist die Hintergrundfarbe des Canvas (Wasserfarbe der Karte).
  - In FILES nach `ui/karten-overlay.js` eintragen.
- [ ] **Step 3: Prüfen.** Alle drei Ausdrücke von Step 1 ergeben das Erwartete. `LOADT` bzw. ein `performance.now()` um den Aufbau zeigt höchstens 10 ms. Die Konsole ist ohne Fehler.
- [ ] **Step 4: Commit** (sw.js CACHE +1, CLAUDE.md).

### Task 2: Minikarte

**Files:**
- Modify: `js/ui/stadtkarte.js`, `index.html` (ein `<canvas id="minikarte">` im HUD), `style.css`, `js/kern/schleife.js` (Aufruf `skMiniStep()` je Bild neben `bautHoverStep`), `js/ui/bedienung.js` (Umschalt+K), sw.js, CLAUDE.md

**Interfaces:**
- Consumes: `SK.paths`, `skPos()` (Task 1).
- Produces:
  - `SK.bg`: OffscreenCanvas oder Canvas der ganzen Ansicht mit `SK.BGS` = 0,5 px/m.
  - `SK.bgDone` (bool).
  - `skMiniStep()`.
  - `skMiniToggle()`.
- **Vorzeichnen:** Kachel-Aufgabe (`TILES.tasks.push`, Muster wie `steilkueste.js`: `if (TILES.startup || this.done) return false`). Ein Generator zeichnet `SK.paths` in Portionen: Füllbauten je 300 Pfadstücke, sonst je Pfadeintrag ein `yield`. Pro Bild läuft er höchstens 4 ms (eigene Zeitmessung im step). Die Füllbauten werden dafür in Task 1 in mehrere `Path2D` zu je ca. 300 aufgeteilt.
- **Darstellung:**
  - 180 CSS-px rund (am Handy, `pointer: coarse`, 120 px), unten rechts. Abstand zum Rand 16 px plus `env(safe-area-inset-*)`. Bei `body.car` über die Tempoanzeige schieben, ohne sie zu überdecken.
  - Canvas-Grösse = CSS × `devicePixelRatio`.
  - Massstab: 400 m Durchmesser. Beim Fahren und Fliegen 400 + 6 × Tempo (m/s), höchstens 1200 m, weich nachgezogen.
  - Drehung `-ang`, Spielerpfeil in der Mitte zeigt nach oben, kleines „N“ am Rand an der Nordrichtung.
- **Ausserhalb von `SK.view`:** Rand-Pfeil (gelb, `#e8c547`) am Kreisrand Richtung Kartenmitte. Der Hintergrund ist dann die Grundfarbe, keine Karte.
- **`under`:** Text „unter Tage“ unten im Kreis, die Karte bleibt sichtbar.
- **Versteckt,** solange `!SK.bgDone`, Umschalt+K aus ist oder die grosse Karte offen ist (Task 3). Neu gezeichnet wird nur, wenn sich Position, Richtung oder Massstab um mehr als 0,5 px bzw. 0,5 Grad geändert hat.

- [ ] **Step 1: Prüfausdrücke (sollen scheitern).**
  ```js
  // nach dem Laden ca. 3 s warten
  SK.bgDone && !document.getElementById("minikarte").hidden   // erwartet: true
  ```
  ```js
  // Zeit je Bild
  let t = 0; for (let i = 0; i < 200; i++) { camera.rotation.y += 0.01; const a = performance.now(); skMiniStep(); t += performance.now() - a; } t / 200   // erwartet: < 0.3
  ```
  ```js
  // Mittelpixel nicht leer (Wayne Tower)
  const c = document.getElementById("minikarte"), d = c.getContext("2d").getImageData(c.width / 2 + 10, c.height / 2 + 10, 1, 1).data; d[3] > 0   // erwartet: true
  ```
  ```js
  // während des Ladebildschirms: Aufgabe hat noch nicht gezeichnet
  // (Seite neu laden, sofort): SK.bgDone === false && document.getElementById("loading") !== null   // erwartet: true
  ```
- [ ] **Step 2: Umsetzen** (Vorzeichnen, Darstellung, Randpfeil, „unter Tage“, Umschalt+K mit localStorage).
- [ ] **Step 3: Prüfen.**
  - Alle Ausdrücke von Step 1 ergeben das Erwartete.
  - Längster Vorzeichnen-Schritt ≤ 6 ms (in der Aufgabe messen und `SK.bgMax` merken).
  - Bildschirmfotos: Begehen am Wayne Tower, Fahrt mit dem Polizeiauto (Massstab wächst), Manor-Wald hinter dem Anwesen (Randpfeil), Batcave („unter Tage“), Handy-Grösse über `resize_window` mobile.
  - Umschalt+K aus → nach dem Neuladen weiter aus.
- [ ] **Step 4: Commit.**

### Task 3: Grosse Karte

**Files:**
- Modify: `js/ui/stadtkarte.js`, `index.html` (`<div id="stadtkarte" hidden>` mit Canvas, Knöpfen +, −, „zu mir“, ×), `style.css`, `js/ui/bedienung.js` (K und Esc, Muster wie das Teleport-Menü Zeile 100-101), sw.js, CLAUDE.md, `gotham/umsetzung.js` (T6 status "fertig"), `PLAN-GOTHAM.md` (T6 erledigt)

**Interfaces:**
- Consumes: `SK.paths`, `SK.labels`, `skPos()`.
- Produces:
  - `skBigOpen()`, `skBigClose()`, `skBigToggle()`.
  - `window.skBigIsOpen = () => bool` (wie `tpMenuOpen`).
  - `SK.big = { cx, cz, scale }` (Mitte in Kartenkoordinaten, px je m).
- **Verhalten:**
  - Beim Öffnen gibt die Karte die Maus frei (wie `teleport.js` Zeile 84) und zentriert auf die eigene Position. Der Startmassstab zeigt ca. 1500 m Breite.
  - Ziehen (Maus/Touch) verschiebt die Karte. Das Mausrad und +/− zoomen um die Mausposition, Faktor 1,18 wie die Planungskarte, von der ganzen Ansicht bis ca. 8 px/m.
  - „zu mir“ zentriert neu. Norden ist oben.
  - Der Spielerpfeil folgt laufend, weil das Spiel weiterläuft. Gezeichnet wird nur bei einer Änderung oder wenn sich der Pfeil bewegt.
  - Beschriftung: Bezirksnamen ab jeder Zoomstufe, Orte mit `big` ab 0,15 px/m, alle Orte ab 0,6 px/m (Schrift mit schwarzem Rand wie die Planungskarte).
  - Massstabsleiste unten links.
- **Tasten:** Solange die Karte offen ist, kommt in `bedienung.js` kein anderer Tastendruck ins Spiel (früh `return`), ausser K und Esc. Die Minikarte ist versteckt.
- **Handy:** Ein Knopf „Karte“ in der Begehen-Leiste öffnet die grosse Karte (Touch hat keine Taste K).

- [ ] **Step 1: Prüfausdrücke (sollen scheitern).**
  ```js
  document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyK" })); skBigIsOpen()   // erwartet: true
  ```
  ```js
  // Tasten gehen nicht durch
  const x0 = player.pos.x; document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW" })); for (let i = 0; i < 30; i++) frame();
  document.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyW" })); Math.abs(player.pos.x - x0) < 0.01   // erwartet: true (im Begehen)
  ```
  ```js
  const s0 = SK.big.scale; document.getElementById("stadtkarte").dispatchEvent(new WheelEvent("wheel", { deltaY: -100, clientX: 400, clientY: 300 })); SK.big.scale > s0   // erwartet: true
  ```
  ```js
  document.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" })); !skBigIsOpen() && !document.getElementById("minikarte").hidden   // erwartet: true
  ```
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.**
  - Alle Ausdrücke von Step 1 ergeben das Erwartete.
  - Zeichenzeit der grossen Karte bei ganzer Ansicht und bei 8 px/m messen und notieren. Ist sie über 30 ms, Füllbauten unter 0,05 px/m weglassen.
  - Bildschirmfotos: ganze Ansicht, Zoom auf Wayne Circle mit Namen, Handy-Grösse.
  - Nach dem Schliessen: Begehen mit Klick fangen, laufen geht. Im Fahrzeug: K, Esc, weiterfahren geht.
- [ ] **Step 4: Commit** (mit umsetzung.js T6 "fertig" und PLAN-GOTHAM).
