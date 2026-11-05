# Wayne Manor 3D - Bauplan (nach den Karten in `karten/`)

Neues Projekt `sachen/wayne-manor/` (der Wayne-Berg bleibt als eigene Seite). Alles wird nach dem Kompass der Karten gebaut:
Karte oben = Westen (-x), rechts = Norden (-z), unten = Osten (+x), links = Sueden (+z). Hausfront und Hauptzufahrt zeigen nach Osten.

## Massstab und Koordinaten
- 1 Kartenpixel (Exterior Grounds, 861 x 1202) = 0,4 m. Nullpunkt = Mitte des Rondells (Karte 500 / 995).
- Welt-x = (py - 995) * 0,4, Welt-z = -(px - 500) * 0,4. Haus damit ca. x -119..12, z -56..122 (etwa 130 x 180 m).
- Umrisse (Haus, Wege, Gaerten, Pool, Plaetze) werden als Pixel-Polygone aus den Karten abgelesen und in einer Datenliste im Code gehalten.

## Schritte (nach jedem Schritt Test und Commit)
1. **Grundgeruest**: Seite, Kamera, Licht, Tag/Nacht, Laufmodus, Leistung (Zusammenfassen, Lichtpool) aus dem Wayne-Berg uebernehmen; Karten-Umrechnung, Debug-Hook.
2. **Gelaende**: flaches Gelaende um das Anwesen, Huegel und Horizont, Seen (Northwest Lake, Midwest Lake), Wald (West/North Forest), West Lawn, South Lawn.
3. **Haus-Huelle**: Grundriss als Polygon (Nord-, West-, Ost-, Suedfluegel), Fassade mit Fenstern und Nacht-Leuchten, Tuerme, Daecher, Haupteingang zum Rondell. Innen leer, nur Aufzug und Treppen.
4. **Aussenanlage**: Rondell mit Brunnen, Main Driveway (zwei Straeusse nach Osten), Garagen-Einfahrt (Bogen im Westen) und Garagen-Ausfahrt (Sueden), Veranda, Wayne Gardens mit Heckenlabyrinth, Pool und Poolhaus, Basketball-/Tennisplatz.
5. **Obergeschosse** (Auxiliary Floors): Third Floor (Theatre, Storage, Parlor II, Martha's Garden), Fourth Floor (Observatory, Hubschrauberlandeplatz H), Garage-Carpark mit 9 nummerierten Plaetzen, Werkstatt, Gym, SW Entrance/Exit.
6. **Hoehle unten** (Lower Level): Tunnel Nord-Sued (Gotham Exit Sueden, Waterfall Exit Norden), Drehende Tiefgarage (Kreis mit 6 Plaetzen), Medical Bay, Auto Repair, Treppe/Aufzug, Southeast/Northeast Bay als Wasserlaeufe mit SE/NE Gate, Lake Exit, Checkpoint I.
7. **Hoehle oben** (Upper Level): Forschung und Waffenkammer (Rundbau), zwei Flugzeug-Hangars, Training Area, Aircraft Exit, Lage nach dem Overlay unter dem Hausumriss.
8. **Verbindungen**: Aufzug und Treppe Haus <-> Hoehle, Garagen-Rampen in den Tunnel, Wasserfall-Ausgang im Norden mit Teich; `groundAt` fuer die Ebenen.
9. **Abgleich**: Draufsichten der Seite neben die Karten legen und Masse nachziehen; alle Wege ablaufen; README, `CLAUDE.md`, Startseite und `sw.js` nachtragen.
