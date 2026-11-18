# Batverse – Regeln und wichtige Infos

Eigene Datei für das Batverse (Nicolas 2026-11-18: "eine eigene md für das Batverse, da das Projekt relativ gross wird").
Gilt zusätzlich zu `C:\Source\CLAUDE.md` und `C:\Source\random\CLAUDE.md`.

## Arbeitsregeln (Nicolas 2026-11-18)

- **Immer den Stand sagen**, wenn ein Auftrag erledigt ist oder sich etwas ändert.
- **Rückfragen nicht stellen, sondern aufschreiben**: in `OFFENE-FRAGEN.md`, jeweils mit "Bis dahin: …" (was gilt, bis Nicolas antwortet). Nicolas schaut sie später an.
- **Wichtige Infos aufschreiben**, die Nicolas später noch wissen muss (z. B. mit welcher Taste man driftet): im Abschnitt "Tasten und Bedienung" unten. Nicolas überfliegt die Stand-Antworten oft nur.
- **Fragt Nicolas "was ist offen?"** oder nach Infos aus einer md: bei Rückfragen höchstens die **ersten 10** nennen und sagen, **wie viele es insgesamt** sind.
- **Ideen** dürfen alle auf einmal genannt werden.
- Neue Notizlisten von Nicolas kommen als eigene Phase in `PLAN-GOTHAM.md` (Nummern N…), mit Stand je Punkt.
- Vor jeder Umsetzung prüfen, ob sie nur fürs Spiel gilt oder auch für die Werkstatt (siehe `C:\Source\random\CLAUDE.md`, Abschnitt Batverse).
- Neue Einträge zum Stand (was gebaut wurde) kommen ab 2026-11-18 oben in **"Änderungen"** dieser Datei, nicht mehr in `C:\Source\random\CLAUDE.md` (dort steht die Geschichte bis 2026-11-17).

## Wichtige Dateien

| Datei | Inhalt |
|-------|--------|
| `PLAN-GOTHAM.md` | Gesamtplan mit Phasen, Notizen 17.11. (Phase 10) und 18.11. (Phase 11) |
| `OFFENE-FRAGEN.md` | Rückfragen an Nicolas mit "Bis dahin" |
| `IDEEN-CASINO.md` | Ideen für Casino-Spiele |
| `IDEEN-AKTE.md` | Ideen für die Personalakte (Lizenzen, Strafregister, Fahrausweis) |
| `PLAN-BANKAUTOMAT.md`, `PLAN-LAPTOP.md`, `PLAN-SPIELAUTOMAT.md` | Pläne einzelner Bauschritte |
| `PLAN.md` | ursprünglicher Bauplan Wayne Manor |

## Tasten und Bedienung (Stand 2026-11-18)

| Was | Taste |
|-----|-------|
| Inventar | E oder I (zu Fuss) |
| Hotbar wählen | 1–9, Mausrad (auch Bargeld und Karte rechts daneben) |
| Zielen / benutzen | rechte Maus halten / linke Maus |
| Nachladen | R |
| Handy | P |
| Karte gross | K oder M; Minikarte an/aus: Umschalt+K |
| Geist (fliegen) | G (Spiel und Werkstatt), in der Werkstatt auch 5 |
| Tore, Türen, Automaten, Tische | Rechtsklick (zu Fuss), im Fahrzeug auch E |
| Ton an/aus im Fahrzeug | N |
| Container-Aufzug im Auto | L |
| Tumbler-Sprung | im Tumbler, 10 s Abklingzeit |
| Behälter (Waffenwand, später Tresore, Koffer, Mülleimer) | Rechtsklick davor (nur von vorne, aus der Nähe); im Fenster ziehen, Shift+Klick = Behälter ↔ Inventar |
| Werkstatt-Modi | 1 Ansehen, 2 Fahren, 3 Drehteller, 4 Person, 5 Geist, Z Zeichnen |

Neue Tasten (z. B. Drift) hier eintragen, sobald sie gebaut sind.

## Änderungen

- **Behälter-Inventar und Waffenwand** (Nicolas 2026-11-18, N22 und N27: "mit Rechtsklick soll ein Inventar aufgehen, wo die 2D-Varianten gezeigt werden … nur vor der Wand, nicht von dahinter, nur aus bestimmter Nähe"): inventar.js – `INV.box` (offener Behälter, Plätze ab Index 100 über `invGet`/`invSet`; Verschieben, Verteilen, halber Stapel und Shift+Klick gelten auch dort), `invBox(id, name, n, init, cols)` (gespeichert in localStorage `wm-box-<id>`, Werkstatt `wm-werkstatt-box-…`), `invBoxOpen(box)`, `invBoxCount`, `invBoxFront(obj, near)` (Front lokal -z, sonst Meldung "nur von vorne" bzw. "zu weit weg"), `box.onChange`. Fenster: oben Name und Plätze des Behälters, darunter "Inventar" (Batsignal-Schalter dann ausgeblendet, Fenster scrollt auf kleinen Bildschirmen); beim Schliessen gespeichert. schusswaffen.js `buildWaffenwand()` (Lochwand 3 x 2,25 m mit Rahmen und Füssen, Waffen seitlich in 4 Reihen: Sniper, MG / Schrotflinte, EMP / Pistole, Greifhaken (Platzhalter), 3 Batarangs, 2 Rauchbomben / Munition auf einer Ablage), `WAFFENWAND_INHALT`, `waffenwandSync` (an der Wand hängt nur, was im Behälter ist). Werkstatt: Wand 1,45 m hinter dem Laptop-Tisch, Rechtsklick "Waffenwand öffnen" (27 Plätze). Geprüft mit echter Maus: Hinweis, Rechtsklick öffnet, Sniper herausgezogen, EMP per Shift+Klick, beide verschwinden von der Wand und sind gespeichert, Sniper zurückgelegt und wieder sichtbar, Esc schliesst; von hinten und aus 5 m abgelehnt; normales Inventar (E) ohne Behälter-Teil. Im Spiel noch nicht verwendet (Geheimbasis-Waffenwand und Tresore folgen mit N23).
- **Batarang-Flugbahn ohne Steigen beim Rückflug** (Nicolas 2026-11-18, N50: "in der Hälfte fliegt der Batarang auf einmal nochmal viel höher und kommt dann zurück"): Ursache: beim Wurf mit leicht erhobenem Blick behielt er beim Wenden die Steiggeschwindigkeit, und das Beschleunigen auf dem Rückweg (`setLength`) vergrösserte sie noch. waffen.js `batarangStep`: hinaus klingt das Steigen ab (`v.y *= exp(-2,5 dt)` statt Schwerkraft 1,2), beim Wenden steuert er zur Handhöhe und beschleunigt nur waagrecht. Gemessen (gleiche Rechnung, ohne Hindernisse): 8 Grad hoch geworfen höchster Punkt 1,4 m am Wendepunkt (vorher 4,1 m beim Rückflug), 20 Grad 3,5 m; Bogen wie vorher (3,5 m rechts, 8,9 m links, nach 1,9 s in der Hand). Gezielter Wurf unverändert.
- **Notizen 18.11.2026 eingeplant** (Nicolas 2026-11-18, Notizliste): `PLAN-GOTHAM.md` Phase 11 (N16–N50) und Ergänzung Waffen/Militärfahrzeuge; `IDEEN-CASINO.md`, `IDEEN-AKTE.md`; Rückfragen 33–42 in `OFFENE-FRAGEN.md`; diese Datei mit den Arbeitsregeln. Noch nichts davon gebaut.
