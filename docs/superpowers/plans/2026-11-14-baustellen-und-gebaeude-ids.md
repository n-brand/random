# Baustellen und Gebäude-IDs – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle Füllbauten und BS-Plätze stehen in Gotham als einfache Baustellen. Jedes Gebäude der Welt hat eine ID, die man beim Hovern (Orbit, Geist) sieht und beim Koordinaten-Kopieren mitbekommt.

**Architecture:**
- **Register `BAUTEN`:** ein zentrales Register mit Grundrissen, Abfrage `bautAt(x, y, z)`. Das ist unabhängig davon, dass Netze zusammengefasst werden.
- **Baustellen:** eine neue Datei baut sie als Generator in Etappen, mit Zwischenspeicher in IndexedDB, in die 768-m-Zellen (`gsplit`).
- **Kollision der Baustellen:** liegt in einem eigenen Zusatzraster im Kollisionssystem (`collAdd`/`collRemove`) und wird nur für die Zellen um den Spieler angelegt.

**Tech Stack:** three.js 0.160, klassische Skripte mit gemeinsamen Globals (`FILES` in `sachen/batverse/index.html`), keine Build-Tools. Tests sind Prüfausdrücke per `javascript_tool` in `http://localhost:4180/sachen/batverse/?debug` (Hinweis: `const`-Globals sind nicht auf `window`, also direkt ansprechen, z. B. `GSTR.done`) sowie Bildschirmfotos.

**Spec:** `docs/superpowers/specs/2026-11-14-baustellen-und-gebaeude-ids-design.md`

## Global Constraints

- **Leistung:** Laden höchstens +0,2 s, Bildzeit in Gotham höchstens +0,3 ms (messen wie bei Leistung 1–4: `?debug`, `gl.finish`, gleiche Kamera vorher/nachher).
- **ID-Präfixe:** `FB-0001`, `BS-01`, `WM-…`, `GO-BR-…`, `GB-…`.
- **Hover:** nur in Orbit und Geist. Abfrage höchstens ca. 8-mal pro Sekunde, nur nach Mausbewegung, nicht beim Ziehen. Kein Hover am Handy, beim Begehen, Fahren und Fliegen.
- **Kollision der Baustellen:** nur in der Zelle des Spielers bzw. aktiven Fahrzeugs und den 8 Nachbarzellen (Zelle = `GCELL` 768 m). Regel „Barrieren weiter innen“.
- **Neue Welt-Dateien:** nur in `FILES`, nicht in `ASSETS` von `sw.js`. Ausnahme: `shared/orbit-pick.js` steht schon in `ASSETS`.
- **Nach jedem Task:** `CACHE` in `sw.js` +1, `CLAUDE.md` (Batverse) nachführen, committen mit `git -c user.email=227780975+n-brand@users.noreply.github.com -c user.name="Nicolas Brand" commit`. Kein Co-Authored-By, nie pushen.
- **Welt:** Bestehendes (Strassen, Gelände, Bäume) nicht verändern.

## Review Focus

- Hover in der Orbit-Ansicht darf das Drehen und Ziehen nicht verlangsamen: Bildzeit beim Ziehen mit und ohne Hover gleich (Task 2).
- Zwei Grundrisse übereinander, etwa ein Raum in der Höhle unter dem Haus: Die Höhe entscheidet, sonst gilt der kleinste Grundriss (Task 1).
- Ein Karten-Export ohne Änderung an `daten.js` darf keine einzige ID ändern (Task 4).
- Wer schnell über eine Zellgrenze fährt, darf nicht durch einen Zaun fahren, der noch nicht angelegt ist. Die Nachbarzellen sind schon geladen (Task 6).
- Ohne Zwischenspeicher (erster Start) und mit Zwischenspeicher müssen die Baustellen identisch aussehen und dieselben IDs haben (Task 5).

---

### Task 1: Gebäude-Register und ID beim Kopieren

**Files:**
- Create: `sachen/batverse/js/kern/bauten.js` (in `FILES` direkt nach `kern/basis.js`)
- Modify: `shared/orbit-pick.js` (Option `idAt`, Rückfall weiter `userData.id`)
- Modify: `sachen/batverse/js/kern/basis.js:31` (`installOrbitPick(..., idAt: p => bautAt(p.x, p.y, p.z))`)

**Interfaces:**
- Produces:
  - `BAUTEN`: Array von `{ id, name, art, poly: [[x, z], …], y0, y1, info? }` in Spielkoordinaten.
  - `bautAdd(e)`: fügt ein und trägt in ein 64-m-Raster ein.
  - `bautAt(x, y, z) -> eintrag | null`: Punkt im Polygon und `y0 - 1 <= y <= y1 + 1`. Bei mehreren Treffern gilt die kleinste Fläche.
  - `bautText(e) -> string`: z. B. `"FB-0187 · Baustelle · Oststadt · geplant ca. 27 m"` aus id, art, `info`.
- `installOrbitPick({ …, idAt })`: wenn `idAt(hit.point)` einen Eintrag liefert, lautet die zweite Zeile `ID: <id> (<art>)`.

- [ ] **Step 1: Prüfausdruck (soll scheitern)**

```js
bautAdd({ id: "TEST-1", name: "Test", art: "Test", poly: [[0,0],[10,0],[10,10],[0,10]], y0: 0, y1: 5 });
bautAdd({ id: "TEST-2", name: "Klein", art: "Test", poly: [[2,2],[4,2],[4,4],[2,4]], y0: 0, y1: 5 });
[bautAt(5, 1, 5)?.id, bautAt(3, 1, 3)?.id, bautAt(5, 20, 5), bautAt(-1, 1, 5)]
// erwartet: ["TEST-1", "TEST-2", null, null]
```

Expected vorher: `ReferenceError: bautAdd is not defined`.

- [ ] **Step 2: `bauten.js` und `idAt` in orbit-pick umsetzen.** Die Testeinträge danach wieder entfernen (`BAUTEN.length = 0` und Raster leeren über `bautClear()`).
- [ ] **Step 3: Prüfausdruck erneut ausführen.** Expected: `["TEST-1","TEST-2",null,null]`. Rechtsklick „Koordinaten kopieren“ über TEST-1 (vorher wieder eintragen): Zwischenablage enthält `ID: TEST-1 (Test)`.
- [ ] **Step 4: Cache, CLAUDE.md, Commit.**

### Task 2: Hover-Schild in Orbit und Geist

**Files:**
- Create: `sachen/batverse/js/ui/bauten-hover.js` (in `FILES` nach den anderen `ui/`-Dateien)
- Modify: `sachen/batverse/style.css` (`#baut-tip`), `sachen/batverse/index.html` (`<div id="baut-tip" hidden>`)
- Modify: `shared/orbit-pick.js`: exportiert/liefert `pointAt(cx, cy) -> {point, object} | null` (dieselbe Strahl-Logik wie `pickAt`)

**Interfaces:**
- Consumes: `bautAt`, `bautText` (Task 1); `orbitPick.pointAt`; Globals `ghost`, `walking`, `controls`.
- Produces: `bautHoverStep()` (aus der Bildschleife, `kern/schleife.js`); intern gedrosselt auf 125 ms und nur bei Bewegung (Maus bzw. Kamera im Geist).

- [ ] **Step 1: Prüfausdruck (soll scheitern)**

```js
bautAdd({ id: "TEST-H", name: "Hover", art: "Test", poly: [[-2090,850],[-2030,850],[-2030,880],[-2090,880]], y0: -13, y1: 0 });
typeof bautHoverStep
// erwartet nach Umsetzung: "function"; dann Maus über die Fläche (Orbit, Kamera darüber): #baut-tip sichtbar mit "TEST-H · Test"
```

- [ ] **Step 2: Umsetzen.**
  - Orbit: Schild an der Maus, Abstand 14 px, versteckt bei `pointerdown` und Ziehen.
  - Geist: Schild mittig unter dem Fadenkreuz, Strahl durch die Bildmitte.
  - Nicht bei `pointer: coarse`, nicht beim Begehen, Fahren und Fliegen.
- [ ] **Step 3: Prüfen.**
  - Orbit über TEST-H: Schild an. Über leerer Wiese: aus.
  - Geist mit Fadenkreuz auf TEST-H: Schild an.
  - Beim Ziehen bleibt das Schild aus, die Bildzeit beim Ziehen ist mit und ohne Hover gleich (±0,1 ms).
- [ ] **Step 4: Testeintrag entfernen, Cache, CLAUDE.md, Commit.**

### Task 3: Bestehende Gebäude eintragen

**Files:**
- Create: `sachen/batverse/js/aussen/bauten-anwesen.js` (in `FILES` nach der letzten Baudatei des Anwesens/der Höhle, vor `kern/start.js`)
- Modify: `sachen/batverse/js/gotham/gotham-bruecken.js` (je Brücke `bautAdd`, Grundriss = Deck plus Türme)

**Interfaces:**
- Consumes: `bautAdd`; vorhandene Umrisse und Konstanten: `HOUSE_PX` mit `mp()`, `HILL`, `GARAGE`, `SILO`, `HGX`, `CSH`, Poolhaus- und Torhaus-Lage (aus `aussen/*.js`, Torhaus in `buildGate`).
- Produces: Einträge mit genau diesen IDs, sofern das Bauwerk existiert:
  - `WM-HAUS`, `WM-OBSERVATORIUM`, `WM-POOLHAUS`, `WM-TORHAUS`, `WM-VERANDA`
  - `WM-TIEFGARAGE`, `WM-AUTOAUFZUG`, `WM-SILO`, `WM-HANGAR-WEST`, `WM-HANGAR-OST`, `WM-RD-ARMORY`, `WM-BATCOMPUTER`, `WM-VORRAUM`
  - `GO-BR-<id der Brücke ohne Sonderzeichen, gross>` je Brücke aus `GOTHAM_STADT.bruecken`

- [ ] **Step 1: Prüfausdruck (soll scheitern)**

```js
[bautAt(-30, HILL + 3, 15)?.id, bautAt(-30, GY + HILL + 1, 15)?.id, BAUTEN.filter(b => b.id.startsWith("GO-BR-")).length]
// erwartet: ["WM-HAUS", "WM-TIEFGARAGE" (falls (-30/15) in GARAGE liegt, sonst einen Punkt in GARAGE nehmen), 6]
```

- [ ] **Step 2: Einträge anlegen.** Die Höhenbereiche richten sich nach den bestehenden Ebenen (EG `FL0`, Dach `ROOF_Y`, Garage `GY`, Höhle `UY`/`LY`, jeweils mit `HILL`, wo gehoben). Räume im Haus bekommen keine eigene ID.
- [ ] **Step 3: Prüfen.**
  - Prüfausdruck mit echten Punkten in jedem Bauwerk, alle 13 WM-IDs und 6 Brücken.
  - Hover in der Orbit-Ansicht über Haus, Poolhaus und eine Brücke, mit Bildern.
- [ ] **Step 4: Cache, CLAUDE.md, Commit.**

### Task 4: Feste Füllbau-IDs und BS-Plätze im Export

**Files:**
- Modify: `sachen/batverse/gotham/index.html` (`gothamExport`, ID-Vergabe der Füllbauten)
- Modify: `sachen/batverse/gotham/stadt.js` (neu erzeugt über den Speicher-Server)

**Interfaces:**
- Produces in `GOTHAM_STADT`:
  - `fuell[i].id` (fest);
  - `fbNext` (Zahl, höchste je vergebene Nummer + 1);
  - `baustellen: [{ id, x, z, w, d }]` (aus `daten.js`-Orten mit `typ: "baustelle"`, Kartenkoordinaten).
- Regel: Die Karte liest beim Export die aktuelle `stadt.js` per `fetch("stadt.js")`. Ein neuer Füllbau bekommt die ID des alten, wenn seine Mitte darin liegt oder höchstens 5 m von dessen Mitte entfernt ist. Bei zwei Kandidaten gewinnt die nähere Mitte, sonst gibt es die nächste Nummer ab `fbNext`. Ohne `fbNext` in der alten Datei gilt höchste vorhandene Nummer + 1. Die Klick-Anzeige der Karte zeigt dieselben IDs.
- Speicher-Server: `scratchpad/save-server.js`, Karte über `http://127.0.0.1:4191/sachen/batverse/gotham/` öffnen (gleicher Ursprung), `POST /save-stadt`.

- [ ] **Step 1: Prüfausdruck in der Karte (soll scheitern)**

```js
const ex = gothamExport(), G = eval("(" + ex.slice(ex.indexOf("{"), ex.lastIndexOf("}") + 1) + ")");
[typeof G.fbNext, (G.baustellen || []).length]
// erwartet nach Umsetzung: ["number", 8]
```

- [ ] **Step 2: Umsetzen, exportieren, speichern.**
- [ ] **Step 3: Gleichheitstest.**
  - Zweimal hintereinander exportieren, ohne `daten.js` zu ändern: Alle `fuell[i].id` sind gleich (Vergleich als Menge `id@runde Mitte`).
  - Stichprobe: 20 IDs der alten `stadt.js` (vor Task 4) und der neuen liegen an derselben Stelle.
- [ ] **Step 4: Cache, CLAUDE.md, Commit.**

### Task 5: Baustellen bauen (Optik, Register, Zwischenspeicher)

**Files:**
- Create: `sachen/batverse/js/gotham/gotham-baustellen.js` (in `FILES` nach `gotham/gotham-unterstrasse.js`)

**Interfaces:**
- Consumes:
  - `GOTHAM_STADT.fuell`, `GOTHAM_STADT.baustellen` (Task 4), `GOT.toGame`, `GOT.STR`, `GOTHAM.bezirke` (Wohlstand über Punkt-im-Polygon der Mitte, Kartenkoordinaten);
  - `gsplit` und `GCELL` (gotham-gelaende.js), `canvasTex`, `M`, `TILES.tasks`, `TH_DB`/`TH_HASH` (wie `gstrCacheLoad` in gotham-strassen.js);
  - `bautAdd` (Task 1).
- Produces:
  - `GBST = { list: [{ id, poly, cell, wohl, h }], done }` (`cell` = Schlüssel der 768-m-Zelle der Mitte);
  - Netze „Gotham-Baustellen Erde“, „Gotham-Baustellen Zaun“ (alphaTest-Gitter), „Gotham-Baustellen Container“, „Gotham-Baustellen Material“;
  - für jede Baustelle `bautAdd({ id, name: "Baustelle " + id, art: "Baustelle", poly, y0: GOT.STR - 1, y1: GOT.STR + 8, info: bezirk + " · geplant ca. " + round(h) + " m" })`. BS-Plätze ohne Höhe.
- Inhalt je Baustelle (Zufall fest aus der ID-Nummer):
  - Erde 3 cm über der Strasse.
  - Zaun 2 m hoch, 0,3 m innerhalb des Grundrisses, Tor 5 m auf der Seite zur nächsten Strasse (`GSTR.onRoad` mit Suchabstand bis 15 m).
  - Container 6 × 2,5 × 2,6 m, bei Wohlstand > 0,6 zwei Container.
  - 2–3 Stapel bzw. Haufen. Bei Wohlstand < 0,3 Zaunfelder mit 25 % Lücken und ein Haufen mehr.
- Budget: höchstens 100 Dreiecke je Baustelle.
- Generator `gbstGen()` mit `yield` alle 40 Baustellen, Kachel-Aufgabe ca. 6 ms pro Bild. Zwischenspeicher-Eintrag `GBST` (Schlüssel `TH_HASH` + Prüfsumme dieser Datei + Prüfsumme von `stadt.js`).

- [ ] **Step 1: Prüfausdruck (soll scheitern)**

```js
[GBST.done, GBST.list.length, bautAt(...(() => { const b = GBST.list[0]; const c = b.poly.reduce((a, p) => [a[0] + p[0] / b.poly.length, a[1] + p[1] / b.poly.length], [0, 0]); return [c[0], GOT.STR + 1, c[1]]; })())?.id === GBST.list[0].id]
// erwartet: [true, <Anzahl fuell + 8>, true]
```

- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.**
  - Prüfausdruck.
  - Dreiecke gesamt höchstens 100 × Anzahl.
  - Erster Start (Zwischenspeicher leer, IndexedDB-Eintrag `GBST` löschen) und zweiter Start: gleiche Anzahl Dreiecke und gleiche IDs.
  - Bilder aus der Orbit-Startansicht und aus 30 m Höhe über einer reichen und einer armen Baustelle.
  - Leistung gegen die Zielwerte.
- [ ] **Step 4: Cache, CLAUDE.md, Commit.**

### Task 6: Kollision der Baustellen nur in der Nähe

**Files:**
- Modify: `sachen/batverse/js/kern/basis.js:125-145` (Zusatzraster in `COLL`)
- Modify: `sachen/batverse/js/gotham/gotham-baustellen.js` (Kollisionsteile je Baustelle, Zell-Verwaltung)

**Interfaces:**
- Produces in basis.js:
  - `COLL.cellsX` (eigene Map, gleiche Zellgrösse `cs`);
  - `collAdd(solidsArr, circlesArr)` und `collRemove(solidsArr, circlesArr)`: tragen nur in `cellsX` ein bzw. aus. `solids`/`circles` bleiben unberührt, also kein `collBuild`.
  - `collNear` liest zusätzlich `cellsX`.
- Produces in gotham-baustellen.js:
  - `gbstColl(b) -> { S: [...], C: [...] }`: schräge Zaunseiten als achsparallele Quader 0,3 × 0,3 m alle 0,25 m (Höhe `GOT.STR - 0.2` bis `GOT.STR + 2`), Tor frei, Container als Kette solcher Quader auf seiner Kontur;
  - `gbstCollStep()` aus der Kachel-Aufgabe: Zielmenge = Zelle von Spieler bzw. aktivem Fahrzeug plus 8 Nachbarn; neue Zellen anlegen, alte entfernen, höchstens eine Zelle pro Bild.

- [ ] **Step 1: Prüfausdruck (soll scheitern)**

```js
typeof collAdd + "/" + (COLL.cellsX ? COLL.cellsX.size : "none")
// erwartet nach Umsetzung: "function/<Zahl > 0 in Gotham, 0 weit weg>"
```

- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.**
  - In Gotham: Zu Fuss und mit dem Tumbler gegen einen Zaun (hält), durch das Tor (frei), gegen einen Container (hält).
  - Schnell über eine Zellgrenze fahren: Zaun in der neuen Zelle hält sofort.
  - Teleport zur Manor: `COLL.cellsX.size` fällt auf 0. `solids.length` und `circles.length` bleiben dabei unverändert.
  - Bildzeit gegen die Zielwerte.
- [ ] **Step 4: Cache, CLAUDE.md (Abschnitt Baustellen und IDs komplett), Commit, Bilder an Nicolas.**
