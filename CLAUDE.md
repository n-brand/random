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

## Eigene PWAs

Ein Eintrag kann zusaetzlich als eigene App installierbar sein (Beispiel `sachen/helden/`): eigenes `manifest.webmanifest` mit `scope`/`start_url` `./`, eigenes `icon.svg`, und die Seite registriert den gemeinsamen Service Worker `../../sw.js`. Externe Bibliotheken (three.js) sind fest versioniert und stehen in `ASSETS`, damit sie offline verfuegbar sind.

## Konventionen

- Reines HTML/CSS/JS, relative Pfade (Seite laeuft auch unter `https://n-brand.github.io/random/`).
- Jede Unterseite hat einen Link zurueck zur Uebersicht (`../../`) und den Footer-Credit.
- Hell/Dunkel ueber `prefers-color-scheme`, mobil zuerst (ab ca. 360px Breite).
- Texte auf Deutsch.
- Lokal testen: `python -m http.server 8080` im Projektordner (Service Worker braucht http, nicht `file://`), oder Eintrag `random` in `C:\Source\.claude\launch.json` (Port 4180).
- Vorschaubilder (`vorschau.webp`) werden aus der 3D-Ansicht aufgenommen (Canvas als Bild, im Browser zu 960x600 zusammengesetzt).

## Aktueller Stand – IMMER AKTUELL HALTEN

Nach jeder Aenderung diesen Abschnitt nachziehen (was gemacht wurde, was offen ist).

Stand: 2026-11-02

Eintraege:
- Pruefungsvorbereitung: UI Designen (`pruefung/ui-design/`) fuer den Test in **Modul 322 "Benutzerschnittstellen entwerfen und implementieren"** (Angabe von Nicolas, 2026-11-02). Geruest fertig, als einziges Thema die vier Handlungsziele des Moduls (aus gibb-Kursseite und Schullehrplan GB Chur, offizielle Modulidentifikation auf modulbaukasten.ch noch nicht geprueft). **Pruefungsinhalte fehlen noch** (kommen von Nicolas, dann in `inhalt.js` eintragen).
- Sachen: Superhelden 3D (`sachen/helden/`, eigene PWA, 6 GLB-Modelle von get3dmodels.com plus Iron-Man-Eigenbau; Lizenzen der Modelle teils unklar, siehe Footer der Seite).
- Blockbench: Halloween-Pack, Pack-Viewer, Cowboyhut (mit Nicolas' Skin `blockbench/cowboyhut/skin.png`, auf seinen Wunsch im Repo).

Offen:
- Halloween-Pack und Cowboyhut im Spiel testen (Sitz auf dem Kopf, Warnung zur Pack-Version).
- Pack-Viewer-Karte hat noch kein Vorschaubild.
- Leere Ordner `sachen/ironman/` und `sachen/cowboyhut/` von Hand loeschen (waren beim Verschieben von Windows gesperrt; Git ignoriert sie).
- Portfolio: Laut `C:\Source\portfolio\CLAUDE.md` sollen Texte und `updated` der random-Karte nachgezogen werden, wenn hier Eintraege dazukommen (dort erledigen, nicht hier).
