# Batverse Desktop (Electron)

Batverse in einem eigenen Fenster statt im Browser: kein Browser-Menü beim Rechtsklick, keine Browser-Tastenkürzel, Spielstand bleibt erhalten.
Die App lädt die Dateien direkt aus dem Repo (`..`), Änderungen am Spiel sind beim nächsten Start bzw. mit F5 sofort da. three.js kommt aus `node_modules` (läuft offline).

## Einmalig installieren

`npm.cmd` statt `npm`: PowerShell blockiert auf diesem PC das Skript `npm.ps1` (Ausführungsrichtlinie). `npm.cmd` ist dasselbe Programm ohne PowerShell-Skript, die Richtlinie bleibt unverändert.

```powershell
npm.cmd --prefix C:\Source\random\desktop install
```

Lädt Electron 33.2.1 (ca. 100 MB) und three.js 0.160.0 aus der npm-Registry nach `desktop/node_modules/` (nicht im Repo).

## Starten

```powershell
npm.cmd --prefix C:\Source\random\desktop start
```

Werkstatt direkt: `npm.cmd --prefix C:\Source\random\desktop run werkstatt`

## Tasten der App

| Taste | Wirkung |
|---|---|
| F11 | Vollbild an/aus |
| F5 | neu laden |
| F2 | Spiel ↔ Werkstatt |
| F12 | Entwicklerwerkzeuge |

Alle anderen Tasten und der Rechtsklick gehen ans Spiel. Links nach aussen öffnen im normalen Browser.

## Hinweise

- Die Website (Browser, GitHub Pages) bleibt unverändert und funktioniert weiter; die App öffnet nur dieselben Dateien in einem eigenen Fenster.
- Eigene Herkunft `batverse://app/`: Spielstand, Inventar und Konto sind getrennt von der Browser-Version (beginnen in der App neu).
- Der Service Worker läuft in der App nicht (nicht nötig, die Dateien liegen lokal).
- Später möglich: eine `.exe` zum Doppelklicken mit electron-builder.
