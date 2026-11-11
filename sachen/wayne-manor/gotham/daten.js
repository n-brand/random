// Gotham City - Planungsdaten fuer die 2D-Karte (gotham/index.html), die Seitenansicht (gotham/schnitt.html) und spaeter den 3D-Aufbau.
// NUR DATEN. Zum Anpassen Zahlen aendern oder Eintraege kopieren, Seite neu laden. Die Karte prueft selbst und zeigt Konflikte
// (Ort auf einer Hauptstrasse, ausserhalb der Insel, Orte uebereinander) rot an und listet sie rechts.
//
// Koordinaten wie im Spiel: Welt-Meter, Rondell von Wayne Manor = 0 / 0, Osten = +x, NORDEN = -z (auf der Karte oben).
// Klick auf die Karte zeigt die Koordinate des Punkts und kopiert sie (zum Abschreiben in diese Datei).
//
// Formate:
//   Linie        [[x, z], ...]  wird als weiche Kurve gezeichnet (Catmull-Rom durch die Punkte)
//   Fluss        punkte [[z, x, breite], ...]  (Nord-Sued-Fluss: Mitte x und Breite je z), Kanal Nord: [[x, z, breite], ...]
//   ort          { id, typ, name, x, z, w, d, h?, ebene?, notiz?, status?, form?, aussen?, ufer? }
//                typ = Schluessel aus TYPEN, w/d = Groesse Ost-West/Nord-Sued in m, h = Hoehe in m, ebene: 0 Strasse, negativ = unter der
//                Strassenebene (siehe Seitenansicht), status "geplant" (Vorgabe) | "baustelle" | "gebaut",
//                aussen = liegt nicht auf der Insel (keine Pruefung), ufer = darf ins Wasser ragen (Hafen, Kai)
//   bezirk       { name, wohlstand 0..1, poly, netz: { winkel (Grad), abstand [quer, laengs] in m, krumm (m), luecken 0..1, breite } }
//                netz erzeugt die Nebenstrassen des Bezirks (verzogenes, gedrehtes Raster mit Luecken, festem Zufall). Wohlstand steuert die
//                automatischen Fuellbauten (reich = Tuerme, arm = kleine Mietshaeuser, Fabrikviertel = Hallen).
//   hauptstrasse { id, name, w, linie, zweistock?, geschlossen? }  zweistock = oben normaler Verkehr, darunter die untere Strasse
//                (Lower Level, 4 m tiefer = Hoehe Tiefgarage 1, 3,2 m licht: Obdachlose, Club-Eingang)
//   bruecke      { name, w, seite: "west"|"ost", z } (quer ueber den Fluss bei z) oder { seite: "nord", x } oder { name, w, linie }.
//                Haengebruecke (Vorbild Williamsburg/Manhattan Bridge): Fahrbahn auf Strassenhoehe, Tuerme stehen automatisch an den Ufern.
//   Uferpunkte   in Linien darf statt x stehen: "W" = Westufer der Insel, "O" = Ostufer, "Wa"/"Oa" = gegenueberliegendes Ufer (Festland),
//                z. B. ["O", 300]; statt z: [x, "N"] = Nordufer der Insel, [x, "Na"] = Festland noerdlich vom Nordkanal.
//                So wandern Strassenenden und Bruecken mit, wenn ein Fluss geaendert wird.
//   ufer         { seite: "west"|"ost", abstand, von, bis } bei einer Hauptstrasse: laeuft im Abstand dem Ufer entlang (von z bis z).

const TYPEN = {
  wahrzeichen: { farbe: "#e8c547", gruppe: "Wahrzeichen" },
  oeffentlich: { farbe: "#6aa9ff", gruppe: "Öffentlich (Polizei, Gericht, Kirche ...)" },
  gesundheit: { farbe: "#ff6b6b", gruppe: "Krankenhaus, Kinderheim, Krippe" },
  bank: { farbe: "#3ddc97", gruppe: "Banken" },
  atm: { farbe: "#3ddc97", gruppe: "Bankautomaten", punkt: true },
  hotel: { farbe: "#c58cff", gruppe: "Hotels" },
  laden: { farbe: "#ff9f43", gruppe: "Läden (Juwelier, Kleider, Waffen, Autohaus)" },
  essen: { farbe: "#ffd36b", gruppe: "Bars, Restaurants, Fast Food" },
  verkehr: { farbe: "#9aa4b2", gruppe: "Verkehr (Bahnhof, Busbahnhof, Taxi, Parkhaus)" },
  freizeit: { farbe: "#5fd3e6", gruppe: "Stadion, Museum, Eventhalle, Club" },
  geheim: { farbe: "#ff4fd8", gruppe: "Geheim (Basen, Verstecke)" },
  baustelle: { farbe: "#f5a623", gruppe: "Baustellen (Vorlage, später ersetzt)" },
  industrie: { farbe: "#8d7b68", gruppe: "Industrie, Hafen" },
  militaer: { farbe: "#7f9a4e", gruppe: "Militär" },
  manor: { farbe: "#ffffff", gruppe: "Bestehend (Wayne Manor)" },
};

// Kreis/Ellipse als geschlossene Linie (fuer Ringstrassen)
const ellipse = (cx, cz, rx, rz, n = 16) => Array.from({ length: n }, (_, i) => [Math.round(cx + Math.cos(i / n * 2 * Math.PI) * rx), Math.round(cz + Math.sin(i / n * 2 * Math.PI) * rz)]);

const GOTHAM = {
  // Sichtbereich beim Oeffnen der Karte
  ansicht: { x0: -3900, z0: -2600, x1: 400, z1: 2200 },

  // Hoehen in Welt-y: Strassenebene der Stadt = Fahrbahn der Bruecken (Nicolas 2026-11-11), Wasser = Meer/Hoehle (SEA_Y).
  // Strasse 31 m ueber dem Wasser (vorher 40; Nicolas: die 9 m zwischen Kanal-Hub und Wasser waren verschwendet)
  // Nicolas 2026-11-11 (2): Schicht zwischen geheimem Wayne-Stock und Kanal herausgeschnitten (5 m): Kanal direkt unter dem Stock, Strasse 26 m ueber dem Wasser
  hoehen: { strasse: -8, wasser: -34 },

  // Wasser: Fluesse geschwungen (Nicolas: nicht gerade), Breite wie im Verhaeltnis zu Williamsburg/Manhattan Bridge (East River ca. 450-500 m)
  wasser: {
    west: { name: "Westfluss", punkte: [[-2800, -3420, 380], [-2200, -3180, 400], [-1700, -3360, 420], [-1200, -3480, 440], [-700, -3260, 400],
      [-200, -3060, 420], [300, -3220, 440], [800, -3420, 420], [1250, -3180, 400], [1700, -3300, 460], [2100, -3330, 500]] },
    ost: { name: "Ostfluss", punkte: [[-2800, -700, 400], [-2200, -950, 420], [-1700, -1000, 420], [-1200, -720, 400], [-700, -640, 420],
      [-200, -900, 440], [300, -820, 420], [800, -600, 400], [1200, -800, 430], [1700, -700, 480]] },
    nord: { name: "Nordkanal", punkte: [[-3700, -1640, 170], [-3200, -1760, 170], [-2700, -1600, 160], [-2200, -1760, 150], [-1700, -1620, 160],
      [-1200, -1700, 170], [-600, -1640, 180]] },
    // Suedkueste vor Gotham von West nach Ost (Bucht beim Hafen), danach geht sie in die bestehende Kueste im Suedosten ueber
    kueste: [[-4200, 1580], [-3600, 1480], [-3250, 1560], [-2950, 1380], [-2750, 1520], [-2450, 1480], [-2200, 1380], [-1900, 1500], [-1600, 1400], [-1300, 1520], [-1000, 1440]],
    rundung: 4,   // Ecken der Insel abrunden (Glaettungsschritte)
    kuesteAlt: [[-500, 783], [0, 283], [500, -217], [1000, -717], [1700, -1417]],
  },
  inseln: [
    { name: "Arkham-Insel", poly: [[-3560, 1720], [-3420, 1650], [-3240, 1660], [-3120, 1760], [-3160, 1900], [-3330, 1960], [-3510, 1900]] },
  ],

  bezirke: [
    { name: "Uptown (sehr reich)", wohlstand: 0.95, poly: [[-3500, -1900], [-500, -1900], [-500, -600], [-1500, -520], [-2100, -620], [-2550, -540], [-3500, -580]],
      netz: { winkel: 9, abstand: [150, 70], krumm: 22, luecken: 0.05, breite: 12 } },
    { name: "Midtown / Zentrum", wohlstand: 0.85, poly: [[-2550, -540], [-2100, -620], [-1500, -520], [-500, -600], [-500, 330], [-1500, 380], [-2250, 300], [-2560, 250]],
      netz: { winkel: -5, abstand: [110, 64], krumm: 14, luecken: 0.06, breite: 12 } },
    { name: "Westseite (Mittelstand)", wohlstand: 0.6, poly: [[-3500, -580], [-2550, -540], [-2560, 250], [-3500, 300]],
      netz: { winkel: 22, abstand: [92, 74], krumm: 34, luecken: 0.1, breite: 11 } },
    { name: "Südstadt (gemischt)", wohlstand: 0.45, poly: [[-2250, 300], [-1500, 380], [-500, 330], [-500, 1800], [-2250, 1800], [-2200, 900]],
      netz: { winkel: -16, abstand: [96, 80], krumm: 30, luecken: 0.12, breite: 11 } },
    { name: "Fabrikviertel", wohlstand: 0.25, poly: [[-3500, 300], [-2560, 250], [-2250, 300], [-2200, 900], [-3500, 860]],
      netz: { winkel: 4, abstand: [170, 120], krumm: 14, luecken: 0.25, breite: 12 } },
    { name: "The Narrows (arm, Hafen)", wohlstand: 0.1, poly: [[-3500, 860], [-2200, 900], [-2250, 1800], [-3500, 1800]],
      netz: { winkel: 33, abstand: [58, 44], krumm: 16, luecken: 0.16, breite: 7 } },
  ],

  // Hauptstrassen (frei gezogen, weiche Kurven). Nebenstrassen kommen automatisch aus den Bezirken (netz).
  hauptstrassen: [
    { id: "ring", name: "Wayne Circle (Ring um den Wayne Tower)", w: 22, geschlossen: true, linie: ellipse(-2050, -100, 290, 245) },
    { id: "parkrow", name: "Park Row (zweistöckig)", w: 24, zweistock: true, linie: [["O", 300], [-1300, 250], [-1560, 140], [-1770, -10]] },
    { id: "uptown-ave", name: "Uptown Avenue", w: 22, linie: [[-2050, -345], [-2000, -700], [-2090, -1100], [-1990, -1450], [-1955, "N"]] },
    { id: "militaer", name: "Zufahrt Militärstützpunkt", w: 18, linie: [[-1955, "Na"], [-1965, -1950], [-2000, -2100]] },
    { id: "gotham-blvd", name: "Gotham Boulevard", w: 22, linie: [[-2050, 145], [-1990, 500], [-2080, 900], [-2030, 1330]] },
    { id: "westside", name: "Westside Drive", w: 18, linie: [[-2340, -100], [-2600, -230], [-2800, -480], [-2860, -700]] },
    { id: "diag-nord", name: "Old Broadway (Nord)", w: 20, linie: [[-1250, -1420], [-1450, -1080], [-1680, -720], [-1820, -300]] },
    { id: "diag-sued", name: "Old Broadway (Süd)", w: 20, linie: [[-2290, 30], [-2470, 400], [-2660, 800], [-2880, 1220]] },
    { id: "crosstown", name: "Crosstown Expressway", w: 24, linie: [["O", -880], [-1300, -860], [-1620, -930], [-2050, -880], [-2450, -800], [-2860, -700], ["W", -730]] },
    { id: "sued-road", name: "Harbor Road", w: 18, linie: [["O", 1050], [-1250, 1000], [-1650, 1090], [-2060, 1050], [-2420, 1110], [-2720, 1180], [-2930, 1260]] },
    { id: "industrial", name: "Industrial Way", w: 18, linie: [[-2470, 400], [-2720, 470], ["W", 520]] },
    { id: "ufer-ost", name: "Uferstrasse Ost (zweistöckig)", w: 22, zweistock: true, ufer: { seite: "ost", abstand: 95, von: -1500, bis: 1350 } },
    { id: "ufer-west", name: "Uferstrasse West", w: 16, ufer: { seite: "west", abstand: 70, von: -1500, bis: 1300 } },
    // ausserhalb der Insel
    { id: "highway", name: "Gotham Highway (Manor - Stadt)", w: 22, linie: [[-61, 200], [-300, 255], [-500, 290], ["Oa", 300]] },
    { id: "hauptstrasse", name: "Hauptstrasse (besteht)", w: 8, besteht: true, linie: [[-61, 200], [0, 168], [48, 138], [78, 108], [100, 78], [128, 55], [172, 36], [210, 0], [232, -60], [244, -130], [256, -217]] },
    { id: "west-nord", name: "Zufahrt Westen (Nord)", w: 16, linie: [["Wa", -730], [-3850, -760], [-4050, -820]] },
    { id: "west-sued", name: "Zufahrt Westen (Süd)", w: 16, linie: [["Wa", 520], [-3850, 560], [-4050, 620]] },
  ],
  // Haengebruecken (Fahrbahn auf Strassenhoehe; Tuerme stehen automatisch an den Ufern)
  bruecken: [
    { name: "Gotham-Highway-Brücke", w: 26, seite: "ost", z: 300 },
    { name: "Nordbrücke (Crosstown)", w: 24, seite: "ost", z: -880 },
    { name: "Südbrücke (Harbor)", w: 22, seite: "ost", z: 1050 },
    { name: "Westbrücke Nord", w: 20, seite: "west", z: -730 },
    { name: "Westbrücke Süd", w: 20, seite: "west", z: 520 },
    { name: "Nordkanal-Brücke (zum Militär)", w: 18, seite: "nord", x: -1955 },
    { name: "Arkham-Brücke", w: 12, linie: [[-2930, 1260], [-3060, 1450], [-3200, 1640]] },
  ],

  // U-Bahn: ein grosser Ring (Ellipse), Stationen per Winkel in Grad (0 = Osten, 90 = Sueden), Abstand ca. 450 m
  ubahn: {
    cx: -2050, cz: 0, rx: 650, rz: 1100,
    stationen: [
      { name: "Hauptbahnhof", a: 0, haupt: true },
      { name: "Stadion", a: 30 }, { name: "Südstadt", a: 60 }, { name: "Hafen", a: 90 }, { name: "Narrows", a: 120, notiz: "Graffiti NBR im Tunnel Richtung Fabrikviertel" },
      { name: "Fabrikviertel", a: 150 }, { name: "Westseite", a: 180 }, { name: "Kathedrale", a: 210 }, { name: "Museumsmeile", a: 240 },
      { name: "Uptown", a: 270 }, { name: "Park Row", a: 300 }, { name: "Diamond District", a: 330 },
    ],
    depot: { name: "Abstellanlage (Züge ausser Betrieb, am Gleisnetz)", x: -1300, z: -330, w: 120, d: 60, gleis: [[-1400, 0], [-1350, -180], [-1300, -330]] },
    graffiti: [{ text: "NBR", x: -2620, z: 600 }],
  },

  // Bus: Linien folgen Hauptstrassen (ids), Haltestellen automatisch alle ca. 400 m
  bus: {
    abstand: 400,
    linien: [
      { name: "Linie 1 Zentrum", farbe: "#3ec7ff", strassen: ["ring", "parkrow", "ufer-ost"] },
      { name: "Linie 2 Nord-Süd", farbe: "#7de0ff", strassen: ["uptown-ave", "gotham-blvd"] },
      { name: "Linie 3 Manor-Express", farbe: "#2fa3e0", strassen: ["highway", "parkrow"] },
      { name: "Linie 4 Hafen", farbe: "#58b8ff", strassen: ["sued-road", "diag-sued"] },
    ],
  },

  // Kanalisation (Nicolas 2026-11-11): nur unter den hier genannten Hauptstrassen (nicht unter jeder Strasse, das waere zu viel),
  // begehbar, 6 m hoch. Gullideckel auf diesen Strassen (Abstand) - nur mit Spezialwerkzeug (Gullihaken) zu oeffnen, darunter Leiter in den Kanal.
  // Auslaesse (Foto von Nicolas, nur groesser): wo ein Sammler die Insel verlaesst, faellt er in einem Absturzschacht auf Wasserhoehe;
  // dort eine Betonstirnwand mit grossem runden Rohr und Gitter davor (rostiger Stahlrahmen, quadratisches Gitter), trichterfoermige
  // Fluegelwaende aus Pflastersteinen, gepflasterte Sohle bis ins Wasser, Betontreppe an einer Fluegelwand. Liegt in einer Nische der Kaimauer.
  // Uebergaenge zur U-Bahn automatisch, wo ein Hauptsammler den U-Bahn-Ring kreuzt.
  kanal: {
    hauptsammler: ["ring", "uptown-ave", "gotham-blvd", "parkrow", "crosstown", "sued-road", "ufer-ost", "ufer-west"],
    gulliAbstand: 70,
    auslass: { rohr: 6, wand: 14, wasser: 36, tiefe: 24 },   // Rohrdurchmesser, Breite Stirnwand, Breite am Wasser, Tiefe der Nische (m)
    hub: { name: "Zentraler Knoten unter dem Wayne Tower (grösster Teil des Netzes, Schurkenbasis)", x: -2050, z: -100, r: 170 },
  },

  orte: [
    // --- Wahrzeichen ---
    { id: "wayne-tower", typ: "wahrzeichen", name: "Wayne Tower", x: -2050, z: -100, w: 70, d: 70, h: 320,
      notiz: "Zentrum, im Wayne Circle. Befahrbare Tiefgarage (2 Ebenen). Direkt darunter geheimer Stock (Vorbild karten/planung/wayne-geheimstock-vorbild.png: weite niedrige Halle, viele runde Pfeiler, runde Deckenlampen, graue Wände, glänzender Boden): Tumbler, Prototypen, Gadgets. Darunter Kanal-Hub mit Schurkenbasis." },
    { id: "gcpd", typ: "oeffentlich", name: "Polizeipräsidium (Batsignal auf dem Dach)", x: -2200, z: 330, w: 80, d: 60, h: 45 },
    { id: "arkham", typ: "wahrzeichen", name: "Arkham Asylum", x: -3340, z: 1800, w: 220, d: 160, h: 30, aussen: true, notiz: "Eigene Insel vor der Küste, nur über die Arkham-Brücke." },
    { id: "hafen", typ: "industrie", name: "Hafen / Containerterminal", x: -2600, z: 1440, w: 560, d: 90, ufer: true, notiz: "Kräne, Container, Lagerhallen." },
    // --- Oeffentlich ---
    { id: "gericht", typ: "oeffentlich", name: "Gerichtsgebäude", x: -1880, z: 330, w: 70, d: 50, h: 35 },
    { id: "kirche", typ: "oeffentlich", name: "Kathedrale", x: -2560, z: 40, w: 50, d: 90, h: 60 },
    { id: "kh-1", typ: "gesundheit", name: "Krankenhaus Uptown", x: -1560, z: -1300, w: 90, d: 70, h: 50 },
    { id: "kh-2", typ: "gesundheit", name: "Krankenhaus Westseite", x: -2680, z: -40, w: 80, d: 60, h: 40 },
    { id: "kh-3", typ: "gesundheit", name: "Krankenhaus Südstadt", x: -1850, z: 1230, w: 80, d: 60, h: 35 },
    { id: "heim-1", typ: "gesundheit", name: "Kinderheim West", x: -2750, z: -300, w: 40, d: 30, h: 12 },
    { id: "heim-2", typ: "gesundheit", name: "Kinderheim Narrows", x: -2300, z: 1260, w: 40, d: 30, h: 12 },
    { id: "krippe-1", typ: "gesundheit", name: "Kinderkrippe Uptown", x: -1400, z: -740, w: 25, d: 20, h: 6 },
    { id: "krippe-2", typ: "gesundheit", name: "Kinderkrippe Westseite", x: -2420, z: -330, w: 25, d: 20, h: 6 },
    { id: "krippe-3", typ: "gesundheit", name: "Kinderkrippe Südstadt", x: -1880, z: 780, w: 25, d: 20, h: 6 },
    // --- Freizeit ---
    { id: "stadion", typ: "freizeit", form: "stadion", name: "Football-Stadion (oben offen)", x: -1420, z: 700, w: 220, d: 160, h: 40, notiz: "Oben offen, kein Dach. Ränge rundum, Spielfeld in der Mitte." },
    { id: "museum-1", typ: "freizeit", name: "Kunstmuseum", x: -1700, z: -1160, w: 100, d: 60, h: 25 },
    { id: "museum-2", typ: "freizeit", name: "Naturkundemuseum", x: -2350, z: -1150, w: 90, d: 70, h: 25 },
    { id: "event", typ: "freizeit", name: "Eventgebäude (Spendengala, Hochzeit)", x: -1900, z: -560, w: 90, d: 60, h: 20 },
    { id: "pinguin", typ: "freizeit", name: "Club des Pinguins (Eingang an der unteren Uferstrasse)", x: -1090, z: 470, w: 50, d: 40, h: 12, ebene: -4,
      notiz: "Eingang an der unteren Strasse (Lower Level) unter der Uferstrasse Ost. Geht über mehrere Ebenen nach unten (siehe Seitenansicht)." },
    { id: "obdachlos", typ: "freizeit", name: "Obdachlosenlager (untere Strasse)", x: -1170, z: -320, w: 30, d: 120, ebene: -4,
      notiz: "Unter der zweistöckigen Uferstrasse Ost: oben normaler Verkehr, unten Lager mit Feuertonnen." },
    // --- Banken ---
    { id: "bank-g1", typ: "bank", name: "Grossbank (Tresorkeller)", x: -1700, z: -380, w: 60, d: 50, h: 120 },
    { id: "bank-g2", typ: "bank", name: "Grossbank (Tresorkeller)", x: -1560, z: -600, w: 60, d: 50, h: 150 },
    { id: "bank-g3", typ: "bank", name: "Grossbank (Tresorkeller)", x: -2250, z: -720, w: 55, d: 45, h: 90 },
    { id: "bank-k1", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -2650, z: 1000, w: 15, d: 12, h: 5 },
    { id: "bank-k2", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -1700, z: 640, w: 15, d: 12, h: 5 },
    { id: "bank-k3", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -2560, z: -1000, w: 15, d: 12, h: 5 },
    { id: "bank-k4", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -1350, z: -200, w: 15, d: 12, h: 5 },
    ...[[-1900, -160], [-1600, 60], [-2350, -350], [-2550, 650], [-2150, 1000], [-1300, 500], [-1800, -1260], [-2850, -820], [-2450, 1300], [-1650, 1300], [-2200, 60], [-1450, -500]]
      .map(([x, z], i) => ({ id: "atm-" + (i + 1), typ: "atm", name: "Bankautomat", x, z, w: 4, d: 4 })),
    // --- Hotels ---
    { id: "hotel-l1", typ: "hotel", name: "Luxushotel", x: -1850, z: -1230, w: 60, d: 50, h: 180 },
    { id: "hotel-l2", typ: "hotel", name: "Luxushotel", x: -2400, z: -600, w: 55, d: 45, h: 140 },
    { id: "hotel-b1", typ: "hotel", name: "Billighotel", x: -2700, z: 1060, w: 30, d: 25, h: 20 },
    { id: "hotel-b2", typ: "hotel", name: "Billighotel", x: -1550, z: 1180, w: 30, d: 25, h: 18 },
    { id: "hotel-b3", typ: "hotel", name: "Billighotel", x: -2820, z: 360, w: 30, d: 25, h: 18 },
    // --- Laeden ---
    { id: "juw-1", typ: "laden", name: "Juwelier", x: -1950, z: -480, w: 20, d: 15, h: 8 },
    { id: "juw-2", typ: "laden", name: "Juwelier", x: -1750, z: -1000, w: 20, d: 15, h: 8 },
    { id: "juw-3", typ: "laden", name: "Juwelier", x: -2300, z: -450, w: 20, d: 15, h: 8 },
    { id: "schneider-1", typ: "laden", name: "Massschneider (teuer)", x: -2150, z: -960, w: 18, d: 14, h: 8 },
    { id: "schneider-2", typ: "laden", name: "Massschneider (teuer)", x: -1500, z: -790, w: 18, d: 14, h: 8 },
    { id: "kleider-n1", typ: "laden", name: "Kleiderladen (normal)", x: -1880, z: 560, w: 30, d: 20, h: 8 },
    { id: "kleider-n2", typ: "laden", name: "Kleiderladen (normal)", x: -2420, z: 150, w: 30, d: 20, h: 8 },
    { id: "kleider-b1", typ: "laden", name: "Kleider-Billigladen", x: -2560, z: 1080, w: 25, d: 18, h: 6 },
    { id: "kleider-b2", typ: "laden", name: "Kleider-Billigladen", x: -1800, z: 980, w: 25, d: 18, h: 6 },
    { id: "kleider-b3", typ: "laden", name: "Kleider-Billigladen", x: -2380, z: 760, w: 25, d: 18, h: 6 },
    { id: "waffen-1", typ: "laden", name: "Waffenladen", x: -2620, z: 560, w: 20, d: 15, h: 6 },
    { id: "waffen-2", typ: "laden", name: "Waffenladen", x: -1500, z: 950, w: 20, d: 15, h: 6 },
    { id: "auto-billig", typ: "laden", name: "Autohaus (billig)", x: -2800, z: 660, w: 70, d: 50, h: 8, notiz: "Echte Filiale der Fahrzeug-Kette aus dem Computer-Shop." },
    { id: "auto-teuer", typ: "laden", name: "Autohaus (teuer)", x: -1560, z: -1200, w: 70, d: 50, h: 12 },
    { id: "auto-militaer", typ: "militaer", name: "Fahrzeughandel Militär", x: -2150, z: -2150, w: 80, d: 60, h: 10, aussen: true, notiz: "Am Militärstützpunkt." },
    // --- Essen ---
    ...[[-1600, -280], [-2150, -520], [-2550, -660], [-1850, 240], [-1450, 450], [-2350, 600]].map(([x, z], i) => ({ id: "bar-" + (i + 1), typ: "essen", name: i % 2 ? "Restaurant" : "Bar", x, z, w: 20, d: 15, h: 8 })),
    ...[[-2700, 1260], [-2450, 960], [-2850, 780], [-2300, 1360]].map(([x, z], i) => ({ id: "fastfood-" + (i + 1), typ: "essen", name: "Billig-Fast-Food", x, z, w: 15, d: 12, h: 5 })),
    // --- Verkehr ---
    { id: "busbahnhof", typ: "verkehr", name: "Busbahnhof", x: -1530, z: 230, w: 90, d: 50, h: 10 },
    { id: "taxi", typ: "verkehr", name: "Taxi-Depot (Taxis ausser Betrieb)", x: -2660, z: 330, w: 70, d: 45, h: 10 },
    ...[[-1900, -250], [-1650, 330], [-2350, -900], [-2700, 720], [-1750, 860]].map(([x, z], i) => ({ id: "parkhaus-" + (i + 1), typ: "verkehr", name: "Parkhaus", x, z, w: 40, d: 30, h: 18 })),
    // --- Industrie ---
    ...[[-2830, 230], [-2660, 230], [-2400, 640], [-2880, 600]].map(([x, z], i) => ({ id: "fabrik-" + (i + 1), typ: "industrie", name: "Fabrik", x, z, w: 70, d: 45, h: 15 })),
    // --- Geheim ---
    { id: "container-base", typ: "geheim", name: "Container (Aufzug zur geheimen Batman-Basis)", x: -3020, z: 1230, w: 6.1, d: 2.4, ufer: true,
      notiz: "Ganz normaler 20-Fuss-Seecontainer am Westfluss beim Hafen (Foto von Nicolas): blau, Wellblech, zweiflügelige Tür mit Verriegelungsstangen, keine Fenster. 6,06 x 2,44 x 2,59 m, innen ca. 5,9 m lang. Er ist ein Aufzug (fährt samt Auto hinunter)." },
    { id: "bunker", typ: "geheim", name: "Batman-Basis unter dem Container (Halle mit Lichtdecke)", x: -2930, z: 1200, w: 90, d: 50, ebene: -4,
      notiz: "Flache, weite Halle auf Höhe der Tiefgarage 1 (Boden 4 m unter der Strasse, ca. 3,4 m hoch): Sichtbetonwände, die ganze Decke ein Raster aus Lichtpaneelen (Foto von Nicolas), glatter Betonboden. Batmobil in der Mitte, Anzug fährt aus dem Boden, Motorrad und Batpod fahren aus der Wand, hinten Reifenstapel und Werkbank, Computer, aufklappbare Wand mit Waffen und Gadgets, Geheimwand mit Tresor (Goldbarren, Bargeld)." },
    { id: "schurkenbasis", typ: "geheim", name: "Schurkenbasis im Kanalnetz", x: -2050, z: -60, w: 120, d: 80, ebene: -25,
      notiz: "Runde, hohe Halle im Kanal-Hub direkt unter dem geheimen Wayne-Stock (der Tumbler steht genau darüber), Vorbild karten/planung/schurkenbasis-vorbild-*: Pfeiler rundum, Stahlstege mit Geländern auf mehreren Ebenen, Gitterboden, Abwasser stürzt als Wasserfall in einen gemauerten Kanal. Dazu Waffen unter Planen, herumliegende Waffen, Tisch mit Computer, Boxsack." },
    ...[[-2850, 1100], [-2550, 1360], [-2350, 1050], [-2750, 900]].map(([x, z], i) => ({ id: "drogen-" + (i + 1), typ: "geheim", name: "Geheimes Drogenversteck", x, z, w: 10, d: 10 })),
    // --- Baustellen (eine Vorlage, mehrfach eingesetzt) ---
    ...[[-2260, -1360], [-1300, -620], [-2800, -1200], [-1700, 520], [-2500, -1350], [-1430, 1300], [-2700, -150], [-2200, 680]]
      .map(([x, z], i) => ({ id: "baustelle-" + (i + 1), typ: "baustelle", name: "Baustelle (Platzhalter)", x, z, w: 60, d: 50, status: "baustelle" })),
    // --- Militaer (Militaerinsel im Suedosten: spaeter, siehe PLAN-GOTHAM.md) ---
    { id: "militaer-nord", typ: "militaer", name: "Militärstützpunkt (ausserhalb der Stadt)", x: -2000, z: -2320, w: 650, d: 420, aussen: true },
    // --- Bestehend ---
    { id: "manor", typ: "manor", name: "Wayne Manor (besteht)", x: -20, z: 15, w: 70, d: 95, status: "gebaut", aussen: true },
  ],

  // Seitenansicht (gotham/schnitt.html): senkrechter Schnitt von West nach Ost, waagrecht NICHT massstaeblich, senkrecht in Metern.
  // y = Meter relativ zur Strassenebene (0 = Welt-y hoehen.strasse = Fahrbahn der Bruecken). x = Position im Bild (Gotham 0..2880, danach der Vergleich mit Wayne Manor).
  schnitt: {
    ebenen: [   // Masskette rechts (Boden bzw. Oberkante der Ebene)
      { y: 62, name: "Brückentürme (Spitze)" },
      { y: 43, name: "Wayne Manor: Dach (Welt 35)" },
      { y: 33, name: "Wayne Manor: Plateau / Erdgeschoss (Welt 25)" },
      { y: 23, name: "Klippenkante bei der Manor, höchste Stelle (Welt 15)" },
      { y: 0, name: "Strasse = Brückenfahrbahn" },
      { y: -4, name: "Tiefgarage 1 = untere Strasse = Club-Bar = Batman-Basis" },
      { y: -4.5, name: "Untere Strasse (Lower Level, Fahrbahn)" },
      { y: -7.5, name: "Tiefgarage 2 = U-Bahn-Bahnsteig" },
      { y: -14, name: "Club: Keller / VIP" },
      { y: -10, name: "Club: Tanzfläche" },
      { y: -16, name: "Geheimer Wayne-Stock (direkt unter Tiefgarage 2)" },
      { y: -22, name: "Kanal-Sohle (Hauptsammler)" },
      { y: -25, name: "Kanal-Hub / Schurkenbasis" },
      { y: -18, name: "Kanal-Auslass (Rohr oben)" },
      { y: 9, name: "Klippenkante bei der Manor, tiefste Stelle (Welt 1)" },
      { y: -8, name: "Batcave oben (Welt −16)" },
      { y: -20, name: "Batcave unten (Welt −28)" },
      { y: -26, name: "Wasserspiegel (Fluss, Meer) / Auslass-Sohle" },
      { y: -30, name: "Meeresgrund am Fuss der Manor-Klippe (Welt −38)" },
      { y: -38, name: "Flussgrund" },
    ],
    teile: [
      // typ: wasser, grund, mauer, deck, strasse, raum, gebaeude, turm, rohr, text; x0/x1 waagrecht, y0/y1 senkrecht (m)
      { typ: "grund", x0: 0, x1: 2880, y0: -60, y1: 0 },
      { typ: "wasser", name: "Westfluss", x0: 0, x1: 400, y0: -38, y1: -26 },
      { typ: "wasser", name: "Ostfluss", x0: 2480, x1: 2880, y0: -38, y1: -26 },
      { typ: "luft", x0: 0, x1: 400, y0: -26, y1: 0 }, { typ: "luft", x0: 2480, x1: 2880, y0: -26, y1: 0 },
      { typ: "mauer", name: "Kaimauer", x0: 400, x1: 426, y0: -38, y1: 0 },
      { typ: "mauer", name: "Kaimauer", x0: 2454, x1: 2480, y0: -38, y1: 0 },
      // Flussufer (Nicolas 2026-11-11): am Fuss der Kaimauer ein Streifen Kies/Sand knapp ueber dem Wasser, dann weich tiefer bis zum Grund
      { typ: "ufer", name: "Kies/Sand am Ufer, dann tiefer", seite: "west", x0: 0, x1: 400, y0: -38, kies: 0.6, strand: 45 },
      { typ: "ufer", name: "Kies/Sand am Ufer, dann tiefer", seite: "ost", x0: 2480, x1: 2880, y0: -38, kies: 0.6, strand: 45 },
      { typ: "deck", name: "Westbrücke (Fahrbahn)", x0: 0, x1: 528, y0: -1.5, y1: 0 },
      { typ: "turm", name: "Brückenturm", x0: 371, x1: 397, y0: -26, y1: 62 },
      { typ: "deck", name: "Highway-Brücke (Fahrbahn)", x0: 2352, x1: 2880, y0: -1.5, y1: 0 },
      { typ: "turm", name: "Brückenturm", x0: 2483, x1: 2509, y0: -26, y1: 62 },
      { typ: "kabel", x0: 0, x1: 384, y0: 2, y1: 62 }, { typ: "kabel", x0: 2496, x1: 2880, y0: 2, y1: 62 },
      // Kanal: Hauptsammler quer durch, an beiden Ufern Absturzschacht und Auslass auf Wasserhoehe
      { typ: "rohr", name: "Hauptsammler (begehbar, 6 m)", x0: 400, x1: 2480, y0: -22, y1: -16 },
      { typ: "schacht", name: "Absturzschacht", x0: 426, x1: 448, y0: -26, y1: -16, farbe: "#7bd88f" }, { typ: "schacht", name: "Absturzschacht", x0: 2432, x1: 2454, y0: -26, y1: -16, farbe: "#7bd88f" },
      { typ: "auslass", name: "Kanal-Auslass (Rohr 6 m, Gitter, Pflaster, Treppe)", x0: 320, x1: 448, y0: -26, y1: -18, seite: "west" },
      { typ: "auslass", name: "Kanal-Auslass (Rohr 6 m, Gitter, Pflaster, Treppe)", x0: 2432, x1: 2560, y0: -26, y1: -18, seite: "ost" },
      { typ: "schacht", name: "Gullideckel + Leiter", x0: 723, x1: 736, y0: -16, y1: 0 }, { typ: "schacht", name: "Gullideckel + Leiter", x0: 1888, x1: 1901, y0: -16, y1: 0 },
      // Narrows
      { typ: "strasse", name: "Uferstr. West", x0: 426, x1: 576, y0: -0.6, y1: 0 },
      { typ: "container", name: "Container = Aufzug (20 Fuss, keine Fenster)", x0: 540, y0: 0, laenge: 6.06, hoehe: 2.59, farbe: "#1f3f8f" },
      { typ: "schacht", name: "Aufzugschacht", x0: 540, x1: 625, y0: -4, y1: 0, farbe: "#ff4fd8" },
      { typ: "raum", name: "Batman-Basis (Lichtdecke)", x0: 432, x1: 704, y0: -4, y1: -0.6, farbe: "#ff4fd8", licht: true },
      { typ: "gebaeude", name: "Mietshaus (Narrows)", x0: 640, x1: 740, y0: 0, y1: 16 },
      // zweistoeckige Strasse mit Club
      { typ: "deck", name: "Zweistöckige Strasse: oben normaler Verkehr", x0: 720, x1: 1120, y0: -0.8, y1: 0 },
      { typ: "strasse", name: "Untere Strasse (Lower Level)", x0: 720, x1: 1120, y0: -4.5, y1: -4 },
      { typ: "raum", name: "Obdachlose", x0: 736, x1: 864, y0: -4, y1: -1.3 },
      { typ: "raum", name: "Club-Eingang", x0: 896, x1: 960, y0: -4, y1: -1.2, farbe: "#5fd3e6" },
      { typ: "raum", name: "Club: Bar (Höhe Tiefgarage 1)", x0: 960, x1: 1216, y0: -4, y1: -1.2, farbe: "#5fd3e6" },
      { typ: "raum", name: "Club: Tanzfläche", x0: 960, x1: 1248, y0: -10, y1: -4.6, farbe: "#5fd3e6" },
      { typ: "raum", name: "Club: Keller / VIP", x0: 992, x1: 1184, y0: -14, y1: -10, farbe: "#5fd3e6" },
      // U-Bahn
      { typ: "raum", name: "U-Bahn-Station (Strecken dazwischen frei tiefer)", x0: 1280, x1: 1504, y0: -8.6, y1: -1.2, farbe: "#ff5a5a" },
      { typ: "raum", name: "Bahnsteig", x0: 1280, x1: 1392, y0: -8.1, y1: -7.5, farbe: "#ffb3b3" },
      { typ: "strasse", name: "Strasse", x0: 1120, x1: 1568, y0: -0.6, y1: 0 },
      // Wayne Tower
      { typ: "gebaeude", name: "Wayne Tower (320 m, oben abgeschnitten)", x0: 1584, x1: 1840, y0: 0, y1: 75, farbe: "#e8c547" },
      { typ: "raum", name: "Tiefgarage 1", x0: 1584, x1: 1840, y0: -4, y1: 0, farbe: "#9aa4b2" },
      { typ: "raum", name: "Tiefgarage 2", x0: 1584, x1: 1840, y0: -7.5, y1: -4, farbe: "#9aa4b2" },
      { typ: "raum", name: "Geheimer Wayne-Stock\n(Tumbler, Prototypen)", x0: 1584, x1: 1840, y0: -16, y1: -8, farbe: "#ff4fd8" },
      { typ: "raum", name: "Kanal-Hub / Schurkenbasis", x0: 1520, x1: 1936, y0: -25, y1: -16, farbe: "#7bd88f" },
      // Midtown und Uferstrasse Ost
      { typ: "strasse", name: "Strasse", x0: 1840, x1: 2016, y0: -0.6, y1: 0 },
      { typ: "gebaeude", name: "Bank (Midtown)", x0: 2032, x1: 2208, y0: 0, y1: 60 },
      // Bank: Tresorkeller auf der Hoehe der Tiefgarage 1, direkt daneben (Nicolas 2026-11-11), darunter Tiefgarage 2
      { typ: "raum", name: "Tiefgarage 1", x0: 2032, x1: 2120, y0: -4, y1: 0, farbe: "#9aa4b2" },
      { typ: "raum", name: "Tresorkeller", x0: 2120, x1: 2208, y0: -4, y1: 0, farbe: "#3ddc97" },
      { typ: "raum", name: "Tiefgarage 2", x0: 2032, x1: 2208, y0: -7.5, y1: -4, farbe: "#9aa4b2" },
      { typ: "deck", name: "Uferstrasse Ost (oben)", x0: 2224, x1: 2454, y0: -0.8, y1: 0 },
      // Groessenvergleich: Rolls-Royce Spectre aus dem Spiel (1,6 m hoch, 5,34 m lang), in echten Proportionen
      { typ: "auto", name: "Rolls-Royce Spectre (Strasse)", x0: 1180, y0: 0, laenge: 5.34, hoehe: 1.6 },
      { typ: "auto", name: "Rolls-Royce Spectre (untere Strasse)", x0: 790, y0: -4, laenge: 5.34, hoehe: 1.6 },
      { typ: "auto", name: "Rolls-Royce Spectre (Batman-Basis)", x0: 610, y0: -4, laenge: 5.34, hoehe: 1.6 },
      { typ: "auto", name: "Rolls-Royce Spectre (Tiefgarage Wayne Tower)", x0: 1610, y0: -4, laenge: 5.34, hoehe: 1.6 },
      { typ: "auto", name: "Rolls-Royce Spectre (Brücke)", x0: 2700, y0: 0, laenge: 5.34, hoehe: 1.6 },
      // Zum Vergleich: Wayne Manor an der Steilkueste (anderer Ort, gleiche Hoehen). Werte aus dem Spiel: Plateau HILL 25, Klippe Welt 1-15,
      // Meer SEA_Y -34, Batcave unten LY -28 (10 m hoch), oben UY -16 (8,5 m), Tiefgarage GY -5,5 unter dem Plateau
      { typ: "titel", name: "Zum Vergleich: Wayne Manor an der Steilküste", x0: 2940, x1: 3320, y0: 65, y1: 65 },
      { typ: "luft", x0: 2940, x1: 3030, y0: -26, y1: 0 },
      { typ: "wasser", name: "Meer", x0: 2940, x1: 3030, y0: -30, y1: -26 },
      { typ: "profil", name: "Steilküste (Fels, 35-49 m über dem Meer)", farbe: "#5b5246",
        punkte: [[3030, -60], [3030, -26], [3024, -17], [3032, -6], [3026, 5], [3033, 16], [3029, 23], [3065, 25], [3090, 33], [3320, 33], [3320, -60], [2940, -60], [2940, -30], [3030, -30]] },
      // gemessen im Spiel (Orbit-Punkt von Nicolas, x 52 / z 227): Kante Welt +1, Meer -34, Grund am Fuss -38
      { typ: "mass", name: "35 m (gemessen bei x 52 / z 227: Kante Welt +1)", x0: 2965, y0: -26, y1: 9 },
      { typ: "mass", name: "49 m (höchste Stelle, Kante Welt +15)", x0: 2995, y0: -26, y1: 23 },
      { typ: "raum", name: "Tiefgarage Manor", x0: 3140, x1: 3270, y0: 27.5, y1: 32.6, farbe: "#9aa4b2" },
      { typ: "gebaeude", name: "Wayne Manor", x0: 3130, x1: 3280, y0: 33, y1: 43, farbe: "#d8d2c4" },
      { typ: "schacht", name: "Aufzug", x0: 3230, x1: 3240, y0: -20, y1: 33, farbe: "#e8c547" },
      { typ: "raum", name: "Batcave oben", x0: 3110, x1: 3310, y0: -8, y1: 0.5, farbe: "#c58cff" },
      { typ: "raum", name: "Batcave unten", x0: 3080, x1: 3310, y0: -20, y1: -10, farbe: "#c58cff" },
      { typ: "wasser", name: "Höhlensee", x0: 3045, x1: 3140, y0: -26, y1: -26 },
      { typ: "strasse", name: "Uferstrasse Ost (unten)", x0: 2224, x1: 2454, y0: -4.5, y1: -4 },
    ],
  },
};
