# Plan: Bankautomat überarbeiten

Wunsch von Nicolas (2026-11-16): "Bankautomat überarbeiten – mach einen Plan und speichere die Bilder".
Vorbild sind vier Bilder aus einem anderen Spiel (Nicolas). Übernommen werden Aufbau und Ablauf, nicht Logos, Namen oder Grafiken.

## Vorbild-Bilder

Ablage in `karten/planung/` (die Bilder kamen im Chat, ich konnte sie nicht selbst als Datei speichern; bitte dort ablegen):

| Datei | Inhalt |
|-------|--------|
| `atm-vorbild-1-abheben.png` | Bildschirm "Betrag zum Abheben wählen": Feinwahl -100 / -10 / -1 / Betrag / +1 / +10 / +100, darunter sechs Schnellbeträge in zwei Spalten (20, 50, 100 / 500, 1 000, 5 000), unten "Abbrechen" (orange) und "Abheben 20 $" (grün). Links und rechts neben dem Bildschirm je vier echte Tasten am Gehäuse |
| `atm-vorbild-2-start.png` | Startbildschirm: "Hallo, (Name) – Was möchtest du tun?", zwei grosse Knöpfe "Einzahlen" und "Abheben" (grün), dazwischen "oder" |
| `atm-vorbild-3-geraet.png` | Das Gerät: freistehende Säule, blauer Rahmen, oben leuchtendes Schild ATM, graues Gehäuse, blauer Bildschirm mit Seitentasten, Kartenschlitz, kleines Tastenfeld, unten eine Klappe |
| `atm-vorbild-4-erfolg.png` | Erfolg: "Erfolgreich! Du hast 1 000 $ eingezahlt", Haken im Kreis, "Zurück zum Menü" (cyan) und "Fertig" (grün). Darunter das Tastenfeld mit Zifferntasten und drei Farbtasten (rot, gelb, grün); die Ansicht ist nah am Gerät |

Allen Bildschirmen gemeinsam ist die Kopfzeile: "ATM", **Einzahl-Limit pro Woche** (z. B. 918 / 10 000, rot wenn voll), **Kontostand** (cyan), **Bargeld** (grün).

## Was sich ändert

1. **Bargeld als Betrag statt Bündel.** Heute ist Bargeld ein Inventar-Gegenstand zu je 10 000 $. Neu wird Bargeld ein Betrag in Dollar (wie der Kontostand), oben rechts neben dem Kontostand angezeigt. Damit lassen sich beliebige Beträge ein- und auszahlen. Die Bündel aus dem Tresor werden beim Aufheben zu Bargeld (je 10 000 $). (Frage 1)
2. **Nahansicht.** Rechtsklick auf den Automaten: die Kamera fährt in 0,4 s vor den Bildschirm (wie Bild 4), die Maus wird frei. Der Bildschirm ist ein HTML-Fenster genau im Bildschirm-Rahmen des Modells; Gehäuse, Seitentasten und Tastenfeld bleiben im Bild sichtbar. Esc oder "Fertig" fährt zurück.
3. **Bildschirme** (eigenes Design im Stil der Vorbilder: blauer Grund, helle Schrift, grosse runde Knöpfe):
   - **Start:** "Hallo, Bruce – Was möchtest du tun?" mit "Einzahlen" und "Abheben".
   - **Betrag:** Titel "Betrag zum Einzahlen/Abheben", Feinwahl -100 … +100 um den gewählten Betrag, sechs Schnellbeträge, "Abbrechen" und "Einzahlen/Abheben X $". Ein Betrag über dem Bargeld, dem Kontostand oder dem Limit ist gesperrt und rot.
   - **Erfolg:** Haken, Text "Du hast X $ eingezahlt/abgehoben", "Zurück zum Menü" und "Fertig".
   - **Kopfzeile** auf allen Seiten: Limit, Kontostand, Bargeld.
4. **Wochenlimit fürs Einzahlen**: 10 000 $ pro Spielwoche (7 Tage zu je 20 min aus dem Tag-Nacht-Zyklus, also 140 min Spielzeit). Abheben ohne Limit. (Frage 2)
5. **Tastatur und Tasten:** Ziffern 0–9 tippen einen Betrag, Rücktaste löscht, Enter bestätigt, Esc geht zurück. Die Seitentasten und Farbtasten am 3D-Gerät sind auch anklickbar (Seitentasten = Knopf daneben, grün = bestätigen, gelb = löschen, rot = abbrechen).
6. **Klänge:** kurzes Piepen bei jedem Tastendruck, Geldzählen beim Auszahlen, Ton beim Erfolg (Web Audio, ohne Dateien wie beim Motorton).
7. **Neues 3D-Gerät** für alle 24 Standorte (gotham-orte.js): freistehende Säule ca. 0,9 x 0,75 x 2,1 m, blauer Rahmen, leuchtendes ATM-Schild oben (nachts hell), Gehäuse grau mit Bildschirm (zeigt den blauen Startbildschirm als Textur), je vier Seitentasten, Kartenschlitz, Tastenfeld mit Farbtasten, Ausgabeschacht, untere Klappe. Kollision wie jetzt.
8. **Bank-App im Handy** (S4) zeigt zusätzlich Bargeld und das Wochenlimit.

## Stand (2026-11-16)

- **Gebaut:** A1 Bargeld als Betrag (Bündel werden beim Öffnen gezählt), A2 Wochenlimit 10 000 $ je 140 min (Wert aus dem Vorbild, Frage 2 bleibt offen), A3 Bildschirme Start, Betrag, Erfolg mit Kopfzeile als HTML-Fenster im Gerätedesign (Nicolas: "genau das Design vergrössert, mit einem HTML-div"), Seitentasten bedienen die Knöpfe daneben. A4 3D-Gerät nur in der Werkstatt (Umbauprojekt), im Spiel noch die alten Säulen.
- **Offen:** A4 im Spiel, A5 Nahansicht (Kamera fährt vor den Bildschirm), A6 Klänge, Tastatur (Ziffern), Handy-Bank mit Bargeld/Limit.

## Umsetzung in Schritten

| Nr | Schritt | Dateien |
|----|---------|---------|
| A1 | Bargeld-Betrag: `KONTO.bar` mit Speicher (gleiche Speicher-Schnittstelle wie der Kontostand, später Supabase), Anzeige oben rechts, Bündel werden beim Aufheben umgerechnet | ui/konto.js, ui/inventar.js, gotham-bunker.js |
| A2 | Wochenlimit (`KONTO.woche`, Zähler je Spielwoche aus `DAY`) | ui/konto.js, kern/tageszeit.js |
| A3 | Bildschirme Start, Betrag, Erfolg mit Kopfzeile, Tastatur | ui/konto.js, index.html, style.css |
| A4 | Neues 3D-Gerät mit Bildschirm-Textur und klickbaren Tasten | gotham/gotham-orte.js |
| A5 | Nahansicht: Kamera fährt vor den Bildschirm, Fenster im Bildschirm-Rahmen | ui/konto.js |
| A6 | Klänge | ui/konto.js |
| A7 | Handy-Bank ergänzen, Prüfen (alle 24 Automaten, Limit, Grenzen), Doku | ui/handy.js, CLAUDE.md |

## Offene Fragen

1. **Bargeld als Betrag** (statt Bündel-Gegenstand im Inventar)? Empfehlung: ja.
2. **Wochenlimit** 10 000 $ pro Spielwoche (140 min Spielzeit) wie im Vorbild, oder höher/kein Limit? Bruce Wayne hat eigentlich genug Geld.
3. **Name auf dem Startbildschirm:** "Bruce" oder dein Name?
