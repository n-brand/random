# Plan Spielautomat ("einarmiger Bandit")

Nicolas 2026-11-17: "Die einarmigen Banditen sollen nochmal einen eigenen Bauschritt bekommen – ähnlich aufbauen wie beim Bankautomaten etc. und die UI direkt anpassen."

## Stand (2026-11-17)

- **S1 3D-Modell** (gebaut): `js/gotham/spielautomat-modell.js`, `buildSpielautomat(farbe)` – Sockel, Unterschrank mit Münzschale, schräges Tastenpult mit Dreh-Knopf, Bildschirm mit drei Walzen im Chromrahmen (leicht nach hinten geneigt), gewölbter Aufsatz mit JACKPOT-Schild und Lauflicht, Lichtleisten, Hebel rechts. Symbole als eigene Zeichnungen (`slotSymDraw`: 7, Diamant, BAR, Glocke, Stern, Zitrone, Kirschen).
- **S2 Werkstatt-Projekt** (gebaut): `PROJEKT` "Spielautomaten" – drei Automaten (rot, lila, blau), daneben Bankautomat und Laptop-Tisch; Rechtsklick als Person spielt, Hebel und 3D-Bildschirm laufen mit.
- **S3 Spielfenster** (gebaut): `js/ui/spielautomat.js` – Walzen (je 20 Felder), Gewinnlinie, Einsatz 10/50/100/500/1 000 in Jetons, Hebel ziehen, DREHEN oder Leertaste, Walzen halten nacheinander, Gewinnplan, letzte Ergebnisse.
- **S4 Casino** (gebaut): alle Automaten im Casino als Instanzen des Modells (4 Gehäusefarben, 3 Bildschirm-Varianten), je Reihe ein Rechtsklick-Ziel "Spielautomat spielen".

## Gewinnplan (Einsatz x Faktor, Annahme, OFFENE-FRAGEN 32)

| Linie | Faktor |
|---|---|
| 7 7 7 | 200 |
| Diamant x 3 | 80 |
| BAR x 3 | 40 |
| Glocke x 3 | 20 |
| Stern x 3 | 12 |
| Zitrone x 3 | 10 |
| Kirschen x 3 | 8 |
| 7 7 (erste zwei) | 10 |
| Diamant x 2 | 5 |
| BAR x 2 | 3 |
| 2 Kirschen irgendwo | 2 |

Walze: 7 x1, Diamant x1, BAR x2, Glocke x3, Stern x3, Zitrone x4, Kirschen x6 → im Schnitt ca. 92 % zurück.

## Offen / Ideen

- Hebel und Bildschirm der Casino-Automaten (Instanzen) bewegen sich beim Spielen nicht mit (nur in der Werkstatt).
- Klänge (Walzen, Gewinn), Jackpot-Anzeige über mehrere Automaten, Sitzhocker vor den Automaten.
