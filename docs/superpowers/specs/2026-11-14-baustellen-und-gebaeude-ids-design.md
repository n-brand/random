# Baustellen in Gotham und IDs für alle Gebäude

Stand 2026-11-14, Batverse (`sachen/batverse/`), Schritt nach G2. Ersetzt im Umsetzungsplan vorerst G3/G4 (Gebäude-Vorlagen):
statt Häusern stehen zuerst überall Baustellen, echte Gebäude kommen später einzeln an ihre Stelle.

## Worum es geht

- Nicolas: „ich möchte dass die füllbauten baustellen sind“. Jeder Füllbau der Karte (heute 1660, `GOTHAM_STADT.fuell`: Umriss mit
  4 Ecken in Kartenkoordinaten, geplante Höhe `h`, ID `FB-xxxx`) wird im Spiel eine Baustelle auf seinem Grundriss. Dazu die acht
  festen Baustellen `BS-01` bis `BS-08` aus `daten.js` (`orte`, typ "baustelle", 60 x 50 m), die heute nicht im Spiel sind.
- Nicolas: „jedes gebäude [soll] eine id haben, die man im geistmode und im orbitmode beim darüberhovern sieht und beim
  coordinaten kopieren mitkopiert“, und „nicht nur füllbauten … auch andere gebäude“, „alle Gebäude bekommen eine ID“.
- Nicolas zur Werkstatt-Vorlage `buildBaustelle`: „ziemlich detailreich – an sich könnten wir bei den details in der leistung sparen“.
  Gewählt: **Ansatz A**, eine einfache Baustelle überall.

Ziel: Gotham sieht aus der Orbit-Ansicht und beim Durchfahren bebaut-in-Arbeit aus, jede Fläche ist über ihre ID ansprechbar
(„FB-0187 umbauen“), und das Spiel wird dadurch nicht spürbar langsamer.

Nicht-Ziele: echte Gebäude, Innenräume, Detail-Baustellen aus der Nähe (Ansatz B, später möglich), Kräne/Rohbauten
(PLAN-GOTHAM G6: „kein Rohbau, kein Kran“).

Anti-Ziele: längere Ladezeit oder Ruckeln beim Fahren; IDs, die sich bei jedem Karten-Export verschieben.

## Ansätze (entschieden)

- **A (gewählt):** eine einfache Baustelle je Fläche, alle zusammengefasst in die bestehenden 768-m-Zellen (`gsplit`), weit weg
  ausgeblendet. Billig, gut lesbar von oben.
- B: wie A plus volle Werkstatt-Qualität im Umkreis von ca. 80 m (bei Annäherung gebaut). Mehr Code, Aufbau-Ruckler. Später.
- C: nur in der Nähe laden. Verworfen: aus der Orbit-Ansicht fehlten die fernen Baustellen.

## Teil 1: Baustellen (Ansatz A)

Je Fläche (Grundriss aus `fuell[i].c`, in Spielkoordinaten über `GOT.toGame`):

- **Erdfläche** auf Strassenhöhe (`GOT.STR` + wenige cm), braune Erde-Textur mit Spuren, UV in Metern.
- **Bauzaun** rundum knapp innerhalb des Grundrisses: 2 m hoch, als Flächen mit einer durchscheinenden Gitter-Textur
  (`alphaTest`), Pfosten nur aufgemalt. Ein Tor (Lücke ca. 5 m) auf der Seite zur nächsten Strasse.
- **Ein Baucontainer** (Quader, ca. 6 x 2,5 x 2,6 m, Farbe nach Zufall aus 3) und **2 bis 3 Materialstapel** (flache Quader:
  Palette mit Ziegeln, Kies-/Sandhaufen als niedrige Pyramide, Bohlen), Lage per festem Zufall je ID.
- **Wohlstand** (Bezirk der Flächenmitte, `GOTHAM.bezirke[].wohlstand`): reich = aufgeräumt, zwei Container, gerade Stapel;
  arm = ein Container, mehr Haufen, Zaun mit fehlenden Feldern (Lücken). Das bleibt bei wenigen Varianten.
- Budget: ca. 60–100 Dreiecke je Baustelle, alles je Material in wenige Netze; Zellen über `gsplit` (Gotham-Zellen, `GHIDE`).
  Zielwerte: Laden höchstens +0,2 s, Bildzeit in Gotham höchstens +0,3 ms (messen wie bei Leistung 1–4).
- **Kollision nur in der Nähe** (Nicolas 2026-11-14 „Nur in der Nähe“): Zaun (Tor frei) und Container sind fest, aber nur für Baustellen in den 768-m-Zellen um den Spieler bzw. das aktive Fahrzeug (die Zelle selbst und ihre Nachbarn). Die Kollisionsteile werden beim Betreten einer Zelle angelegt und beim Verlassen wieder entfernt; dafür braucht die Kollisionsliste (`solids`/`circles` und ihr Raster) ein Entfernen. Schräge Zaunseiten als Kette kleiner Teile (Grundrisse sind gedreht, die Kollision kennt nur achsparallele Quader und Kreise). Haufen ohne Kollision. Regel „Barrieren weiter innen“ beachten. Grund: ca. 1700 Baustellen mit voller Kollision wären über 100 000 Teile (Gotham heute ca. 30 000).
  Regel „Barrieren weiter innen“ beachten.
- Gebaut nach dem Start als Kachel-Aufgabe in Etappen (wie `gstrGen`), mit eigenem Zwischenspeicher-Eintrag in IndexedDB
  (wie `GSTR`), Schlüssel aus `TH_HASH` und Datei-Prüfsumme.
- Die acht `BS-xx` überlappen keine Füllbauten (die Karte reserviert ihre Fläche vorher, `markRect`). Sie werden gleich gebaut (60 x 50 m, also grösser), stehen aber nicht in `fuell`: Export ergänzen
  (`baustellen: [{ id, x, z, w, d }]` in `stadt.js`, Mitte und Masse wie in `daten.js`, ohne Drehung).
- Neue Datei `js/gotham/gotham-baustellen.js` (nach `gotham-unterstrasse.js` in `FILES`). `buildBaustelle` in der Werkstatt
  bleibt unverändert (Detail-Vorlage für später).

## Teil 2: IDs für alle Gebäude

### Feste IDs

- Füllbauten behalten ihre Nummer über Karten-Exporte hinweg. **Einfrieren beim Export** (`gothamExport` in
  `gotham/index.html`): die Karte lädt dafür die aktuelle `stadt.js` als Bezug (oder liest sie per fetch). Für jeden neu erzeugten
  Füllbau gilt: liegt seine Mitte in einem bisherigen Füllbau (oder höchstens 5 m von dessen Mitte), bekommt er dessen ID; sonst
  die nächste freie Nummer. Bisherige IDs, die keinen Nachfolger finden, werden nicht neu vergeben.
- Startstand: die IDs der jetzigen `stadt.js` (1660) gelten ab jetzt als fest.
- Nie neu vergebene Nummern: der Export schreibt die höchste je vergebene Nummer als Feld `fbNext` in `stadt.js` (Teil des erzeugten Exports, nicht von Hand) und vergibt neue Nummern ab dort. (Entscheidung Claude)
- Teilt sich ein alter Füllbau in zwei neue, deren Mitten beide darin liegen: der mit der nächsten Mitte behält die ID, der andere bekommt eine neue Nummer. (Entscheidung Claude)
- Die Klick-Anzeige der Karte zeigt weiter dieselbe ID wie das Spiel.

### ID-Schema

| Präfix | Was | Beispiele |
|---|---|---|
| `FB-0001` … | Füllbau / Baustelle aus der Karte | `FB-0187` |
| `BS-01` … | feste Baustellen aus `daten.js` | `BS-03` |
| `WM-…` | Gebäude des Anwesens (oben) | `WM-HAUS`, `WM-POOLHAUS`, `WM-TORHAUS`, `WM-VERANDA`, `WM-OBSERVATORIUM` |
| `WM-…` | unter der Erde / Höhle | `WM-TIEFGARAGE`, `WM-AUTOAUFZUG`, `WM-SILO`, `WM-HANGAR-WEST`, `WM-HANGAR-OST`, `WM-RD-ARMORY`, `WM-BATCOMPUTER`, `WM-VORRAUM` |
| `GO-BR-…` | Gotham-Brücken | `GO-BR-NORD`, `GO-BR-OST`, `GO-BR-HIGHWAY` … |
| `GB-…` | spätere Gotham-Gebäude | `GB-WAYNE-TOWER` |

„Alle Gebäude“ = alles mit Dach oder Raum, das man als eigenes Bauwerk ansprechen würde. Die genaue Liste fürs Anwesen
legt der Bauer anhand der Bauteile fest (Haus samt Türmen = ein Gebäude `WM-HAUS`; Räume im Haus wie Theatre bekommen keine
eigene ID, ausser Observatorium als eigener Aufbau). Mauer, Strassen, Gelände, Fahrzeuge: keine Gebäude-ID (Fahrzeuge haben
ihren Namen).

### Register statt Objekt-ID

Beim Laden werden viele Teile je Material zusammengefasst; eine ID am Objekt (`userData.id`) geht dabei verloren. Darum:

- Zentrales Register `BAUTEN` (neue Datei `js/kern/bauten.js`, früh in `FILES`): `{ id, name, art, poly: [[x, z] …], y0, y1 }`
  in Spielkoordinaten. Funktion `bautAt(x, y, z)` liefert den Eintrag, dessen Grundriss den Punkt enthält und dessen Höhenbereich
  passt (bei mehreren den kleinsten). Raster-Index für schnelle Suche.
- Anwesen-Gebäude tragen sich mit ihren vorhandenen Umrissen ein (z. B. `HOUSE_PX` über `mp()`, `GARAGE`, `SILO`, `HGX` usw.),
  angehoben um `HILL`, wo sie auf dem Plateau stehen. Baustellen tragen sich beim Bau ein.
- `shared/orbit-pick.js` bekommt eine Option `idAt(point)` (Rückfall weiter `userData.id`): beim Kopieren steht die ID als
  zweite Zeile wie heute („ID: FB-0187 (Baustelle)“). Andere Seiten mit Orbit-Pick ändern sich nicht.

### Hover-Anzeige

- **Orbit-Ansicht:** kleines Schild an der Maus mit ID und Name, z. B. „FB-0187 · Baustelle · Oststadt · geplant ca. 27 m“,
  „WM-POOLHAUS · Poolhaus“. Abfrage höchstens ca. 8-mal pro Sekunde und nur, wenn die Maus sich bewegt hat (Strahl wie
  Orbit-Pick). Nicht während Ziehen/Drehen.
- **Geistmodus:** dasselbe Schild unter dem Fadenkreuz, Ziel = Bildmitte (gleiche Abfrage, Bildmitte statt Maus).
- Nicht im Begehen, Fahren, Fliegen (dort nicht verlangt).
- Am Handy: kein Hover; die ID kommt beim Kopieren (Orbit-Pick) mit.

## Prüfen

- Laden und Bildzeit vorher/nachher messen (Zielwerte oben), Zeichenaufrufe in Gotham.
- Hover über einer Baustelle, einem Anwesen-Gebäude und Leere (kein Schild); Geist mit Fadenkreuz; Kopieren enthält die ID.
- Karte neu exportieren: IDs bleiben gleich (Stichprobe: 20 IDs vorher/nachher an derselben Stelle).
- Zu Fuss und mit dem Auto: Zaun und Container halten, Tor ist frei, Strassen und Gehsteige unverändert.
- Bilder aus der Orbit-Ansicht für Nicolas.

## Dem Bauer überlassen

- Genaue Texturen, Farben, Varianten, Lage von Tor und Stapeln.
- Ob die Hover-Abfrage den vollen Szenen-Strahl nimmt oder schneller nur Boden/Baustellen-Netze trifft.
- Aufteilung in Commits.
