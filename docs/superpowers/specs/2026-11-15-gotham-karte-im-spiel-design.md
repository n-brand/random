# T6 – Gotham-Karte im Spiel (Design)

Stand 2026-11-15, Nicolas. Umsetzungsplan-Eintrag T6 (`gotham/umsetzung.js`, PLAN-GOTHAM Zeile 23).

## Absicht

Im Spiel jederzeit wissen, wo man in Gotham ist: eine **kleine Karte, die immer mitläuft**, und auf Tastendruck eine
**grosse Karte über den ganzen Bildschirm** zum Nachschauen (Orte suchen, Weg überlegen).

## Ziele

- Kleine Karte (Minikarte): rund, unten rechts, dreht sich mit der Blickrichtung (wie ein Navi), Spieler als Pfeil in der Mitte.
  Zeigt Fahrzeugposition, wenn man fährt/fliegt.
- Grosse Karte: Taste **K** öffnet/schliesst (auch Esc schliesst). Verschieben (ziehen), zoomen (Mausrad, +/−), Norden oben,
  eigener Pfeil, Knopf "zu mir". Das Spiel läuft dahinter weiter (Pause gibt es nicht; Eingaben gehen an die Karte, solange sie offen ist).
- Inhalt beider Karten aus den Daten, die das Spiel schon lädt (`GOTHAM`, `GOTHAM_STADT`): Wasser/Insel, Bezirke, Hauptstrassen,
  Nebenstrassen, Brücken, Füllbauten, Orte (mit Namen auf der grossen Karte), Baustellen, Wayne Manor (`GOTHAM.manorLage`).
- Aussehen wie die Planungskarte: Farben und Strichstärken aus `gotham/index.html` übernommen.

## Nicht-Ziele

- Keine Planungsfunktionen: keine Konfliktprüfung, kein Info-Panel, keine Ebenenliste, kein Kanal/Gullis/Bus.
- Kein Teleport per Klick (kann später kommen).
- Die bestehenden Boden-Overlays (Knopf "Karte": Aussenanlage, Höhlen) bleiben unverändert.

## Anti-Ziele

- Die Minikarte darf die Bildzeit nicht spürbar erhöhen (Ziel < 0,3 ms je Bild) und das Laden nicht verlängern.
- Die Planungsseite `gotham/index.html` wird nicht verändert.

## Ansätze

- **A** Planungsseite als eingebettetes Fenster wiederverwenden: gleiches Aussehen, aber die Seite rechnet beim Öffnen viel selbst.
- **B** Zeichencode aus der Planungsseite in eine gemeinsame Datei herauslösen: sauber, aber grosser Umbau mit Risiko für die Planungsseite.
- **C** Eigene Spielkarte aus den vorhandenen Daten: leicht und schnell. **Gewählt (Nicolas), kombiniert mit A:** die passenden
  Zeichenteile aus `gotham/index.html` werden kopiert, umbenannt und fürs Spiel angepasst (Canvas statt SVG).

## Entscheidungen

- Neue Datei `js/ui/stadtkarte.js` (in FILES nach `ui/karten-overlay.js`), Präfix `SK` für alle globalen Namen.
- Zeichnen mit Canvas 2D und `Path2D`. Die Pfade werden einmal beim ersten Gebrauch aus den Daten gebaut, in Kartenkoordinaten.
- Minikarte: einmalig vorgezeichnetes Bild der ganzen Karte (ca. 0,5 px/m), davon je Bild ein gedrehter Ausschnitt; das
  Vorzeichnen läuft nach dem Ladebildschirm in kleinen Portionen (wie die Bereiche), nicht beim Laden.
- Grosse Karte: Vektorzeichnung, neu gezeichnet nur bei Verschieben/Zoomen/Bewegung (höchstens jedes Bild).
- Position: `GOT.toMap(x, z)`; Blickrichtung über dieselbe Drehung umgerechnet.
- Ausserhalb der Karte (`GOTHAM.ansicht`) zeigt die Minikarte am Rand einen Pfeil Richtung Kartenmitte.
- In der Batcave: Position = Lage über der Höhle (unter Wayne Manor), Pfeil mit Hinweis "unter Tage".
- Minikarte ein-/ausschaltbar (Taste **Umschalt+K**), Zustand in localStorage (`wm-minikarte`), Standard an.

## Offen für den Bauenden

- Genaue Grösse der Minikarte (Vorschlag 180 px, auf Handy 120 px) und Massstab (Vorschlag ca. 400 m Durchmesser, beim Fahren grösser).
- Welche Orte auf der grossen Karte je Zoomstufe beschriftet werden.
