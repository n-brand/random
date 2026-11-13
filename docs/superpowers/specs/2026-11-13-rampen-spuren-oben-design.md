# Spuren oben an den Rampen der zweistöckigen Strassen (Variante B)

Stand 2026-11-13, für Batverse (`sachen/batverse/`), Gotham G2e.

## Worum es geht

An den Rampen der Uferstrasse (`ufer-ost`, beide Enden) stimmt oben die Spurführung nicht. Nicolas hat es schon mehrmals gemeldet
(zuletzt bei -2686/-320 und -978/1286):

- Auf dem Deck sind es 2 + 2 Spuren. Neben dem Rampenschacht bleibt oben nur je 1 Spur, und der Wechsel kommt schlagartig, ohne Markierung.
- In den letzten 30 m vor dem Strassenende läuft die obere Spur in einen Gehsteig-Keil aus (`gdeckUp`). Die Strasse ist dort nur noch 7 m
  breit, und Seitenstrassen am Ende stossen auf den Keil (z. B. -2797/-308).
- Seitenstrassen treffen auf den offenen Schacht: Westende bei 108 m (genau am Portal), Ostende bei 42 m und 85 m vor dem Ende.

Ziel: Man versteht beim Fahren, welche Spur nach unten geht und welche oben bleibt, und nirgends endet eine Spur ins Nichts.

## Gewählter Ansatz: B, die innere Spur taucht ab

Wie die Unterführungen am Mittleren Ring in München. Vom Strassenende her (Kreuzung) gesehen:

```
Kreuzung    flach (30 m)          Rampe (80 m)            Deck (oben 2+2, unten 2+2)
            → → oben ────────── → oben ──────────────────  → →   rechte Spur bleibt oben, aufs Deck
            ↘ unten ┄┄┄┄┄┄┄┄┄  ▓▓▓▓▓▓ abwärts ▓▓▓▓▓▓▓▓▓▓  ⟶ untere Strasse
```

- Am Strassenende ist die Uferstrasse normal 14 m breit mit 2 + 2 Spuren.
- Die linke (innere) Spur jeder Richtung ist die Rampe zur unteren Strasse (RW 7 m = die zwei inneren Spuren). Die rechte (äussere)
  Spur bleibt oben, läuft neben dem Schacht vorbei und aufs Deck.
- Auf dem Deck kommt nach dem Portal innen wieder eine zweite Spur dazu. In Gegenrichtung endet die innere Deck-Spur vor dem Portal.
  Wer innen fährt, muss vorher nach rechts einfädeln.

Verworfen:

- **A (verbreitern auf 21 m):** braucht 7 m mehr Platz auf 110 m, Häuser und Karte müssten weichen, und das Problem mit den
  Seitenstrassen bliebe.
- **C (Rampen von den Kreuzungen wegschieben):** hat Nicolas nicht gewählt. Seitenstrassen am Schacht werden stattdessen klar als
  „nur rechts rein und rechts raus“ markiert.

## Was sich ändert

Fast nur Linien. Die Geometrie bleibt bis auf einen Punkt:

1. **Kein Gehsteig-Keil mehr am Strassenende.** Die obere Spur bleibt bis zum Ende voll breit (`gdeckUp` = w/2 statt Trichter auf
   RW/2), und die Naht-Fläche am Ende geht über die ganze Fahrbahnbreite.
2. **Flacher Teil (letzte 30 m):** Hier liegen die Rampenspur und die obere Spur noch auf gleicher Höhe nebeneinander.
   - Trennlinie: zuerst gestrichelt (Spurwechsel erlaubt), dann ca. 15 m vor dem Rampenbeginn durchgezogen.
   - Pfeile auf beiden Spuren: innen „↘ unten“ (Pfeil plus Schrift „LOWER“ bzw. „UNTEN“), aussen „↑“ geradeaus.
   - Gelbe Doppellinie in der Mitte bleibt.
3. **Rampe:** Die obere Spur bekommt Randlinien (aussen weiss, innen weiss an der Brüstung) und Leitpfeile alle ca. 25 m.
4. **Deck nach dem Portal, Richtung Deckmitte:** Eine neue innere Spur beginnt.
   - Sperrfläche (weisse Schrägstriche) als Keil direkt hinter der Portalmauer.
   - Danach beginnt die gestrichelte Spurlinie.
5. **Deck vor dem Portal, Richtung Strassenende:** Die innere Spur endet.
   - Ca. 60 m vor dem Portal: zwei bis drei Einfädel-Pfeile (geschwungen nach rechts).
   - Die gestrichelte Spurlinie läuft aus, und vor der Portalmauer liegt eine Sperrfläche mit Schrägstrichen.
6. **Seitenstrassen am Schacht** (Westende 108 m, Ostende 42 m und 85 m):
   - Die Kreuzungsfläche endet an der Brüstung; das ist schon so.
   - In der Seitenstrasse kommt ein Pfeil „nur rechts“ dazu.
   - Auf der Uferstrasse wird die Spurlinie auf Höhe der Einmündung durchgezogen.
7. **Unten** bleibt alles wie heute: Der Trichter mit den zusammenlaufenden Spuren ist schon passend.

## Technik (für die Umsetzung)

- Linien und Pfeile als eigene flache Netze knapp über der Fahrbahn, wie die bestehenden Streifen `LG`/`LW` in `gotham-unterstrasse.js`.
  Pfeile, Schrift und Sperrflächen bekommen ein gemeinsames Textur-Atlas-Material (Canvas) und werden wie `gsplit` behandelt.
- Die Deck-Fahrbahn (`gotham-strassen.js`, Textur `lineTex` mit gestrichelten Spurlinien) braucht vor und nach dem Portal einen
  Abschnitt ohne innere Spurlinie (schlichter Asphalt plus eigene Linien), ähnlich wie die Trichter unten.
- `gdeckUp`, `gothamDeckAt` (Gehsteig neben dem oberen Trichter) und die Naht-Fläche: an die volle Breite anpassen. Kollision und
  Boden prüfen.
- Danach: Datei-Hash ändert sich, der Strassen-Zwischenspeicher rechnet einmal neu. CACHE in `sw.js` erhöhen, `CLAUDE.md` nachführen.

## Prüfen

- Beide Rampen in beide Richtungen fahren:
  - oben bleiben,
  - nach unten abbiegen,
  - von unten hochkommen,
  - auf dem Deck innen fahren und vor dem Portal einfädeln.
- Seitenstrassen bei 108 m (West) und bei 42 m und 85 m (Ost): rechts rein und rechts raus muss gehen.
- Am Strassenende -2797/-308: Einmündung befahrbar, kein Gehsteig-Keil.
- Bildschirmfotos von oben für Nicolas.

## Offen

- **Ring:** Nicolas: „beim Ring soll es auch noch uferstrassen geben“. Was genau gemeint ist, ist noch zu klären (Rampen/Auffahrten am
  Ring nach demselben Muster?). Nicht Teil dieses Schritts, bis es geklärt ist.
- Schrift auf der Fahrbahn: „UNTEN“ oder „LOWER“ (Gotham ist englischsprachig)? Vorschlag: „LOWER“.
