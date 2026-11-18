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
| Werkstatt-Modi | 1 Ansehen, 2 Fahren, 3 Drehteller, 4 Person, 5 Geist, Z Zeichnen |

Neue Tasten (z. B. Drift) hier eintragen, sobald sie gebaut sind.

## Änderungen

- **Batarang-Flugbahn ohne Steigen beim Rückflug** (Nicolas 2026-11-18, N50: "in der Hälfte fliegt der Batarang auf einmal nochmal viel höher und kommt dann zurück"): Ursache: beim Wurf mit leicht erhobenem Blick behielt er beim Wenden die Steiggeschwindigkeit, und das Beschleunigen auf dem Rückweg (`setLength`) vergrösserte sie noch. waffen.js `batarangStep`: hinaus klingt das Steigen ab (`v.y *= exp(-2,5 dt)` statt Schwerkraft 1,2), beim Wenden steuert er zur Handhöhe und beschleunigt nur waagrecht. Gemessen (gleiche Rechnung, ohne Hindernisse): 8 Grad hoch geworfen höchster Punkt 1,4 m am Wendepunkt (vorher 4,1 m beim Rückflug), 20 Grad 3,5 m; Bogen wie vorher (3,5 m rechts, 8,9 m links, nach 1,9 s in der Hand). Gezielter Wurf unverändert.
- **Notizen 18.11.2026 eingeplant** (Nicolas 2026-11-18, Notizliste): `PLAN-GOTHAM.md` Phase 11 (N16–N50) und Ergänzung Waffen/Militärfahrzeuge; `IDEEN-CASINO.md`, `IDEEN-AKTE.md`; Rückfragen 33–42 in `OFFENE-FRAGEN.md`; diese Datei mit den Arbeitsregeln. Noch nichts davon gebaut.
