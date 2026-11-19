# Plan: Spielfiguren (N35)

Nicolas 2026-11-18: "Spielfiguren anfangen, einfach gebaut wie in Schedule I. Grosse Aufgabe: Fahrzeuge und Gebäude müssen evtl. an die Figurengrösse angepasst werden."

## Ziel

Einfache, freundliche Figuren im Low-Poly-Stil: runder Kopf, gezeichnetes Gesicht, glatte Kapseln für Arme und Beine, flache Farben, keine Finger. Eigener Entwurf, nichts aus Schedule I übernommen, nur der Stil (einfach, gut lesbar, wenige Teile).

## Massstab (heute im Spiel)

- Augenhöhe zu Fuss `EYE` 1,62 m, Körper `BODY` 1,8 m, Radius 0,3 m (laufen.js); Werkstatt-Person `EYE` 1,65 m.
- Die Figur wird **1,78 m** gross, Augen auf 1,62 m. Damit passen Türen (2,2 m), Treppen und Fahrzeuge wie bisher; Anpassungen sind erst nötig, wenn man die Figur in Fahrzeugen sitzen sieht (Sitzhöhe je Fahrzeug, `spec.seat`).

## Schritte

| Schritt | Inhalt | Stand |
|---|---|---|
| F1 | **Figur-Modell** `buildFigur(o)` (js/spieler/figur.js): Kopf, Haare (Varianten), Gesicht (Augen, Brauen, Mund als Textur), Rumpf, Arme, Beine, Schuhe; Farben je Figur (Haut, Haare, Oberteil, Hose, Schuhe); Gelenke als Gruppen. **Laufanimation** `figurPose(F, t, tempo)`: Stehen (leichtes Atmen), Gehen, Rennen (Arme und Beine schwingen, Kopf wippt), Springen. Werkstatt: Auswahl "Spielfigur" mit Drehteller; die Ersatzfigur auf dem Skateboard wird diese Figur. | gebaut 2026-11-18 |
| F2 | **Dritte Person** zu Fuss: Taste (z. B. F5 wäre Browser – Vorschlag **V** wie bei Fahrzeugen) wechselt Ich-Sicht/Kamera hinter der Figur; Figur dreht sich in Laufrichtung, Animation aus dem Tempo; Waffen und Gegenstände in der Hand der Figur. | gebaut 2026-11-19 (Taste V, Spiel und Werkstatt) |
| F3 | **Batman-Figur**: Anzug, Umhang (flattert, beim Gleiten N48 ausgebreitet), Maske; Wechsel über den Batsuit im Inventar (Körper-Platz, OFFENE-FRAGEN 50). | gebaut 2026-11-19 (Batsuit auf dem Inventar-Platz "Körper", Figur in der dritten Person) |
| F4 | **Figuren in der Welt**: Fussgänger in Gotham (gehen Gehsteige entlang, warten an Kreuzungen), Personal im Casino (Croupiers an den Tischen, Kassierer), Polizisten am Präsidium. Viele gleichzeitig: einfache Instanzen, nur nah animiert. | teilweise 2026-11-19: Personal im Casino (Croupiers, Kassierer), Polizisten am Präsidium; Fussgänger offen |
| F5 | **Fahrzeuge**: Figur sitzt sichtbar im Fahrzeug (Sitzpunkt je Spec), Ein-/Aussteigen kurz animiert; wo der Platz nicht passt, Fahrzeug oder Sitz anpassen. | offen |
| F6 | **Gebäude prüfen**: Türen, Treppen, Decken, Theken auf Figurengrösse (Casino, Präsidium, Werkstatt-Bauten); Liste der Abweichungen und Korrekturen. | offen |
| F7 | **Akten und Dating mit Gesichtern**: Fotos in der Akte (N38) und der Dating-App (N40) aus den Figuren gerendert. | offen |

## Fragen (stehen auch in OFFENE-FRAGEN.md 53)

- Taste für die dritte Person zu Fuss (Vorschlag V)?
- Soll die eigene Figur anpassbar sein (Haare, Kleidung) oder fest Bruce Wayne / Batman?

## Bis dahin

F1 ist gebaut und in der Werkstatt zu sehen; das Spiel bleibt in der Ich-Sicht.
