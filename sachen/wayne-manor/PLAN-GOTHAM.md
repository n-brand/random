# Wayne Manor 3D – Plan 2: Gotham City und Ausbau (Stand 2026-11-11)

Sammelt alle Wünsche von Nicolas vom 2026-11-11. **Karte zum Plan:** `gotham/index.html` (im Browser `sachen/wayne-manor/gotham/`), Daten in `gotham/daten.js`.
Die Karte ist ein Entwurf: Lage, Grösse und Namen dort ändern (Zahlen in `daten.js`), dann gilt die Karte. Später liest der 3D-Aufbau dieselbe Datei.

Koordinaten wie im Spiel: Meter, Rondell = 0/0, **Norden = -z (oben)**, Osten = +x. Gotham liegt im **Westen** (x ca. -3000..-1100), die bestehende Hauptstrasse wird zum Gotham Highway nach Westen verlängert.

**Regeln für alles hier:** stilisiert, eigene Entwürfe, keine Logos/Marken/Film-Nachbauten. Die bestehende Welt (Wald, Gelände, Strassen) wird **nur nach Rückfrage** verändert. Jeder Schritt wird einzeln gebaut, getestet, committet. Gebäude von Gotham sind **innen leer**, ausser wo hier ausdrücklich ein Innenraum steht.

---

## Phase 0 – Technik zuerst (ohne die geht Gotham nicht)

Gotham ist ca. 2 x 3 km gross, die Welt endet heute bei ca. 700 m. Darum zuerst:

| Nr | Was | Inhalt |
|----|-----|--------|
| T1 | Bildrate-Anzeige | FPS und Zeichenaufrufe einblendbar (`?debug` und Einstellungen), Messwerte PC und Handy vorher/nachher |
| T2 | **Kacheln 128 m** | Welt in 128-m-Kacheln (Gelände, Bäume, Gebäude, Kollision je Kachel). Nur Kacheln im Umkreis werden gebaut/angezeigt, weiter weg vereinfacht (LOD), ganz weit weg entladen. Laden verteilt über mehrere Bilder (kein Ruckeln). Antwort zur Frage „sieht die Welt dann noch normal aus?“: ja, die Grenzen sieht man nicht, wenn Gelände und Bäume an den Kachelrändern aus derselben Formel kommen |
| T3 | **Einstellungen** | Menü „Einstellungen“: Ladeweite (z. B. 2-8 Kacheln = 256 m bis 1 km), Lautstärke (gibt es schon als Regler im T-Menü), Grafikstufe. Gespeichert im Browser (`localStorage`, wirkt wie ein Cookie, wird aber nicht an einen Server geschickt; Lautstärke ist dort schon gespeichert) |
| T4 | **Ladescreen** | Eigener Ladebildschirm, getrennt für PC (breit, Tastenbelegung als Tipps) und Handy (hochkant/quer, Touch-Tipps), mit Fortschritt der echten Ladeschritte |
| T5 | **Teststrecke für Bauteile** | Eigene Testseite ausserhalb der Welt (`werkstatt/`): lädt ein einzelnes Modell (Fahrzeug, Gebäude-Vorlage) auf eine leere Fläche mit Piste, ohne die Welt zu ändern. Werkzeug: VS Code mit Live Server reicht (wie heute); Vite, CodeSandbox oder StackBlitz bringen hier wenig, weil das Projekt ohne Build läuft – Empfehlung: nicht einführen |
| T6 | Gotham-Karte im Spiel | Die 2D-Karte (`gotham/`) auch im Spiel als Kartenansicht (Taste) mit eigener Position |

## Phase 1 – Gotham: Grundgerüst

| Nr | Was | Inhalt |
|----|-----|--------|
| G1 | Gelände und Wasser | Hauptinsel zwischen **Westfluss** und **Ostfluss**, Meer im Süden (schliesst an die bestehende Küste im Südosten an), Arkham-Insel vor der Küste. Ufermauern an den Flüssen. Braucht Rückfrage: Küste wird nach Westen verlängert, Wald dort weicht |
| G2 | **Strassennetz** | Durchgehendes Raster über die ganze Insel (Avenues Nord-Süd, Strassen Ost-West, zwei breite Hauptachsen), Kreuzungen, Gehsteige, Ampeln (Deko). Highway von der Manor über eine **zweistöckige Brücke** (oben Highway, unten Strasse, darunter Obdachlosenlager und der Club des Pinguins). Weitere Brücken: 2 über den Ostfluss, 2 über den Westfluss, Arkham-Brücke |
| G3 | **Gebäude-Vorlagen** | Wenige Vorlagen, mehrfach eingesetzt: Wolkenkratzer (Glas/Stein, Höhe nach Wohlstand), Bürohaus, Mehrfamilienhaus (Ziegel, Feuertreppen), Laden mit Wohnung darüber, Fabrikhalle, Lagerhalle. Innen leer |
| G4 | **Wohlstand reich → arm** | Jede Fläche bekommt einen Wohlstand 0..1 (Bezirke in der Karte, weich überblendet): Uptown/Zentrum hohe Türme, Westseite/Südstadt gemischt, Fabrikviertel, **The Narrows am Hafen** arm (kleine Häuser, Fabriken). Sinnvoll so: Armenviertel am Hafen ist typisch (Industrie, Lärm, billiger Boden) |
| G5 | **Seitengassen** | Im armen Viertel dichtes Gassennetz: Müllcontainer, Säcke, Wäscheleinen, Feuertreppen, Pfützen, Dampf aus Gullys |
| G6 | **Baustellen-Vorlage** | Eine Vorlage (Bauzaun, Kran, Rohbau-Gerippe, Container, Schutt), mehrfach eingesetzt (8 Plätze in der Karte). Wird später nach und nach durch wichtige Gebäude ersetzt |

## Phase 2 – Verkehr

| Nr | Was | Inhalt |
|----|-----|--------|
| V1 | **U-Bahn-Ring** | Ein grosser Ring (ca. 5,4 km) unter der Stadt, 12 Stationen mit grossem Abstand (ca. 450 m), **Hauptbahnhof** (Osten, nahe Busbahnhof), **Abstellanlage** für Züge ausser Betrieb gleich daneben, am Gleisnetz angeschlossen. Fahrender Zug. Graffitis in den Tunneln, eines „NBR“ |
| V2 | **Bus** | Bushaltestellen zwischen den U-Bahn-Stationen, 3 Linien (Ring innen, Nord-Süd, Manor-Express), ein fahrender Bus, **Busbahnhof** |
| V3 | **Taxi-Depot** | Halle/Hof, in dem die Taxis stehen, die nicht fahren (das bestehende Gotham Taxi als Vorlage) |
| V4 | Parken | Tiefgaragen bei vielen grossen Gebäuden (Einfahrt als Rampe, innen nur bei ausgewählten befahrbar), 5 Parkhäuser |

## Phase 3 – Gebäude mit Bedeutung

Lage siehe Karte. Alle zuerst als leere Hülle (Vorlage + Schild), Innenräume nur wo genannt.

- **Wayne Tower** im Zentrum (ca. 320 m). Befahrbare Tiefgarage (-1); **darunter ein geheimer Stock (-2)** mit dem Tumbler, weiteren Prototypen und Gadgets; darunter der Kanal-Hub (-3, siehe Phase 4).
- **Polizeipräsidium** mit Batsignal auf dem Dach (leuchtet nachts, schaltbar).
- **Arkham Asylum** auf der Arkham-Insel.
- **Hafen** mit Containerterminal, Kränen, Lagerhallen.
- Gericht, Kathedrale/Kirche, **Eventgebäude** (Spendengala, Hochzeit), 2 Museen.
- 3 Krankenhäuser, 2 Kinderheime, 3 Kinderkrippen.
- **American-Football-Stadion**.
- **Banken:** 3 Grossbanken mit Tresorkellern (voller Tresore), 4 kleine Banken mit nur 3 Automaten, 12 Bankautomaten in der Stadt.
- **Hotels:** 2 Luxushotels, 3 Billighotels.
- **Läden:** 3 Juweliere, 2 Massschneider (teuer), 2 normale und 3 billige Kleiderläden, 2 Waffenläden.
- **Essen:** 6 Bars/Restaurants, 4 Billig-Fast-Food im armen Viertel.
- **Club des Pinguins** unter der Highway-Brücke.
- 4 **geheime Drogenverstecke** im armen Viertel.
- **Autohäuser** (echte Filialen der Fahrzeug-Kette aus dem Computer-Shop, Phase 7): billig (Fabrikviertel), teuer (Uptown), Militär (am Stützpunkt).

## Phase 4 – Untergrund

| Nr | Was | Inhalt |
|----|-----|--------|
| U1 | **Abwasserkanäle** | Ein zusammenhängendes Netz unter den Hauptstrassen (begehbar, Rinne mit fliessendem Wasser, Stege). An den Flüssen/Meer vereinzelt **Abflussgitter** (6 Stück), aus denen Wasser kommt |
| U2 | Übergänge | Von den U-Bahn-Tunneln kommt man an 4 Stellen in die Kanäle |
| U3 | **Kanal-Hub unter dem Wayne Tower** | Grösster Teil des Netzes; dort die **Basis der Bösen**: Waffen unter Planen, herumliegende Waffen, Tisch mit Computer, Boxsack, Gitterboden, teils mit fliessendem Abwasser darunter |

## Phase 5 – Geheimbasis im Container

Ein unscheinbarer Container am Westfluss beim Hafen, innen viel grösser (führt in einen Raum unter dem Kai):
Batmobil in der Mitte, **Anzug fährt aus dem Boden**, **Motorrad und Batpod fahren aus der Wand**, Decke aus Lampen, Computer, **aufklappbare Wand** mit Waffen und Gadgets, **Geheimwand mit Tresor** (Goldbarren, Bargeld). Alle Mechanismen als Tore nach der Regel „Tore anzielen“.

## Phase 6 – Militär

- **Militärstützpunkt ausserhalb der Stadt** (nördlich, über eine Zufahrt erreichbar): Kaserne, Hangars, Fahrzeughalle, Militär-Autohaus.
- **Militärinsel im Südosten** (zusätzlich, im Meer, per Boot/Flug): Landebahn, Hangars, Hafen.
- Der Kampfjet bekommt dort einen richtigen Platz (statt Hauptstrasse, Rückfrage).

## Phase 7 – Wayne Manor und Batcave

- Batcave: weitere geheime Dinge (Vorschläge zur Auswahl vor dem Bau), **Hangar-Fläche vergrössern**.
- **U-Boot** in der Cave, **Meer tiefer** machen (damit U-Boot und grössere Boote passen; betrifft Höhlenwasser, Wassertunnel, Küste – Rückfrage), **Schnellboot**.
- **Inneneinrichtung der Mansion** (Raum für Raum).
- **Klavier mit Geheimcode**: richtige Tonfolge spielen → geheimer Aufzug öffnet sich.

## Phase 8 – Fahrzeuge

- **Tumbler 2.0** – drei eigene Entwürfe, inspiriert von den Stilrichtungen „Affleck“, „Pattinson“ und „Arkham“ (Muscle-Car-Panzer, Strassen-Muscle-Car, futuristisch) – **keine Film-Nachbauten** (eigene Regel).
- **„Chevrollette co“** – unklar, bitte genauer (Chevrolet Corvette? Camaro? Oder eine Fahrzeug-Kette mit diesem Namen?).
- Bus, U-Bahn-Zug, U-Boot, Schnellboot (siehe oben).

## Phase 9 – Spielsysteme

| Nr | Was | Inhalt |
|----|-----|--------|
| S1 | **Inventar mit Hotbar** | Leiste unten (wie Minecraft/Schedule I), Tasten 1-9, Plätze für Gegenstände, Waffen, Kleider, Goldbarren, **Munition** (stapelbar) |
| S2 | **Zielfunktion bei Waffen** | Rechte Maustaste zielen (Kamera näher, Fadenkreuz), Konflikt mit „Rechtsklick = einsteigen/Tor“ lösen (z. B. zielen nur mit Waffe in der Hand) |
| S3 | **Kontostand** | Geld als eigener Zustand (lokal gespeichert), Schnittstelle so gebaut, dass er **später mit Supabase** verbunden werden kann (Anmeldung und Datenbank erst dann; Datenschutz/Kosten vorher klären) |
| S4 | **Computer/Handy-Browser** | Wie das Handy-Internet in GTA V: Bildschirm im Spiel mit Seiten, darunter der **Fahrzeug-Shop** mit drei Händlern (billig, teuer, Militär). Gekauftes Fahrzeug wird geliefert; die Händler gibt es auch als Gebäude in Gotham |
| S5 | **Kameras** | Unklar – bitte genauer: Überwachungskameras in der Stadt (auf dem Batcomputer ansehen)? Oder Kamera-Ansichten für den Spieler? |
| S6 | **Eigene Figuren** | Später: personalisierbare Spielfigur, Kleider wirklich anziehen (braucht ein Figurenmodell mit Skelett; grosser eigener Schritt) |

## Nicht Teil von Wayne Manor

- **„Rampe und Polytrack game“** – klingt nach einem eigenen Spiel (Strecke mit Rampen, Stil wie Polytrack). Vorschlag: eigenes Projekt unter `sachen/`, eigener Plan.

---

## Empfohlene Reihenfolge

`T1 → T2 → T3 → T4 → T5 → G1 → G2 → G3/G4 → G5/G6 → V1 → V2 → Phase 3 (Wayne Tower, Polizei, Hafen zuerst) → U1-U3 → Phase 5 → V3/V4 → Phase 6 → S1 → S3 → S4 → S2 → Phase 7 → Phase 8 → S6`

Begründung: Ohne Kacheln (T2) und Einstellungen (T3) wird Gotham zu langsam, besonders am Handy. Strassen vor Gebäuden, weil alles an den Strassen hängt. Untergrund nach den Gebäuden darüber, weil Eingänge oben liegen. Inventar und Geld vor Shop und Waffen.

## Offene Fragen an Nicolas

1. Lage und Grösse von Gotham so wie in der Karte? (ca. 1,9 x 3 km, ca. 1 km westlich der Manor)
2. Darf die Küste nach Westen verlängert werden und der Wald zwischen Manor und Gotham dafür weichen (Highway, Flüsse)?
3. „Chevrollette co“ und „Kameras“ – was genau?
4. Kampfjet später auf die Militärinsel stellen? (Die Anflugschneise im Wald ist seit 2026-11-11 wieder zu, Bäume stehen wie vorher.)
