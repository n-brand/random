# Wayne Manor 3D

Wayne Manor als begehbare 3D-Szene im Browser (three.js 0.160, eine Datei `index.html`, keine Build-Tools).
Gebaut nach den Lageplaenen in `karten/` (Aussenanlage, Nebengeschosse, oberes und unteres Level der Hoehle)
und den Skizzen unter `karten/planung/`. Bauplan und Stand der einzelnen Schritte: `PLAN.md`.

![Vorschau](vorschau.webp)

## Inhalt

- **Anwesen auf einem Plateau (25 m):** Schloss mit Ecktuermen, Glasdach, Theater, Observatorium und Landeplatz,
  Rondell mit Brunnen, Heckenlabyrinth, Pool, Poolhaus, Tennis- und Basketballplatz, Tiefgarage mit Stellplaetzen.
- **Zufahrt:** Serpentine im Stil einer Alpenpassstrasse den Osthang hinunter, schraeges Einfahrtstor mit Torhaus,
  geschwungene Hauptstrasse zwischen Plateau und Steilkueste.
- **Batcave, zwei Ebenen:** oben Forschung und Waffenkammer, Hangars mit Jets, Vorraum mit Hangartor;
  unten drehende Tiefgarage, Medical Bay, Auto Repair mit Auffahr-Hebebuehne, Hoehlensee mit Steg und Boot,
  Felstor zum Lake Exit, Wassertunnel zur Steilkueste, Tunnel nach Gotham und zum Waterfall Exit.
- **Autoaufzug** Garage - Hangfuss - Batcave (mit Drehteller), Personenaufzug vom Haus bis in die Hoehle.
- **Landschaft:** Steilkueste mit Felswand, Wasserhoehlen und Felsnadeln, Bucht mit Landzungen, Wasserfall,
  Wald, Seen, Meer mit Wellen; Tag und Nacht.

## Bedienung

| Was | PC | Handy |
| --- | --- | --- |
| Umschauen (Orbit) | Ziehen, Mausrad | Wischen, zwei Finger |
| Begehen | Knopf "Begehen", Linksklick faengt die Maus, WASD, Leertaste springt, Shift rennt | Joysticks, Sprung-Knopf |
| Geist (fliegen) | Knopf "Geist", WASD waagrecht, Leertaste hoch, Strg runter, Shift schneller | Joysticks, Sprung/Runter |
| Tore, Hebebuehne | Zielen, Rechtsklick oder E | Hinweis antippen |
| Aufzuege | E; im Aufzug Tasten 1-5 oder Pfeile, Anzeige rechts | Anzeige antippen |
| Boot | E einsteigen/aussteigen, W/S Gas, A/D lenken, Shift schneller | Joysticks |
| Fahrzeuge (Tumbler, Rolls-Royce, Motorrad) | E ein/aus (naechstes Fahrzeug), W/S, A/D, Shift, Leertaste Sprung (nur Tumbler, ab 50 km/h), V Kamera, R zuruecksetzen, L Autoaufzug, 1-3 Halt, M Motorton an/aus | Joysticks, Sprung-Knopf |
| Karten | Knopf "Karte" blendet die Lageplaene ein | |
| Von unten | Knopf "Von unten": Blick unter das Gelaende auf Garage und Hoehle | |

Esc beendet Begehen, Geist und Fahren. Taste T oder die Auswahl "Teleport (Test)" springt zu festen Zielen
(Testhilfe, wird spaeter entfernt).

## Entwickeln

- Lokal ueber http starten (Service Worker), z. B. im Projektordner `python -m http.server 8080`.
- `?debug` stellt `window.manorDebug` bereit (Spieler, Wege, Aufzuege, Boot, Auto, Tore) zum Testen ohne Maus.
- Nach jeder Aenderung `CACHE` in `../../sw.js` hochzaehlen.

---

Erstellt von [Nicolas Brand](https://n-brand.github.io/portfolio/)
