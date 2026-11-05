# random

Sammelprojekt fuer zufaellige kleine Sachen und Tests (Experimente, Mini-Tools, Spielereien).
Die Startseite `index.html` ist eine installierbare PWA und zeigt eine Uebersicht aller Eintraege.

Ergaenzt die globalen Regeln in `C:\Source\CLAUDE.md` (Git-Identitaet, Footer-Credit, README, PowerShell).

## Aufbau

- `index.html` – Uebersichtsseite (HTML, CSS und JS inline, keine Build-Tools, keine Abhaengigkeiten)
- `manifest.webmanifest` – PWA-Manifest
- `sw.js` – Service Worker (Offline-Cache)
- `icon.svg` – App-Icon
- `sachen/<name>/index.html` – eine "Sache" (Mini-Tool, Spielerei)
- `tests/<name>/index.html` – ein Test/Experiment
- `pruefung/<name>/` – eine Pruefungsvorbereitung (siehe unten)
- `blockbench/<name>/` – ein Minecraft-Modell oder Resource Pack (siehe unten): `cowboyhut/`, `halloween/`, `viewer/`, `lokal/` (nicht im Repo)

## Pruefungsvorbereitung (eigener Bereich auf der Startseite)

- Steht im Array `PRUEFUNG` in `index.html` (`type: "pruefung"`), eigener Abschnitt zwischen den Eintraegen und Blockbench. Suche gilt, Filter-Tabs nicht (wie Blockbench, `renderSection()`).
- Pro Pruefung ein Ordner `pruefung/<name>/` mit `index.html` (Lernseite, Tabs Themen / Lernkarten / Quiz) und `inhalt.js` (nur Daten: `themen`, `karten`, `quiz`, Format steht oben in der Datei). **Inhalte kommen von Nicolas** – nichts dazuerfinden, nur seine Unterlagen uebernehmen.
- Fortschritt (gewusste Karten, bestes Quiz-Ergebnis) liegt nur im Browser (`localStorage`).
- Sichtbare Texte hier mit echten Umlauten (Nicolas' Bezeichnung "Pruefungsvorbereitung" mit ue nur im Code).
- **Antworten gemischt:** Quiz und Prüfung mischen pro Durchgang auch die Antworten jeder Frage (`mitReihenfolge`: Feld `reihenfolge` = Original-Indizes in Anzeige-Reihenfolge). `richtig` in `inhalt.js` zeigt weiter auf die Original-Indizes. Die Lösungen nach der Prüfung zeigen die Antworten in derselben Reihenfolge wie beim Beantworten. Darum keine Antworten wie „alle oben genannten“ in `inhalt.js`.
- **Offline:** Seite und `inhalt.js` stehen in `ASSETS` in `sw.js`; nach jeder Änderung `CACHE` hochzählen. Geprüft 2026-11-04 mit gestopptem Server: Prüfung, Quiz, Haus 3D und Startseite laufen aus dem Speicher.
- **Kein Zoomen** auf Pruefungsseiten (Wunsch von Nicolas, 2026-11-04: in der PWA aus Versehen gezoomt): Viewport `maximum-scale=1, user-scalable=no` (Android), `touch-action: manipulation` auf `html` (kein Doppeltipp-Zoom) und ein kleines Skript gegen Kneif-Zoom auf iPhone/iPad (`gesturestart`/`gesturechange` und Zwei-Finger-`touchmove` abfangen; iOS ignoriert `user-scalable=no`). Neue Pruefungsseiten genauso.

## Blockbench (eigener Bereich auf der Startseite)

- Minecraft-Modelle liegen unter `blockbench/<name>/` und stehen im Array `BLOCKBENCH` in `index.html` (gleiche Felder wie `ENTRIES`, `type: "blockbench"`). Sie erscheinen im eigenen Abschnitt "Blockbench" unter den anderen Eintraegen.
- Pro Modell: `build.py` erzeugt `.bbmodel` (Blockbench-Projekt), Java-Modell `.json` und Textur `.png` (Aufruf `python build.py` im Ordner, keine Abhaengigkeiten). Modell nur in `build.py` aendern, nicht in den erzeugten Dateien.
- Einheiten: Spielerkopf = 0..16 auf allen Achsen (1 Skin-Pixel = 2 Einheiten), vorne = Norden (-z). Java-Grenzen beachten: Koordinaten -16..32, Drehung nur um eine Achse in Schritten von 22.5 Grad.
- `index.html` im Modellordner zeigt das Modell mit three.js (liest das Java-`.json`), wahlweise auf einem Skin (`skin.png`, 64x64, schmale Arme werden erkannt).
- `blockbench/viewer/` – Pack-Viewer: liest Resource Packs (.zip, mit JSZip), .bbmodel und Java-Modell-.json im Browser (parent und `#textur`-Verweise werden aufgeloest, flache Items ausgelassen) und zeigt sie per `display.head` auf dem Kopf. Fremde Packs (z.B. von Planet Minecraft, meist "All rights reserved") nur so lokal anschauen, **nicht ins Repo legen**.
- `blockbench/lokal/` (in `.gitignore`): Dateien dort (.zip, .bbmodel, .json, .png) laedt der Viewer beim Start automatisch, solange die Seite ueber den lokalen Python-Server laeuft (der liefert die Ordnerliste). Auf GitHub Pages gibt es den Ordner nicht.
- Viewer-Parameter: `?pack=<url>` laedt ein Pack direkt (mehrfach moeglich, dann kein `lokal/`), `?embed=1` blendet Kopfzeile und Footer aus (fuer iframes). Kuerbis-Texturen (`block/carved_pumpkin`, `block/jack_o_lantern`) im Pack werden als Kuerbis-Block angezeigt; `__MACOSX/` und `._`-Dateien werden ignoriert.

### Halloween-Pack (`blockbench/halloween/`)

- Eigenes Resource Pack, alles selbst erzeugt von `build.py` (Texturen als Pixel-Arrays, Huete als Elemente). Ergebnis: `halloween-pack.zip` (zum Download), `hexenhut.bbmodel`, `teufelshoerner.bbmodel`, `pack.png`. Seite `index.html` mit Download, Anleitung und eingebettetem Viewer.
- Inhalt: neue Texturen fuer `carved_pumpkin`, `jack_o_lantern`, `pumpkin_side`, `pumpkin_top`; leeres `misc/pumpkinblur.png` (kein Kuerbis-Rand beim Tragen, gilt fuer alle Kuerbisse); Huete `halloween:item/hexenhut` und `halloween:item/teufelshoerner` mit gemeinsamer Textur `halloween:item/huete`.
- Huete haengen am geschnitzten Kuerbis per Custom Model Data: Hexenhut 1001, Teufelshoerner 1002. Ab 1.21.4 ueber `assets/minecraft/items/carved_pumpkin.json` (`range_dispatch`, `/give @s carved_pumpkin[custom_model_data={floats:[1001]}]`), davor ueber `overrides` in `models/item/carved_pumpkin.json` (`{CustomModelData:1001}`).
- `pack.mcmeta` nach dem Schema aktueller Packs fuer 26.x: `pack_format` 15, `min_format` 15, `max_format` [97, 1], `supported_formats` [15, 97] (abgeschaut am "Default-Style Halloween Pack" fuer 26.3).
- **Im Spiel noch nicht getestet** (nur im Viewer). Offen: pruefen, ob Minecraft das Pack ohne Warnung laedt und ob Groesse/Sitz der Huete auf dem Kopf stimmt (`display.head`, Skalierung 0.8).
- Neuen Hut ergaenzen: Eintrag in `HATS` (naechste freie Nummer fuer `cmd`), Farben als Bereich in `REGIONS`, dann `python build.py`.

### Recherche: bestehende Halloween-Packs (Stand 2026-10-25)

Modrinth (Suche "halloween", Resource Packs, nach Downloads), mit Lizenz:
- Halloween Mash-up (586k Downloads, All Rights Reserved), Halloween Mashup 2025 Concept Update (MIT, basiert auf dem Konsolen-Pack von Mojang), **Default-Style Halloween Pack** (MIT, fuer 26.3), Halloween Texture Pack Redux (Public Domain, Nachbau des Konsolen-Packs, 76 MB), Halloween Pumpkin Heads und Simple Witch Hat's (All Rights Reserved), **Spooky Lantern** (MIT, Laternen-Modell).
- Nach `lokal/` geladen (nicht im Repo, nur zum Anschauen im Viewer): `HalloweenPack_26.3_v3.3.zip` (Default-Style Halloween Pack, MIT, 4 MB) und `Spooky_lantern_yellow.zip` (Spooky Lantern, MIT, 0.6 MB). Ihre Block-Modelle verweisen teils auf Vanilla-Texturen, die nicht im Pack sind; die erscheinen im Viewer magenta/schwarz.
- Planet Minecraft blockt automatische Downloads (403), dort nur von Hand herunterladen.

## Neuen Eintrag hinzufuegen

1. Ordner unter `sachen/` oder `tests/` anlegen, Einstieg ist immer `index.html`.
2. Im Array `ENTRIES` in `index.html` einen Eintrag ergaenzen:

```js
{ type: "test", title: "Titel", desc: "Ein Satz, worum es geht.", href: "tests/name/", date: "2026-10-22", tags: ["css"] }
```

   `type` ist `"sache"` oder `"test"`. Sortiert wird nach `date` (neueste zuerst).
   Optional `img: "sachen/name/vorschau.webp"` fuer ein Vorschaubild auf der Karte (16:10, ca. 960x600, WebP, unter 100 KB).
3. Die Seite des Eintrags in `ASSETS` in `sw.js` aufnehmen und `CACHE` hochzaehlen (`random-v2`, `random-v3`, ...), sonst sehen installierte Clients die Aenderung nicht.
   Grosse Dateien (z.B. GLB-Modelle) gehoeren in `LAZY`, sie werden nach der Aktivierung im Hintergrund geladen.

### Retro Game Hub (Präsentationen, `sachen/retro-hub/`, `sachen/retro-hub-titel/`)

- Zwei einzelne, unveränderte HTML-Dateien (alles eingebettet, einzige externe Abhängigkeit: Google Fonts "Press Start 2P" und "VT323"). Nicht anfassen; neue Fassung = Datei ersetzen und `CACHE` in `sw.js` hochzählen.
- Offline: beide Seiten stehen in `LAZY` in `sw.js` (werden nach der Aktivierung im Hintergrund gespeichert). Die Schriften holt der Service Worker beim Aktivieren selbst (CSS lesen, genannte `.woff2`-Dateien speichern, `FONTS_CSS`); zusätzlich werden Fonts-Antworten bei jedem Abruf mitgespeichert, auch undurchsichtige (Stylesheet per `<link>`). Geprüft mit gestopptem Server: Seiten und Schriften laden.

## Eigene PWAs

Ein Eintrag kann zusaetzlich als eigene App installierbar sein (Beispiel `sachen/helden/`): eigenes `manifest.webmanifest` mit `scope`/`start_url` `./`, eigenes `icon.svg`, und die Seite registriert den gemeinsamen Service Worker `../../sw.js`. Externe Bibliotheken (three.js) sind fest versioniert und stehen in `ASSETS`, damit sie offline verfuegbar sind.

## Konventionen

- Reines HTML/CSS/JS, relative Pfade (Seite laeuft auch unter `https://n-brand.github.io/random/`).
- Jede Unterseite hat einen Link zurueck zur Uebersicht (`../../`) und den Footer-Credit.
- Hell/Dunkel ueber `prefers-color-scheme`, mobil zuerst (ab ca. 360px Breite).
- Texte auf Deutsch.
- Lokal testen: `python -m http.server 8080` im Projektordner (Service Worker braucht http, nicht `file://`), oder Eintrag `random` in `C:\Source\.claude\launch.json` (Port 4180).
- Vorschaubilder (`vorschau.webp`) werden aus der 3D-Ansicht aufgenommen (Canvas als Bild, im Browser zu 960x600 zusammengesetzt). Beim Haus: Seite mit `?vorschau` öffnen (behält den WebGL-Bildpuffer), Fenster auf 960x600, Canvas per `toBlob('image/webp', 0.82)`. Das Vorschaufenster sperrt Anfragen an andere Ports – zum Speichern einen kleinen Node-Server nutzen, der die Seite selbst ausliefert und den POST als Datei schreibt.

### Haus 3D (`sachen/haus/`)

- Einfamilienhaus (8 x 6 m, 1 Einheit = 1 m) komplett aus Code: Wände als `ExtrudeGeometry` mit Löchern für Tür/Fenster (Giebelwände fünfeckig), Dach aus zwei Platten, Kamin, Sockel, Stufen, Baum (Stamm als `LatheGeometry`), Büsche, Weg, Rasen. Gruppen benannt (`Haus`, `Waende`, `Fenster`, `Tuer`, `Dach`, `Garten`).
- Texturen prozedural auf Canvas mit festem Zufall (Putz, Ziegeldach, Holz, Ziegelsteine, Rasen, Pflaster); UVs in Metern (`metreUV`), damit der Massstab stimmt.
- three.js 0.160.0 wie die anderen Seiten (Service-Worker-Cache) – darum ACES-Tonemapping, `NeutralToneMapping` gibt es erst ab r162. Nur die Sonne wirft Schatten. Shader vorab mit `compileAsync`, Rendern pausiert bei verstecktem Tab. Nebel hängt am Kameraabstand (sonst verschwindet das Haus am Handy, wo die Kamera weiter weg steht).
- Knöpfe: Auto-Rotation, Nacht (blendet über: Fenster und Türlampe leuchten, Innenlicht), Ansicht zurücksetzen, Begehen, Vollbild.
- **Begehen (Ich-Sicht):** PC wie Minecraft, aber Maus per Linksklick übernehmen (Pointer Lock, Fadenkreuz, Zeiger weg), erneuter Linksklick gibt sie frei (Wunsch von Nicolas); Taste E schaltet die Mausempfindlichkeit durch (20, 30, 40, 60, 80, 100, 140, 200, 300 %, Toast, in localStorage `haus-sens3` gemerkt); WASD/Pfeile, Leertaste springt, Shift rennt. Handy (`pointer: coarse`): Vollbild + Querformat (`screen.orientation.lock`, iPhone-Safari kann kein Seiten-Vollbild → nur Hinweis „Handy quer drehen“), linker Joystick läuft, rechter dreht die Sicht, Sprung-Knopf. Verlassen mit Esc (bei übernommener Maus gilt Verlust des Pointer Locks ohne eigenes Freigeben als Esc) oder Knopf „× Verlassen“ oben rechts (am Handy grösser).
- Kollision im Grundriss: Rechtecke (`solids`: Wände mit Türöffnung, Möbel, offenes Türblatt) und Kreise (Baum, Büsche), Spielerradius 0.3. Bodenhöhe aus `groundAt` (Sockel 0.35, zwei Stufen); höher als 0.4 = Wand. Innen Decke bei 2.7 m.
- Innenraum: Tür steht 80° offen, Holzboden, Teppich, Tisch mit 2 Stühlen, Sofa, Regal, Deckenlampe; Innenlicht tagsüber neutral, nachts warm.
- Laufgeschwindigkeit 4.4 m/s, rennen 7.2 (Nicolas wollte schneller, 2026-11-04).

### Villa 3D (`sachen/villa/`)

- **Himmelsrichtungen (von Nicolas festgelegt, 2026-11-05):** **Süden = Strasse** (+z: Hausfront, Veranda, Einfahrt), **Norden = Pool** (-z, hinter dem Haus), **Osten = Garageseite** (+x), **Westen = gegenüber** (-x: Sitzplatz, Grill, Whirlpool). Eselsbrücke: Von der Strasse aus zum Haus schauen (nach Norden): Garage rechts = Osten, Whirlpool-Terrasse links = Westen. „Nördlich“ = weiter weg von der Strasse (Richtung Pool und dahinter). Gilt für alle Ortsangaben von Nicolas.

- Amerikanisches Haus aus Code (1 = 1 m), **doppelte Tiefe** (18,5 m: vorderer Teil bis zur alten Rückwand `MID`, die jetzt Innenwand mit Türen ist, dahinter der Anbau bis `BZ`). Keller (y -3..0), Erdgeschoss ab 0.3, Obergeschoss ab 3.3, Satteldach (ohne Schornstein, Wunsch von Nicolas). EG: Wohnzimmer, offene Küche, Esszimmer, Büro, hinten Familienzimmer mit grosser Öffnung zur Terrasse. OG: Flur von der Treppe nach hinten, links Elternschlafzimmer und Bad, rechts Kinderzimmer und Spielzimmer, vorne zwei Schlafzimmer (grosse Bodenfliesen mit Relief). Keller: Waschküche, Tischtennis, Sofa, hinten Heimkino und Fitnessecke. Garage rechts neben der Küche (12 x 9.6 m, Tür zur Küche, zwei Tore offen, **Ferrari** im ersten (Vorlage: Ferrari 488 / F8 Tributo, Rosso Corsa: Keilform aus Seitenprofil mit Bevel, schmale LED-Scheinwerfer, seitliche Lufteinlässe hinter den Türen, vier runde Rücklichter, Doppelauspuff, Spoilerlippe, gelbe Bremssättel, Springendes Pferd als Canvas-Schild auf Haube, Nase und Flanken, „Ferrari“-Schriftzug hinten; Nase zeigt nach Süden +z), blaues Motorrad vorne im zweiten Stellplatz, hinten und an den Seiten Regale mit Kisten, Hintertür (offen, mit Podest) in der Rückwand zum Garten; Einfahrt 11 m breit, am Randstein abgesenkt), Veranda vorne, **Garagenkeller:** Der Keller geht auch unter die Garage (Durchgang vom Hauskeller bei z -3.2..-1.9): links Werkstatt (Werkbank mit Schraubstock, Werkzeugwand, roter Rollwagen), rechts Weinkeller (Regale, Fass mit Tisch). Die Garagenfläche steht dafür in `HOLES` (kein Gelände darunter), die Bodenplatte muss fest sein (sonst fällt man durch). **Sitzplatz** westlich des Pools (Platten x -13.2..-6.5): runder Esstisch mit vier Stühlen und rot-weissem Sonnenschirm, Grillecke hinten (L-Theke aus Stein mit Gasgrill, Glut, Deckel, Gasflasche, Kühlbox, Barhocker). **Sonnenliegen:** zwei Liegen mit schräger Rückenlehne und Beistelltisch auf der freien Wiese östlich des Pools (x ~8, knapp 4 m vom Wasser, Füsse zum Pool) und zwei weitere im Norden hinter dem Pool (x -2.9/-1.7, z -25.6, quer, Kopf nach Norden, ~3 m vom Wasser). **Whirlpool** (freistehend, Holzverkleidung, weisser Rand, Wasser, Düsen, Sitzbank, Stufe mit Handtuch) auf einer **Holzterrasse an der Westseite des Hauses** (x -9.6..-6.1, z -12..-8, Oberkante 0.22); dorthin führt ein **Ausgang aus dem Familienzimmer** (Westwand, z -10.4..-9.3, Tür 80° offen). **Aussendusche** an der Nordwand der Garage (x 14.6, Holzrost mit Abfluss, Sichtschutz aus Latten, Brausekopf, Handtuch). **Sichtschutz:** Holzzaun (1.9 m, Bretterfelder zwischen schwarzen Pfosten) an der Westgrenze x -14.6, **Querzäune vor der Hausfront** (West: von der Hausecke zum Westzaun mit Gartentor aus Holz (braun wie der Zaun), Ost: von der Garage zur Hecke; sonst sieht man vom Südwesten/Südosten der Strasse an Haus und Garage vorbei in den Garten) und hohe Hecke (Reihe grosser Büsche, InstancedMesh) an der Nordgrenze z -31 und Ostgrenze x 21.6; die Strassenseite (Süden) bleibt offen, Zaun und Hecke enden am Bürgersteig. **Solarpanels:** je 6 Spalten auf der Südseite (Strassenseite) der Dachflächen von Haus (6 Reihen) und Garage (3 Reihen), InstancedMesh mit Zellenmuster, Montageschienen; Ausrichtung nach Süden weil dort die Sonne steht. **Gewächshaus:** am Gartenweg (15.3 / -13.2, um 63° gedreht), Tür zum Weg hin, kurzer Abzweig vom Weg Garage→Pool, um 34° schräg zum Haus gedreht (Glas, Steinsockel, Tür zum Pool hin), Tische mit Topfpflanzen und Tomaten (InstancedMesh), Kollision als Kreise entlang der Wände, Plattenwege (`stonePath()`: Catmull-Rom-Kurve als ein Band mit hellem Randstein, UV in Weltmetern, Enden unter den Pool-Platten): Garagen-Hintertür → Pool (Ostrand der Platten), davon ein Abzweig zur Gewächshaustür. hinten Terrasse und Pool (8 x 4 m, 1.5 m tief, drei Stufen, Liegen).
- **Treppen übereinander, alle links (Westen)** (Wunsch von Nicolas, 2026-11-05): Beide Treppen liegen bei x -5.6..-4.5 (`SW0`/`SW1`). Kellertreppe genau unter der Treppe ins Obergeschoss, gegenläufig (Einstieg hinten im EG bei z -3.9, unten vorne). Beide aus offenen Trittflächen (Stufe = dünner Quader), damit man darunter Kopffreiheit hat; Geländer beidseitig. Dafür wanderten das Elternbett im OG (jetzt x -3.0) und der Tisch im Keller (jetzt x -2.9..-0.16). Per `?debug` geprüft: hoch ins OG, Keller runter und wieder hoch. **Offen:** Nicolas meldete „fix die Treppe“ ohne Angabe, was genau nicht stimmt (Kollision läuft sauber).
- **Türen zum Öffnen** (Wunsch von Nicolas, 2026-11-05): Haustür, Garagen-Hintertür, Terrassentür (Familienzimmer → Whirlpool) und Saunatür sind Scharnier-Gruppen (`makeDoor()`, `doors`): geschlossen = `closed`-Winkel, offen = `open`, Start geschlossen. Zielen (Fadenkreuz bei gesperrter Maus, sonst Mauszeiger) und nah stehen (2.4 m) zeigt „Rechtsklick: Tür öffnen/schließen“, Rechtsklick schaltet (Linksklick bleibt Maus fangen/freigeben); Garagentore sind jetzt auch Türen (Sektionaltor kippt unter die Decke, Start offen); auf Touch tippt man den Hinweis. Die Kollision (`solids`-Eintrag) folgt dem Blatt. Türblätter haben `userData.merge = false`, sonst würden sie beim Zusammenfassen eingefroren. Die Öffnungen im Inneren (Keller, OG-Flur, Esszimmer usw.) haben noch keine Türblätter.
- **Gartentore** (Ost und West) in den Querzäunen vor der Hausfront sind begehbar (ohne Kollision), Ost zwischen Garage und Hecke (x 19.3..20.5). Vorher war das Westtor eine feste Wand, man kam nicht in den Garten.
- **Sauna** an der Ostseite der Garage (x 18.2..20.9, z -3..-0.5): Holzhaus mit Pultdach (hinten/Norden 0.5 m höher, Seitenwände als Keil aus `ExtrudeGeometry`), Glasfront nach Süden mit Holztür links, Holzterrasse mit zwei Liegen, innen Bank und Ofen. Direktzugang von der Garage: Tür in der Garage-Ostwand (`SAUNA_DOOR` z -1.9..-1.0, öffnet in die Sauna, Regal dort gekürzt). Bäume und Büsche halten Abstand (Büsche an der Garage-Ostwand nur ausserhalb z -3.7..1.4).
- **Leistung** (2026-11-05): Bäume (Stamm, Laubkugeln, Kegel) tragen `userData.merge` und werden mit zusammengefasst (Meshes 531 → 317, Zeichenaufrufe 207 → 134); Schattenkarte nur bei Bedarf neu (`shadowMap.autoUpdate = false`, `needsUpdate` beim Start und wenn sich eine Tür bewegt); Pixel-Ratio höchstens 1.5 (Handy 1.25); Tür-Hinweis fasst das DOM nur bei Änderung an. Messung (`?debug`, `gl.finish()`, Orbit-Ansicht): 3.25 → 0.79 ms pro Bild. Echtes Handy nicht geprüft.
- **Strasse vor dem Haus** (`ROAD`, z 18.8..25.2, 34 m Laufgrenze): Asphalt mit gelber Mittellinie und weissen Randlinien, Bürgersteig mit Randstein auf beiden Seiten (0.12 m, begehbar), Bürgersteig durchgehend, nur an der Einfahrt unterbrochen; der Weg schliesst am Bürgersteig an, vier Strassenlampen (Leuchtkörper nachts hell, keine echten Lichter), Briefkasten am Weg. Gelände dort flach (`FLAT`).
- Gelände: Haus, Einfahrt und Garten flach (`FLAT`), nach aussen sanfte Hügel (`terrain()`); Rasen als Gitter mit Löchern für Haus und Pool. Pflanzen: ~35 Laub-/Nadelbäume mit Mindestabstand (`put()`/`free()`: jede Pflanze belegt einen Kronenkreis, keine Überlappung; Büsche halten Abstand zu Bäumen), Büsche als InstancedMesh, Blumenbeete mit Randsteinen (vor der Veranda, beidseits des Wegs bis zum Bürgersteig, an der linken Hauswand): Blumen in versetzten Reihen mit Stiel und Blatt, Anzahl nach Fläche (InstancedMesh mit Farben). Vorgarten bis zur Strasse ist komplett flach (`FLAT`), sonst steigt der Rasen über Beete und Weg, Hecke an der Einfahrt.
- Bauweise: `box(x0,y0,z0,x1,y1,z1)` in Weltkoordinaten (fest = `solids`), `wall()` zerlegt Wände in senkrechte Streifen an allen Lochkanten (Fenster im EG und OG übereinander), `slab()` mit einem Treppenloch, `windowIn()`. Danach werden alle Quader gleichen Materials zusammengefasst (Mehrfach-Materialien je Seite neu gruppiert): ~600 → ~180 Zeichenaufrufe. Zimmerlampen: 15 Lampenkörper, aber nur 6 echte Punktlichter (nachts, wandern alle 0.5 s zu den nächsten Lampen; feste Anzahl vermeidet Shader-Neuberechnung); tagsüber heller Himmels-Bodenton und leicht leuchtende Decke.
- Laufen in 3D: Quader blockieren seitlich zwischen Fuss+0.45 und Kopf; begehbar ist die höchste Quader-Oberseite bis 0.45 über den Füssen (Treppenstufen 0.19), Decke stoppt den Kopf. Im Pool: langsamer, wenig Schwerkraft, Leertaste/Sprung halten = nach oben schwimmen, unter Wasser blauer Nebel. Gehen 4.6 m/s, rennen 7.5.
- Garagendach ohne Überstand zur Hausseite (ragte sonst ins Obergeschoss). Wasser kaum spiegelnd (Umgebungs-Spiegelung auf 0.25), sonst weisse Blendflecken.
- `?debug` stellt `window.villa` bereit (Spieler, `update`, `setWalk`) zum Testen der Wege; geprüft: Haustür, Treppe hoch, Kellertreppe, Küche→Garage (Auto stoppt), in den Pool, hochschwimmen, über Stufen raus, Hang hinter der Einfahrt.

### Wohnwagen 3D (`sachen/camper/`)

- Eigene Seite (nicht in der Villa-Datei), three.js, Orbit-Ansicht plus Laufmodus wie Villa/Haus (WASD, Maus fangen per Linksklick, Joysticks auf Touch). Einheiten 1 = 1 m, Wohnwagen längs der x-Achse: **hinten = -x** (Klapp-Terrasse), **vorne = +x** (Deichsel, Treppe zum Dach), Seiten ±z. Boden innen y 0.65, Körpergrösse im Laufmodus 1.7 (Tür 1.75 m hoch, sonst käme man nicht rein).
- **Ausklappen** (`applyFold(p)`, p 0..1, Knopf/Schieber/Taste F, 10 s): alles hängt an Zeitfenstern mit `stage(p, a, b)`: Stützen (0–0.12), zwei Zimmer seitlich ausfahren (0.10–0.45, Tiefe `D`, Aussenwand fährt, Boden/Decke/Seitenwände werden mit `scale.z` gestreckt; +z = Schlafzimmer, -z = Wohnzimmer, Möbel erscheinen ab 0.40), Heckklappe als zwei Platten (je 1.75 m, zugeklappt wie ein Z als Tür) fällt zur Terrasse (0.30–0.70) mit Tisch/Stühlen, Geländer, zwei Stufen, Markise mit Lichterkette (0.72–0.90), Dachterrasse mit Holzboden, Geländer und Treppe vorne (0.55–0.90), Mast mit Fahne und Satellitenschüssel (0.86–0.97). Rückwärts läuft es umgekehrt.
- **Kollision** läuft über `solids` mit `on`-Schalter; bewegliche Teile ändern ihre Masse pro Bild (`setS`). Zu: Heckklappe und Zimmeraussenwände sperren, aufgeklappt kommt man hinten über die Stufen rein, in beide Zimmer und über die Treppe aufs Dach. Einklappen ist gesperrt, solange jemand auf Terrasse, im Wagen oder auf dem Dach steht (Hinweis „Erst aussteigen“).
- **Landschaft:** Höhenfeld `terrainH(x, z)` (Mesh 340 m, 220x220, Vertexfarben Wiese/Fels/Schnee). Campingplatz bleibt eben (y = 0, Kiesplatz, Feuerstelle, zwei Zelte). Geschwungene Hauptstrasse im Süden (`roadZ(t)`, `roadY(t) = 0.1 t`, also 10 % Steigung nach Osten, Asphalt-Band mit Mittel- und Randlinien, Schild "CAMPING" und Kieszufahrt zum Platz). Hügel, Berge im Norden und ringsum (Gauss-Gipfel plus Randwall), Wald als InstancedMesh. Laufmodus folgt dem Gelände (`supportAt` startet bei `terrainH`), Hänge über ca. 48° sind gesperrt, LIMIT 150 m. Orbit-Kamera wird über dem Gelände gehalten. Deko: Wimpelkette mit Lichterkette (leuchtet nachts) zwischen zwei Pfosten, Kugelgrill, Kühlbox, Brennholzstapel, Blumenwiese (InstancedMesh), ziehende Wolken. Ausklappteile (Mast, Schüssel, Geländer, Stufen) werden zugeklappt über `visible` ausgeblendet, sonst bleiben flachgedrückte Reste sichtbar.
- Möbel sind bis auf Küchenzeile, Sitzbank, Tisch und Schrank im Hauptraum nicht fest (man läuft durch). Tag/Nacht (Knopf), Feuerstelle mit Flamme und Licht, vier Lampen (Hauptraum, beide Zimmer, Terrasse), Lichterketten leuchten nachts.
- `?debug` stellt `window.camperDebug` bereit (`setP(p)` wendet sofort an, `update`, `player`); damit geprüft: Heckeingang, Dachtreppe, beide Zimmer, zugeklappt von allen Seiten gesperrt, 30 % (Wand der halb ausgefahrenen Zimmer sperrt). Im versteckten Vorschau-Tab läuft `requestAnimationFrame` nicht, deshalb `setP` statt Warten auf die Schleife.
- **Offen:** Möbel in den Zimmern nicht begehbar-solide; kein Zugfahrzeug; Handy (Joysticks, Gelenkwinkel) nicht auf einem echten Gerät geprüft.

## Aktueller Stand – IMMER AKTUELL HALTEN

Nach jeder Aenderung diesen Abschnitt nachziehen (was gemacht wurde, was offen ist).

Stand: 2026-11-05

Eintraege:
- Pruefungsvorbereitung: UI Designen (`pruefung/ui-design/`) fuer den Test in **Modul 322 "Benutzerschnittstellen entwerfen und implementieren"** (Angabe von Nicolas, 2026-11-02). Geruest fertig, als einziges Thema die vier Handlungsziele des Moduls (aus gibb-Kursseite und Schullehrplan GB Chur, offizielle Modulidentifikation auf modulbaukasten.ch noch nicht geprueft). **Pruefungsinhalte fehlen noch** (kommen von Nicolas, dann in `inhalt.js` eintragen).
- Sachen: Wohnwagen 3D (`sachen/camper/`, klappt auf Knopfdruck zur kleinen Villa aus, komplett begehbar, Vorschaubild aus der 3D-Ansicht), Retro Game Hub – Präsentation in zwei Fassungen (`sachen/retro-hub/` = mit Text, `sachen/retro-hub-titel/` = nur Kartentitel; Abschlusspräsentation Scrum-Experiment TBZ, Dateien unverändert aus Nicolas' Downloads `index.html` bzw. `index_final_version.html`, je ca. 1 MB mit eingebetteten Bildern, ohne Vorschaubild), Villa 3D (`sachen/villa/`, amerikanisches Haus mit Keller, Garage, Pool, Hügeln; geprüft Desktop und Wege per `?debug`. Leistung am echten Handy noch nicht geprüft), Haus 3D (`sachen/haus/`, aus Code gebaut, Tag/Nacht, begehbar mit WASD bzw. Joysticks; geprüft Desktop, 375px hoch und 740x360 quer mit Touch-Emulation. Echtes Handy-Vollbild nicht automatisch prüfbar), Superhelden 3D (`sachen/helden/`, eigene PWA, 6 GLB-Modelle von get3dmodels.com plus Iron-Man-Eigenbau; Lizenzen der Modelle teils unklar, siehe Footer der Seite).
- Blockbench: Halloween-Pack, Pack-Viewer, Cowboyhut (mit Nicolas' Skin `blockbench/cowboyhut/skin.png`, auf seinen Wunsch im Repo).

Offen:
- Halloween-Pack und Cowboyhut im Spiel testen (Sitz auf dem Kopf, Warnung zur Pack-Version).
- Pack-Viewer-Karte hat noch kein Vorschaubild.
- Leere Ordner `sachen/ironman/` und `sachen/cowboyhut/` von Hand loeschen (waren beim Verschieben von Windows gesperrt; Git ignoriert sie).
- Portfolio: Laut `C:\Source\portfolio\CLAUDE.md` sollen Texte und `updated` der random-Karte nachgezogen werden, wenn hier Eintraege dazukommen (dort erledigen, nicht hier).
