# Plan: Laptops (Werkstatt-Umbauprojekt)

Wunsch von Nicolas (2026-11-17, Notizen N5): In der Werkstatt einen Laptop platzieren, ähnlich wie der Bankautomat, aber mit anderem UI und anderen Funktionen. Direkt daneben ein zweiter Laptop mit anderem Hardware-Design. Software ist auf allen gleich, aber nicht jeder PC hat jede App.

## Entscheidungen (von mir gesetzt, Nicolas kann sie ändern)

- Eine Datei `js/ui/laptop.js` (3D-Modelle, Oberfläche, Stile) für Werkstatt und später das Spiel (z. B. Batcomputer-Raum, Wayne Tower, Wohnungen).
- **Laptop A "Wayne Book"**: silbernes Ultrabook, **entsperrt**. Apps: Web, Kontakte, E-Mail, Karten.
- **Laptop B "Nightfall X17"**: schwarzer Gaming-Laptop mit rotem Licht, **mit Passwort** (Hinweis auf dem Sperrbildschirm). Apps: Web, E-Mail, Karten (ohne Kontakte).
- Dritter Zustand **ohne Passwort** (Anmelden per Klick) ist eingebaut, aber an keinem der zwei Werkstatt-Laptops gesetzt.
- Benutzername immer eingetragen: "Bruce Wayne".
- **Web**: Startseite mit angehefteten Seiten wie in GTA V, überall angemeldet: Autohändler (Budget Cars, Prestige Motors, Defense Supply), Waffen (Guns & Ammo, Gotham Arms), Börse (Gotham Stock Exchange), Bank (Gotham City Bank), Immobilien (Gotham Estates: eigene Immobilien mit aktuellem Wert, Angebote).
- **Börse**: Kurse laufen zufällig weiter (alle 4 s, auch die verpasste Zeit beim Öffnen), Depot, Kauf/Verkauf vom Konto.
- **Kontakte**: Polizei, Taxi, Krankenwagen, Feuerwehr; Anruf mit Wählen, Antwort, Auflegen (im Spiel später mit Wirkung, z. B. Taxi kommt).
- **E-Mail**: Posteingang mit festen Mails, Kontobewegungen und Kaufbestätigungen.
- **Karten**: Gotham aus den Kartendaten (Insel, Bezirke, Hauptstrassen, Orte), eigene Immobilien markiert, Suche, Zoomen und Verschieben.

## Schritte

| Nr | Schritt | Stand |
|----|---------|-------|
| L1 | 3D: Tisch mit zwei Laptops (verschiedene Gehäuse), Bildschirm als Textur wie beim Automaten | gebaut |
| L2 | Oberfläche: Sperrbildschirm (entsperrt/ohne/Passwort), Desktop, Taskleiste, App-Fenster | gebaut |
| L3 | Apps Web (mit Seiten), Kontakte, E-Mail, Karten | gebaut |
| L4 | Laptops im Spiel aufstellen (Ort mit Nicolas klären) | offen |
| L5 | Weitere Apps (Ideen sammeln), Wirkung der Anrufe im Spiel | offen |
