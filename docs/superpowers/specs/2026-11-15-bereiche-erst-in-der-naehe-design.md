# Batcave und Manor-Umgebung erst in der Nähe bauen – Design

Stand 2026-11-15, Nicolas: "kann man die batcave und wayne manor auch erst bauen wenn man in der nähe ist aber nicht zu viel auf einmal
gleichzeitig weil es sonst laggen könnte". Gewählt: Ansatz A. Batverse, `sachen/batverse/`.

## Absicht

Das Spiel startet über Gotham, 1,5 bis 4 km von der Manor entfernt. Trotzdem baut es beim Laden die ganze Batcave und die Manor-Umgebung.

Gemessen am Desktop (LOADT):

| Datei | Zeit | davon Daten | davon Netze und Kollision |
|---|---|---|---|
| hoehle-unten.js | ca. 260 ms | 84 ms (Raster `CM`) | ca. 180 ms |
| hoehle-oben.js | ca. 130 ms | 64 ms (Raster `CMU`) | ca. 65 ms |
| serpentine-bau.js | ca. 113 ms | – | ca. 113 ms |
| grundmauer.js | ca. 80 ms | – | ca. 80 ms |

Haus, Aussenanlage und Aufzüge kosten zusammen etwa 50 ms und bleiben, wie sie sind.

Ziel: Diese vier Teile entstehen erst, wenn man in die Nähe kommt, in kleinen Portionen pro Bild. So wird der Start schneller, das Spiel ruckelt nicht, und Speicher wird erst belegt, wenn man dort ist.

## Ziele

- Etwa 0,25–0,35 s weniger Ladezeit bis zum ersten Bild bei der Startansicht über Gotham (Höhlennetze ca. 245 ms plus der verzögerte Teil der Serpentine).
- **Kein Ruckeln:** Ein Bereich baut sich in Portionen von höchstens 3 ms je Bild. Solange der Ladebildschirm steht, gilt `TILES.slice()`, also 30 ms.
- **Bau startet**, sobald Kamera, Spieler oder aktives Fahrzeug näher als 600 m an der Mitte eines Bereichs sind.
- **Rechtzeitig fertig:** Wer ankommt, findet den Bereich fertig vor.
  - Normal unterwegs: Bei 600 m Vorlauf und 3 ms je Bild ist das gegeben.
  - Sofortiger Fertigbau: Teleport (Menü T, Orte und Fahrzeuge), „Hierhin teleportieren“ im Orbit, Halt des Personenaufzugs bzw. des Autoaufzugs in der Höhle, „Fahrzeug holen“ in einem Bereich.
- **Zeichenaufrufe:** Ein fertiger Bereich fasst seine statischen Teile selbst je Material zusammen, wie start.js. Der Untergrund-Teil wird wie bisher oben ausgeblendet (`UNDERGROUND`). Weil Materialien, die der Bereich mit anderen Teilen teilt, nicht mehr zusammen mit denen gezeichnet werden, sind in der Batcave höchstens +15 Zeichenaufrufe erlaubt (Claude, nach der Prüfung: ca. 0,1 ms, nur dort).
- **Kollision:** Sie entsteht mit den Netzen. Es gibt keinen Zustand, in dem man sie sieht, aber durchfällt.
- **Gebaut bleibt gebaut,** kein Entladen.

## Nicht-Ziele

- Haus, Aussenanlage, Tore, Aufzüge, Fahrzeuge, Höhlenlichter: Sie bleiben beim Laden.
- Höhlenraster `CM`/`CMU`, `caveAt`, `caveUpAt`: Physik, Kamera und Boot brauchen sie überall. Sie bleiben beim Laden.
- Entladen beim Wegfahren.
- Zwischenspeicher in IndexedDB (Ansatz C).

## Anti-Ziele

- Ein spürbarer Ruckler beim Annähern: kein Bild über +5 ms durch den Bau.
- Durch den Boden fallen, weil die Kollision noch fehlt. Das gilt für Spieler, Fahrzeuge in der Garage oder Batcave und das Boot am Steg.
- Teile bekommen eine andere Gestalt oder Lage als heute (Zufall: gleiche Reihenfolge und gleiche Werte).
- Mehr als +15 Zeichenaufrufe in der Batcave (heute 276).

## Ansätze

- **A, gewählt:** Die vier teuren Blöcke werden zu Bau-Aufgaben mit Zeitbudget.
- **B, verworfen:** Alles rund um die Manor verzögern. Das bringt nur etwa 50 ms mehr, und viele Dateien greifen beim Laden auf Haus, Tore und Stellplätze zu.
- **C, verworfen:** Fertige Netze zwischenspeichern. Hilft nur ab dem zweiten Start, der Speicher bleibt belegt, und viele Materialien zu speichern ist aufwendig.

## Entwurf

- **Neue Datei `js/kern/bereiche.js`**, in `FILES` nach `kern/basis.js`, damit Bau-Hilfen wie `B()` bekannt sind:
  - `areaAdd({ id, x, z, r = 600, gen })`: `gen` ist eine Generator-Funktion. Sie baut Netze und Kollision und gibt mit `yield` zwischen kleinen Portionen ab.
  - `areaEnsure(x, z, pad = 0)`: baut alle Bereiche, deren Kreis den Punkt enthält, sofort fertig.
  - `AREAS` mit Zustand je Bereich: `wait`, `run` oder `done`.
- **Kachel-Aufgabe** in `TILES.tasks`:
  - Sie startet den Generator jedes Bereichs in Reichweite und lässt ihn im Zeitbudget laufen.
  - Am Ende fasst sie die statischen Teile des Bereichs zusammen, mit derselben Regel wie start.js. Diese Regel wird dafür zu einer gemeinsamen Funktion.
  - Im ersten Bild (`TILES.startup`) laufen nur Bereiche, in deren Kreis die Kamera steht.
- **Wo die Teile hinkommen:** Jeder Bereich baut in eine eigene Gruppe statt in `world`. Statische Teile werden danach zusammengefasst.
- **Kollision:** `solids`/`circles` wachsen während des Baus. `collNear` baut das Raster neu, sobald sich die Anzahl ändert (bestehendes Verhalten).
- **Bereiche, Mitte und Inhalt:**
  - `batcave`: ein Bereich für beide Höhlen (Claude, nach der Prüfung). Netze der unteren und der oberen Höhle, ohne Tore, Hebebühne, Lichter, Raster und `liftBay`, und ohne alles, was andere Dateien beim Laden brauchen.
  - `serpentine`: nur Felsen, Leitplanken, Leitpfosten und Geröll. **Fahrbahn und Grundstücksmauer bleiben beim Laden** (Nicolas 2026-11-15: "ja, fahrbahn und mauer beim laden lassen"; man sieht beide von weit her, von Brücken, Orbit und The Bat).
  - `grundmauer.js` wird darum nicht verzögert.
- **Regel für die Aufteilung:** Was eine spätere Datei beim Laden liest, bleibt beim Laden. Dazu gehören `gates`-Einträge, `caveLights`, `world.userData.*`, Funktionen und Konstanten. Nur reine Netze und deren Kollision werden verzögert.
- **Kollision:** Teile werden einzeln ins Kollisionsraster eingetragen, nicht mit einem vollen `collBuild` je Bild (Claude).
- **Gleiche Gestalt:** Bereiche, die Zufall benutzen (`r1`, `rockR`, `vnoise`), müssen beim späteren Bau dieselben Werte bekommen. Ist der Zufall global und fortlaufend, erhält der Bereich einen eigenen Zufall mit festem Startwert, der so gewählt ist, dass die Ergebnisse gleich bleiben. Wo das nicht genau geht, ist eine Abweichung in der Gestalt erlaubt. Der Bauer meldet sie.
- **Sofortiger Fertigbau** (jeder ist ein absichtlicher Ruckler von ca. 0,25 s, darum nur, wo man sonst fallen würde; Claude, nach der Prüfung), Aufrufe von `areaEnsure` in:
  - `teleportToPoint` und `teleportTo` (ui/teleport.js),
  - „Fahrzeug holen“ (`summonVehicle`, `useCar`),
  - Halt des Personenaufzugs an Höhle oben und unten (personenaufzug.js),
  - Autoaufzug (autoaufzug.js),
  - Wechsel vom Geist zum Begehen (`ghostToWalk`, Taste G).
- Geist und „Von unten“ haben keine Kollision. Dort wird in Portionen gebaut, kurzes Auftauchen der Höhle ist erlaubt.

## Prüfung

- **Laden:** `LOADT` vorher und nachher, Summe und erstes Bild.
- **Annähern:** Fahrt mit dem Polizeiauto von Gotham zur Manor (Serpentine, Mauer), längstes Bild beim Annähern. Danach Aufzug in die Höhle, längstes Bild.
- **Teleport** in die Batcave aus Gotham: sofort Boden unter den Füssen, Fahrzeuge in der Batcave stehen.
- **Zeichenaufrufe** in der Batcave und an der Manor gleich wie vorher (±5).
- **Bild-Vergleich** Batcave, Serpentine und Mauer vorher und nachher, gleiche Kamera.

## Dem Bauer überlassen

- Die genaue Grenze, was in den vier Dateien verzögert wird, nach der Regel oben.
- Wie die Zusammenfassung aus start.js geteilt wird.
- Die Mitten der Bereiche, aus den vorhandenen Massen: Höhle um den Aufzug, Serpentine um `SERP`, Mauer um die Manor.
