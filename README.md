# random

**Live:** [https://n-brand.github.io/random/](https://n-brand.github.io/random/)

Sammlung zufaelliger kleiner Sachen und Tests: Mini-Tools, Spielereien und Experimente. Die Startseite ist eine installierbare PWA mit einer Uebersicht aller Eintraege.

## Lokal starten

```bash
python -m http.server 8080
```

Dann [http://localhost:8080](http://localhost:8080) oeffnen. Der Service Worker braucht http, `file://` reicht nicht.

## Neuer Eintrag

1. Ordner `sachen/<name>/` oder `tests/<name>/` mit einer `index.html` anlegen.
2. Eintrag im Array `ENTRIES` in `index.html` ergaenzen.
3. In `sw.js` die Seite in `ASSETS` aufnehmen und `CACHE` hochzaehlen.

---

Erstellt von [Nicolas Brand](https://n-brand.github.io/portfolio/)
