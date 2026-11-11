# Wayne Manor 3D – Kacheln und Lade-Steuerung (Plan T1-T4, Stand 2026-11-11)

Voraussetzung für Gotham (`PLAN-GOTHAM.md`, Phase 0). Erst wenn das läuft, wird Gotham gebaut.

## Ist-Zustand (gemessen 2026-11-11, Desktop, Orbit-Startansicht)

| Wert | heute |
|------|-------|
| Ladezeit bis spielbar | ca. 6,3 s (alles wird beim Start gebaut) |
| Zeichenaufrufe pro Bild | 572 |
| Dreiecke pro Bild | ca. 3,0 Mio. |
| Bildzeit (Grafik) | ca. 2,5 ms |
| Speicher (JS) | ca. 113 MB |
| Gelände | **ein** Netz 640 x 640 (Raster 2 m in der Mitte, bis 22 m am Rand), reicht bis ±1500 m, Laufgrenze 700 m |
| Wald | 7230 Bäume, alle beim Start, in 400-m-Feldern |
| Kollision | 3008 Quader und 8410 Kreise, **bei jedem Schritt alle durchgesehen** |

Gotham (2 x 3 km, ca. 1 km entfernt) passt weder ins Gelände-Netz noch in diese Art zu laden: alles beim Start bauen und jede Kollision linear prüfen wird mit Tausenden Gebäuden zu langsam, am Handy sowieso. Handy ist noch nie gemessen.

## Idee in einem Satz

Die Welt wird in **Kacheln zu 128 x 128 m** geteilt; um den Spieler werden nur die Kacheln innerhalb der **Ladeweite** gebaut (nah fein, weiter weg grob), der Rest wird nach und nach in kleinen Portionen pro Bild nachgeladen und weit hinten wieder freigegeben.

## Was gekachelt wird und was nicht

- **Gelände:** pro Kachel ein eigenes Netz aus derselben Höhenformel (`genH`), darum passen die Ränder ohne sichtbare Naht. Feinheit nach Abstand (LOD): nahe Kacheln 2 m Raster (wie heute am Anwesen), dann 4, 8, 16 m. Gegen Risse zwischen fein und grob hängt an jedem Kachelrand eine kurze Schürze nach unten. Ausschnitte (Pool, Brunnen, Portale, Silo, Rampe, Meereshöhlen) gelten pro Eckpunkt wie heute.
- **Höhe für Laufen und Fahren** (`terrainH`) wird immer aus dem feinen 2-m-Raster gerechnet und pro Kachel gemerkt (ca. 17 KB je Kachel), egal wie grob die Kachel gerade angezeigt wird. Darum steht man überall gleich hoch, auch wenn die Ansicht wechselt.
- **Wald und Felsen:** pro Kachel als InstancedMesh, mit festem Zufall je Kachel (nach dem Neuladen stehen die Bäume genau gleich). Weit weg keine einzelnen Bäume mehr, nur dunklere Waldfarbe im Gelände.
- **Kollision:** ein **Raster aus 16-m-Zellen** für Quader und Kreise. Laufen und Fahren prüfen nur noch die Zellen in der Nähe statt aller 11 000 Hindernisse. Kacheln tragen ihre Hindernisse beim Laden ein und beim Entladen wieder aus. Bringt schon heute etwas.
- **Gotham-Gebäude** (später): pro Kachel aus `gotham/daten.js` und den Vorlagen erzeugt, je Kachel und Material zusammengefasst. Ganz weit weg nur einfache Quader als Silhouette, damit die Skyline am Horizont steht.
- **Nicht gekachelt:** das handgebaute Anwesen (Haus, Garage, Höhlen, Serpentine, Hauptstrasse, Steilküste, Mauer). Es bleibt fest geladen wie heute (keine Änderung an diesen Dateien), wird aber ausgeblendet, wenn man weit weg ist; die Höhlen nur in ihrer Nähe.

## Lade-Steuerung („Load Balancing“)

1. **Ring um den Spieler** (beim Fahren/Fliegen um das Fahrzeug, im Orbit um die Kamera): alle Kacheln innerhalb der Ladeweite sollen da sein. Entladen erst eine Kachel weiter aussen (sonst springt es an der Grenze hin und her).
2. **Warteschlange mit Vorrang:** nahe vor schnell fern, vorne im Blick vor hinten, in Fahrtrichtung voraus (wichtig für Jet und The Bat, die schnell sind).
3. **Zeitbudget pro Bild:** Aufbau in kleinen Schritten (Höhen rechnen, Netz bauen, Bäume setzen, Kollision eintragen), pro Bild höchstens ca. 4 ms am PC und 2 ms am Handy. Dann ruckelt nichts, es wird nur etwas später fertig.
4. **Feinheit wechseln ohne Flackern:** neues Netz erst fertig bauen, dann austauschen.
5. **Zwischenspeicher:** zuletzt verlassene Kacheln bleiben noch eine Weile im Speicher (Rückweg lädt sofort), mit Obergrenze.
6. **Nebel und Sichtweite folgen der Ladeweite:** der Nebel ist vor der letzten geladenen Kachel dicht, man sieht keine Kante. Dahinter ein sehr grober Fernring (32-m-Raster bis ca. 3 km) für Berge, Küste und Skyline.

## Einstellungen (T3)

Neuer Knopf „Einstellungen“ (Orbit-Leiste und T-Menü):

- **Ladeweite:** 2 bis 8 Kacheln (256 m bis 1 km). Vorgabe PC 5 (640 m), Handy 3 (384 m).
- **Grafik:** Schatten an/aus, Auflösung (Pixel-Verhältnis).
- **Lautstärke:** der bestehende Regler zieht hierher um.
- **FPS-Anzeige** an/aus.

Gespeichert im Browser (`localStorage`). Das wirkt für dich wie ein Cookie (bleibt nach dem Neuladen), wird aber nie an einen Server geschickt. Die Lautstärke wird heute schon so gemerkt.

## Ladescreen (T4)

Beim Start werden nur das Anwesen und die Kacheln um den Startpunkt gebaut, der Rest kommt im Hintergrund. Ziel: **spielbar in unter 3 s** statt 6,3 s. Der Ladebildschirm zeigt echte Schritte mit Fortschritt. PC: breit, mit Tastenbelegung als Tipps. Handy: eigene Anordnung mit Touch-Tipps.

## Schritte (je einzeln bauen, testen, committen)

| Nr | Schritt | Prüfen |
|----|---------|--------|
| K1 | **FPS-/Messanzeige** (Bildrate, Bildzeit, Zeichenaufrufe, Dreiecke, geladene Kacheln), ein- und ausblendbar | Werte vor dem Umbau festhalten, PC und Handy-Emulation |
| K2 | **Kollisions-Raster** (16-m-Zellen) für Quader und Kreise | Verhalten unverändert: alle Teleport-Ziele, Garage, Höhlen, Mauer, Fahrzeuge; Zeit pro Schritt kleiner |
| K3 | **Kachel-Verwaltung** (Ring, Warteschlange, Zeitbudget, Cache) und **Wald pro Kachel** | Bäume erscheinen und verschwinden um den Spieler, kein Ruckeln, Bäume nach Neuladen gleich |
| K4 | **Gelände in Kacheln mit LOD** (ersetzt das 640er-Netz), Höhen-Merker, Ausschnitte, Grenze 700 m fällt | Keine Risse, Wege, Rampe, Portale, Küste, Silo; alles Platzierte steht auf dem Boden (Höhe ändert sich ausserhalb des Anwesens leicht, weil das Raster dort feiner wird) |
| K5 | **Fernring, Nebel und Sichtweite** an der Ladeweite | Keine sichtbare Kante, Horizont mit Bergen und Küste |
| K6 | **Einstellungen** (Ladeweite, Grafik, Lautstärke, FPS) | Wert bleibt nach Neuladen, Wirkung sofort |
| K7 | **Ladescreen PC/Handy** mit echtem Fortschritt, Start nur mit nahen Kacheln | unter 3 s bis spielbar |
| K8 | **Handy messen** (echtes Gerät von Nicolas) und Vorgaben anpassen | mind. 30 FPS am Handy |

## Risiken

- K4 ändert das Gelände ausserhalb des Anwesens leicht (feineres Raster). Dinge, die beim Start auf das Gelände gesetzt werden (Küstenfelsen, Steilküsten-Haut, Strassen), müssen nachgeprüft werden. Darum K4 als eigener Schritt mit vielen Prüfstellen.
- Web Worker (Rechnen im Hintergrund-Thread) bringt hier vorerst wenig, weil die Höhenformel an vielen gemeinsamen Funktionen hängt. Erst nötig, wenn das Zeitbudget nicht reicht.

## Fragen an Nicolas

1. Vorgaben Ladeweite PC 5 Kacheln (640 m) und Handy 3 (384 m) so recht?
2. Statt Weltrand ein grober Horizont bis ca. 3 km, einverstanden?
3. Mit K1 und K2 anfangen? Beide ändern nichts Sichtbares (ausser der Anzeige) und machen das Spiel sofort etwas schneller.
