# Wayne Tower (P3a, Teil 1) – Design

Stand 2026-11-14, Brainstorming mit Nicolas. Batverse, `sachen/batverse/`.

## Absicht

Der Wayne Tower ist das Wahrzeichen im Zentrum von Gotham (Karte `daten.js`, Ort `wayne-tower`: Karten-x -2050, z -100, 70 x 70 m,
320 m hoch, im Wayne Circle). Bisher steht dort nichts. Er soll von weitem als Art-Deco-Turm erkennbar sein und von unten bis oben
begehbar werden: Lobby, alle Geschosse, Dach, zwei öffentliche Tiefgaragen und der geheime Wayne-Stock mit eigener Fahrzeugausfahrt.

## Ziele

- **Aussen (Nicolas):** Art-Deco-Stein mit Rücksprüngen bei ca. 120 / 200 / 260 m, darüber eine Krone mit Lichtband und Antenne bis 320 m.
  Graue Steinfassade mit Fensterraster wie im Vorbild `karten/planung/wayne-logo-vorbild.png`. Hoher Sockel mit Eingangsvordach.
- **WAYNE-Schrift** oben am Hauptschaft, direkt unter dem ersten Rücksprung (ca. 120 m). Vorschlag Claude: auf allen vier Seiten.
- **Geschosse:** Erdgeschoss/Lobby 9,4 m, alle anderen 4,7 m (Regel Gotham: mindestens 4,7 m). Das ergibt rund 65 Geschosse.
- **Ansatz A (Nicolas "ja A"):** Von aussen nur die Fassade. Ein Geschoss wird erst gebaut, wenn der Aufzug dort hält, und beim Wegfahren
  wieder entfernt. Es ist zuerst ein Rohbau mit leeren Böden, Stützen, Fenstern und dem Aufzugskern.
- **Wayne-Aufzug** (Nicolas): ein normaler Personenaufzug, nur für Menschen, ohne Auto. Er fährt von ganz unten bis ganz oben und hält
  überall: Tiefgarage 2, geheimer Stock, Tiefgarage 1, Lobby, jedes Geschoss, Dach. Der geheime Stock steht ganz normal in der Halteliste
  (Nicolas: "soll in der Halteliste sein").
- **Zwei Tiefgaragen** (Nicolas): ein öffentliches Parkhaus, nicht geheim, mit Schranken.
  - Laut Seitenansicht liegen sie **neben** dem Turm unter dem Platz: TG 1 mit Boden bei -5,5 m, TG 2 mit Boden bei -11 m,
    jeweils relativ zur Strasse (Welt-y `GOT.STR`).
  - Eine **geschwungene Rampe** für Fahrzeuge verbindet beide Ebenen.
  - Eine **Zufahrtsstrasse** führt von TG 1 zur **unteren Strasse des Wayne Circle**. Beide liegen auf -5,5 m, die Strasse ist also eben.
  - An der Einfahrt steht eine **Schranke**, die sich öffnet, wenn ein Fahrzeug davor steht.
  - Der Wayne-Aufzug hat in beiden Ebenen einen Halt.
- **Geheimer Stock** (Seitenansicht: Boden -8 m, Decke 0 m, direkt unter dem Turm): eine weite, niedrige Halle mit runden Pfeilern,
  runden Deckenleuchten, grauen Wänden und glänzendem Boden (Vorbild `wayne-geheimstock-vorbild.png`).
  - Zuerst baue ich nur die Halle, die Einrichtung kommt am Schluss.
  - Von der Halle führt ein **geheimer Fahrzeuggang** zur unteren Strasse des Wayne Circle. Er steigt 2,5 m, von -8 auf -5,5 m, auf
    ungefähr 200 m Länge. Er endet in einer **getarnten Wandplatte** in der Seitenwand der unteren Strasse (passt zu PLAN-GOTHAM
    Entscheid 9: Zugänge über Tore in den Wänden der unteren Strasse).
  - Vorschlag Claude: Die Platte öffnet sich im Fahrzeug mit L wie das Einfahrtstor der Manor, und zwar in beide Richtungen.
- **Gebäude-IDs:** `GO-WAYNE-TOWER`, `GO-WAYNE-TG1`, `GO-WAYNE-TG2`, `GO-WAYNE-GEHEIM` und `GO-WAYNE-GANG` im Register (`bautAdd`).
- **Reihenfolge (Nicolas):** **Inneneinrichtung erst ganz am Schluss**, **Spezialsachen erst ganz am Schluss**. Spezialsachen sind
  Tumbler, Prototypen, Gadgets und die Effekte des geheimen Stocks. Vorher entstehen Rohbau, Wege, Aufzug und Kollision.

## Nicht-Ziele

- Polizeipräsidium und Hafen: Sie gehören zu P3a, bekommen aber je ein eigenes Design.
- Kanal-Hub und Schurkenbasis darunter (U3).
- U-Bahn-Anschluss, auch wenn TG 2 auf Bahnsteighöhe liegt (V1).
- Parkende oder fahrende Autos und Verkehr (V3/V4).
- Alle 65 Geschosse dauerhaft in der Szene (dagegen spricht Ansatz A).
- Möbel, Büros, Empfangstheke, Tumbler und Gadgets **vor** den letzten Schritten.

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es läuft)

- Ladezeit oder Bildzeit werden spürbar schlechter. Gemessen wird vorher und nachher; danach kommt eine Leistungsprüfung.
- Der Turm ändert das bestehende Gelände oder die Strassen und Rampen des Wayne Circle, ohne dass Nicolas gefragt wurde.
- Kollision nur bis zur sichtbaren Fläche: Barrieren gehören weiter nach innen (Regel Nicolas).
- Neue Welt-Dateien landen im Offline-Cache (ASSETS). Sie gehören in FILES (index.html).

## Ansätze

- **A, gewählt:** Die Hülle (Fassade, Sockel, Krone, Schrift) wird beim Laden gebaut und zusammengefasst. Geschosse im Turm entstehen
  erst beim Halt des Aufzugs, eines nach dem anderen. Tiefgaragen, geheimer Stock und Gänge sind fest, aber klein.
  Ladezeit und Bildzeit bleiben fast gleich.
- **B, verworfen:** Alle rund 65 Geschosse stehen fest in der Szene und sind von aussen durch die Fenster zu sehen. Das kostet dauerhaft
  Dreiecke, Draw-Calls und Kollision, auch weit weg vom Turm.
- **Tiefgarage später:** Sie war zuerst aus dem Umfang genommen. Nicolas hat sie zurückgeholt, als öffentliches Parkhaus mit Aufzug.

## Was Nicolas entschieden hat

- Umfang "alles auf einmal", aber Inneneinrichtung und Spezialsachen als letzte Schritte.
- Stil Art-Deco-Stein, WAYNE-Schrift unter dem ersten Rücksprung.
- Ein Personenaufzug mit allen Halten, der geheime Stock gehört dazu.
- Zwei öffentliche Tiefgaragen mit Schranke, Wendelrampe und Zufahrt zur unteren Strasse.
- Ein geheimer Fahrzeuggang vom geheimen Stock zur unteren Strasse.
- Geschosse nach Ansatz A.

## Dem Bauer überlassen (mit Vorschlag)

- **Lage der Tiefgaragen und Gänge:** Die Tiefgaragen liegen an einer Seite neben dem Turm, die Zufahrt und der geheime Gang je zur
  nächstgelegenen Stelle der unteren Ringstrasse, die nicht auf einer Rampe liegt. Zufahrt und geheimer Gang münden an verschiedenen
  Stellen. Vorschlag: die Tiefgaragen ca. 70 x 60 m, direkt an der Turmseite, an der der Aufzugskern liegt.
- Geometrie der Fassade (Fensterraster als Textur auf grossen Flächen, Art-Deco-Lisenen als wenige Kästen), Form der Krone.
- Wie die Geschosswahl im Aufzug bei rund 70 Halten aussieht, zum Beispiel unten benannte Halte und darüber eine Nummer.
  Vorbild ist der bestehende Personenaufzug `js/aufzuege/personenaufzug.js`.
- Kollision und Boden der unterirdischen Räume. Vorbild ist die untere Strasse (`gothamDeckAt`, `GDECK`) oder die Tiefgarage der Manor.
- Sichtbarkeit unter der Erde: Das Gelände bleibt zu, die Räume liegen darunter. Die Zufahrt läuft über die untere Strasse.
- Neue Dateien unter `js/gotham/`, je eine klare Aufgabe (Hülle, Untergrund, Aufzug/Geschoss).

## Entscheide nach der Prüfung (Claude, korrigierbar)

- **Kanal-Hub:** Wie in der Seitenansicht liegt der Hub (-17..-8) nur unter dem Turm, die Tiefgaragen liegen daneben. `kanal.hub.r` 170 m
  ist der Knoten des Kanalnetzes, nicht der Raum. Der Aufzugsschacht reicht bis -11 (TG 2). Er steht deshalb am Turmrand zur Tiefgaragen-Seite.
  U3 spart diese Ecke aus.
- **Vorplatz (Nicolas "Ja, Vorplatz"):**
  - Die Bauplätze direkt am Turm (FB-0425, FB-0546, FB-0547) fallen weg.
  - Dafür kommt ein Vorplatz mit Eingang und Vordach. Er liegt auf der Seite, wo der meiste Platz bis zur nächsten Strasse ist.
  - Die Änderung kommt in die Karte (`daten.js`, Aussparung um den Turm). Danach wird `stadt.js` neu exportiert, die übrigen FB-IDs
    bleiben gleich.
  - Die Nebenstrassen bleiben unverändert.
- **Tiefgaragen unter Strassen und Bauplätzen** sind erlaubt, die Seitenansicht zeigt sie unter der Fahrbahnplatte. Die Oberfläche
  bleibt dabei unverändert.
- **Leistung**, gemessen wie bei den Baustellen am Desktop:
  - Die Ladezeit bleibt bei etwa 2,0 s, höchstens +0,1 s.
  - Die Bildzeit steigt am Turm höchstens um 0,3 ms und weit weg um nichts.
  - Der Turm ist von weitem sichtbar: Eine einfache Fernform ohne Schrift und Details wird nicht mit den Gotham-Netzen ausgeblendet.

## Reihenfolge der Umsetzung

1. Hülle aussen: Sockel, Schaft, Rücksprünge, Krone, Antenne, Fensterraster, WAYNE-Schrift, Lichtband, Register-ID, Kollision der Aussenwände.
2. Lobby als begehbares Erdgeschoss (Rohbau) mit Eingang und Aufzugskern.
3. Tiefgaragen 1 und 2, Wendelrampe, Zufahrt zur unteren Strasse, Schranke.
4. Geheimer Stock als leere Halle mit Pfeilern und Leuchten, geheimer Gang, getarnte Wandplatte.
5. Wayne-Aufzug mit allen Halten. Die Geschosse entstehen bei Bedarf (Ansatz A).
6. **Inneneinrichtung:** Lobby, Büros und Chefetage.
7. **Spezialsachen:** Tumbler, Prototypen und Gadgets im geheimen Stock.
