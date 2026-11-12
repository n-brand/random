# Wayne Manor 3D – Plan 2: Gotham City und Ausbau (Stand 2026-11-11)

Sammelt alle Wünsche von Nicolas vom 2026-11-11. **Karte zum Plan:** `gotham/index.html` (im Browser `sachen/wayne-manor/gotham/`), Daten in `gotham/daten.js`.
Die Karte ist ein Entwurf: Lage, Grösse und Namen dort ändern (Zahlen in `daten.js`), dann gilt die Karte. Später liest der 3D-Aufbau dieselbe Datei.

Koordinaten wie im Spiel: Meter, Rondell = 0/0, **Norden = -z (oben)**, Osten = +x. Gotham liegt im **Westen** (x ca. -3700..-950, z ca. -1450..1390), die bestehende Hauptstrasse wird zum Gotham Highway nach Westen verlängert.

**Regeln für alles hier:** stilisiert, eigene Entwürfe, keine Logos/Marken/Film-Nachbauten. Die bestehende Welt (Wald, Gelände, Strassen) wird **nur nach Rückfrage** verändert. Jeder Schritt wird einzeln gebaut, getestet, committet. Gebäude von Gotham sind **innen leer**, ausser wo hier ausdrücklich ein Innenraum steht.

---

## Phase 0 – Technik zuerst (ohne die geht Gotham nicht)

Gotham ist ca. 2,7 x 2,8 km gross, die Welt endet heute bei ca. 700 m. Darum zuerst (ausführlich in **`PLAN-KACHELN.md`**, Schritte K1-K8):

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
| G1 | Gelände und Wasser | **Hauptinsel nach der Skizze von Nicolas (2026-11-12):** frei gezeichneter Umriss (`insel.umriss` in `daten.js`), oben breit mit Einbuchtung, Nordosten am höchsten, unten zur Spitze schmaler und mit der Spitze im Meer (Hafen dort). Die Flüsse liegen als Band um die Insel: **Westfluss** 400 m, **Ostfluss** 440 m (wie der East River bei der Williamsburg Bridge), **Nordkanal** 180 m, im Süden offenes Meer (schliesst an die bestehende Küste im Südosten an), Arkham-Insel im Südwesten vor der Küste. **Strassenebene der Stadt = Fahrbahn der Brücken**, 18 m über dem Wasser (Welt-y -16, Wasser -34; Nicolas: Schichten herausgeschnitten, Tiefgaragen-Etagen 5,5 m wie bei Wayne Manor, Tiefgaragen des Wayne Towers neben den Turm, geheimer Wayne-Stock direkt unter den Turm und alles darunter mit hoch): hohe Kaimauern rundum; am Mauerfuss ein Streifen Kies/Sand knapp über dem Wasser, dann wird der Fluss weich tiefer (keine senkrechte Kante unter Wasser). Braucht Rückfrage: Küste wird nach Westen verlängert, Wald dort weicht |
| G2 | **Strassennetz** | Kein starres Gitter (Nicolas 2026-11-11): frei gezogene, geschwungene Hauptstrassen (Ring um den Wayne Tower, Diagonale „Old Broadway“, Crosstown Expressway, Uferstrassen …) und je Bezirk ein eigenes, gedrehtes und verzogenes Nebenstrassennetz mit Lücken (Narrows: enge Gassen). **Zweistöckige Strassen in der Stadt** (Park Row, Uferstrasse Ost): oben normaler Verkehr, 5,5 m darunter auf Höhe der Tiefgarage 1 (ca. 4,5 m licht) die untere Strasse (Lower Level) mit Obdachlosen und dem Eingang zum Club des Pinguins. **Hängebrücken** im Stil Williamsburg/Manhattan Bridge (Türme an den Ufern, ca. 62 m über der Fahrbahn, Tragseile), Fahrbahn auf Strassenhöhe: 3 über den Ostfluss (Highway, Nord, Süd), 2 über den Westfluss; nach Arkham keine Brücke, sondern die **Arkham-Fähre** (Nicolas 2026-11-12) vom Fähranleger in den Narrows. Füllbauten stehen automatisch an den Strassen und in den Blöcken (nie auf einer Strasse) |
| G3 | **Gebäude-Vorlagen** | **Geschosshöhe immer mindestens 4,7 m** (wie das Erdgeschoss von Wayne Manor; Nicolas 2026-11-11), höher nur für Hallen wie Empfang/Lobby (Wayne Tower EG 9,4 m → ca. 67 Stockwerke). Wenige Vorlagen, mehrfach eingesetzt: Wolkenkratzer (Glas/Stein, Höhe nach Wohlstand), Bürohaus, Mehrfamilienhaus (Ziegel, Feuertreppen), Laden mit Wohnung darüber, Fabrikhalle, Lagerhalle. Innen leer |
| G4 | **Wohlstand reich → arm** | Jede Fläche bekommt einen Wohlstand 0..1 (Bezirke in der Karte, weich überblendet): Uptown/Zentrum hohe Türme, Westseite/Südstadt gemischt, Fabrikviertel, **The Narrows am Hafen** arm (kleine Häuser, Fabriken). Sinnvoll so: Armenviertel am Hafen ist typisch (Industrie, Lärm, billiger Boden) |
| G5 | **Seitengassen** | Im armen Viertel dichtes Gassennetz: Müllcontainer, Säcke, Wäscheleinen, Feuertreppen, Pfützen, Dampf aus Gullys |
| G6 | **Baustellen-Vorlage** | Eine Vorlage (Bauzaun, Kran, Rohbau-Gerippe, Container, Schutt), mehrfach eingesetzt (8 Plätze in der Karte). Wird später nach und nach durch wichtige Gebäude ersetzt |

### Brücken-Analyse Südbrücke (Harbor), 2026-11-12

- **Vorher:** bei z 1050 über den Ostfluss. Dort war der Fluss schon Meer, das Ostende lag im offenen Wasser, am Ostufer ging keine Strasse weiter. Auch die Nordbrücke endete am Ostufer ohne Strasse.
- **Jetzt:** Südbrücke bei z 800, ca. 440 m über dem Ostfluss, landet auf der Festland-Zunge südlich vom Highway. Die neue **East Shore Road** verbindet am Ostufer die Enden von Nord-, Highway- und Südbrücke. Die Harbor Road führt von der Südbrücke quer durch die Narrows bis zum Fähranleger der Arkham-Fähre.
- Der Hafen liegt an der Inselspitze direkt am Meer, Schiffe müssen unter keiner Brücke durch. Die Durchfahrtshöhe von 18 m bleibt deshalb unkritisch (die echte Williamsburg Bridge hat ca. 41 m).
- Abstand zur Highway-Brücke ca. 500 m.

## Phase 2 – Verkehr

| Nr | Was | Inhalt |
|----|-----|--------|
| V1 | **U-Bahn-Ring** | Stationen auf der Höhe der Tiefgarage 2 (Bahnsteig 11 m unter der Strasse, Nicolas 2026-11-11), die Strecken dazwischen dürfen nach Bedarf tiefer liegen oder angepasst werden (z. B. unter Flüssen, Kanälen, Kellern). Ein grosser Ring entlang der Inselform (ca. 420 m vom Ufer, ganz unter der Insel; Nicolas 2026-11-12) unter der Stadt, 12 Stationen mit grossem Abstand (ca. 390 m), **Hauptbahnhof** (Osten, nahe Busbahnhof), **Abstellanlage** für Züge ausser Betrieb gleich daneben, am Gleisnetz angeschlossen. Fahrender Zug. Graffitis in den Tunneln, eines „NBR“ |
| V2 | **Bus** | Bushaltestellen zwischen den U-Bahn-Stationen, 3 Linien (Ring innen, Nord-Süd, Manor-Express), ein fahrender Bus, **Busbahnhof** |
| V3 | **Taxi-Depot** | Halle/Hof, in dem die Taxis stehen, die nicht fahren (das bestehende Gotham Taxi als Vorlage) |
| V4 | Parken | Tiefgaragen-Etagen 5,5 m hoch wie bei Wayne Manor (Nicolas 2026-11-11). Tiefgaragen bei vielen grossen Gebäuden (Einfahrt als Rampe, innen nur bei ausgewählten befahrbar), 5 Parkhäuser |

## Phase 3 – Gebäude mit Bedeutung

Lage siehe Karte. Alle zuerst als leere Hülle (Vorlage + Schild), Innenräume nur wo genannt.

- **Wayne Tower** im Zentrum (ca. 320 m, logisch ca. 80 Stockwerke à 4 m). Befahrbare Tiefgarage (2 Ebenen) **neben dem Turm**; **direkt unter dem Turm ein geheimer Stock** (0 bis -8 m) (Vorbild `karten/planung/wayne-geheimstock-vorbild.png`: weite niedrige Halle, viele runde Pfeiler, runde Deckenlampen) mit dem Tumbler, weiteren Prototypen und Gadgets; darunter der Kanal-Hub (-3, siehe Phase 4).
- **Polizeipräsidium** mit Batsignal auf dem Dach (leuchtet nachts, schaltbar).
- **Arkham Asylum** auf der Arkham-Insel, erreichbar nur mit der **Arkham-Fähre** (Autofähre, Anleger in den Narrows und auf Arkham).
- **Hafen** mit Containerterminal, Kränen, Lagerhallen.
- Gericht, Kathedrale/Kirche, **Eventgebäude** (Spendengala, Hochzeit), 2 Museen.
- 3 Krankenhäuser, 2 Kinderheime, 3 Kinderkrippen.
- **American-Football-Stadion**, oben offen (kein Dach). Tribünen 3 Stockwerke hoch (14,1 m), Sitzreihen wie auf dem Foto von Nicolas: 0,4 m Stufenhöhe, 0,8 m tief, Kunststoff-Sitzschalen in Blautönen (Seitenansicht).
- **Wohnhaus mit Laden im Erdgeschoss** (Nicolas 2026-11-11): z. B. unten eine Pizzeria, darüber normale Wohnungen (alle Geschosse 4,7 m). Gilt genauso für Bäckerei, Kiosk, Waschsalon usw.
- **Banken:** 3 Grossbanken mit Tresorkellern (voller Tresore; Tresorkeller auf der Höhe der Tiefgarage 1, direkt daneben), 4 kleine Banken mit nur 3 Automaten, 12 Bankautomaten in der Stadt.
- **Hotels:** 2 Luxushotels, 3 Billighotels.
- **Läden:** 3 Juweliere, 2 Massschneider (teuer), 2 normale und 3 billige Kleiderläden, 2 Waffenläden.
- **Essen:** 6 Bars/Restaurants, 4 Billig-Fast-Food im armen Viertel.
- **Club des Pinguins**: Eingang an der unteren Strasse (-5,5 m) (Lower Level) der zweistöckigen Uferstrasse Ost, geht über mehrere Ebenen nach unten (Bar auf Höhe der Tiefgarage 1 direkt am Eingang, darunter Tanzfläche (-13,5 m) und Keller/VIP (-17,5 m); siehe Seitenansicht `gotham/schnitt.html`).
- 4 **geheime Drogenverstecke** im armen Viertel.
- **Autohäuser** (echte Filialen der Fahrzeug-Kette aus dem Computer-Shop, Phase 7): billig (Fabrikviertel), teuer (Uptown), Militär (am Stützpunkt, vorerst weggelassen).

## Phase 4 – Untergrund

| Nr | Was | Inhalt |
|----|-----|--------|
| U1 | **Abwasserkanäle** | Ein zusammenhängendes Netz nur unter ausgewählten Hauptstrassen (nicht unter jeder Strasse; Liste `kanal.hauptsammler` in der Karte), begehbar, ca. 6 m hoch, Sohle 17 m unter der Strasse, gleicher Boden wie der Kanal-Hub; führt neben Club und U-Bahn vorbei, Rinne mit fliessendem Wasser, Stege. Wo ein Sammler die Insel verlässt, fällt er in einem Absturzschacht auf Wasserhöhe: **Auslass wie im Foto von Nicolas, nur grösser** (Nische in der Kaimauer): Betonstirnwand mit rundem Rohr (6 m) und Gitter davor (rostiger Stahlrahmen, quadratisches Gitter wie im ersten Foto), trichterförmige Flügelwände aus Pflastersteinen (14 m an der Wand, 36 m am Wasser, 24 m tief), gepflasterte Sohle bis ins Wasser, Betontreppe an einer Flügelwand |
| U1b | **Gullideckel und Nebensammler** | Unter den Gullideckeln liegen **Nebensammler**: beginnen direkt unter dem Gullideckel (Scheitel ca. 1,2 m unter der Strasse), 3 m hoch, damit man **zu Fuss und mit dem Batpod** überall durchkommt, fallen im Bogen mit höchstens ca. 12 % Gefälle und münden seitlich auf Bodenhöhe in den Hauptsammler – das Wasser fliesst dorthin (Nicolas 2026-11-11, Skizze). Nicht unter jeder Strasse: nur unter Nebenstrassen, die an einem Hauptsammler enden, davon jede zweite, und nur die letzten 150 m vor der Einmündung (`kanal.neben`). Gullideckel alle ca. 70 m auf Haupt- und Nebensammlern, öffnen nur mit **Spezialwerkzeug (Gullihaken)** aus dem Inventar (S1), darunter Leiter. Detailbild in der Seitenansicht |
| U2 | Übergänge | Von den U-Bahn-Tunneln kommt man an 4 Stellen in die Kanäle |
| U3 | **Kanal-Hub unter dem Wayne Tower** | Grösster Teil des Netzes, **direkt unter dem geheimen Wayne-Stock** (der Tumbler steht genau darüber); dort die **Basis der Bösen** als runde, hohe Halle (Vorbilder `karten/planung/schurkenbasis-vorbild-*`: Pfeiler rundum, Stahlstege auf mehreren Ebenen, Wasserfall aus Abwasser in einen gemauerten Kanal): Waffen unter Planen, herumliegende Waffen, Tisch mit Computer, Boxsack, Gitterboden, teils mit fliessendem Abwasser darunter |

## Phase 5 – Geheimbasis im Container

Ein ganz normaler 20-Fuss-Seecontainer am Westfluss beim Hafen (Foto von Nicolas: blau, Wellblech, zweiflügelige Tür mit Verriegelungsstangen, **keine Fenster**; 6,06 x 2,44 x 2,59 m, innen ca. 5,9 m lang) ist ein **Aufzug** (fährt samt Auto hinunter). Unten eine flache, weite **Halle** auf Höhe der Tiefgarage 1 (Boden 5,5 m unter der Strasse, ca. 4,7 m hoch), Vorbild Foto von Nicolas: Sichtbetonwände, **die ganze Decke ein Raster aus Lichtpaneelen**, glatter Betonboden, hinten Reifenstapel und Werkbank.
Batmobil in der Mitte, **Anzug fährt aus dem Boden**, **Motorrad und Batpod fahren aus der Wand**, Decke aus Lampen, Computer, **aufklappbare Wand** mit Waffen und Gadgets, **Geheimwand mit Tresor** (Goldbarren, Bargeld). Alle Mechanismen als Tore nach der Regel „Tore anzielen“.

## Phase 6 – Militär (vorerst weggelassen)

Nicolas 2026-11-12: Für die Planung jetzt nicht wichtig, aus der Karte entfernt (Stützpunkt, Zufahrt, Nordkanal-Brücke, Militär-Autohaus). Später wieder aufnehmen:

- **Militärstützpunkt ausserhalb der Stadt** (nördlich, über eine Zufahrt erreichbar): Kaserne, Hangars, Fahrzeughalle, Militär-Autohaus.
- Zufahrt über die Nordkanal-Brücke (Verlängerung der Uptown Avenue).

## Später (vorgemerkt, noch nicht in der Karte)

- **Militärinsel im Südosten** (Nicolas 2026-11-11: erst später, vorerst weglassen): im Meer, per Boot/Flug, Landebahn, Hangars, Hafen. Der Kampfjet könnte dort einen richtigen Platz bekommen (statt Hauptstrasse, Rückfrage).

## Phase 7 – Wayne Manor und Batcave

- Batcave: weitere geheime Dinge (Vorschläge zur Auswahl vor dem Bau), **Hangar-Fläche vergrössern**.
- **U-Boot** in der Cave, **Meer tiefer** machen (damit U-Boot und grössere Boote passen; betrifft Höhlenwasser, Wassertunnel, Küste – Rückfrage), **Schnellboot**.
  - Stand 2026-11-11 (Nicolas: Meeresgrund bei Wayne Manor wird für U-Boote später ohnehin tiefer): Meer und Höhlenwasser Welt -34, Meeresgrund am Fuss der Manor-Klippe Welt -38 (nur ca. 4 m Wasser), weiter draussen ca. -47; Gotham-Flussgrund 12 m unter dem Wasser (Welt -46, im Schnitt -43 m unter der Strasse). Beim Vertiefen Meer, Bucht, Wassertunnel, Höhlensee und Gotham-Flüsse zusammen planen (U-Boot soll von der Batcave bis in die Flüsse kommen); Zieltiefe noch offen.
- **Inneneinrichtung der Mansion** (Raum für Raum).
- **Klavier mit Geheimcode**: richtige Tonfolge spielen → geheimer Aufzug öffnet sich.

## Phase 8 – Fahrzeuge

- **Tumbler 2.0** – drei eigene Entwürfe, inspiriert von den Stilrichtungen „Affleck“, „Pattinson“ und „Arkham“ (Muscle-Car-Panzer, Strassen-Muscle-Car, futuristisch) – **keine Film-Nachbauten** (eigene Regel).
- **„Chevrollette co“** – unklar, bitte genauer (Chevrolet Corvette? Camaro? Oder eine Fahrzeug-Kette mit diesem Namen?).
- Bus, U-Bahn-Zug, U-Boot, Schnellboot (siehe oben), **Autofähre** nach Arkham.

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

1. Lage und Grösse von Gotham so wie in der Karte? (Inselform nach Skizze, ca. 2,7 x 2,8 km, Ostfluss endet ca. 500 m westlich der Manor)
2. Darf die Küste nach Westen verlängert werden und der Wald zwischen Manor und Gotham dafür weichen (Highway, Flüsse)?
3. „Chevrollette co“ und „Kameras“ – was genau?
4. Kampfjet später auf die Militärinsel stellen (Insel kommt erst später)? (Die Anflugschneise im Wald ist seit 2026-11-11 wieder zu, Bäume stehen wie vorher.)
