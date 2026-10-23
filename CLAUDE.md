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

## Neuen Eintrag hinzufuegen

1. Ordner unter `sachen/` oder `tests/` anlegen, Einstieg ist immer `index.html`.
2. Im Array `ENTRIES` in `index.html` einen Eintrag ergaenzen:

```js
{ type: "test", title: "Titel", desc: "Ein Satz, worum es geht.", href: "tests/name/", date: "2026-10-22", tags: ["css"] }
```

   `type` ist `"sache"` oder `"test"`. Sortiert wird nach `date` (neueste zuerst).
   Optional `img: "sachen/name/vorschau.webp"` fuer ein Vorschaubild auf der Karte (16:10, ca. 960x600, WebP, unter 100 KB).
3. Die Seite des Eintrags in `ASSETS` in `sw.js` aufnehmen und `CACHE` hochzaehlen (`random-v2`, `random-v3`, ...), sonst sehen installierte Clients die Aenderung nicht.

## Konventionen

- Reines HTML/CSS/JS, relative Pfade (Seite laeuft auch unter `https://n-brand.github.io/random/`).
- Jede Unterseite hat einen Link zurueck zur Uebersicht (`../../`) und den Footer-Credit.
- Hell/Dunkel ueber `prefers-color-scheme`, mobil zuerst (ab ca. 360px Breite).
- Texte auf Deutsch.
- Lokal testen: `python -m http.server 8080` im Projektordner (Service Worker braucht http, nicht `file://`).
