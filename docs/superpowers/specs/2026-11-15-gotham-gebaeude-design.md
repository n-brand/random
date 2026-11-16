# G3/G4 – Gebäude-Vorlagen und Wohlstand (Design)

Stand 2026-11-15, Nicolas. Umsetzungsplan-Eintrag G3/G4 (`gotham/umsetzung.js`), PLAN-GOTHAM Zeilen G3 und G4.

## Absicht

Gotham besteht heute fast nur aus Baustellen: Auf jeder der 1657 Füllbau-Flächen steht eine. Die Stadt soll sich jetzt **automatisch entlang der Strassen mit Gebäuden füllen**. Uptown und Midtown bekommen hohe Türme, die Narrows am Hafen kleine Häuser, Fabriken und Lagerhallen. Auf Strassenhöhe soll Gotham lebendig wirken (Entscheidung Nicolas: **nah detailliert, fern schlicht**). Aus der Ferne soll eine glaubwürdige Skyline entstehen, ohne dass die Bildrate leidet.

## Ziele

- Jede Füllbau-Fläche (`GOTHAM_STADT.fuell`, IDs FB-…, Höhe `h`) wird ein Gebäude aus wenigen Vorlagen:
  - Wolkenkratzer
  - Bürohaus
  - Mietshaus
  - Laden mit Wohnung
  - Fabrik
  - Lagerhalle
- Die Vorlage wählt sich nach Wohlstand des Bezirks, Höhe und Grösse.
- **Geschosse mindestens 4,7 m** (Regel Gotham, Nicolas 2026-11-11). Geschosszahl N = max(1, round(h / 4,7)), Gebäudehöhe = N × 4,7 m plus Dachkante. Einzige Ausnahme sind hohe Hallen wie Fabrik und Lagerhalle: ein Geschoss mit 6–12 m.
- **Fern:** Jedes Gebäude ist eine schlichte Hülle mit Fassadentextur in Fensterachsen (3 m × 4,7 m), Geschossbändern bzw. Gesims als Textur, Dachkante und Flachdach.
- **Nah** (Vorschlag 200 m, Handy 120 m) kommen die Anbauten dazu:
  - an der Strassenseite im Erdgeschoss Läden mit Schaufenster, Markise und Schild
  - Hauseingang
  - Feuertreppen (Mietshaus)
  - Dachaufbauten: Wassertank, Treppenhaus, Lüftung, Kamine
  - Vordach bzw. Lobby (Büro, Wolkenkratzer)
  - Tore und Rampen (Lagerhalle, Fabrik)
- **Nachts** leuchten zufällige Fenster.
- **Kollision:** Hauswände sind fest, die Dächer begehbar (The Bat kann landen, man steht nicht im Haus). Beides gilt nur in der Nähe, wie heute bei den Baustellen.
- Das Gebäude-Register `BAUTEN` führt jedes Gebäude unter seiner ID mit Art „Füllbau“, Vorlage, Bezirk und Höhe. Hover-Schild und Rechtsklick-ID funktionieren damit weiter.
- Die Baustellen **BS-01 … BS-08** bleiben Baustellen.
- **Werkstatt:** Jede Vorlage lässt sich einzeln ansehen. T5 hat das versprochen: „Gebäude-Vorlagen kommen mit G3 dazu“.

## Nicht-Ziele

- Innenräume und begehbare Türen. Türen sind nur Optik. Die Gebäude sind innen leer und nicht betretbar.
- Lücken füllen und Seitengassen (das ist G5/G6).
- Gebäude mit Bedeutung wie Polizei oder Hafen (P3a/P3b).
- Tiefgaragen-Einfahrten an den unteren Strassen (PLAN-GOTHAM Entscheidung 9, später).
- Neue Grundrisse. Die Flächen aus `stadt.js` gelten, und die Karte wird nicht neu berechnet.

## Anti-Ziele

- Die Ladezeit wird nicht spürbar länger. Die Hüllen werden nach dem Start als Kachel-Aufgabe gebaut und zwischengespeichert, wie heute die Baustellen.
- In Gotham kostet ein Bild höchstens ca. +1,5 ms (Desktop). Kein Bild ruckelt durch den Aufbau: höchstens ca. 4 ms je Portion.
- Es gibt keine eigenen Texturen je Gebäude. Alle Gebäude teilen sich die Materialien.
- Die Planungskarte (`gotham/index.html`) und die Füllbau-IDs ändern sich nicht.

## Ansätze

- **1 – Zusammengefasste Hüllen und Nahdetails je Zelle (gewählt, Nicolas):**
  - Hüllen aller Gebäude je 768-m-Zelle zu wenigen Netzen zusammengefasst, je Material eines (`gsplit` wie Strassen und Baustellen).
  - Die Anbauten werden je 128-m-Zelle in der Nähe in Portionen gebaut und wieder abgebaut.
  - Das passt zu Zellen, Zwischenspeicher und Portionen, die es im Projekt schon gibt. Es braucht wenige Zeichenaufrufe, und jedes Haus behält seine Masse.
- **2 – Instanzen:**
  - Gleiche Bauteile und gestreckte Hüllen als InstancedMesh.
  - Das ist am sparsamsten für die Grafikkarte, verzieht aber die Fenstertextur (dagegen hilft nur ein eigener Shader) und passt schlechter zu Kollision und IDs.
- **Verworfen:** jedes Haus als eigene Gruppe mit Detailstufen, wie der Entwurf `buildFuellbau`. Das wären Zehntausende Zeichenaufrufe.

## Entscheidungen

### Vorlagenwahl

Wohlstand w des Bezirks an der Flächenmitte (`GOTHAM.bezirke`, Punkt-in-Polygon), Fabrikviertel am Namen erkennbar:

| Bedingung | Vorlage |
|---|---|
| Fabrikviertel oder Narrows, Fläche ≥ 900 m², h ≤ 20 | Fabrik oder Lagerhalle (Zufall aus der ID) |
| h ≥ 60 und w ≥ 0,7 | Wolkenkratzer (ab 40 % der Höhe ein Rücksprung, wenn beide Seiten ≥ 30 m; Glas oder Stein aus der ID) |
| w ≥ 0,55 und h ≥ 18 | Bürohaus (Stein und Fensterbänder) |
| h ≤ 14 und Fläche ≤ 400 m² | Laden mit Wohnung (Ziegel, 1–3 Geschosse) |
| sonst | Mietshaus (Ziegel, Feuertreppe) |

### Hüllen

- **Front:** Die Strassenseite wird wie heute das Baustellentor bestimmt (`gbstGate`). Läden und Eingang sitzen an der Front.
- **Grundriss:** Die eingezogenen Flächen wie bei den Baustellen (`gbstInset`), damit kein Haus auf Gehsteig oder Fahrbahn steht. Gebäudefuss auf `GOT.STR`.
- **Materialien:** ein gemeinsames Material je Fassadenart. Jede Fassadenart hat eine eigene Canvas-Textur mit RepeatWrapping. UV in Fensterachsen, wie `face()` im Entwurf.
- **Fassadenarten:** Ziegel-Fenster, Stein-Büro, Glas-Vorhang, Fabrikfenster, Wellblech, Brandwand (Ziegel ohne Fenster).
- **Erdgeschoss:** an der Front eine eigene Textur mit Schaufenstern. Dazu kommt eine Leuchttextur (emissiveMap) mit zufällig hellen Fenstern, die nachts hochgeregelt wird.
- **Seiten:** Seiten, die an ein Nachbarhaus grenzen (unter 2 m Abstand), werden Brandwand. Sonst haben sie Fenster.
- **Zwischenspeicher:** IndexedDB-Eintrag wie `GBST`. Der Schlüssel ist `TH_HASH` plus Prüfsumme der neuen Dateien plus `stadt.js`.

### Nahdetails

- Je 128-m-Zelle werden alle Anbauten der Häuser darin zu Netzen je Material zusammengefasst.
- Gebaut wird in Portionen in der Kachel-Zeit. Wer sich entfernt, dem werden sie abgebaut. Der Abbau geschieht mit Abstand zum Aufbau-Radius, damit es am Rand nicht flackert.
- Die Bauteile stammen aus dem Entwurf `buildFuellbau`: Läden, Markisen, Schilder, Feuertreppe, Wassertank, Dachaufbauten. Sie werden auf gemeinsame Materialien umgestellt.
- Schilder kommen aus einem gemeinsamen Schild-Atlas mit festen Ladennamen (DELI, LAUNDROMAT, PAWN SHOP …). Der Zufall richtet sich nach der ID.

### Kollision und Register

- **Kollision:** je Gebäude ein gedrehter Quader (`dkAdd` aus `kern/drehkoll.js`) mit Oberseite als Boden auf dem Dach. Angelegt und entfernt werden nur Gebäude in den 128-m-Zellen um Spieler bzw. aktives Fahrzeug, wie `gbstCollStep`.
- **Baustellen:** Die Baustellen-Datei baut nur noch BS-01 … BS-08. Ihre Register-Einträge bleiben.

### Neue Dateien

- `js/gotham/gotham-gebaeude.js`: Vorlagenwahl, Hüllen, Zwischenspeicher, Register, Kollision.
- `js/gotham/gebaeude-vorlagen.js`: gemeinsame Materialien und Texturen, Bau der Anbauten je Vorlage. Die Werkstatt lädt diese Datei ebenfalls.
- Beide kommen in die FILES-Liste nach `gotham-baustellen.js`. Die Werkstatt-Abhängigkeit gehört in `ASSETS` und `BV_KEEP` in `sw.js`.

### Nach dem Builder-Check

- **Ladebildschirm:** Er wartet auch auf die Hüllen, wie heute auf die Baustellen. Nicolas wollte am 2026-11-15 ausdrücklich, dass der Ladebildschirm bis zum Letzten wartet. Die Hüllen bekommen darum solange die 30-ms-Scheibe. Ab dem zweiten Start kommen sie aus dem Zwischenspeicher.
- **Skyline (Nicolas):** Die Hüllen bleiben bis ca. 3 km sichtbar, die Skyline ist also auch von der Manor aus zu sehen. Für die Hüllen-Zellen gilt darum nicht die Ausblend-Regel von `gHideStep` (Sichtweite + 200 m), sondern eine eigene bis ca. 3 km. Kamera-Fernebene und Nebel müssen das zulassen. Das Leistungsbudget von +1,5 ms gilt auch mit der Skyline. Reicht es nicht, bekommen Hüllen in der Ferne weniger Dreiecke, zum Beispiel ohne Dachkante und Gesims.
- **Schatten (Nicolas):** Nur Gebäude in der Nähe werfen Schatten, im gleichen Radius wie die Anbauten (ca. 200 m). Die zusammengefassten Hüllen haben `castShadow = false` und `receiveShadow = true`. Für die Nähe gibt es je 128-m-Zelle eigene Schatten-Hüllen, also nur ins Schattenbild gezeichnete Kästen oder die Hüllen der Zelle mit `castShadow`. Die Anbauten werfen ebenfalls Schatten.
- **Hallenhöhe und Register** (Entscheidung des Bauenden): Fabrik und Lagerhalle bekommen die Hallenhöhe clamp(h, 6, 12). In `BAUTEN` und im Hover-Schild steht die gebaute Höhe, nicht h aus der Karte.
- **Kollision der Anbauten** (Entscheidung des Bauenden): Feuertreppen, Markisen, Wassertanks und Dachaufbauten sind nicht fest, nur Hülle und Dach. Damit bleibt die Landeprüfung von The Bat unverändert, und die Teile sind reine Optik.
- **Zwischenspeicher-Schlüssel** (Entscheidung des Bauenden): enthält auch `gotham-strassen.js`, weil Front und Einzug daraus kommen. So macht es GBST auch.

## Offen für den Bauenden

- Genaue Fassadenbilder je Art und die Schildnamen.
- Radien (Vorschlag 200/120 m).
- Feinheiten des Rücksprungs bei Wolkenkratzern.
- Ob das alte `buildFuellbau` bleibt oder in den Vorlagen aufgeht. Die Werkstatt muss dann die Vorlagen zeigen.
