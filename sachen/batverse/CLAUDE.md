# Batverse – Regeln und wichtige Infos

Eigene Datei für das Batverse (Nicolas 2026-11-18: "eine eigene md für das Batverse, da das Projekt relativ gross wird").
Gilt zusätzlich zu `C:\Source\CLAUDE.md` und `C:\Source\random\CLAUDE.md`.

## Arbeitsregeln (Nicolas 2026-11-18)

- **Immer den Stand sagen**, wenn ein Auftrag erledigt ist oder sich etwas ändert.
- **Rückfragen nicht stellen, sondern aufschreiben**: in `OFFENE-FRAGEN.md`, jeweils mit "Bis dahin: …" (was gilt, bis Nicolas antwortet). Nicolas schaut sie später an.
- **Wichtige Infos aufschreiben**, die Nicolas später noch wissen muss (z. B. mit welcher Taste man driftet): im Abschnitt "Tasten und Bedienung" unten. Nicolas überfliegt die Stand-Antworten oft nur.
- **Fragt Nicolas "was ist offen?"** oder nach Infos aus einer md: bei Rückfragen höchstens die **ersten 10** nennen und sagen, **wie viele es insgesamt** sind.
- **Ideen** dürfen alle auf einmal genannt werden.
- Neue Notizlisten von Nicolas kommen als eigene Phase in `PLAN-GOTHAM.md` (Nummern N…), mit Stand je Punkt.
- Vor jeder Umsetzung prüfen, ob sie nur fürs Spiel gilt oder auch für die Werkstatt (siehe "Regeln aus dem Verlauf" unten).
- Neue Einträge zum Stand (was gebaut wurde) kommen oben in **`docs/AENDERUNGEN-BATVERSE.md`** (Repo-Ordner `docs/`, Abschnitt "Ab 2026-11-17"). Diese CLAUDE.md bleibt klein (nur Regeln, Tasten, Grundlagen, Verweise); das Protokoll wächst nicht mehr hier.

- **Offline-Cache** (seit 2026-11-23): nach Änderungen `node tools/sw-build.js` im Projektordner ausführen (erzeugt `ASSETS` und `CACHE` in `sw.js`); neue Werkstatt-/Planungsdateien für offline in `BV_KEEP` eintragen. Kein `CACHE`-Hochzählen von Hand mehr.

## Wichtige Dateien

| Datei | Inhalt |
|-------|--------|
| `PLAN-GOTHAM.md` | Gesamtplan mit Phasen, Notizen 17.11. (Phase 10) und 18.11. (Phase 11) |
| `OFFENE-FRAGEN.md` | Rückfragen an Nicolas mit "Bis dahin" |
| `IDEEN-CASINO.md` | Ideen für Casino-Spiele |
| `IDEEN-AKTE.md` | Ideen für die Personalakte (Lizenzen, Strafregister, Fahrausweis) |
| `PLAN-BANKAUTOMAT.md`, `PLAN-LAPTOP.md`, `PLAN-SPIELAUTOMAT.md` | Pläne einzelner Bauschritte |
| `PLAN.md` | ursprünglicher Bauplan Wayne Manor |

## Tasten und Bedienung (Stand 2026-11-18)

| Was | Taste |
|-----|-------|
| Inventar | E oder I (zu Fuss) |
| Meine Akte | **J** (überall beim Begehen, im Fahrzeug, in der Werkstatt), J oder Esc schliesst |
| Hotbar wählen | 1–9, Mausrad (auch Bargeld und Karte rechts daneben) |
| Zielen / benutzen | rechte Maus halten / linke Maus |
| Nachladen | R |
| Greifhaken | rechte Maus halten = Zielhilfe (Punkte zum Ziel, gelber Ring = Halt in Reichweite, rot = nichts bis 70 m); Linksklick = Haken schiessen, er zieht dich hin, danach wird das Seil eingezogen |
| Scharfschützengewehr-Zoom | beim Zielen (rechte Maus) Mausrad: 6× bis 24×, bleibt bis zum Waffenwechsel |
| Handy | P oder Handy in der Hand + Rechtsklick (braucht ein Handy im Inventar); Pfeiltasten + Enter wählen Apps, Rücktaste zurück, Esc/P weglegen; im Hochformat weiter laufen (WASD, Shift, Leertaste) und Klick ins Bild = umschauen, Querformat (Browser) hält das Spiel an |
| Karte gross | K oder M; Minikarte an/aus: Umschalt+K |
| Geist (fliegen) | G (Spiel und Werkstatt), in der Werkstatt auch 5 |
| Tore, Türen, Automaten, Tische | Rechtsklick (zu Fuss), im Fahrzeug auch E |
| Ton an/aus im Fahrzeug | N |
| Container-Aufzug im Auto | L |
| Seilwinde (Cougar) | im Flug **H** = Haken ablassen; über ein Fahrzeug fliegen, es wird eingehängt und mitgenommen; **H** nochmals = absetzen |
| Kampfhubschrauber | fliegt wie The Bat; im Flug **Linksklick oder Q** = Kanone (halten), **Rechtsklick oder X** = Rakete (alle 0,6 s), **Mausrad** = Zoom 1× bis 6×; Kanone zielt auf die Bildmitte (Kreis), Raketen auf die rote Raute (Kurs des Hubschraubers, Höhe mit der Maus hoch/runter) |
| Polizei-Helikopter | wie The Bat: Rechtsklick einsteigen, W/S vor/zurück, A/D drehen, Leertaste steigen, C sinken, V Kamera/Cockpit, Shift aussteigen (gelandet); im Flug **Linksklick** = Suchscheinwerfer an/aus, er schwenkt auf die Bildmitte |
| Keilsperre (Präsidium) | **Rechtsklick** auf die Steuersäule neben der Zufahrt = hochfahren / einfahren (rot = oben, grün = unten) |
| Gleitumhang | zu Fuss im Fall (mehr als 3 m über dem Boden) **Leertaste** = Umhang auf, Maus lenkt, nach unten schauen = Sturzflug; Leertaste nochmal oder Landen = zu |
| Drift | im Auto **Q** halten und lenken (ab ca. 25 km/h): Heck bricht aus, Reifenspuren und Qualm; nicht bei Motorrädern und Panzern |
| Panzer schiessen | **Linksklick** (bei gefangener Maus) oder Leertaste; Mausrad Zoom; Maus frei mit Esc |
| Tumbler-Sprung | im Tumbler, 10 s Abklingzeit |
| Behälter (Waffenwand, später Tresore, Koffer, Mülleimer) | Rechtsklick davor (nur von vorne, aus der Nähe); im Fenster ziehen, Shift+Klick = Behälter ↔ Inventar |
| Tresor | Rechtsklick davor: zu = Tastenfeld (Ziffern, Enter, Rücktaste; Standard-Code **0000**, 3 x falsch = 10 s gesperrt), offen = Inhalt mit "Schliessen und verriegeln" und "Code ändern" |
| Tresor aufbrechen / sprengen | Brechstange in der Hand + Rechtsklick, stehen bleiben bis der Kreis voll ist (Stufe 1–2); Sprenggas in der Hand + Rechtsklick bringt Ladung an, Feuerzeug + Rechtsklick zündet (4 s, Stufe 3–4) |
| Koffer | Rechtsklick davor oder in der Hand: öffnen (Inhalt + Bargeld nehmen/hineinlegen); linke Maus auf dem Koffer halten (0,8 s, Kreis): aufnehmen |
| Mülleimer | Rechtsklick: Fenster, hineinlegen und bis zur Leerung wieder herausnehmen (keine eigene Taste zum Leeren: Knopf "Jetzt leeren" im Fenster mit Rückfrage, oder Neuladen) |
| Nachtsichtbrille | aufsetzen: im Inventar auf den Platz "Kopf" ziehen oder Shift+Klick, oder in der Hand Linksklick; **B** = an/aus |
| Casino-Spiele (Crash, Mines, Glücksrad) | Rechtsklick auf Automat bzw. Rad; Einsatz mit den Jeton-Knöpfen, Leertaste = Starten/Auszahlen, Esc schliesst (nicht während einer Runde) |
| Skateboard | in der Hand linke Maus halten (0,6 s, Kreis) = aufsteigen; W anschieben (Shift schneller), S bremsen, A/D und Maus lenken, Leertaste Ollie, Linksklick absteigen |
| Bat-Knopf | in der Hand Linksklick = Batsignal an/aus (rote LED am Gerät leuchtet, solange es an ist) |
| Eigenes Hintergrundbild | Handy: App Einstellungen > Eigenes Bild hochladen; Laptop: Einstellungen > Personalisierung > Eigenes Bild hochladen |
| Bankautomat aufbrechen | Brechstange in der Hand + Rechtsklick, stehen bleiben bis der Kreis voll ist (8 s); oder Sprenggas in der Hand + Rechtsklick (Zündung nach 3 s, Abstand halten); oder mit einer Schusswaffe darauf schiessen (ca. 15 Pistolentreffer); danach fliegen 20 s Geldscheine heraus, darüberlaufen sammelt sie (je 50 $ Bargeld); nach 3 min wieder heil |
| Crash | zwei Einsätze (je "dabei", − / + Betrag), STARTEN zahlt beide; jeder hat seinen eigenen AUSZAHLEN-Knopf, Leertaste = starten bzw. nächsten Einsatz auszahlen; nach dem letzten Auszahlen fliegt das Flugzeug bis zum Absturzpunkt weiter |
| Handgranate | in der Hand: rechte Maus = Wurfbahn, Linksklick = werfen; explodiert nach 2,5 s |
| Zigaretten | in der Hand Linksklick = anzünden (braucht ein Feuerzeug im Inventar), brennt ca. 40 s; nochmal Linksklick = ausdrücken; jede angezündete ist verbraucht |
| USB-Stick | im Laptop: Taskleiste USB-Symbol > einstecken/auswerfen, App "USB-Laufwerk" zeigt die Dateien; Sperrbildschirm: "USB-Stick einstecken" (schwarzer Stick) umgeht das Passwort |
| Fidget Spinner | in der Hand linke Maus halten = beschleunigen (bis ca. 6 U/s), loslassen = läuft ca. 20 s aus, kurzer Linksklick = stoppt |
| Sporttasche | auf dem Werkstatt-Tisch: linke Maus halten (0,8 s) = aufnehmen, Rechtsklick = öffnen; in der Hand: Rechtsklick öffnen, Linksklick umhängen; im Inventar Platz "Rücken" (hinziehen oder Shift+Klick): "wechseln" = Schulter / Rücken, "öffnen" = Inhalt |
| Batsuit anziehen | im Inventar auf den Platz "Körper" ziehen oder Shift+Klick; in der dritten Person (V) ist man dann Batman mit Umhang |
| Dritte Person zu Fuss | **V** (Spiel und Werkstatt-Person): Kamera hinter der Figur über die rechte Schulter, nochmal V = Ich-Sicht; bleibt gespeichert |
| U-Bahn | zu Fuss die Treppe neben dem U-Schild hinunter; auf dem Bahnsteig an eine offene Tür gehen = einsteigen; im Zug WASD gehen, Maus schauen; an einer offenen Tür zum Bahnsteig hinausgehen = aussteigen; wer beim Schliessen in der Tür steht, hält sie auf (Verspätung) |
| Werkstatt-Modi | 1 Ansehen, 2 Fahren, 3 Drehteller, 4 Person, 5 Geist, Z Zeichnen |
| Werkstatt-Teleport und Einsteigen | **T** = Teleport-Menü (Orte und Fahrzeuge, immer als Person); vor dem Fahrzeug **Rechtsklick oder F** = einsteigen, im Fahrzeug **F oder E** (Fluggeräte Shift) = aussteigen, du stehst wieder als Person daneben |

Neue Tasten (z. B. Drift) hier eintragen, sobald sie gebaut sind.


## Grundlagen

### Batverse (`sachen/batverse/`, frueher "Wayne Manor 3D" in `sachen/wayne-manor/`, in Arbeit, schrittweise)
- **Umbenannt** (Nicolas 2026-11-12: das Projekt ist mehr als die Manor): Ordner `sachen/batverse/`, Titel "Batverse" (Startseite, Seitentitel, Ladebildschirm, Links der Planungsseiten und der Werkstatt). Die Villa im Spiel heisst weiter Wayne Manor, interne Namen (`manorDebug`, localStorage `wm-...`) bleiben. **Offline:** die 3D-Welt ist absichtlich nicht im Offline-Speicher (zu gross): nicht in `ASSETS`, und `isWorld()` in sw.js laesst ihre Abrufe am Cache vorbei; die Startseiten-Karte hat `onlineOnly` und ist offline ausgeblendet. Werkstatt (mit ihren Skripten basis.js, modelle.js, motorton.js, the-bat.js, jet.js, fuellbau.js), Planungsseiten (gotham/) und das Vorschaubild bleiben offline (`BV_KEEP`). Neue Welt-Dateien also NICHT in ASSETS eintragen; neue Werkstatt-Abhaengigkeiten in ASSETS und `BV_KEEP`.
- Neues Projekt nach den Karten in `karten/` (Exterior Grounds, Auxiliary Floors, Upper/Lower Level der Höhle, Fassadenfoto). Bauplan mit neun Schritten in `PLAN.md`; **jeder Schritt wird einzeln gebaut, getestet, committet und auf localhost angesehen** (Wunsch von Nicolas, wegen Tokens).
- Orientierung nach dem Kompass der Karten: Norden = -z, Osten = +x (Hausfront und Hauptzufahrt zeigen nach Osten); Karte oben = Westen, rechts = Norden. Massstab **1 Kartenpixel = 0,2 m** (Nicolas, 2026-11-05: 0,4 war doppelt zu gross, Rampe wäre 14 m breit gewesen), Nullpunkt = Karte 500/995, `mp(px, py) -> [x, z]` im Code. Haus ca. x -61..6, z -29..61 (65 x 90 m). Alles Kartenbezogene wird über `mp()` gerechnet; feste Masse (Türen, Treppe, Aufzug, Strassenbreiten) bleiben in Metern.
- **Aufbau (seit 2026-11-08, Nicolas: „aufteilen, auch in Ordner“):** `index.html` enthält nur noch HTML; CSS in `style.css`; der Code liegt in 30 klassischen Skripten unter `js/` in Ordnern (`kern/`, `gelaende/`, `strassen/`, `haus/`, `aussen/`, `aufzuege/`, `hoehle/`, `spieler/`, `ui/`, `fahrzeuge/`). Das Modul in `index.html` importiert three.js (importmap), legt `THREE`, `OrbitControls`, `installOrbitPick`, `mergeGeometries`, `mergeVertices` auf `window` und hängt die Skripte in der Liste `FILES` mit `async = false` an (Reihenfolge = Ausführungsreihenfolge). Alle obersten `const`/`let`/`function` teilen sich den globalen Bereich (wie vorher im einen Modul), jede Datei beginnt mit `"use strict"`. **Reihenfolge beachten:** Eine Datei darf beim Laden nur Namen aus früheren Dateien benutzen (Funktionen aus späteren Dateien nur zur Laufzeit, z. B. in Ereignissen/Bildschleife). Neue Datei = in `FILES` (index.html) eintragen (seit der Umbenennung in Batverse nicht mehr in `ASSETS`, ausser die Werkstatt braucht sie). Aufgeteilt wurde rein mechanisch an den Abschnittsüberschriften (ohne Codeänderung); geprüft: lädt ohne Fehler, alle 39 Teleport-Ziele, Garage → Autoaufzug → Batcave, Röhre → Sprung, Boot, Bild unverändert.

## Regeln aus dem Verlauf (wörtlich aus dem Protokoll hierher verschoben)

- **Regel (Nicolas 2026-11-16): vor jeder Umsetzung überlegen, ob sie nur fürs Spiel (Gotham/Manor) gilt oder auch für die Werkstatt** (`werkstatt/`: Person-Modus mit Konto, Inventar, Gegenständen; Umbauprojekt; Gotham-Gebäude aus den Spieldateien). Gilt sie auch dort, gleich mitbauen und in der Werkstatt prüfen (Ersatzschichten `werkstatt/flug-shim.js`, `gotham-shim.js`, `person.js`; kopierte Stile in `person.css` nachziehen; neue Werkstatt-Abhängigkeiten in ASSETS und BV_KEEP).
- **Regel (Nicolas, 2026-11-08):** Barrieren, unsichtbare Wände, Kollision und Kameragrenzen bei unregelmässigem Gelände/Fels immer **deutlich weiter innen** als die sichtbare Fläche ansetzen (vom tiefsten/innersten Punkt plus Abstand, nicht vom Nennwert).
- **Regel: Reifen immer rund** (Nicolas, 2026-11-08: "von vorne runder, auch fuer kuenftige direkt so"): `addWheel` baut den Reifen mit `roundTireGeo(r, w, seg)` (Drehprofil: Flanke ab 0,6 r, Viertelkreis-Schultern mit Radius min(0,3 w, 0,3 r), flache Laufflaeche) statt als Zylinder; Stollen sitzen nur auf der Laufflaeche (0,82 w). Gilt automatisch fuer alle Fahrzeuge (Tumbler, Rolls-Royce, Motorrad, Batpod) und jedes neue, das `addWheel` nutzt. Neue Fahrzeuge immer ueber `addWheel` bauen, keine eigenen Zylinder-Reifen.
- **Regel: Radhaus geschlossen** (Nicolas, 2026-11-10, Foto eines Autos ohne Rad): Hinter jedem Rad liegt das **Radhaus** (innen mit der Radhausschale/Radkastenverkleidung ausgekleidet) als geschlossene dunkle Wand. Sie fuellt den ganzen Radlauf aus und reicht unten bis zur Unterkante der Karosserie (Wagenboden), nicht bis zum Boden. Durch den Radlauf darf man weder unter das Auto noch auf die andere Seite sehen. Vorbild: Spectre (dunkler Quader je Achse von Radinnenseite zu Radinnenseite, ab Wagenboden bis knapp ueber das Rad, so lang wie der Radlauf). Gilt fuer alle neuen Fahrzeuge; bestehende bei Gelegenheit nachruesten.
- **Regel: Tore anzielen** (Nicolas 2026-11-10, gilt fuer alle kuenftigen Tueren, Tore, Rampen, Klappen): angezielt ist ein Tor, wenn man auf das Tor selbst ODER auf seine Flaeche im geschlossenen Zustand schaut (Box `gateBox` beim ersten Aufruf, alle Tore starten zu), offen also auch auf die Oeffnung. Hinweis und Funktion (Rechtsklick/E) erst in der Naehe: Abstand des Spielers zur Box hoechstens `t.near` (Vorgabe 8 m, `gateNear` in kern/tore.js; Felstore ueber Wasser 30 m). Neue Tore einfach mit `gates.push` und bei Bedarf `near` eintragen.
- **Regel Geschosshoehe Gotham** (Nicolas 2026-11-11, Bild vom Manor-Erdgeschoss): jedes Geschoss neuer Gebaeude in Gotham mindestens 4,7 m (wie das EG von Wayne Manor, Boden 0,6 -> 5,3), hoeher nur fuer Hallen wie Empfang/Lobby (`eg` im Schnitt).

## Weitere Dateien

- Änderungsprotokoll (alles, was gebaut wurde, mit Prüfungen): `C:\Source\random\docs\AENDERUNGEN-BATVERSE.md` (ab 2026-11-17 neueste zuerst; 2026-11-08 bis 11-16 älteste zuerst). Ältere Einträge vor dem Batverse: `C:\Source\random\docs\AENDERUNGEN.md`.
- Offene Fragen: `OFFENE-FRAGEN.md`. Pläne: `PLAN.md`, `PLAN-GOTHAM.md` und die übrigen `PLAN-*.md`. Ideen: `IDEEN-*.md`.
