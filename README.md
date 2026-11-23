# random

**Live:** [https://n-brand.github.io/random/](https://n-brand.github.io/random/)

Sammlung zufaelliger kleiner Sachen und Tests: Mini-Tools, Spielereien und Experimente. Die Startseite ist eine installierbare PWA mit einer Uebersicht aller Eintraege.

## Lokal starten

```bash
python -m http.server 8080
```

Dann [http://localhost:8080](http://localhost:8080) oeffnen. Der Service Worker braucht http, `file://` reicht nicht.

## Aufbau

- `index.html` – Startseite mit den Listen `ENTRIES` (Sachen und Tests), `PRUEFUNG` und `BLOCKBENCH`
- `sachen/<name>/` – Sachen und Tests (beide liegen hier; ob ein Eintrag als "Test" erscheint, bestimmt `type` in `ENTRIES`)
- `pruefung/<name>/` – Pruefungsvorbereitungen (`index.html` plus `inhalt.js`)
- `blockbench/<name>/` – Minecraft-Modelle und Resource Packs
- `shared/` – gemeinsame Skripte (z. B. `orbit-pick.js`)
- `sw.js` – Service Worker (offline); `ASSETS` und `CACHE` erzeugt `tools/sw-build.js`
- `tools/` – Hilfsskripte (Node, ohne Abhaengigkeiten)
- `desktop/` – Batverse als Desktop-App (Electron)
- `docs/` – Aenderungsprotokoll, Plaene und Entwuerfe

## Neuer Eintrag

1. Ordner `sachen/<name>/` (bzw. `pruefung/<name>/` oder `blockbench/<name>/`) mit einer `index.html` anlegen.
2. Eintrag in `index.html` ergaenzen: Sachen und Tests in `ENTRIES` (`type: "sache"` oder `"test"`), Pruefungen in `PRUEFUNG`, Modelle in `BLOCKBENCH`.
3. `node tools/sw-build.js` ausfuehren: nimmt die Seite (und das Vorschaubild) in `ASSETS` auf und setzt `CACHE` neu. Zusatzdateien eines Eintrags (z. B. `inhalt.js`) vorher in `ASSETS_EXTRA` in `sw.js` eintragen, grosse Dateien in `LAZY`.

---

Erstellt von [Nicolas Brand](https://n-brand.github.io/portfolio/)
