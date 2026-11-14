# Wayne Tower (P3a Teil 1) – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Wayne Tower steht als Art-Deco-Turm im Wayne Circle. Er hat einen Vorplatz, eine Lobby, einen Personenaufzug mit allen Halten (Geschosse bei Bedarf), zwei öffentliche Tiefgaragen mit Wendelrampe, Schranke und Zufahrt zur unteren Ringstrasse sowie den geheimen Stock mit getarntem Fahrzeuggang. Alles ist als Rohbau angelegt, Einrichtung und Spezialsachen kommen später.

**Architecture:**
- **Gemeinsame Daten:** Eine Datendatei legt die Lage aller Teile in Turm-Koordinaten fest: Mitte, Drehung, Räume, Gänge und Wandöffnungen.
- **Gebaute Teile:** Getrennte Dateien bauen die Hülle, den Untergrund und den Aufzug.
- **Kollision:** Der Turm steht in Spielkoordinaten gedreht, nämlich um die Drehung der Karte gegenüber dem Spiel. Darum wird die gedrehte Kollision der Brücken (`gbrPart` …) zu einem allgemeinen System in `kern/`. Es liefert Wände, Decken und Böden.
- **Geschosse (Ansatz A):** Es gibt nur ein Geschoss-Netz. Es wird an die Höhe des aktuellen Halts geschoben.

**Tech Stack:** three.js 0.160, klassische Skripte mit gemeinsamen Globals (`FILES` in `sachen/batverse/index.html`), keine Build-Tools.
- Tests sind Prüfausdrücke per `javascript_tool` in `http://localhost:4180/sachen/batverse/?debug`. `const`-Globals stehen nicht auf `window`, man spricht sie direkt an.
- Dazu kommen Bildschirmfotos.
- Karten-Export: `gotham/index.html`, gespeichert über den Speicherserver `scratchpad/save-server.js` auf `127.0.0.1:4191`.

**Spec:** `docs/superpowers/specs/2026-11-14-wayne-tower-design.md`

## Global Constraints

- **Leistung (Spec):**
  - Laden: Messen wie bei den Baustellen am Desktop. Höchstens +0,1 s gegenüber vorher (ca. 2,0 s).
  - Bildzeit: Am Turm höchstens +0,3 ms, weit weg +0.
  - Fernform: Der Turm ist von weitem als einfache Form ohne Schrift sichtbar und wird nicht mit den Gotham-Zellen ausgeblendet.
- **Höhen (Spec, Seitenansicht):** Alles ist relativ zu `GOT.STR` (Strasse = 0).
  - Lobby: 0 bis 9,4.
  - Geschosse: je 4,7.
  - TG 1: Boden -5,5, Decke -1.
  - TG 2: Boden -11, Decke -6.
  - Geheimer Stock: Boden -8, Decke 0. Er liegt nur unter dem 70 x 70-Grundriss.
- **Rücksprünge (festgelegt, auf Geschossgrenzen):**
  - Bei 122,2 / 202,1 / 258,5 m. Das ist 9,4 + 4,7 × 24 / 41 / 53.
  - Breite des Schafts: 70 / 56 / 44 m, darüber die Krone mit 32 m bis 300 m, Antenne bis 320 m.
  - Geschosse 1 bis 52, darüber das Dach als Terrasse des obersten Rücksprungs auf 258,5 m.
- **Lage:**
  - Turm in Karten-Koordinaten x -2050, z -100, 70 x 70, achsparallel in der Karte. Spielkoordinaten über `GOT.toGame`.
  - Tiefgaragen neben dem Turm, mit eigenen Grundrissen.
  - Kanal-Hub später nur unter dem Turm. Der Aufzugsschacht steht am Turmrand zur Tiefgaragen-Seite.
- **IDs:** `GO-WAYNE-TOWER`, `GO-WAYNE-TG1`, `GO-WAYNE-TG2`, `GO-WAYNE-GEHEIM`, `GO-WAYNE-GANG`, dazu `GO-WAYNE-ZUFAHRT` für die öffentliche Zufahrt (Claude).
- **Regeln:**
  - Barrieren liegen weiter innen als die sichtbare Fläche: Kollision 0,3 m grösser bzw. früher.
  - Bestehende Strassen, Rampen und Gelände nicht ändern. Ausnahme: die Wandöffnungen der unteren Ringstrasse für Zufahrt und Geheimgang.
  - Neue Welt-Dateien kommen nur in `FILES`, nicht in `ASSETS`.
- **Nicht in diesem Plan:**
  - Inneneinrichtung (Lobby, Büros, Chefetage) und Spezialsachen (Tumbler, Prototypen, Gadgets) bekommen nach Task 7 ein eigenes kurzes Design mit Nicolas (Spec: "erst ganz am Schluss").
  - Kanal-Hub, U-Bahn, Verkehr.
- **Nach jedem Task:**
  - `CACHE` in `sw.js` +1.
  - `CLAUDE.md` (Batverse) nachführen.
  - Committen mit `git -c user.email=227780975+n-brand@users.noreply.github.com -c user.name="Nicolas Brand" commit`. Kein Co-Authored-By, nie pushen.

## Review Focus

1. **Geschoss unter den Füssen:** Wer in Geschoss 30 ausgestiegen ist und den Aufzug nach unten ruft, darf nicht ins Leere fallen. Das Geschoss-Netz bleibt, wo der Spieler steht, solange er nicht in der Kabine ist (Task 7).
2. **Übergang untere Strasse → Gang:** Ein Auto, das durch die Wandöffnung fährt, verliert nie den Boden. `gothamDeckAt` liefert dort null, der Boden des Gangs muss lückenlos anschliessen (Task 5, 6).
3. **Kamera unter der Erde:** `camBlocked` sperrt unter dem Gelände alles ausser bekannten Hohlräumen. In Tiefgarage, Gang und geheimem Stock darf die Fahrzeugkamera nicht in den Wagen springen (Task 5, 6).
4. **Hover unter der Erde:** Im Geist in TG 2 zeigt das Hover-Schild `GO-WAYNE-TG2` und nicht den Turm oder den Platz darüber (Task 3, 5).
5. **Schnell an die Schranke:** Mit 30 m/s an die geschlossene Schranke fahren heisst anhalten, nicht hindurch. Sie öffnet erst, wenn man langsam davor steht (Task 5).

---

### Task 1: Gedrehte Kollision als allgemeines System

**Files:**
- Create: `sachen/batverse/js/kern/drehkoll.js`, in `FILES` direkt nach `kern/bauten.js`, also nach `fernring.js`. So bleibt `TH_HASH` gleich, der die Dateien bis `gelaende.js` abdeckt, und die Datei steht vor den Brücken.
- Modify: `js/gotham/gotham-bruecken.js` (gbr → drehkoll), `js/fahrzeuge/fahren.js`, `js/spieler/laufen.js`, `js/fahrzeuge/jet.js`, `js/fahrzeuge/the-bat.js` (Aufrufe umbenennen)

**Interfaces:**
- Produces:
  - `dkAdd({ cx, cy, cz, ux, uz, hl, hw, hh, floor = 1, chain = 0, ceil = 1, m = 0.3 }) -> teil`: wie `gbrPart`. `ceil = 0` heisst: Das Teil wirkt nicht als Decke.
  - `dkRemove(teil)`.
  - `dkPush(p, y0, y1, R)`, `dkCeil(x, z, R, y) -> number`, `dkIn(x, y, z, m) -> bool`.
  - `dkFloor(x, z, feet) -> number | null`: Oberseite von Teilen mit `floor`, Füsse höchstens 0,6 darunter.
  - `dkMove(teil, dy)`: verschiebt ein Teil in der Höhe, für das Geschoss-Netz und die Aufzugskabine.
  - `dkRoom({ poly, y0, y1 })` und `dkInRoom(x, y, z) -> bool`: Hohlräume unter der Erde für `camBlocked` und für `carGround`.
- `gothamBridgeAt` bleibt, nutzt für Teile aber `dkFloor`. `carPush`, `pushOut`, `hoverStep`, `jetAir`, `batAir` und `camBlocked` rufen die dk-Funktionen auf.

- [ ] **Step 1: Prüfausdruck (soll scheitern).** Die Brückenprüfung aus Commit 541fb00 wird zur Funktion `testBruecken()`, wie in der CLAUDE.md beschrieben: von unten hoch, seitlich, Querriegel, Strebe, Bein, Seil, Hänger, Landen oben, 11 641 Fahrbahnproben. Dazu kommt:
  ```js
  const t = dkAdd({ cx: 0, cy: 100, cz: 0, ux: Math.cos(1), uz: Math.sin(1), hl: 5, hw: 2, hh: 1 });
  [dkIn(0, 100, 0), dkIn(0, 103, 0), dkFloor(0, 0, 101.2), dkCeil(0, 0, 1, 95), (dkRemove(t), dkIn(0, 100, 0))]
  // erwartet: [true, false, 101, 98.7, false]
  ```
  Expected vorher: `ReferenceError: dkAdd is not defined`.
- [ ] **Step 2: Umsetzen.** Der Code von `gbrPart`/`gbrEach`/`gbrPush`/`gbrCeil`/`gbrIn` wandert nach `drehkoll.js`, das Raster wird `DK.grid`. Die Brücken rufen `dkAdd` auf. `dkRoom` legt die Hohlräume in einem 64-m-Raster ab, wie `bautAdd`.
- [ ] **Step 3: Prüfen.** Der Prüfausdruck ergibt `[true,false,101,98.7,false]`. `testBruecken()` bringt die gleichen Zahlen wie in 541fb00. Die Ladezeit bleibt unverändert.
- [ ] **Step 4: Cache, CLAUDE.md (Abschnitt „Feste Brueckenteile“ → „Gedrehte Kollision“), Commit.**

### Task 2: Vorplatz in der Karte

**Files:**
- Modify: `sachen/batverse/gotham/daten.js` (Ort `wayne-tower`: `vorplatz: { tiefe }` und die Seite)
- Modify: `sachen/batverse/gotham/index.html`: Der Vorplatz wird **erst nach den Nebenstrassen** belegt, er sperrt nur Füllbauten.
- Modify: `sachen/batverse/gotham/stadt.js`, neu exportiert.

**Interfaces:**
- Produces: `GOTHAM.orte` → `wayne-tower.vorplatz = { seite: "n" | "s" | "o" | "w", tiefe: m }`. Gewählt wird die Seite mit dem meisten Abstand bis zur nächsten Nebenstrasse. Die Tiefe reicht bis 2 m vor deren Gehsteig, höchstens 40 m.
- Der Export behält `fbNext`. Die IDs aller übrigen Füllbauten bleiben gleich.

- [ ] **Step 1: Prüfausdruck in der Karte (soll scheitern).**
  ```js
  const near = GOTHAM_STADT.fuell.filter(f => Math.abs(f.x + 2050) < 60 && Math.abs(f.z + 100) < 60).map(f => f.id);
  near   // erwartet nachher: []   (vorher: enthält FB-0425, FB-0546, FB-0547)
  ```
- [ ] **Step 2: Umsetzen, exportieren, speichern.**
- [ ] **Step 3: Gleichheitstest.**
  - Die alte `stadt.js` (git `HEAD`) gegen die neue vergleichen. `neben` und `haupt` sind identisch.
  - In `fuell` fehlen genau die Füllbauten im Vorplatz, alle anderen IDs und Grundrisse sind gleich.
  - Die Liste der entfernten IDs an Nicolas melden.
- [ ] **Step 4: Cache, CLAUDE.md, Commit.** Hinweis: `stadt.js` liegt im Bereich von `TH_HASH`. Der erste Start danach rechnet das Gelände einmal neu, das ist erwartet.

### Task 3: Turmdaten und Hülle aussen

**Files:**
- Create: `js/gotham/gotham-wayne-daten.js`, in `FILES` vor `gotham/gotham-unterstrasse.js`, weil die Wandöffnungen dort schon gelten müssen.
- Create: `js/gotham/gotham-wayne-turm.js`, in `FILES` nach `gotham/gotham-baustellen.js`.
- Modify: `index.html` (FILES)

**Interfaces:**
- Produces (`gotham-wayne-daten.js`):
  - `WT = { cx, cz, ux, uz, Y, toW(a, b) -> [x, z], toT(x, z) -> [a, b] }`.
    - Turm-Koordinaten: a längs der Karten-x, b längs der Karten-z, Mitte 0/0.
    - `Y = GOT.STR`.
  - `WT.lv = { lobby: 0, g: k => 9.4 + 4.7 * (k - 1), dach: 258.5, tg1: -5.5, tg2: -11, geheim: -8 }`.
  - `WT.vorplatz`: Seite und Tiefe aus `daten.js`.
  - `WT.kern`: Rechteck des Aufzugskerns in Turm-Koordinaten, am Rand zur TG-Seite.
  - Die Rechtecke von TG, Rampe, Zufahrt und Geheimgang werden in Task 5/6 ergänzt.
  - `GDECK.gaps = []`: Wandöffnungen `{ road: "ring", s0, s1, side }`. Der Eintrag erfolgt in Task 5/6, die Liste liegt aber schon hier.
- Produces (`gotham-wayne-turm.js`):
  - Hülle mit Sockel und Eingang (mit Vordach) zur Vorplatzseite, Schaft mit Fensterraster als Textur (wenige Flächen), Lisenen, Rücksprünge, Krone mit Lichtband (abends hell) und Antenne.
  - WAYNE-Schrift auf allen vier Seiten unter 122,2 m.
  - Vorplatz als Steinfläche.
  - Fernform für die Weite.
  - Kollision: Aussenwände als dk-Teile. Die Eingangsöffnung bleibt frei, die Lobby folgt in Task 4.
  - Register: `GO-WAYNE-TOWER` (Grundriss 70 x 70, y 0 bis 320 relativ).

- [ ] **Step 1: Prüfausdruck (soll scheitern).**
  ```js
  const [x, z] = WT.toW(0, 0), [x2, z2] = WT.toW(40, 0);
  const [wx, wz] = WT.toW(35, 10);   // Aussenwand
  [bautAt(x, WT.Y + 50, z)?.id, dkIn(wx, WT.Y + 60, wz), bautAt(x2, WT.Y + 50, z2)?.id ?? null]
  // erwartet: ["GO-WAYNE-TOWER", true, null]
  ```
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.**
  - Prüfausdruck stimmt.
  - DeLorean seitlich gegen die Fassade auf 60 m und von oben auf die Rücksprung-Terrassen: hält bzw. landet. Gleiche Prüfweise wie `testBruecken`.
  - Bildschirmfotos: nah vom Vorplatz, aus 1 km, von der Manor aus. Der Turm ist sichtbar.
  - Ladezeit und Bildzeit gegen die Global Constraints messen.
- [ ] **Step 4: Cache, CLAUDE.md, Commit, Bilder an Nicolas.**

### Task 4: Lobby und Aufzugskern (Rohbau)

**Files:**
- Modify: `js/gotham/gotham-wayne-turm.js`

**Interfaces:**
- Produces:
  - Begehbares Erdgeschoss mit 9,4 m: Boden als dk-Teil mit `floor`, Innenwände der Fassade, Stützen, Eingang offen.
  - Aufzugskern mit Türöffnung zur Lobby. Die Türen kommen in Task 7.
  - `WT.lobbyFloor(x, z, feet)`: braucht es nur, wenn dk-Böden nicht reichen.

- [ ] **Step 1: Prüfausdruck (soll scheitern).** Spieler im Eingang absetzen und 15 m in die Lobby gehen lassen (`walkStep` mit W). Er landet in der Lobby auf `WT.Y`, nicht im Gelände. Seitlich gegen den Kern wird er gestoppt. Expected vorher: Er steht nach Task 3 vor der Aussenwand.
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.** Prüfausdruck stimmt. Bildschirmfoto der Lobby von innen, mit Blick durch die Fenster nach aussen.
- [ ] **Step 4: Cache, CLAUDE.md, Commit.**

### Task 5: Tiefgaragen, Wendelrampe, Zufahrt, Schranke

**Files:**
- Create: `js/gotham/gotham-wayne-unten.js`, in `FILES` nach `gotham-wayne-turm.js`.
- Modify: `js/gotham/gotham-wayne-daten.js` (Rechtecke, Gänge, `GDECK.gaps`)
- Modify: `js/gotham/gotham-unterstrasse.js`: Wandstücke und Wandkreise in `GDECK.gaps` auslassen, Stirnflächen an den Öffnungsrändern.
- Modify: `js/spieler/laufen.js` (`groundAt`), `js/fahrzeuge/fahren.js` (`carSlopeG`, `camBlocked`) und `js/ui/bauten-hover.js`, falls nötig. Den Boden liefern dk-Teile, Hohlräume `dkRoom`.

**Interfaces:**
- Produces:
  - TG 1 und TG 2 als Rechteck neben dem Turm an der Kernseite. Vorschlag 70 x 60, Lage nach `WT.kern`. Je Ebene Boden, Decke, Wände, Stützenraster, Parkfeld-Markierung und Leuchten.
  - **Wendelrampe** zwischen den Ebenen, mit einer Drehung über 5,5 m Höhe und Radius ≥ 9 m. Die Steigung beträgt höchstens 12 %, sonst dreht sie 1,5-mal.
  - **Zufahrt:** ebener Gang auf -5,5 m (7 m Fahrbahn + 1,5 m Gehweg) von TG 1 zur inneren Wand der unteren Ringstrasse. Die Öffnung liegt nicht in einer Rampe oder Portalzone (`gdeckInRamp`, `gdeckPortalZone`).
  - **Schranke** an der TG-Einfahrt, ein Eintrag in `gates`: öffnet, wenn ein Fahrzeug langsamer als 3 m/s höchstens 6 m davor steht (beide Richtungen), schliesst nach 4 s ohne Fahrzeug. Ist sie zu, ist sie ein dk-Teil.
  - Register: `GO-WAYNE-TG1`, `GO-WAYNE-TG2`, `GO-WAYNE-ZUFAHRT`. `dkRoom` für alle Räume.
  - Wayne-Aufzug: In beiden TG gibt es eine Türöffnung am Kern. Die Kabine kommt in Task 7.

- [ ] **Step 1: Prüfausdrücke (sollen scheitern).** Polizeiauto auf der unteren Ringstrasse vor der Öffnung, mit Gas in die Zufahrt (`carStep`-Schleife wie in der Baustellen-Prüfung):
  - Es hält an der geschlossenen Schranke.
  - Bei 2 m/s davor öffnet sie.
  - Das Auto erreicht TG 1 und fährt die Wendel nach TG 2. `CAR.y` ergibt ungefähr `WT.Y - 11`.
  - Es fällt nie: Verlauf von `CAR.y` ohne Sprung > 0,7 m.
  - Mit 30 m/s an die Schranke: hält.
  - `bautAt` in TG 2 ergibt `GO-WAYNE-TG2`.
  - `camBlocked` hinter dem Auto in TG 2 ergibt false.
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.**
  - Alle Prüfausdrücke stimmen, auch rückwärts hinaus auf die Ringstrasse.
  - Die untere Ringstrasse ausserhalb der Öffnung ist unverändert: Wandkreise zählen, Fahrprobe entlang der Wand.
  - Bildschirmfotos von Einfahrt, TG 1, Wendel, TG 2.
  - Leistung messen.
- [ ] **Step 4: Cache, CLAUDE.md, Commit, Bilder an Nicolas.**

### Task 6: Geheimer Stock und getarnter Gang

**Files:**
- Modify: `js/gotham/gotham-wayne-unten.js`, `js/gotham/gotham-wayne-daten.js` (Gang, zweite Öffnung in `GDECK.gaps`)
- Modify: `js/ui/bedienung.js` (L im Fahrzeug an der Wandplatte)

**Interfaces:**
- Produces:
  - **Halle** unter dem ganzen 70 x 70-Grundriss: Boden -8, Decke 0. Runde Pfeiler im Raster 8–10 m, runde Deckenleuchten, graue Wände, glänzender Boden (`roughness` niedrig). Keine Einrichtung.
  - **Gang:** von der Halle zur inneren Wand der unteren Ringstrasse, an einer anderen Stelle als die Zufahrt. Er steigt gleichmässig von -8 auf -5,5. 7 m breit und 4,5 m hoch, Boden und Decke als dk-Teile.
  - **Wandplatte:** Von der Strasse aus sieht sie aus wie die Wand, gleiche Textur und Fugen. Ein Eintrag in `gates`. Im Fahrzeug höchstens 15 m davor öffnet L sie, von beiden Seiten. Sie fährt in 2 s nach oben in die Decke. Zu ist sie ein dk-Teil.
  - Register: `GO-WAYNE-GEHEIM`, `GO-WAYNE-GANG`. `dkRoom` für Halle und Gang.
  - Türöffnung am Aufzugskern auf -8.

- [ ] **Step 1: Prüfausdrücke (sollen scheitern).** Auto auf der unteren Ringstrasse vor der Platte:
  - Zu: Es hält.
  - L: Die Platte öffnet sich.
  - Es fährt durch den Gang in die Halle. `CAR.y` endet bei ungefähr `WT.Y - 8`, ohne Sprung > 0,7 m.
  - Zurück und erneut L: Die Platte schliesst.
  - `bautAt` in der Halle ergibt `GO-WAYNE-GEHEIM`.
  - Das Hover-Schild im Geist über der Halle, auf dem Vorplatz, zeigt nicht die Halle.
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.** Prüfausdrücke stimmen. Bildschirmfotos: Wand geschlossen von der Strasse aus (nicht von der übrigen Wand zu unterscheiden), offen, Gang, Halle. Leistung messen.
- [ ] **Step 4: Cache, CLAUDE.md, Commit, Bilder an Nicolas.**

### Task 7: Wayne-Aufzug und Geschosse bei Bedarf

**Files:**
- Create: `js/gotham/gotham-wayne-aufzug.js`, in `FILES` nach `aufzuege/autoaufzug.js`, weil `liftPanel` gebraucht wird.
- Modify: `js/aufzuege/personenaufzug.js`: Die Anzeige kennt einen dritten Aufzug „W“ (`buildLiftPanel`, `updateLiftPanel`).
- Modify: `js/kern/tore.js` bzw. der `gates`-Eintrag: Rechtsklick/E auf die Wayne-Türen.

**Interfaces:**
- Produces:
  - `WLIFT = { stops: [{ name, y }], at, target, state, y, inCar(p), use(), pick(i) }`.
  - Halte von unten: TG 2, Geheimer Stock, TG 1, Lobby, Geschoss 1–52, Dach. Der geheime Stock steht ganz normal in der Liste (Spec).
  - Fahrt mit etwa 7 m/s, über 50 m schneller bis 12 m/s, damit Lobby → Dach unter 30 s dauert.
  - **Anzeige:** Benannte Halte unten und oben als Knöpfe, dazwischen ein Feld „Geschoss 1–52“ mit Zahl und OK. Pfeil hoch/runter = nächster Halt.
  - Kabine und Türen als dk-Teile, die mitfahren (`dkMove`).
  - **Geschoss-Netz** `WT.floor`: eine Gruppe mit Boden, Stützen, Kernwänden und Innenseite der Fassade (Fenster als Textur mit alphaTest). Dazu dk-Teile. Hält der Aufzug an Geschoss k, wird sie auf `WT.lv.g(k)` gesetzt und sichtbar.
    - Sie bleibt an Geschoss k, solange der Spieler dort ausserhalb der Kabine steht (Review Focus 1).
    - Steht der Spieler in der Kabine und sie fährt ab, wird sie unsichtbar und die Teile werden abgemeldet.
    - Dach: eigene feste Terrasse mit Brüstung (dk), keine Gruppe.
  - Register: `GO-WAYNE-TOWER` gilt für alle Geschosse, keine eigenen IDs.

- [ ] **Step 1: Prüfausdrücke (sollen scheitern).**
  - Spieler in der Lobby vor dem Kern, `WLIFT.use()`: Die Kabine kommt.
  - `WLIFT.pick(Geschoss 30)`: Nach der Fahrt ist `player.pos.y` ≈ `WT.Y + WT.lv.g(30)` und `WT.floor.visible` ist true.
  - Aussteigen, 10 m gehen: Der Boden hält.
  - Den Aufzug von dort nach TG 2 rufen: Der Spieler bleibt auf Höhe g(30), fällt nicht, das Netz bleibt sichtbar.
  - Wieder einsteigen und nach TG 2, dann geheimer Stock, dann Dach: Ankunft jeweils auf der richtigen Höhe. Der Boden des Geschosses ist danach unsichtbar.
- [ ] **Step 2: Umsetzen.**
- [ ] **Step 3: Prüfen.** Prüfausdrücke stimmen. Bildschirmfotos: Anzeige, Geschoss 30 innen mit Blick hinaus, Dach. Leistung: Bildzeit im Geschoss und auf dem Vorplatz.
- [ ] **Step 4: Cache, CLAUDE.md (Abschnitt Wayne Tower komplett), Commit, Bilder an Nicolas.** Danach fragen: Design der Inneneinrichtung und der Spezialsachen (eigene kurze Runde).
