# Batverse – Plan 2: Gotham City und Ausbau (Stand 2026-11-11)

Sammelt alle Wünsche von Nicolas vom 2026-11-11. **Karte zum Plan:** `gotham/index.html` (im Browser `sachen/batverse/gotham/`), Daten in `gotham/daten.js`.
Die Karte ist ein Entwurf: Lage, Grösse und Namen dort ändern (Zahlen in `daten.js`), dann gilt die Karte. Später liest der 3D-Aufbau dieselbe Datei.

Koordinaten wie im Spiel: Meter, Rondell = 0/0, **Norden = -z (oben)**, Osten = +x. Gotham liegt im **Westen** (x ca. -3700..-950, z ca. -1450..1390), die bestehende Hauptstrasse wird zum Gotham Highway nach Westen verlängert.

**Regeln für alles hier:** stilisiert, eigene Entwürfe, keine Logos/Marken/Film-Nachbauten. Die bestehende Welt (Wald, Gelände, Strassen) wird **nur nach Rückfrage** verändert. Jeder Schritt wird einzeln gebaut, getestet, committet. Gebäude von Gotham sind **innen leer**, ausser wo hier ausdrücklich ein Innenraum steht.

---

## Phase 0 – Technik zuerst (ohne die geht Gotham nicht)

Gotham ist ca. 2,7 x 2,8 km gross, die Welt endet heute bei ca. 700 m. Darum zuerst (ausführlich in **`PLAN-KACHELN.md`**, Schritte K1-K8):

| Nr | Was | Inhalt |
|----|-----|--------|
| T1 ✅ | Bildrate-Anzeige (K1) | FPS und Zeichenaufrufe einblendbar (`?debug` und Einstellungen), Messwerte PC und Handy vorher/nachher |
| T2 (läuft: K2-K5 und Fernring fertig, K8 offen) | **Kacheln 128 m** | Welt in 128-m-Kacheln (Gelände, Bäume, Gebäude, Kollision je Kachel). Nur Kacheln im Umkreis werden gebaut/angezeigt, weiter weg vereinfacht (LOD), ganz weit weg entladen. Laden verteilt über mehrere Bilder (kein Ruckeln). Antwort zur Frage „sieht die Welt dann noch normal aus?“: ja, die Grenzen sieht man nicht, wenn Gelände und Bäume an den Kachelrändern aus derselben Formel kommen |
| T3 ✅ | **Einstellungen** (K6) | Menü „Einstellungen“: Ladeweite (z. B. 2-8 Kacheln = 256 m bis 1 km), Lautstärke (gibt es schon als Regler im T-Menü), Grafikstufe. Gespeichert im Browser (`localStorage`, wirkt wie ein Cookie, wird aber nicht an einen Server geschickt; Lautstärke ist dort schon gespeichert) |
| T4 ✅ | **Ladescreen** (K7) | Eigener Ladebildschirm, getrennt für PC (breit, Tastenbelegung als Tipps) und Handy (hochkant/quer, Touch-Tipps), mit Fortschritt der echten Ladeschritte |
| T5 ✅ | **Teststrecke für Bauteile** (`werkstatt/`, 2026-11-12) | Eigene Testseite ausserhalb der Welt (`werkstatt/`): lädt ein einzelnes Modell (Fahrzeug, Gebäude-Vorlage) auf eine leere Fläche mit Piste, ohne die Welt zu ändern. Werkzeug: VS Code mit Live Server reicht (wie heute); Vite, CodeSandbox oder StackBlitz bringen hier wenig, weil das Projekt ohne Build läuft – Empfehlung: nicht einführen |
| T6 (fertig 2026-11-15) | Gotham-Karte im Spiel | Die 2D-Karte (`gotham/`) auch im Spiel als Kartenansicht (Taste) mit eigener Position |

## Phase 1 – Gotham: Grundgerüst

| Nr | Was | Inhalt |
|----|-----|--------|
| G1 | Gelände und Wasser | **Hauptinsel nach der Skizze von Nicolas (2026-11-12):** frei gezeichneter Umriss (`insel.umriss` in `daten.js`), oben breit mit Einbuchtung, Nordosten am höchsten, unten zur Spitze schmaler und mit der Spitze im Meer (Hafen dort). Die Flüsse liegen als Band um die Insel: **Westfluss** 400 m, **Ostfluss** 440 m (wie der East River bei der Williamsburg Bridge), **Nordkanal** 180 m, im Süden offenes Meer (schliesst an die bestehende Küste im Südosten an), Arkham-Insel im Südwesten vor der Küste. **Strassenebene der Stadt = Fahrbahn der Brücken**, 22 m über dem Wasser (Welt-y -12, Wasser -34; Nicolas 2026-11-12: um 4 m angehoben, vorher -16, damit unter der Strasse Decken und Reserve zum Wasser Platz haben (Fahrbahnplatte 1 m, Decken und Bodenplatten 0,5 m, in der Seitenansicht eingetragen); Nicolas: Schichten herausgeschnitten, Tiefgaragen-Etagen 5,5 m wie bei Wayne Manor, Tiefgaragen des Wayne Towers neben den Turm, geheimer Wayne-Stock direkt unter den Turm und alles darunter mit hoch): hohe Kaimauern rundum; am Mauerfuss ein Streifen Kies/Sand knapp über dem Wasser, dann wird der Fluss weich tiefer (keine senkrechte Kante unter Wasser). **Rückfrage erledigt (Nicolas 2026-11-12):** Berge weichen nur auf der Gotham-Fläche (Insel, Flüsse, Uferstreifen), dahinter bleiben sie; Festland gegenüber fällt natürlich zum Wasser ab (Hügel, Wald, Kies am Ufer). **Schritte:** G1a Höhenformel und Wasserflächen (fertig 2026-11-12), G1b feines Gelände-Raster für Gotham (befahrbar, fertig 2026-11-12), G1c Weltgrenze ca. 4,3 km und Teleport „Gotham“ (fertig 2026-11-12), G1d Kaimauern mit Kiesstreifen (fertig 2026-11-12: Brüstung 1,1 m, Kai 12 m breit; Lücken für Brücken mit G2). |
| G2 | **Strassennetz** | Kein starres Gitter (Nicolas 2026-11-11): frei gezogene, geschwungene Hauptstrassen (Ring um den Wayne Tower, Diagonale „Old Broadway“, Crosstown Expressway, Uferstrassen …) und je Bezirk ein eigenes, gedrehtes und verzogenes Nebenstrassennetz mit Lücken (Narrows: enge Gassen). **Zweistöckige Strassen in der Stadt** (Park Row, Uferstrasse Ost): oben normaler Verkehr, 5,5 m darunter auf Höhe der Tiefgarage 1 (ca. 4,5 m licht) die untere Strasse (Lower Level) mit Obdachlosen und dem Eingang zum Club des Pinguins. **Hängebrücken** im Stil Williamsburg/Manhattan Bridge (Türme an den Ufern, ca. 62 m über der Fahrbahn, Tragseile), Fahrbahn auf Strassenhöhe: 3 über den Ostfluss (Highway, Nord, Süd), 2 über den Westfluss, 1 über den Nordkanal nach Norden (bei x -2424, Nicolas 2026-11-12, mit Zufahrt Norden); nach Arkham keine Brücke, sondern die **Arkham-Fähre** (Nicolas 2026-11-12) vom Fähranleger in den Narrows. Füllbauten stehen automatisch an den Strassen und in den Blöcken (nie auf einer Strasse) |
| G3 ✅ (2026-11-16) | **Gebäude-Vorlagen** | **Geschosshöhe immer mindestens 4,7 m** (wie das Erdgeschoss von Wayne Manor; Nicolas 2026-11-11), höher nur für Hallen wie Empfang/Lobby (Wayne Tower EG 9,4 m → ca. 67 Stockwerke). Wenige Vorlagen, mehrfach eingesetzt: Wolkenkratzer (Glas/Stein, Höhe nach Wohlstand), Bürohaus, Mehrfamilienhaus (Ziegel, Feuertreppen), Laden mit Wohnung darüber, Fabrikhalle, Lagerhalle. Innen leer |
| G4 ✅ (2026-11-16) | **Wohlstand reich → arm** | Jede Fläche bekommt einen Wohlstand 0..1 (Bezirke in der Karte, weich überblendet): Uptown/Zentrum hohe Türme, Westseite/Südstadt gemischt, Fabrikviertel, **The Narrows am Hafen** arm (kleine Häuser, Fabriken). Sinnvoll so: Armenviertel am Hafen ist typisch (Industrie, Lärm, billiger Boden) |
| G5 ✅ (2026-11-16) | **Seitengassen** | Im armen Viertel dichtes Gassennetz: Müllcontainer, Säcke, Wäscheleinen, Feuertreppen, Pfützen, Dampf aus Gullys |
| G6 ✅ (2026-11-16) | **Baustellen als Lückenfüller** | Nicolas 2026-11-12: Baustellen füllen die Lücken zwischen den Füllbauten (kein Rohbau, kein Kran): Erde mit Spuren, darauf Material (Kies, Sand, Ziegel auf Paletten, Betonplatten, Bohlen), ein paar Metallstangen (Bewehrung aus Fundamentstreifen, Bündel, Gerüstrohre), Baucontainer und Toilette, rundum Bauzaun-Gitter mit Tor und Absperrbaken. Vorlage `buildBaustelle` in `js/gotham/fuellbau.js` (beliebige Grösse), Beispiel in der Werkstatt. Dazu die 8 Plätze in der Karte; später nach und nach durch Gebäude ersetzbar |

### Brücken-Analyse Südbrücke (Harbor), 2026-11-12

- **Vorher:** bei z 1050 über den Ostfluss. Dort war der Fluss schon Meer, das Ostende lag im offenen Wasser, am Ostufer ging keine Strasse weiter. Auch die Nordbrücke endete am Ostufer ohne Strasse.
- **Jetzt:** Südbrücke bei z 800, ca. 440 m über dem Ostfluss, landet auf der Festland-Zunge südlich vom Highway. Die neue **East Shore Road** verbindet am Ostufer die Enden von Nord-, Highway- und Südbrücke. Die Harbor Road führt von der Südbrücke quer durch die Narrows bis zum Fähranleger der Arkham-Fähre.
- Der Hafen liegt an der Inselspitze direkt am Meer, Schiffe müssen unter keiner Brücke durch. Die Durchfahrtshöhe von 18 m bleibt deshalb unkritisch (die echte Williamsburg Bridge hat ca. 41 m).
- Abstand zur Highway-Brücke ca. 500 m.

## Phase 2 – Verkehr

| Nr | Was | Inhalt |
|----|-----|--------|
| V1 | **U-Bahn: 4 Ringlinien** | Nicolas 2026-11-12: **ein Zentrumsring** um den Wayne Tower und **drei Ringe drumherum** in den Lappen der Insel (Uptown im Nordosten, Westseite, Süden mit Südstadt/Narrows/Hafen). Jeder Ring ist eine Ringlinie mit **zwei Gleisen** (Züge im und gegen den Uhrzeigersinn, Vorbild Yamanote-Linie in Tokio). Jeder äussere Ring kreuzt den Zentrumsring an zwei **Umsteigestationen** (6 insgesamt). An jeder Umsteigestation **Gleisverbindungen mit Weichen** (4 Verbindungskurven): Züge fahren nicht nur im Kreis, sondern können dort auf den anderen Ring wechseln, in beide Richtungen (Nicolas 2026-11-12). So lassen sich auch Linien quer über mehrere Ringe fahren. Stationen auf der Höhe der Tiefgarage 2 (Bahnsteig 11 m unter der Strasse), Strecken dazwischen dürfen tiefer liegen. **Hauptbahnhof** am Zentrumsring (Osten, nahe Busbahnhof) mit **Abstellanlage**. Fahrende Züge. Graffitis in den Tunneln, eines „NBR“ |
| V2 ✅ (2026-11-16) | **Bus** | Bushaltestellen zwischen den U-Bahn-Stationen, 3 Linien (Ring innen, Nord-Süd, Manor-Express), ein fahrender Bus, **Busbahnhof** |
| V3 | **Taxi-Depot** | Halle/Hof, in dem die Taxis stehen, die nicht fahren (das bestehende Gotham Taxi als Vorlage) |
| V4 | Parken | Tiefgaragen-Etagen 5,5 m hoch wie bei Wayne Manor (Nicolas 2026-11-11). Tiefgaragen bei vielen grossen Gebäuden (Einfahrt als Rampe, innen nur bei ausgewählten befahrbar), 5 Parkhäuser |

## Phase 3 – Gebäude mit Bedeutung

Lage siehe Karte. Alle zuerst als leere Hülle (Vorlage + Schild), Innenräume nur wo genannt.

- **Wayne Tower** im Zentrum (ca. 320 m, logisch ca. 80 Stockwerke à 4 m). Befahrbare Tiefgarage (2 Ebenen) **neben dem Turm**; **direkt unter dem Turm ein geheimer Stock** (0 bis -8 m) (Vorbild `karten/planung/wayne-geheimstock-vorbild.png`: weite niedrige Halle, viele runde Pfeiler, runde Deckenlampen) mit dem Tumbler, weiteren Prototypen und Gadgets; darunter der Kanal-Hub (-3, siehe Phase 4).
- **Polizeipräsidium** mit Batsignal auf dem Dach (leuchtet nachts, schaltbar).
- **Arkham Asylum**: nach „Später“ verschoben (Nicolas 2026-11-12).
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

Ein ganz normaler 20-Fuss-Seecontainer am Ostufer (Nicolas 2026-11-12: x -1470 / z 181) (Foto von Nicolas: blau, Wellblech, zweiflügelige Tür mit Verriegelungsstangen, **keine Fenster**; 6,06 x 2,44 x 2,59 m, innen ca. 5,9 m lang) ist ein **Aufzug** (fährt samt Auto hinunter). Unten eine flache, weite **Halle** auf Höhe der Tiefgarage 1 (Boden 5,5 m unter der Strasse, ca. 4,7 m hoch), Vorbild Foto von Nicolas: Sichtbetonwände, **die ganze Decke ein Raster aus Lichtpaneelen**, glatter Betonboden, hinten Reifenstapel und Werkbank.
Batmobil in der Mitte, **Anzug fährt aus dem Boden**, **Motorrad und Batpod fahren aus der Wand**, Decke aus Lampen, Computer, **aufklappbare Wand** mit Waffen und Gadgets, **Geheimwand mit Tresor** (Goldbarren, Bargeld). Alle Mechanismen als Tore nach der Regel „Tore anzielen“.

## Phase 6 – Militär (vorerst weggelassen)

Nicolas 2026-11-12: Für die Planung jetzt nicht wichtig, aus der Karte entfernt (Stützpunkt, Zufahrt, Nordkanal-Brücke, Militär-Autohaus). Später wieder aufnehmen:

- **Militärstützpunkt ausserhalb der Stadt** (nördlich, über eine Zufahrt erreichbar): Kaserne, Hangars, Fahrzeughalle, Militär-Autohaus.
- Zufahrt über die Nordkanal-Brücke (Verlängerung der Uptown Avenue).
- Militärfahrzeuge und weitere Waffen aus den Notizen 18.11.2026: siehe Phase 11, N51 und N52.

## Später (vorgemerkt, noch nicht in der Karte)

- **Arkham-Insel** (Nicolas 2026-11-12: wie die Militärinsel erst später, aus der Karte entfernt): Arkham Asylum auf eigener Insel vor der Küste, nur mit der **Arkham-Fähre** erreichbar (Autofähre, Anleger in den Narrows und auf Arkham; vorher Insel bei ca. -3340 / 1800).
- **Militärinsel im Osten** (Nicolas 2026-11-11: erst später, vorerst weglassen): im Meer, per Boot/Flug, Landebahn, Hangars, Hafen. Der Kampfjet bekommt dort seinen Platz (statt Hauptstrasse; entschieden, Nicolas 2026-11-12).
- **Kameras (S5)**: später (Nicolas 2026-11-12).

## Phase 7 – Wayne Manor und Batcave

- Batcave: weitere geheime Dinge (Vorschläge zur Auswahl vor dem Bau), **Hangar-Fläche vergrössern**.
- **U-Boot** in der Cave, **Meer tiefer** machen (damit U-Boot und grössere Boote passen; betrifft Höhlenwasser, Wassertunnel, Küste – Rückfrage), **Schnellboot**.
  - Stand 2026-11-11 (Nicolas: Meeresgrund bei Wayne Manor wird für U-Boote später ohnehin tiefer): Meer und Höhlenwasser Welt -34, Meeresgrund am Fuss der Manor-Klippe Welt -38 (nur ca. 4 m Wasser), weiter draussen ca. -47; Gotham-Flussgrund 12 m unter dem Wasser (Welt -46, im Schnitt -43 m unter der Strasse). Beim Vertiefen Meer, Bucht, Wassertunnel, Höhlensee und Gotham-Flüsse zusammen planen (U-Boot soll von der Batcave bis in die Flüsse kommen); Zieltiefe noch offen.
- **Inneneinrichtung der Mansion** (Raum für Raum).
- **Klavier mit Geheimcode**: richtige Tonfolge spielen → geheimer Aufzug öffnet sich.

## Phase 8 – Fahrzeuge

- **Tumbler 2.0** – drei eigene Entwürfe, inspiriert von den Stilrichtungen „Affleck“, „Pattinson“ und „Arkham“ (Muscle-Car-Panzer, Strassen-Muscle-Car, futuristisch) – **keine Film-Nachbauten** (eigene Regel).
- **Corvette** (Nicolas 2026-11-12: mit „Chevrollette co“ war einfach eine Corvette gemeint; stilisiert, ohne Logos) – nicht dringend, irgendwann oder ganz am Ende.
- Bus, U-Bahn-Zug, U-Boot, Schnellboot (siehe oben), **Autofähre** nach Arkham.

## Phase 9 – Spielsysteme

| Nr | Was | Inhalt |
|----|-----|--------|
| S1 | **Inventar mit Hotbar** | Leiste unten (wie Minecraft/Schedule I), Tasten 1-9, Plätze für Gegenstände, Waffen, Kleider, Goldbarren, **Munition** (stapelbar) |
| S2 | **Zielfunktion bei Waffen** | Rechte Maustaste zielen (Kamera näher, Fadenkreuz). Entschieden: mit Waffe in der Hand öffnet Rechtsklick keine Tore und steigt nicht ein (Slot wechseln). Linksklick wird frei für Aktionen (statt Maus fangen). |
| S3 | **Kontostand** | Geld als eigener Zustand (lokal gespeichert), Schnittstelle so gebaut, dass er **später mit Supabase** verbunden werden kann (Anmeldung und Datenbank erst dann; Datenschutz/Kosten vorher klären) |
| S4 | **Computer/Handy-Browser** | Wie das Handy-Internet in GTA V: Bildschirm im Spiel mit Seiten, darunter der **Fahrzeug-Shop** mit drei Händlern (billig, teuer, Militär). Gekauftes Fahrzeug wird geliefert; die Händler gibt es auch als Gebäude in Gotham |
| S5 | **Kameras** | **Später** (Nicolas 2026-11-12). Noch unklar: Überwachungskameras in der Stadt (auf dem Batcomputer ansehen) oder Kamera-Ansichten für den Spieler. |
| S6 | **Eigene Figuren** | Später: personalisierbare Spielfigur, Kleider wirklich anziehen (braucht ein Figurenmodell mit Skelett; grosser eigener Schritt) |

## Stand der alten Notizen (2026-11-17)

Gebaut: Gotham mit Polizei und Batsignal, Hafen, Wayne Tower mit geheimem Stock, Container-Geheimbasis (Tumbler, Anzug aus dem Boden, Motorrad und Batpod aus der Wand, Lichtdecke, Computer, Waffenwand, Tresor), Kanalnetz mit Schurkenbasis unter dem Wayne Tower, U-Bahn mit Graffiti NBR und Abstellanlage, Bus und Busbahnhof, Taxi-Depot, Parkhäuser und Tiefgaragen, Baustellen-Vorlage, Seitengassen, Casino, Kirche, Gericht, Stadion, Krankenhäuser, Krippen, Bankautomaten; S1 Inventar mit Hotbar und Munition, S2 Zielen und Waffen, S3 Kontostand (Supabase später), S4 Handy-Browser mit Fahrzeug- und Waffenläden; Tag-Nacht; U-Boot, Schnellboot, Meer tiefer.
Als Gebäude (innen leer) stehen auch: Club des Pinguins, Grand Ballroom (Events), 3 grosse und 4 kleine Banken, Hotels teuer und billig, Juweliere, Massschneider, Kleiderläden, Bars, Restaurants, Fast Food, Fabriken, Museen, Waffenläden, Autohäuser. Ladeweite und Lautstärke werden schon gespeichert (localStorage wm-range, wm-vol). Noch offen aus den alten Notizen: Tumbler 2.0 (drei Entwürfe), Corvette, Arkham-Insel mit Fähre, Militärstützpunkt und -insel, Klavier mit Geheimcode, Inneneinrichtung der Mansion, weitere geheime Dinge und grösserer Hangar in der Cave, Kameras (S5), eigene Figuren (S6), Obdachlosenlager unter der Brücke und Drogenverstecke (in der Karte, noch nicht gebaut), Tresorkeller in den grossen Banken und 3 Automaten in den kleinen, coolerer Ladebildschirm getrennt für Handy und PC, Bankautomaten-Modell an allen 24 Standorten (PLAN-BANKAUTOMAT A4). Nicht Batverse: "Rampe und Polytrack game", "VS Code mit Live Server, Vite, CodeSandbox/StackBlitz zum Testen von Bauteilen" (Werkzeuge).

## Phase 10 – Notizen 17.11.2026

| Nr | Was | Stand |
|----|-----|-------|
| N1 | **Börse**, Aktienhandel (Wayne Enterprises, Autohauskette usw.). Vorlage für einen begehbaren Handelssaal (Nicolas 2026-11-17, Filmbild): `karten/planung/boerse-vorbild-handelssaal.webp` – grosser Saal mit Säulen, achteckige Handelsposten mit Bildschirm-Kränzen und Leuchtdach, Händlertische mit vielen Monitoren, Kurstafeln oben an den Wänden, Gedränge, Papier am Boden. Bild nur lokal (Filmstandbild, nicht ins öffentliche Repo) | offen – braucht Kursmodell und Seite im Web (Kurse im Laptop schon da) |
| N2 | **Geldwäsche**: bargeldintensive Betriebe, Immobilien, Kunst, Gold, Luxusgüter, Kryptowährungen | offen – Idee, Ablauf mit Nicolas klären |
| N3 | **Geld- und Gefangenentransporte** (fahrende Transporter) | offen |
| N4 | Casinos | ein Casino steht (BS-02); weitere offen |
| N5 | **Laptops in der Werkstatt**: wie der Bankautomat, aber anderes UI. Zwei Laptops nebeneinander mit verschiedenem Gehäuse, gleiche Software; nicht jeder hat jede App. Benutzername schon eingetragen; manche entsperrt, manche ohne, manche mit Passwort. Apps: **Web** (Browser mit angehefteten Seiten wie GTA V: Autohändler, Waffen, Börse, Bank, Immobilien – überall schon angemeldet; eigene Immobilien mit Wert), **Kontakte** (Polizei, Taxi, Krankenwagen, Feuerwehr anrufen), **E-Mail**, **Karten**; weitere Apps später | **gebaut 2026-11-17** in der Werkstatt (PLAN-LAPTOP.md L1-L3); im Spiel aufstellen offen |
| N6 | **Granaten** als Werkzeug | offen |
| N7 | **Autoschlüssel**: im Autohaus hinten in einem Schlüsseltresor | offen |
| N8 | Jeder Gegenstand: **2D im Inventar, 3D in der Hand und ausserhalb** | Schusswaffen 3D in der Hand; übrige noch 2D-Symbol in der Hand, 3D-Modelle offen |
| N9 | **Generalschlüssel/Hacktool** für Batman: jede Tür öffnen, jedes Fahrzeug stehlen | offen (hängt an N7) |
| N10 | Batarang flog durch Gebäude, soll abprallen (Gebäude, Fahrzeug, Baum) | **gebaut 2026-11-17** |
| N11 | Bankautomat direkt beim Wayne Tower | **gebaut 2026-11-17** (neues Modell auf dem Vorplatz) |
| N12 | Item zum Ein-/Ausschalten des Batsignals (Bat-Knopf) | **gebaut 2026-11-17** |
| N13 | **Keilsperren** (hydraulische Strassensperren, engl. *wedge barrier* / Road Blocker; Nicolas 2026-11-17, Filmbild Wall Street, Vorlage `karten/planung/keilsperre-vorbild.webp`): Stahlkeile im Boden quer über die Fahrbahn, fahren hoch (z. B. vor Börse, Grossbank, Gericht, Polizei). Schräge Vorderseite = Rampe: mit Motorrad/Batpod springt man darüber, Autos prallen an der steilen Kante ab (Stoss, Schaden, stehen bleiben), schwere Fahrzeuge (Tumbler, Panzer) kommen evtl. drüber. Dazu Absperrböcke und Pylonen. Idee: ein-/ausfahrbar (Rechtsklick, Alarm, Polizeieinsatz) | offen |
| N14 | **Abfahrt in eine untere Strasse unter einer Hochstrasse** (Nicolas 2026-11-17, Filmbild, Vorlage `karten/planung/unterstrasse-abfahrt-vorbild.webp`): breite Strasse unter einem Hochstrassen-Deck auf Betonpfeilern; die Decke ist dunkel mit Reihen von Leuchtstoffröhren (grünlich-weiss), an der Kreuzung Ampeln und Fussgängersignale; der linke Fahrstreifen taucht als Rampe nach links in eine untere Ebene ab, rechts geht es ebenerdig weiter ins Helle. Abgleich mit dem Bestand: zweistöckige Strassen und Rampen gibt es schon (gotham-unterstrasse.js, Wayne Circle, Park Row); fehlt: Leuchtröhren unter dem Deck, Ampeln/Fussgängersignale, Kreuzung unter der Hochstrasse, die Rampe seitlich als Abzweig statt mittig | offen |
| N15 | **Lichter aus und Nachtsichtbrille** (Nicolas 2026-11-17, nur als Idee): Batman kann in Tunneln, Kanälen, U-Bahn, Tiefgaragen und Gebäuden alle Lampen eines Bereichs ausschalten (z. B. Gadget im Inventar oder Rechtsklick an einem Sicherungskasten; Lampen-Materialien und Lichter dunkel, nach einer Zeit wieder an). Dazu eine Nachtsichtbrille als Gegenstand (Taste oder Hotbar): grünliches, helleres Bild mit Rauschen und Vignette (Nachbearbeitung oder Nebel/Belichtung anpassen), Wärmequellen/Personen heben sich ab. Zusammen: Gegner sehen im Dunkeln nichts, Batman schon | Idee |

## Phase 11 – Notizen 18.11.2026

Die alten Notizen in derselben Liste sind gegen "Stand der alten Notizen" und Phase 10 abgeglichen: neu sind nur die Punkte unten. Rückfragen dazu: `OFFENE-FRAGEN.md` 33–42.

**Gegenstände und Behälter**

| Nr | Was | Stand |
|----|-----|-------|
| N16 | **Bat-Knopf in 3D** in der Hand, eher wie ein Funkgerät oder eine Fernbedienung mit einem Knopf | gebaut 2026-11-18 |
| N21 | **Aufnehmen mit Kreis**: linke Maus auf einem Gegenstand halten, ein Kreis um den Zielpunkt füllt sich, voll = aufgenommen (Geld, Goldbarren, Koffer). Für Behälter ersetzt durch N22 | teilweise – Koffer aufnehmen mit Kreis (2026-11-18); Geld, Goldbarren am Boden noch nicht |
| N22 | **Behälter-Inventar per Rechtsklick** (Tresore, Koffer, Waffenwand): öffnet ein Fenster mit den 2D-Plätzen des Behälters, Gegenstände einfach hinein- und herausziehen wie im Inventar. Nur von vorne, nur aus der Nähe, nur wenn offen (zu = kein Zugriff) | **gebaut 2026-11-18** (inventar.js `invBox`); Tresore, Koffer, Mülleimer folgen |
| N23 | **Tresore**: verschliessbar, mehrere Sicherheitsstufen und Varianten (verschieden gross, sehr sichere mit grösserer Tür, aber nicht riesig), aufbrechen oder aufsprengen je nach Stufe. Werkzeuge als Gegenstände 2D/3D: Brechstange, explosives Gas, Feuerzeug. In der Werkstatt einen Tresor beim Tisch mit den Laptops. Vorschlag der Stufen siehe `OFFENE-FRAGEN.md` 34 | **gebaut 2026-11-18** in der Werkstatt (5 Stufen, `gotham/tresor.js`); im Spiel: Casino (Stufe 3) und Geheimbasis (Stufe 5) **2026-11-18**; Banken offen (innen leer, Tresorkeller eigener Schritt) |
| N24 | **Goldbarren und Geldstapel in 3D** überarbeiten (eigener Schritt) | gebaut 2026-11-18 (auch einzelne Scheine) |
| N25 | **Batarang-Etui wird ein Koffer**: schwarzer Akten-/Geldkoffer, aufnehmbar (Kreis), zweite Variante mit Geld. Als Gegenstand in der Hand zu; im Inventar zeigt der Tooltip keinen Inhalt. 2D und 3D | **gebaut 2026-11-18** (koffer.js; Bargeld im Koffer als Betrag) |
| N26 | **Mülleimer** in der Werkstatt: öffentlicher Mülleimer, Papierkorb, evtl. eine dritte Variante (z. B. Container). Wie man Gegenstände loswird und ob man sie bis zur Leerung wieder herausnehmen kann: brainstormen (`OFFENE-FRAGEN.md` 35) | **gebaut 2026-11-18** in der Werkstatt (muell.js); im Spiel aufstellen offen |
| N27 | **Waffenwand in der Werkstatt** (hinter dem Tisch) mit allen bisherigen Waffen, Rechtsklick = Behälter-Inventar (N22) | **gebaut 2026-11-18** |
| N28 | **Nachtsichtbrille** (Militär) als Gegenstand 2D/3D; anziehen (Ausrüstungsplatz wie in Minecraft?) -> grüne Sicht mit Rauschen. Ersetzt die Brille aus der Idee N15 | **gebaut 2026-11-18** (nachtsicht.js, Platz Kopf, Taste B) |
| N33 | **Zigaretten** als Gegenstand | gebaut 2026-11-18 |
| N34 | **Skateboard** wie in Schedule I: Rechtsklick halten, bis der Kreis um die Maus voll ist, dann Wechsel in die Ansicht von hinten auf dem Board; W beschleunigt, deutlich schneller als zu Fuss | **gebaut 2026-11-18** (skateboard.js, Ersatzfigur bis N35) |
| N36 | **Fidget Spinner** als Gegenstand, Rechtsklick dreht ihn | gebaut 2026-11-18 |
| N39 | **USB-Sticks**, zuerst 3 verschieden aussehende, mit eigener Software/Daten; in Computer, Laptop oder Server einstecken | Laptop gebaut 2026-11-18 (Computer/Server offen) |

**Bankautomat, Casino, Werkstatt**

| Nr | Was | Stand |
|----|-----|-------|
| N17 | **Bankautomat 3D**: die zwei schwarzen Striche links neben dem Bildschirm sind falsch, gemeint sind Kartenschlitz und Geldausgabe. Bildschirm grösser, die Schlitze darunter | gebaut 2026-11-18 |
| N18 | **Bankautomat aufbrechen**: beim Beschuss mit einer Waffe ca. 20 s ununterbrochen Geldscheine aus dem Schlitz (Animation), dazu eine zerstörte 3D-Variante. Später aufbrechen, zerstören, manipulieren | Beschuss gebaut 2026-11-18 (aufbrechen mit Werkzeug, manipulieren offen) |
| N19 | **Jeton-Automat einzeln in der Werkstatt** (Bargeld gegen Jetons) | gebaut 2026-11-18 |
| N20 | **Spielautomaten grösser** (wirken zu klein) | gebaut 2026-11-18 |
| N29 | **Neue Casino-Automaten**, alle mit Jetons, Knöpfe im Jeton-Design: **Crash** (Flugzeug steigt, Faktor wächst, rechtzeitig auszahlen, sonst Absturz = Einsatz weg), **Mines** (ca. 30 verdeckte Felder mit Diamanten und Bomben, Einsatz und Anzahl Bomben selbst wählen, jeder Diamant erhöht den Gewinn, mehr Bomben = mehr Wert je Diamant, Bombe = verloren), **Daily Spin Wheel** (Glücksrad einmal am Tag, wie GTA V). Roulette bleibt. Weitere Ideen: `IDEEN-CASINO.md` | **gebaut 2026-11-18** in der Werkstatt und im Casino (casino-spiele.js) |
| N30 | **Börse auf dem Laptop** wie in GTA V | teilweise – "Gotham Stock Exchange" mit 8 Aktien, Depot, Kauf/Verkauf ist im Laptop gebaut (2026-11-17); Ausbau offen (`OFFENE-FRAGEN.md` 36) |
| N31 | **Neues, realistisches Casino in der Werkstatt** nach Recherche echter Casinos (Grösse, Aufteilung, Aussehen) | gebaut 2026-11-18 (werkstatt/casino-real.js) |
| N37 | **Waffenshop in der Werkstatt** grösser, direkt daneben ein viel grösserer | gebaut 2026-11-18 (nur Werkstatt) |
| – | Regel: alles, was neu einzeln gebaut wird, beim Tisch in der Werkstatt aufstellen, wo jetzt die Laptops stehen | Regel |

**Handy und Apps**

| Nr | Was | Stand |
|----|-----|-------|
| N32 | **Zwei Handys** (Gaming-Handy von Wayne Enterprises, Büro-Handy einer anderen Firma), als Gegenstand 2D/3D. In der Hand Rechtsklick = Handy unten rechts (wie GTA V, Fenster wie beim Laptop), Pfeiltasten und Enter wählen Apps. Browser: Handy dreht quer und füllt den Bildschirm; andere Apps (Kontakte usw.) bleiben hochkant unten rechts | **gebaut 2026-11-18** (handy.js, Spiel und Werkstatt) |
| N40 | **Dating-App** auf dem Handy (Aufbau echter Apps recherchieren, eigene bauen) | gebaut 2026-11-18 (Gotham Hearts) |
| N41 | **Eigenes Hintergrundbild** für Handy und Laptop hochladen, stark verpixelt gespeichert (Speicher sparen) | gebaut 2026-11-18 |
| N49 | **Musik-App** wie Spotify (ohne Werbung) mit eigenen Songs von Nicolas; Handy weg = kleine Anzeige mit vor, zurück, Pause, schliessen | offen – wartet auf die Dateien (`OFFENE-FRAGEN.md` 40) |

**Waffen, Fahrzeuge, Bewegung**

| Nr | Was | Stand |
|----|-----|-------|
| N44 | **Greifhaken**: cooleres 2D-Symbol, neuer Name (`OFFENE-FRAGEN.md` 39), 3D-Modell, nur Batman (in keinem Laden; ist es auch heute nicht). Zielhilfe wie bei der Rauchbombe (wie weit er reicht), schiesst ein Seil mit 3D-Haken und zieht es wieder ein | gebaut 2026-11-18 (Symbol, 3D, Zielhilfe, Seil mit Haken); Name offen (Frage 39) |
| N45 | **Löschfahrzeug**: Zielhilfe wie bei der Rauchbombe (wie weit der Strahl reicht) | gebaut 2026-11-18 |
| N46 | **Polizei-Helikopter** und **Polizei-Jeep** (Pickup mit offener Ladefläche) | gebaut 2026-11-18 |
| N47 | **Drift** für Landfahrzeuge (Taste in `CLAUDE.md` eintragen) | gebaut 2026-11-18 (Taste Q) |
| N48 | **Gleitumhang**: Batman gleitet nach einem Sprung in die Tiefe in einem bestimmten Winkel | gebaut 2026-11-18 |
| N50 | **Batarang-Flugbahn**: in der Mitte steigt er plötzlich viel höher, dann kommt er zurück – korrigieren | **behoben 2026-11-18** |
| N51 | **Weitere Waffen**: G36, G36C (Karabiner), AKM, MP7, MG34, weitere Maschinengewehre und Maschinenpistolen | gebaut 2026-11-18 (G36, G36C, AKM, MP7, MP5, MG34) |
| N52 | **Militärfahrzeuge** (zu Phase 6): Kampfpanzer Leopard (gibt es), Transporthelikopter Cougar, leichter Transport- und Schulungshelikopter, Kommandofahrzeug Piranha I, Sanitätsfahrzeug Piranha I, geschütztes Mannschaftstransportfahrzeug Duro IIIP, Panzerjäger 90 (Piranha I), offensiver Drohnen-Panzer (Nicolas: "Minotaurus"), Aufklärungsdrohne Northrop Grumman RQ-4 | teilweise 2026-11-18: Piranha I (Kommando, Sanität, Panzerjäger 90), Duro IIIP, Cougar, Schulungshelikopter gebaut; Minotaurus und RQ-4 offen |

**Figuren, Akten, Ideen**

| Nr | Was | Stand |
|----|-----|-------|
| N35 | **Spielfiguren** anfangen, einfach gebaut wie in Schedule I. Grosse Aufgabe: Fahrzeuge und Gebäude müssen evtl. an die Figurengrösse angepasst werden | offen – eigener Plan nötig |
| N38 | **Personalakte** des Spielers: Waffenlizenzen in Stufen, Strafregister, Fahrausweis usw. Online-Datenbank-Software nur auf Computern der Polizei und bei Batman; die eigene Akte jederzeit ohne Gegenstand ansehen. Später Personen mit Akten (auch Joker, Bane, Pinguin). Ideen: `IDEEN-AKTE.md` | eigene Akte gebaut 2026-11-18 (Taste J); Datenbank-Software und Personen offen |
| N42 | Idee: **Innenräume erst beim Betreten laden**, Module (z. B. gleiche Hotelzimmer), hinter geschlossenen Türen weniger laden | Idee |
| N43 | Idee: **eigene Geräusche in Gebäuden** (z. B. im Casino Spielgeräusche und Klingeln) | Idee |

## Nicht Teil von Wayne Manor

- **„Rampe und Polytrack game“** – klingt nach einem eigenen Spiel (Strecke mit Rampen, Stil wie Polytrack). Vorschlag: eigenes Projekt unter `sachen/`, eigener Plan.

---

## Empfohlene Reihenfolge

Als Seite mit allen Schritten, Begründung und Abhängigkeiten: **`gotham/umsetzung.html`** (Daten in `gotham/umsetzung.js`).

`T1 → T2 → T3 → T4 → T5 → G1 → G2 → G3/G4 → G5/G6 → V1 → V2 → Phase 3 (Wayne Tower, Polizei, Hafen zuerst) → U1-U3 → Phase 5 → V3/V4 → Phase 6 → S1 → S3 → S4 → S2 → Phase 7 → Phase 8 → S6`

Begründung: Ohne Kacheln (T2) und Einstellungen (T3) wird Gotham zu langsam, besonders am Handy. Strassen vor Gebäuden, weil alles an den Strassen hängt. Untergrund nach den Gebäuden darüber, weil Eingänge oben liegen. Inventar und Geld vor Shop und Waffen.

## Entscheidungen (Nicolas 2026-11-12)

0. **Himmelsrichtungen wie bei Wayne Manor:** Die Karte ist nicht nach Norden ausgerichtet. Kompass-Stern unten rechts (drehbar wie eine Kurbel, Klick = Norden oben / zurück). Namen angepasst: Westfluss → Südfluss, Ostfluss → Nordfluss, Nordkanal → Westkanal, Westseite → Südseite, Südstadt → Oststadt, Uferstrasse Ost → Nord usw. (ältere Texte in diesem Plan nutzen teils noch die alten Namen).

1. **Lage und Grösse von Gotham:** so wie in der Karte (Inselform nach Skizze, ca. 2,7 x 2,8 km).
2. **Wayne Manor liegt bei [-323, 1318] der Karte** und ist um **62 Grad nach rechts** (im Uhrzeigersinn) gedreht: zuerst ca. 30 Grad, dann so weit, dass die Manor-Hauptstrasse ohne Knick in den Highway übergeht (Nicolas, Punkt [-505, 1437]). In der Karte umgesetzt (`daten.js`: `manorLage`, Manor-Steilküste `kuesteAlt`, Manor-Hauptstrasse und Highway-Anfang umgerechnet; das östliche Festland reicht jetzt bis zur Manor-Küste). Im Spiel bleibt die Manor bei 0 / 0: Gotham wird beim Bau mit der Umkehrung (62 Grad nach links drehen, dann verschieben) in die Spielwelt gelegt.
3. **Kameras (S5):** vorerst nach „Später“.
4. **Kampfjet:** kommt später auf die Militärinsel.
5. **Tests im Panzer** (automatisch rauszoomen, Turm läuft nach, Zoom-Maus gleich schnell): bleiben vorerst.
6. **Waffen (S2):** mit Waffe in der Hand öffnet Rechtsklick keine Tore und steigt nicht ein (zum Öffnen im Inventar auf einen leeren Platz wechseln). **Linksklick** soll künftig Aktionen auslösen statt die Maus zu fangen; die Maus wird dann anders gefangen.
7. **„Chevrollette co“** = eine Corvette; kommt irgendwann oder ganz am Ende (Phase 8).
9. **Gelände für Gotham (G1):** Berge nur auf der Gotham-Fläche abtragen, Festland gegenüber natürlich abfallend (Nicolas 2026-11-12).
8. **Klare ID für jeden Füllbau und jede Baustelle** (Nicolas 2026-11-12; seit G3/G4 stehen auf allen Füllbau-Flächen Gebäude mit derselben ID, Baustellen gibt es nur noch BS-01 … BS-08): Füllbauten `FB-0001` … (Reihenfolge, in der die Karte sie erzeugt; ändern sich Strassen oder Bezirke, verschieben sich die Nummern, deshalb vor dem Bau in G3/G4 einfrieren), Baustellen `BS-01` … (fest in `daten.js`), Muster in der Werkstatt `FB-MUSTER` / `BS-MUSTER`. Die ID steckt im 3D-Objekt (`userData.id`, `buildFuellbau`/`buildBaustelle` mit `id`): **Rechtsklick in der Orbit-Ansicht kopiert sie mit** (Zeile „ID: …“). Auf der Karte zeigt ein Klick auf einen Füllbau oder eine Baustelle die ID und kopiert sie vor dem Punkt, z. B. `FB-0187 [-2905, 673]`. So kann man in Nachrichten einfach die ID nennen.
9. **Garagen an den unteren Strassen** (Nicolas 2026-11-12): die unteren Strassen (Park Row, Uferstrasse Nord, Wayne Circle, Ebene -5,5 = Tiefgarage 1) eignen sich prima fuer Einfahrten in die Tiefgaragen der Gebaeude daneben (G3/G4: Tore in den Seitenwaenden der unteren Strasse statt Rampen von oben).

## Offene Fragen an Nicolas

Keine.
