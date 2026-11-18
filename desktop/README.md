# Batverse Desktop (Electron)

Batverse in einem eigenen Fenster statt im Browser: kein Browser-Menü beim Rechtsklick, keine Browser-Tastenkürzel, Spielstand bleibt erhalten.
Die App lädt die Dateien direkt aus dem Repo (`..`), Änderungen am Spiel sind beim nächsten Start bzw. mit F5 sofort da. three.js kommt aus `node_modules` (läuft offline).

## Einmalig installieren

```powershell
npm --prefix C:\Source\random\desktop install
```

Lädt Electron 33.2.1 (ca. 100 MB) und three.js 0.160.0 aus der npm-Registry nach `desktop/node_modules/` (nicht im Repo).

## Starten

```powershell
npm --prefix C:\Source\random\desktop start
```

Werkstatt direkt: `npm --prefix C:\Source\random\desktop run werkstatt`

## Tasten der App

| Taste | Wirkung |
|---|---|
| F11 | Vollbild an/aus |
| F5 | neu laden |
| F2 | Spiel ↔ Werkstatt |
| F12 | Entwicklerwerkzeuge |

Alle anderen Tasten und der Rechtsklick gehen ans Spiel. Links nach aussen öffnen im normalen Browser.

## Hinweise

- Eigene Herkunft `batverse://app/`: Spielstand, Inventar und Konto sind getrennt von der Browser-Version (beginnen in der App neu).
- Der Service Worker läuft in der App nicht (nicht nötig, die Dateien liegen lokal).
- Später möglich: eine `.exe` zum Doppelklicken mit electron-builder.
