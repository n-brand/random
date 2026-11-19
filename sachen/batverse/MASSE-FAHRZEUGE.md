# Fahrzeuggrössen: Vergleich und Vorschlag

Nicolas 2026-11-19: "Vergleiche die Fahrzeuge mal noch – z. B. G-Klasse und Geldtransporter sind unrealistisch anders gross – mach einen Vorschlag, wie wir das fixen."

## Messung (Werkstatt, 2026-11-19)

Gemessen über alle sichtbaren Teile, darum **mit Spiegeln, Lichtbalken und Antennen** (Breite und Höhe sind deshalb oft etwas grösser als die Karosserie).
"Echt" sind ungefähre Werte vergleichbarer echter Fahrzeuge aus meinem Wissen (nicht nachgemessen, ohne Spiegel); bei eigenen Entwürfen ein passendes Vorbild.
Abweichung = Modell gegenüber echt, nur Länge und Karosseriehöhe (Breite mit Spiegeln ist nicht vergleichbar).

| Fahrzeug | Modell L × B × H (m) | Echt ca. L × B × H (m) | Auffällig |
|---|---|---|---|
| Mercedes-Benz G-Klasse | 5,05 × 2,26 × 2,03 | 4,66 × 1,93 × 1,97 | Länge +8 % |
| Geldtransporter (Gotham Secure) | 7,70 × 2,82 × 3,69 (Dach 2,99) | 7,3 × 2,4 × 3,0 | passt |
| Gotham Police (Limousine) | 5,33 × 2,22 × 1,78 (Dach ca. 1,41) | 5,39 × 2,0 × 1,45 | passt |
| Gotham Taxi | 5,13 × 2,23 × 1,63 | 5,39 × 2,0 × 1,45 | Höhe mit Schild, passt |
| Police Van | 6,53 × 2,60 × 3,40 (Dach 2,6) | 6,0–7,0 × 2,0 × 2,7 | passt |
| Police Pickup | 6,33 × 2,42 × 3,02 (Dach 2,1) | 5,9 × 2,03 × 1,96 | Länge +7 %, Dach +7 % |
| Rolls-Royce (grau) | 6,26 × 2,30 × 1,64 | 5,76 × 2,02 × 1,65 | Länge +9 % |
| Rolls-Royce Spectre | 5,49 × 2,24 × 1,61 | 5,48 × 2,08 × 1,56 | passt |
| Aventador | 4,90 × 2,10 × 1,17 | 4,78 × 2,03 × 1,14 | passt |
| DeLorean | 4,63 × 2,25 × 1,44 | 4,27 × 1,86 × 1,14 | **Länge +8 %, Höhe +26 %** |
| Tumbler | 5,37 × 2,60 × 1,66 | 4,6 × 2,8 × 1,5 | **Länge +17 %** |
| Bus | 12,23 × 3,30 × 3,37 | 12,0 × 2,55 × 3,1 | passt |
| Gotham Fire Engine | 10,11 × **3,96** × 4,35 | 10 × 2,55 × 3,3 | **Breite und Höhe viel zu gross** |
| Gotham Fire Ladder | 12,76 × 3,20 × 3,93 | 12 × 2,55 × 3,5 | Höhe +12 % |
| Gotham Fire Crane | 12,75 × 3,30 × 5,92 | 12 × 2,55 × 4,0 | **Höhe viel zu gross** |
| Abschleppwagen | 9,73 × 3,00 × 3,27 | 10 × 2,55 × 3,6 | passt |
| Piranha I | 6,72 × 2,93 × (Dach 2,0) | 6,25 × 2,5 × 1,85 | Länge +7 % |
| Duro IIIP | 7,66 × 3,38 × (Dach 2,95) | 6,9 × 2,16 × 2,9 | Länge +11 % |
| Panzer | 9,10 × 3,57 × 2,68 | 9,97 × 3,75 × 3,0 | eher klein (−10 %) |
| Motorrad, Streetfighter, Batpod | 2,2–3,8 × 0,8–1,2 × 1,1–1,2 | 2,1–3,8 × 0,8–1,2 × 1,1 | passt |

## Befund

- **G-Klasse und Geldtransporter liegen beide nahe an echt.** Ein echter Geldtransporter ist wirklich rund 1 m höher und 2,7 m länger als eine G-Klasse. Im Bild verstärkt die Perspektive den Eindruck (der Transporter steht näher an der Kamera), und die wuchtige Front mit Rammschutz wirkt zusätzlich gross. Die G-Klasse ist eher etwas zu lang (+8 %).
- **Klar daneben** sind die Feuerwehr (Fire Engine fast 4 m breit, Höhe 4,35 m; Fire Crane fast 6 m hoch), der DeLorean (zu hoch), der Tumbler (zu lang) und leicht der Duro und der Rolls-Royce (grau).
- Es gibt **keinen gemeinsamen Massstab-Check**: jedes Modell wurde für sich nach Fotos gebaut.

## Vorschlag

1. **Grössenvergleich in der Werkstatt** (neue Auswahl "Grössenvergleich"): alle Fahrzeuge in einer Reihe nebeneinander auf einem 1-m-Raster, dazu eine Spielfigur (1,78 m) und eine Tür (2,2 m) als Massstab. Damit sieht man Abweichungen sofort und kann sie gemeinsam beurteilen.
2. **Tabelle der Sollmasse** (diese Datei) als Regel: neue und überarbeitete Fahrzeuge werden gegen ein echtes Vorbild gemessen; Abweichung höchstens ±5 % bei Länge und Karosseriehöhe.
3. **Korrektur je Modell**:
   - Wo nur die Gesamtgrösse nicht stimmt (G-Klasse, Rolls-Royce grau, Tumbler, Duro, Pickup, Panzer): ein Massstabsfaktor je Modell, der Modell **und** Fahrdaten zusammen skaliert (Räder, Radstand, Spur, Kollisionspunkte, Sitz, Kamera, Ausstiege). Dafür eine kleine Hilfsfunktion `massstab(spec, bau, k)`, damit nichts auseinanderläuft.
   - Wo die Proportionen falsch sind (Feuerwehr, DeLorean): Modell neu aufbauen bzw. Masse im Bau korrigieren. Bei der Feuerwehr gleich zusammen mit der gewünschten Überarbeitung aller Feuerwehrfahrzeuge.
4. Danach in der Werkstatt-Reihe nochmals messen und diese Tabelle nachführen.

Bis zur Entscheidung: nichts skaliert; die Feuerwehr bekommt bei ihrer Überarbeitung schon die richtigen Masse (2,55 m breit, Höhe nach Tabelle).
