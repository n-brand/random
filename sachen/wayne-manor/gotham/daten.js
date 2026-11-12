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
//                (Lower Level, 5,5 m tiefer = Hoehe Tiefgarage 1, ca. 4,4 m licht: Obdachlose, Club-Eingang)
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
  ansicht: { x0: -4600, z0: -2100, x1: 200, z1: 2100 },

  // Hoehen in Welt-y: Strassenebene der Stadt = Fahrbahn der Bruecken (Nicolas 2026-11-11), Wasser = Meer/Hoehle (SEA_Y).
  // Strasse 31 m ueber dem Wasser (vorher 40; Nicolas: die 9 m zwischen Kanal-Hub und Wasser waren verschwendet)
  // Nicolas 2026-11-11 (2): Schicht zwischen geheimem Wayne-Stock und Kanal herausgeschnitten (5 m): Kanal direkt unter dem Stock.
  // Nicolas 2026-11-11 (3): Tiefgaragen-Etagen 5,5 m wie bei Wayne Manor (vorher 4 / 3,5 m); Strasse 29,5 m ueber dem Wasser
  // Nicolas 2026-11-11 (4): geheimer Wayne-Stock direkt unter den Wayne Tower, alles darunter (Kanal, Hub, Wasser, Flussgrund) 11,5 m mit hoch
  hoehen: { strasse: -16, wasser: -34 },

  // Hauptinsel (Nicolas 2026-11-12, Skizze): frei gezeichneter Umriss, oben breit mit Einbuchtung, unten spitz ins Meer (Hafen an der Spitze).
  // Punkte [x, z] im Uhrzeigersinn, werden weich verbunden. Die Fluesse legen sich als Band in ihrer Breite um die Insel.
  insel: {
    name: "Gotham (Hauptinsel)",
    umriss: [[-3480, -900], [-3350, -910], [-3160, -820], [-2980, -820], [-2820, -910], [-2590, -890], [-2380, -890], [-2170, -1010], [-2010, -1240], [-1800, -1330],
      [-1650, -1450], [-1390, -1430], [-1280, -1350], [-1240, -1240], [-1090, -1100], [-980, -970], [-950, -750], [-1020, -500], [-1250, -260], [-1320, -80],
      [-1410, 150], [-1530, 310], [-1710, 510], [-1780, 700], [-1810, 970], [-1850, 1200], [-2010, 1350], [-2220, 1390], [-2360, 1380], [-2540, 1250],
      [-2700, 1020], [-2840, 930], [-2980, 740], [-3090, 560], [-3180, 280], [-3410, 100], [-3620, -150], [-3700, -360], [-3690, -640], [-3620, -770]],
  },

  // Wasser: Breite der Fluesse je Seite der Insel (East River bei der Williamsburg Bridge ca. 450-500 m), Meer im Sueden
  // Lage der Spielwelt von Wayne Manor auf der Karte (Nicolas 2026-11-12): Rondell bei x/z, Drehung in Grad im Uhrzeigersinn
  manorLage: { x: -323, z: 1318, dreh: 62 },
  wasser: {
    west: { name: "Westfluss", breite: 400 },
    ost: { name: "Ostfluss", breite: 440 },
    nord: { name: "Nordkanal", breite: 180 },
    sued: { name: "Hafenbecken (Meer)", breite: 400 },
    rundung: 140,   // Festland-Ufer abrunden (m): groesser = runder, aber schmale Kanaele werden etwas schmaler

    // Kueste von West nach Ost: suedlich davon Meer. Die Inselspitze ragt ins Meer (Hafen), danach geht sie in die bestehende Kueste im Suedosten ueber
    // Wayne Manor (Nicolas 2026-11-12): liegt bei [-323, 1318] dieser Karte und ist um 62 Grad nach rechts (im Uhrzeigersinn) gedreht (Nicolas: Hauptstrasse geht ohne Knick in den Highway), damit ihre
    // Steilkueste an die Kueste von Gotham passt (manorLage). kuesteAlt = Steilkueste der Manor (Spiel-Punkte [0, 283], [500, -217], [1000, -717],
    // [1700, -1417]): erst um manorLage.dreh gedreht, dann verschoben.
    kueste: [[-5200, 600], [-4500, 560], [-4100, 640], [-3700, 700], [-3200, 1000], [-2400, 1550], [-1650, 1420], [-1100, 1620]],
    kuesteAlt: [[-573, 1451], [103, 1658], [780, 1864], [1726, 2154]],
  },
  inseln: [
    { name: "Arkham-Insel", poly: [[-3560, 1720], [-3420, 1650], [-3240, 1660], [-3120, 1760], [-3160, 1900], [-3330, 1960], [-3510, 1900]] },
  ],

  bezirke: [
    // Bezirke an der Inselform (Nicolas 2026-11-12): Uptown im breiten Nordosten, Westseite im Westlappen, Narrows und Hafen an der Suedspitze
    { name: "Uptown (sehr reich)", wohlstand: 0.95, poly: [[-2600, -1700], [-800, -1700], [-800, -480], [-1500, -460], [-2100, -560], [-2600, -560]],
      netz: { winkel: 9, abstand: [150, 70], krumm: 22, luecken: 0.05, breite: 12 } },
    { name: "Midtown / Zentrum", wohlstand: 0.85, poly: [[-2600, -560], [-2100, -560], [-1500, -460], [-800, -480], [-800, 330], [-1500, 380], [-2250, 300], [-2600, 250]],
      netz: { winkel: -5, abstand: [110, 64], krumm: 14, luecken: 0.06, breite: 12 } },
    { name: "Westseite (Mittelstand)", wohlstand: 0.6, poly: [[-3900, -1100], [-2600, -1100], [-2600, 250], [-3900, 300]],
      netz: { winkel: 22, abstand: [92, 74], krumm: 34, luecken: 0.1, breite: 11 } },
    { name: "Südstadt (gemischt)", wohlstand: 0.45, poly: [[-2250, 300], [-1500, 380], [-800, 330], [-800, 950], [-2200, 950], [-2200, 780]],
      netz: { winkel: -16, abstand: [96, 80], krumm: 30, luecken: 0.12, breite: 11 } },
    { name: "Fabrikviertel", wohlstand: 0.25, poly: [[-3900, 300], [-2600, 250], [-2250, 300], [-2200, 780], [-3900, 780]],
      netz: { winkel: 4, abstand: [170, 120], krumm: 14, luecken: 0.25, breite: 12 } },
    { name: "The Narrows (arm, Hafen)", wohlstand: 0.1, poly: [[-3900, 780], [-2200, 780], [-2200, 950], [-800, 950], [-800, 1600], [-3900, 1600]],
      netz: { winkel: 33, abstand: [58, 44], krumm: 16, luecken: 0.16, breite: 7 } },
  ],

  // Hauptstrassen (frei gezogen, weiche Kurven). Nebenstrassen kommen automatisch aus den Bezirken (netz).
  hauptstrassen: [
    { id: "ring", name: "Wayne Circle (Ring um den Wayne Tower)", w: 22, geschlossen: true, linie: ellipse(-2050, -100, 290, 245) },
    { id: "parkrow", name: "Park Row (zweistöckig)", w: 24, zweistock: true, linie: [["O", 300], [-1640, 180], [-1770, -10]] },
    { id: "uptown-ave", name: "Uptown Avenue", w: 22, linie: [[-2050, -345], [-2000, -700], [-1980, -1000], [-1955, "N"]] },
    { id: "gotham-blvd", name: "Gotham Boulevard", w: 22, linie: [[-2050, 145], [-1990, 500], [-2080, 900], [-2120, 1240]] },
    { id: "westside", name: "Westside Drive", w: 18, linie: [[-2340, -100], [-2600, -230], [-2800, -480], [-2860, -700]] },
    // Nicolas 2026-11-12: direkter Hauptsammler vom Hub (Schurkenbasis) nach Westen bis unter die Uferstrasse West
    { id: "west-ave", name: "West Avenue", w: 20, linie: [[-2340, -100], [-2800, -125], [-3200, -160], ["W", -170]] },
    { id: "diag-nord", name: "Old Broadway (Nord)", w: 20, linie: [[-1380, -1250], [-1500, -1000], [-1680, -720], [-1820, -300]] },
    { id: "diag-sued", name: "Old Broadway (Süd)", w: 20, linie: [[-2290, 30], [-2470, 400], [-2600, 750], [-2580, 1100]] },
    { id: "crosstown", name: "Crosstown Expressway", w: 24, linie: [["O", -880], [-1300, -860], [-1620, -930], [-2050, -880], [-2450, -800], [-2860, -700], ["W", -730]] },
    // Harbor Road (Nicolas 2026-11-12: Bruecke neu analysiert): von der Suedbruecke quer durch die Narrows zum Faehranleger (Arkham)
    { id: "sued-road", name: "Harbor Road", w: 18, linie: [["O", 800], [-1950, 860], [-2150, 1000], [-2380, 1090], [-2580, 1100]] },
    { id: "industrial", name: "Industrial Way", w: 18, linie: [[-2470, 400], [-2720, 470], ["W", 520]] },
    { id: "ufer-ost", name: "Uferstrasse Ost (zweistöckig)", w: 22, zweistock: true, ufer: { seite: "ost", abstand: 95, von: -1300, bis: 1100 } },
    { id: "ufer-west", name: "Uferstrasse West", w: 16, ufer: { seite: "west", abstand: 70, von: -850, bis: 700 } },
    // ausserhalb der Insel
    { id: "highway", name: "Gotham Highway (Manor - Stadt)", w: 22, linie: [[-528, 1358], [-760, 1200], [-1000, 800], ["Oa", 300]] },   // ab Suedwest-Ende der Manor-Hauptstrasse (Spiel -61 / 200, umgerechnet)
    // Festland Ost: verbindet die Enden von Nord-, Highway- und Suedbruecke (vorher endeten Nord- und Suedbruecke ohne Strasse)
    { id: "ost-festland", name: "East Shore Road (Festland Ost)", w: 18, linie: [["Oa", -880], [-420, -600], [-420, -150], [-500, 290], [-800, 600], [-1000, 800]] },   // endet am Highway (Manor jetzt im Sueden)
    // Nicolas 2026-11-12: Strasse von der Suedbruecke muendet kurz nach der Bruecke in den Highway (ab dort eine Strasse)
    { id: "harbor-zubringer", name: "Harbor-Zubringer (Südbrücke - Highway)", w: 18, linie: [["Oa", 800], [-1080, 740], [-830, 507]] },
    { id: "nord-zufahrt", name: "Zufahrt Norden (über die Nordkanal-Brücke)", w: 16, linie: [[-2424, "Na"], [-2470, -1450], [-2560, -1800]] },
    { id: "nord-anschluss", name: "Anschluss Nordkanal-Brücke", w: 16, linie: [[-2424, -870], [-2445, -800]] },
    { id: "hauptstrasse", name: "Hauptstrasse (besteht)", w: 8, besteht: true, linie: [[-528, 1358], [-471, 1397], [-422, 1425], [-382, 1438], [-345, 1443], [-311, 1457], [-274, 1487], [-224, 1503], [-161, 1495], [-94, 1472], [-11, 1442]] },   // Spiel-Punkte (-61 / 200 ... 256 / -217) mit manorLage umgerechnet
    { id: "west-nord", name: "Zufahrt Westen (Nord)", w: 16, linie: [["Wa", -730], [-4250, -760], [-4450, -820]] },
    { id: "west-sued", name: "Zufahrt Westen (Süd)", w: 16, linie: [["Wa", 520], [-3700, 480], [-4100, 520]] },
  ],
  // Haengebruecken (Fahrbahn auf Strassenhoehe; Tuerme stehen automatisch an den Ufern)
  // spanne = Laenge ueber dem Wasser zwischen den Tuermen (m) fuer die Seitenansicht; die Karte misst nach und meldet, wenn die Zahl nicht mehr stimmt
  bruecken: [
    { name: "Gotham-Highway-Brücke", spanne: 414, w: 26, seite: "ost", z: 300 },
    { name: "Nordbrücke (Crosstown)", spanne: 430, w: 24, seite: "ost", z: -880 },
    // Nicolas 2026-11-12: vorher bei z 1050, dort war der Ostfluss schon Meer - die Bruecke endete im Wasser, ohne Strasse am Ostufer
    { name: "Südbrücke (Harbor)", spanne: 436, w: 22, seite: "ost", z: 800 },
    // Nicolas 2026-11-12: Bruecke nach Norden ueber den Nordkanal (bei x -2424 / z -946)
    { name: "Nordkanal-Brücke", spanne: 272, w: 20, seite: "nord", x: -2424 },
    { name: "Westbrücke Nord", spanne: 364, w: 20, seite: "west", z: -730 },
    { name: "Westbrücke Süd", spanne: 416, w: 20, seite: "west", z: 520 },
  ],
  // Faehren (Nicolas 2026-11-12: nach Arkham eine Faehre statt einer Bruecke): Route uebers Wasser von Anleger zu Anleger
  faehren: [
    { name: "Arkham-Fähre", linie: [[-2640, 1140], [-2850, 1360], [-3040, 1560], [-3185, 1680]], notiz: "Autofähre zwischen dem Anleger in den Narrows und Arkham Asylum, einzige Verbindung zur Arkham-Insel." },
  ],

  // U-Bahn (Nicolas 2026-11-12): ein Zentrumsring um den Wayne Tower und drei Ringe in den Lappen der Insel (Uptown, Westseite, Sueden).
  // Jeder Ring ist eine Ringlinie mit zwei Gleisen (Zuege in beide Richtungen, Vorbild Yamanote-Linie Tokio). Wo sich Ringe kreuzen,
  // entsteht automatisch eine Umsteigestation mit Gleisverbindungen (Weichen), dort koennen Zuege auf den anderen Ring wechseln. Ring = Ellipse: Mitte cx/cz, Halbachsen rx/rz, dreh = Drehung in Grad.
  // Stationen per Winkel a in Grad auf der Ellipse (0 = Osten, 90 = Sueden, 180 = Westen, 270 = Norden), nicht naeher als 120 m an einer Umsteigestation.
  ubahn: {
    wechsel: 140,   // Gleisverbindungen an den Umsteigestationen: Weichen so viele m vor der Kreuzung, Zuege koennen den Ring wechseln (Nicolas 2026-11-12)
    ringe: [
      { name: "Ring 1 Zentrum", farbe: "#ff5a5a", cx: -2150, cz: -80, rx: 540, rz: 470,
        stationen: [{ name: "Hauptbahnhof", a: 0, haupt: true }, { name: "Gericht", a: 45 }, { name: "Polizeipräsidium", a: 140 }, { name: "Museumsmeile", a: 200 }, { name: "Kathedrale", a: 250 }, { name: "Park Row", a: 300 }] },
      { name: "Ring 2 Uptown", farbe: "#ffd43b", cx: -1720, cz: -790, rx: 400, rz: 430, dreh: -20,
        stationen: [{ name: "Uptown", a: 250 }, { name: "Kunstmuseum", a: 300 }, { name: "Diamond District", a: 355 }, { name: "Uptown Ost", a: 40 }, { name: "Crosstown", a: 205 }] },
      { name: "Ring 3 Westseite", farbe: "#74c0fc", cx: -3030, cz: -320, rx: 470, rz: 380,
        stationen: [{ name: "Westseite", a: 180 }, { name: "Westside Drive", a: 250 }, { name: "Westseite Nord", a: 300 }, { name: "Krankenhaus West", a: 90 }, { name: "Industrial Way", a: 130 }] },
      { name: "Ring 4 Süd", farbe: "#a9e34b", cx: -2230, cz: 800, rx: 320, rz: 450,
        stationen: [{ name: "Stadion", a: 330 }, { name: "Südstadt", a: 20 }, { name: "Hafen", a: 90 }, { name: "Narrows", a: 150, notiz: "Graffiti NBR im Tunnel Richtung Fabrikviertel" }, { name: "Fabrikviertel", a: 210 }] },
    ],
    depot: { name: "Abstellanlage (Züge ausser Betrieb, am Gleisnetz)", x: -1450, z: -330, w: 120, d: 60, gleis: [[-1780, 100], [-1650, -120], [-1500, -300]] },
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
    hauptsammler: ["ring", "uptown-ave", "gotham-blvd", "parkrow", "crosstown", "sued-road", "ufer-ost", "ufer-west", "west-ave"],
    gulliAbstand: 70,
    // Nebensammler (Nicolas 2026-11-11): beginnt direkt unter dem Gullideckel (Scheitel ca. 1,2 m unter der Strasse), 3 m hoch (Batpod mit Fahrer passt), im Bogen mit
    // hoechstens ca. 12 % Gefaelle
    // bergab, muendet seitlich auf Bodenhoehe in den Hauptsammler (Wasser fliesst dorthin, man kommt zu Fuss und mit dem Batpod bis in den Hauptsammler). Nur unter Nebenstrassen, die einen
    // Hauptsammler beruehren, und nur die letzten `laenge` m vor der Einmuendung, davon nur `anteil` (nicht unter jeder Strasse).
    neben: { laenge: 150, anteil: 0.5, hoehe: 3, scheitel: -1.2, maxGefaelle: 0.12 },   // anteil = Anteil der einmuendenden Nebenstrassen mit Nebensammler (fest ausgewaehlt)
    auslass: { rohr: 6, wand: 14, wasser: 36, tiefe: 24 },   // Rohrdurchmesser, Breite Stirnwand, Breite am Wasser, Tiefe der Nische (m)
    hub: { name: "Zentraler Knoten unter dem Wayne Tower (grösster Teil des Netzes, Schurkenbasis)", x: -2050, z: -100, r: 170 },
  },

  orte: [
    // --- Wahrzeichen ---
    { id: "wayne-tower", typ: "wahrzeichen", name: "Wayne Tower", x: -2050, z: -100, w: 70, d: 70, h: 320,
      notiz: "Zentrum, im Wayne Circle. Befahrbare Tiefgarage (2 Ebenen). Direkt darunter geheimer Stock (Vorbild karten/planung/wayne-geheimstock-vorbild.png: weite niedrige Halle, viele runde Pfeiler, runde Deckenlampen, graue Wände, glänzender Boden): Tumbler, Prototypen, Gadgets. Darunter Kanal-Hub mit Schurkenbasis." },
    { id: "gcpd", typ: "oeffentlich", name: "Polizeipräsidium (Batsignal auf dem Dach)", x: -2200, z: 330, w: 80, d: 60, h: 45 },
    { id: "arkham", typ: "wahrzeichen", name: "Arkham Asylum", x: -3340, z: 1800, w: 220, d: 160, h: 30, aussen: true, notiz: "Eigene Insel vor der Küste, nur mit der Arkham-Fähre." },
    { id: "faehre-narrows", typ: "verkehr", name: "Fähranleger Narrows (Arkham-Fähre)", x: -2620, z: 1125, w: 30, d: 20, ufer: true, notiz: "Anleger mit Rampe für Autos und Wartebereich, Ende der Harbor Road." },
    { id: "faehre-arkham", typ: "verkehr", name: "Fähranleger Arkham", x: -3190, z: 1690, w: 30, d: 20, aussen: true, notiz: "Anleger an der Arkham-Insel, vor dem Tor der Anstalt." },
    { id: "hafen", typ: "industrie", name: "Hafen / Containerterminal", x: -2070, z: 1350, w: 420, d: 90, ufer: true, notiz: "An der Südspitze der Insel, direkt am Meer (Schiffe müssen unter keiner Brücke durch). Kräne, Container, Lagerhallen." },
    // --- Oeffentlich ---
    { id: "gericht", typ: "oeffentlich", name: "Gerichtsgebäude", x: -1880, z: 330, w: 70, d: 50, h: 35 },
    { id: "kirche", typ: "oeffentlich", name: "Kathedrale", x: -2560, z: 40, w: 50, d: 90, h: 60 },
    { id: "kh-1", typ: "gesundheit", name: "Krankenhaus Uptown", x: -1560, z: -1300, w: 90, d: 70, h: 50 },
    { id: "kh-2", typ: "gesundheit", name: "Krankenhaus Westseite", x: -2680, z: -40, w: 80, d: 60, h: 40 },
    { id: "kh-3", typ: "gesundheit", name: "Krankenhaus Südstadt", x: -1930, z: 1180, w: 80, d: 60, h: 35 },
    { id: "heim-1", typ: "gesundheit", name: "Kinderheim West", x: -2750, z: -300, w: 40, d: 30, h: 12 },
    { id: "heim-2", typ: "gesundheit", name: "Kinderheim Narrows", x: -2300, z: 1260, w: 40, d: 30, h: 12 },
    { id: "krippe-1", typ: "gesundheit", name: "Kinderkrippe Uptown", x: -1400, z: -740, w: 25, d: 20, h: 6 },
    { id: "krippe-2", typ: "gesundheit", name: "Kinderkrippe Westseite", x: -2420, z: -330, w: 25, d: 20, h: 6 },
    { id: "krippe-3", typ: "gesundheit", name: "Kinderkrippe Südstadt", x: -1960, z: 700, w: 25, d: 20, h: 6 },
    // --- Freizeit ---
    { id: "stadion", typ: "freizeit", form: "stadion", name: "Football-Stadion (oben offen)", x: -2150, z: 540, w: 220, d: 160, h: 14.1, notiz: "Oben offen, kein Dach. Tribünen 3 Stockwerke (je 4,7 m), Sitzreihen 0,4 m hoch und 0,8 m tief. Ränge rundum, Spielfeld in der Mitte." },
    { id: "museum-1", typ: "freizeit", name: "Kunstmuseum", x: -1700, z: -1160, w: 100, d: 60, h: 25 },
    { id: "museum-2", typ: "freizeit", name: "Naturkundemuseum", x: -2060, z: -1000, w: 90, d: 70, h: 25 },
    { id: "event", typ: "freizeit", name: "Eventgebäude (Spendengala, Hochzeit)", x: -1900, z: -560, w: 90, d: 60, h: 20 },
    { id: "pinguin", typ: "freizeit", name: "Club des Pinguins (Eingang an der unteren Uferstrasse)", x: -1770, z: 470, w: 50, d: 40, h: 12, ebene: -5.5,
      notiz: "Eingang an der unteren Strasse (Lower Level) unter der Uferstrasse Ost. Geht über mehrere Ebenen nach unten (siehe Seitenansicht)." },
    { id: "obdachlos", typ: "freizeit", name: "Obdachlosenlager (untere Strasse)", x: -1290, z: -320, w: 30, d: 120, ebene: -5.5,
      notiz: "Unter der zweistöckigen Uferstrasse Ost: oben normaler Verkehr, unten Lager mit Feuertonnen." },
    // --- Banken ---
    { id: "bank-g1", typ: "bank", name: "Grossbank (Tresorkeller)", x: -1700, z: -380, w: 60, d: 50, h: 120 },
    { id: "bank-g2", typ: "bank", name: "Grossbank (Tresorkeller)", x: -1560, z: -600, w: 60, d: 50, h: 150 },
    { id: "bank-g3", typ: "bank", name: "Grossbank (Tresorkeller)", x: -2250, z: -720, w: 55, d: 45, h: 90 },
    { id: "bank-k1", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -2650, z: 1000, w: 15, d: 12, h: 5 },
    { id: "bank-k2", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -1800, z: 630, w: 15, d: 12, h: 5 },
    { id: "bank-k3", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -2520, z: -850, w: 15, d: 12, h: 5 },
    { id: "bank-k4", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -1350, z: -200, w: 15, d: 12, h: 5 },
    ...[[-1900, -160], [-1600, 60], [-2350, -350], [-2550, 650], [-2140, 1020], [-1580, 320], [-1800, -1260], [-2850, -820], [-2450, 1300], [-1870, 1160], [-2200, 60], [-1450, -500]]
      .map(([x, z], i) => ({ id: "atm-" + (i + 1), typ: "atm", name: "Bankautomat", x, z, w: 4, d: 4 })),
    // --- Hotels ---
    { id: "hotel-l1", typ: "hotel", name: "Luxushotel", x: -1850, z: -1230, w: 60, d: 50, h: 180 },
    { id: "hotel-l2", typ: "hotel", name: "Luxushotel", x: -2400, z: -600, w: 55, d: 45, h: 140 },
    { id: "hotel-b1", typ: "hotel", name: "Billighotel", x: -2630, z: 1030, w: 30, d: 25, h: 20 },
    { id: "hotel-b2", typ: "hotel", name: "Billighotel", x: -1870, z: 1110, w: 30, d: 25, h: 18 },
    { id: "hotel-b3", typ: "hotel", name: "Billighotel", x: -2820, z: 360, w: 30, d: 25, h: 18 },
    // --- Laeden ---
    { id: "juw-1", typ: "laden", name: "Juwelier", x: -1950, z: -480, w: 20, d: 15, h: 8 },
    { id: "juw-2", typ: "laden", name: "Juwelier", x: -1750, z: -1000, w: 20, d: 15, h: 8 },
    { id: "juw-3", typ: "laden", name: "Juwelier", x: -2300, z: -450, w: 20, d: 15, h: 8 },
    { id: "schneider-1", typ: "laden", name: "Massschneider (teuer)", x: -2150, z: -960, w: 18, d: 14, h: 8 },
    { id: "schneider-2", typ: "laden", name: "Massschneider (teuer)", x: -1500, z: -790, w: 18, d: 14, h: 8 },
    { id: "kleider-n1", typ: "laden", name: "Kleiderladen (normal)", x: -1880, z: 560, w: 30, d: 20, h: 8 },
    { id: "kleider-n2", typ: "laden", name: "Kleiderladen (normal)", x: -2420, z: 150, w: 30, d: 20, h: 8 },
    { id: "kleider-b1", typ: "laden", name: "Kleider-Billigladen", x: -2550, z: 1070, w: 25, d: 18, h: 6 },
    { id: "kleider-b2", typ: "laden", name: "Kleider-Billigladen", x: -1850, z: 970, w: 25, d: 18, h: 6 },
    { id: "kleider-b3", typ: "laden", name: "Kleider-Billigladen", x: -2380, z: 760, w: 25, d: 18, h: 6 },
    { id: "waffen-1", typ: "laden", name: "Waffenladen", x: -2620, z: 560, w: 20, d: 15, h: 6 },
    { id: "waffen-2", typ: "laden", name: "Waffenladen", x: -1840, z: 910, w: 20, d: 15, h: 6 },
    { id: "auto-billig", typ: "laden", name: "Autohaus (billig)", x: -2800, z: 660, w: 70, d: 50, h: 8, notiz: "Echte Filiale der Fahrzeug-Kette aus dem Computer-Shop." },
    { id: "auto-teuer", typ: "laden", name: "Autohaus (teuer)", x: -1560, z: -1200, w: 70, d: 50, h: 12 },
    // --- Essen ---
    ...[[-1600, -280], [-2150, -520], [-2550, -660], [-1850, 240], [-1520, 240], [-2350, 600]].map(([x, z], i) => ({ id: "bar-" + (i + 1), typ: "essen", name: i % 2 ? "Restaurant" : "Bar", x, z, w: 20, d: 15, h: 8 })),
    ...[[-2570, 1150], [-2450, 960], [-2850, 780], [-2300, 1360]].map(([x, z], i) => ({ id: "fastfood-" + (i + 1), typ: "essen", name: "Billig-Fast-Food", x, z, w: 15, d: 12, h: 5 })),
    // --- Verkehr ---
    { id: "busbahnhof", typ: "verkehr", name: "Busbahnhof", x: -1580, z: 130, w: 90, d: 50, h: 10 },
    { id: "taxi", typ: "verkehr", name: "Taxi-Depot (Taxis ausser Betrieb)", x: -2660, z: 330, w: 70, d: 45, h: 10 },
    ...[[-1900, -250], [-1680, 300], [-2270, -880], [-2700, 720], [-1850, 870]].map(([x, z], i) => ({ id: "parkhaus-" + (i + 1), typ: "verkehr", name: "Parkhaus", x, z, w: 40, d: 30, h: 18 })),
    // --- Industrie ---
    ...[[-2830, 230], [-2660, 230], [-2400, 640], [-2880, 600]].map(([x, z], i) => ({ id: "fabrik-" + (i + 1), typ: "industrie", name: "Fabrik", x, z, w: 70, d: 45, h: 15 })),
    // --- Geheim ---
    { id: "container-base", typ: "geheim", name: "Container (Aufzug zur geheimen Batman-Basis)", x: -1470, z: 181, markiert: true, w: 6.1, d: 2.4, ufer: true,
      notiz: "Ganz normaler 20-Fuss-Seecontainer am Ostufer (Nicolas 2026-11-12: bei x -1470 / z 181) (Foto von Nicolas): blau, Wellblech, zweiflügelige Tür mit Verriegelungsstangen, keine Fenster. 6,06 x 2,44 x 2,59 m, innen ca. 5,9 m lang. Er ist ein Aufzug (fährt samt Auto hinunter)." },
    { id: "bunker", typ: "geheim", name: "Batman-Basis unter dem Container (Halle mit Lichtdecke)", x: -1540, z: 181, w: 90, d: 50, ebene: -5.5,
      notiz: "Flache, weite Halle auf Höhe der Tiefgarage 1 (Boden 5,5 m unter der Strasse, ca. 4,7 m hoch): Sichtbetonwände, die ganze Decke ein Raster aus Lichtpaneelen (Foto von Nicolas), glatter Betonboden. Batmobil in der Mitte, Anzug fährt aus dem Boden, Motorrad und Batpod fahren aus der Wand, hinten Reifenstapel und Werkbank, Computer, aufklappbare Wand mit Waffen und Gadgets, Geheimwand mit Tresor (Goldbarren, Bargeld)." },
    { id: "schurkenbasis", typ: "geheim", name: "Schurkenbasis im Kanalnetz", x: -2050, z: -60, w: 120, d: 80, ebene: -28.5,
      notiz: "Runde, hohe Halle im Kanal-Hub direkt unter dem geheimen Wayne-Stock (der Tumbler steht genau darüber), Vorbild karten/planung/schurkenbasis-vorbild-*: Pfeiler rundum, Stahlstege mit Geländern auf mehreren Ebenen, Gitterboden, Abwasser stürzt als Wasserfall in einen gemauerten Kanal. Dazu Waffen unter Planen, herumliegende Waffen, Tisch mit Computer, Boxsack." },
    ...[[-2780, 930], [-2480, 1260], [-2350, 1050], [-2750, 900]].map(([x, z], i) => ({ id: "drogen-" + (i + 1), typ: "geheim", name: "Geheimes Drogenversteck", x, z, w: 10, d: 10 })),
    // --- Baustellen (eine Vorlage, mehrfach eingesetzt) ---
    ...[[-2030, -1100], [-1300, -620], [-2780, -860], [-1850, 460], [-2580, -830], [-2000, 1270], [-2700, -230], [-2200, 680]]
      .map(([x, z], i) => ({ id: "baustelle-" + (i + 1), typ: "baustelle", name: "Baustelle (Platzhalter)", x, z, w: 60, d: 50, status: "baustelle" })),
    // --- Bestehend ---
    { id: "manor", typ: "manor", name: "Wayne Manor (besteht)", x: -346, z: 1307, dreh: 62, w: 70, d: 95, status: "gebaut", aussen: true },
  ],

  // Seitenansicht (gotham/schnitt.html): senkrechter Schnitt von West nach Ost, waagrecht NICHT massstaeblich, senkrecht in Metern.
  // y = Meter relativ zur Strassenebene (0 = Welt-y hoehen.strasse = Fahrbahn der Bruecken). x = Position im Bild (Gotham 0..3700, danach Detail Nebensammler und Vergleich mit Wayne Manor). Gebaeude: breite = echte Breite in m (gezeichnet massstaeblich, Mass unten), geschoss = logische Geschosshoehe in m (Stockwerke werden gezeichnet und gezaehlt), eg = hoeheres Erdgeschoss (z. B. Empfangshalle), echt = wirkliche Hoehe, wenn oben abgeschnitten.
  // REGEL (Nicolas 2026-11-11): Geschosse in Gotham immer mindestens 4,7 m (wie das Erdgeschoss von Wayne Manor), hoeher nur fuer Hallen wie Empfang.
  schnitt: {
    gothamBis: 4750,   // Ende des Gotham-Teils (Trennlinie, Beschriftung Osten)
    ebenen: [   // Masskette rechts (Boden bzw. Oberkante der Ebene)
      { y: 62, name: "Brückentürme (Spitze)" },
      { y: 51, name: "Wayne Manor: Dach (Welt 35)" },
      { y: 41, name: "Wayne Manor: Plateau / Erdgeschoss (Welt 25)" },
      { y: 31, name: "Klippenkante bei der Manor, höchste Stelle (Welt 15)" },
      { y: 0, name: "Strasse = Brückenfahrbahn" },
      { y: -5.5, name: "Tiefgarage 1 = untere Strasse = Club-Bar = Batman-Basis" },
      { y: -11, name: "Tiefgarage 2 = U-Bahn-Bahnsteig" },
      { y: -17.5, name: "Club: Keller / VIP" },
      { y: -13.5, name: "Club: Tanzfläche" },
      { y: -1.2, name: "Nebensammler: Scheitel unter dem Gullideckel" },
      { y: -8, name: "Geheimer Wayne-Stock (direkt unter dem Wayne Tower)" },
      { y: -17, name: "Kanal-Sohle (Hauptsammler) = Boden Kanal-Hub / Schurkenbasis" },
      { y: -10, name: "Kanal-Auslass (Rohr oben)" },
      { y: 17, name: "Klippenkante bei der Manor, tiefste Stelle (Welt 1)" },
      { y: 0, name: "Batcave oben (Welt −16)" },
      { y: -12, name: "Batcave unten (Welt −28)" },
      { y: -18, name: "Wasserspiegel (Fluss, Meer) / Auslass-Sohle" },
      { y: -22, name: "Meeresgrund am Fuss der Manor-Klippe (Welt −38)" },
      { y: -30, name: "Flussgrund" },
    ],
    teile: [
      // typ: wasser, grund, mauer, deck, strasse, raum, gebaeude, turm, rohr, text; x0/x1 waagrecht, y0/y1 senkrecht (m)
      { typ: "grund", x0: 0, x1: 4750, y0: -60, y1: 0 },
      { typ: "wasser", name: "Westfluss", x0: 0, x1: 400, y0: -30, y1: -18 },
      { typ: "wasser", name: "Ostfluss", x0: 4350, x1: 4750, y0: -30, y1: -18 },
      { typ: "luft", x0: 0, x1: 400, y0: -18, y1: 0 }, { typ: "luft", x0: 4350, x1: 4750, y0: -18, y1: 0 },
      { typ: "mauer", name: "Kaimauer", x0: 400, x1: 426, y0: -30, y1: 0 },
      { typ: "mauer", name: "Kaimauer", x0: 4324, x1: 4350, y0: -30, y1: 0 },
      // Flussufer (Nicolas 2026-11-11): am Fuss der Kaimauer ein Streifen Kies/Sand knapp ueber dem Wasser, dann weich tiefer bis zum Grund
      { typ: "ufer", name: "Kies/Sand am Ufer, dann tiefer", seite: "west", x0: 0, x1: 400, y0: -30, kies: 0.6, strand: 45 },
      { typ: "ufer", name: "Kies/Sand am Ufer, dann tiefer", seite: "ost", x0: 4350, x1: 4750, y0: -30, kies: 0.6, strand: 45 },
      { typ: "deck", name: "Westbrücke (Fahrbahn)", x0: 0, x1: 528, y0: -1.5, y1: 0 },
      { typ: "turm", name: "Brückenturm", x0: 371, x1: 397, y0: -18, y1: 62 },
      { typ: "deck", name: "Highway-Brücke (Fahrbahn)", x0: 4222, x1: 4750, y0: -1.5, y1: 0 },
      { typ: "turm", name: "Brückenturm", x0: 4353, x1: 4379, y0: -18, y1: 62 },
      { typ: "kabel", x0: 0, x1: 384, y0: 2, y1: 62 }, { typ: "kabel", x0: 4366, x1: 4750, y0: 2, y1: 62 },
      // Kanal: Hauptsammler quer durch, an beiden Ufern Absturzschacht und Auslass auf Wasserhoehe
      { typ: "rohr", name: "Hauptsammler (begehbar, 6 m)", x0: 400, x1: 1112, y0: -17, y1: -11 },
      { typ: "rohr", name: "Hauptsammler", x0: 1687, x1: 4350, y0: -17, y1: -11 },
      { typ: "text", name: "Hauptsammler führt hier neben\nClub und U-Bahn vorbei", x0: 1132, x1: 1672, y0: -14, y1: -14 },
      { typ: "schacht", name: "Absturzschacht", x0: 426, x1: 448, y0: -18, y1: -11, farbe: "#7bd88f" }, { typ: "schacht", name: "Absturzschacht", x0: 4302, x1: 4324, y0: -18, y1: -11, farbe: "#7bd88f" },
      { typ: "auslass", name: "Kanal-Auslass (Rohr 6 m, Gitter, Pflaster, Treppe)", x0: 320, x1: 448, y0: -18, y1: -10, seite: "west" },
      { typ: "auslass", name: "Kanal-Auslass (Rohr 6 m, Gitter, Pflaster, Treppe)", x0: 4302, x1: 4430, y0: -18, y1: -10, seite: "ost" },
      { typ: "schacht", name: "Gullideckel + Leiter", x0: 895, x1: 908, y0: -11, y1: 0 }, { typ: "schacht", name: "Gullideckel + Leiter", x0: 3136, x1: 3149, y0: -11, y1: 0 },
      // Narrows
      { typ: "strasse", name: "Uferstr. West", x0: 426, x1: 576, y0: -0.6, y1: 0 },
      { typ: "container", name: "Container = Aufzug (20 Fuss, keine Fenster)", x0: 540, y0: 0, laenge: 6.06, hoehe: 2.59, farbe: "#1f3f8f" },
      { typ: "schacht", name: "Aufzugschacht", x0: 540, x1: 625, y0: -5.5, y1: 0, farbe: "#ff4fd8" },
      { typ: "raum", name: "Batman-Basis (Lichtdecke)", x0: 432, x1: 704, y0: -5.5, y1: -0.8, farbe: "#ff4fd8", licht: true },
      { typ: "gebaeude", name: "Mietshaus (Narrows)", x0: 640, x1: 892, y0: 0, y1: 18.8, geschoss: 4.7, breite: 18 },
      // zweistoeckige Strasse mit Club
      { typ: "deck", name: "Zweistöckige Strasse: oben normaler Verkehr", x0: 892, x1: 1292, y0: -1, y1: 0 },
      { typ: "strasse", name: "Untere Strasse (Lower Level)", x0: 892, x1: 1292, y0: -6, y1: -5.5 },
      { typ: "raum", name: "Obdachlose", x0: 908, x1: 1036, y0: -5.5, y1: -2 },
      { typ: "raum", name: "Club-Eingang", x0: 1068, x1: 1132, y0: -5.5, y1: -1.6, farbe: "#5fd3e6" },
      { typ: "raum", name: "Club: Bar (Höhe Tiefgarage 1)", x0: 1132, x1: 1388, y0: -5.5, y1: -1.6, farbe: "#5fd3e6" },
      { typ: "raum", name: "Club: Tanzfläche", x0: 1132, x1: 1420, y0: -13.5, y1: -6.1, farbe: "#5fd3e6" },
      { typ: "raum", name: "Club: Keller / VIP", x0: 1164, x1: 1356, y0: -17.5, y1: -13.5, farbe: "#5fd3e6" },
      // U-Bahn
      { typ: "raum", name: "U-Bahn-Station (Strecken dazwischen frei tiefer)", x0: 1452, x1: 1676, y0: -12.1, y1: -1.6, farbe: "#ff5a5a" },
      { typ: "raum", name: "Bahnsteig", x0: 1452, x1: 1564, y0: -11.6, y1: -11, farbe: "#ffb3b3" },
      { typ: "strasse", name: "Strasse", x0: 1292, x1: 1740, y0: -0.6, y1: 0 },
      // Wayne Tower
      { typ: "gebaeude", name: "Wayne Tower (320 m, oben abgeschnitten)", x0: 1756, x1: 2736, y0: 0, y1: 75, farbe: "#e8c547", geschoss: 4.7, eg: 9.4, echt: 320, breite: 70 },
      { typ: "raum", name: "Tiefgarage 1", x0: 2756, x1: 3012, y0: -5.5, y1: 0, farbe: "#9aa4b2" },
      { typ: "raum", name: "Tiefgarage 2", x0: 2756, x1: 3012, y0: -11, y1: -5.5, farbe: "#9aa4b2" },
      { typ: "strasse", name: "Strasse", x0: 2736, x1: 3036, y0: -0.6, y1: 0 },
      { typ: "raum", name: "Geheimer Wayne-Stock\n(Tumbler, Prototypen)", x0: 1756, x1: 2736, y0: -8, y1: 0, farbe: "#ff4fd8" },
      { typ: "raum", name: "Kanal-Hub / Schurkenbasis", x0: 1692, x1: 2746, y0: -17, y1: -8, farbe: "#7bd88f" },
      // Midtown und Uferstrasse Ost
      { typ: "strasse", name: "Strasse", x0: 3046, x1: 3222, y0: -0.6, y1: 0 },
      { typ: "gebaeude", name: "Bank (Midtown)", x0: 3238, x1: 4078, y0: 0, y1: 60, geschoss: 4.7, eg: 7, breite: 60 },
      // Bank: Tresorkeller auf der Hoehe der Tiefgarage 1, direkt daneben (Nicolas 2026-11-11), darunter Tiefgarage 2
      { typ: "raum", name: "Tiefgarage 1", x0: 3238, x1: 3658, y0: -5.5, y1: 0, farbe: "#9aa4b2" },
      { typ: "raum", name: "Tresorkeller", x0: 3658, x1: 4078, y0: -5.5, y1: 0, farbe: "#3ddc97" },
      { typ: "raum", name: "Tiefgarage 2", x0: 3238, x1: 4078, y0: -11, y1: -5.5, farbe: "#9aa4b2" },
      { typ: "deck", name: "Uferstrasse Ost (oben)", x0: 4094, x1: 4324, y0: -1, y1: 0 },
      // Groessenvergleich: Rolls-Royce Spectre aus dem Spiel (1,6 m hoch, 5,34 m lang), in echten Proportionen
      { typ: "auto", name: "Rolls-Royce Spectre (Strasse)", x0: 1352, y0: 0, laenge: 5.34, hoehe: 1.6 },
      { typ: "auto", name: "Rolls-Royce Spectre (untere Strasse)", x0: 962, y0: -5.5, laenge: 5.34, hoehe: 1.6 },
      { typ: "auto", name: "Rolls-Royce Spectre (Batman-Basis)", x0: 610, y0: -5.5, laenge: 5.34, hoehe: 1.6 },
      { typ: "auto", name: "Rolls-Royce Spectre (Tiefgarage Wayne Tower)", x0: 2836, y0: -5.5, laenge: 5.34, hoehe: 1.6 },
      { typ: "auto", name: "Rolls-Royce Spectre (Brücke)", x0: 4570, y0: 0, laenge: 5.34, hoehe: 1.6 },
      // Alle Gebaeudetypen je einmal (Nicolas 2026-11-11), echte Breite und Geschosse; Typen, die schon im Schnitt stehen, fehlen hier
      { gruppe: "typen", typ: "titel", name: "Alle Gebäudetypen (je einmal, echte Breite und Höhe)", x0: 4850, x1: 18038, y0: 60, y1: 60 },
      { gruppe: "typen", typ: "grund", x0: 4810, x1: 18078, y0: -60, y1: 0 },
      { gruppe: "typen", typ: "strasse", name: "Strasse", x0: 4830, x1: 18058, y0: -0.6, y1: 0 },
      { gruppe: "typen", typ: "gebaeude", name: "Polizeipräsidium (öffentlich, Batsignal auf dem Dach)", x0: 4850, x1: 5970, y0: 0, y1: 47, farbe: "#6aa9ff", geschoss: 4.7, eg: 9.4, breite: 80 },
      { gruppe: "typen", typ: "text", name: "☾ Batsignal", x0: 4850, x1: 5970, y0: 50, y1: 50 },
      { gruppe: "typen", typ: "gebaeude", name: "Krankenhaus (Gesundheit)", x0: 6138, x1: 7398, y0: 0, y1: 49.3, farbe: "#ff6b6b", geschoss: 4.7, eg: 7, breite: 90 },
      { gruppe: "typen", typ: "gebaeude", name: "Luxushotel", x0: 7566, x1: 8406, y0: 0, y1: 75, farbe: "#c58cff", geschoss: 4.7, eg: 9.4, echt: 178.6, breite: 60 },
      { gruppe: "typen", typ: "gebaeude", name: "Juwelier (Laden)", x0: 8574, x1: 8854, y0: 0, y1: 9.4, farbe: "#ff9f43", geschoss: 4.7, breite: 20 },
      { gruppe: "typen", typ: "gebaeude", name: "Bar / Restaurant", x0: 9022, x1: 9302, y0: 0, y1: 9.4, farbe: "#ffd36b", geschoss: 4.7, breite: 20 },
      { gruppe: "typen", typ: "gebaeude", name: "Parkhaus (Verkehr)", x0: 9470, x1: 10030, y0: 0, y1: 18.8, farbe: "#9aa4b2", geschoss: 4.7, breite: 40 },
      { gruppe: "typen", typ: "gebaeude", name: "Museum (Freizeit)", x0: 10198, x1: 11598, y0: 0, y1: 23.5, farbe: "#5fd3e6", geschoss: 4.7, eg: 9.4, breite: 100 },
      { gruppe: "typen", typ: "gebaeude", name: "Drogenversteck (geheim)", x0: 11766, x1: 11906, y0: 0, y1: 4.7, farbe: "#ff4fd8", geschoss: 4.7, breite: 10 },
      { gruppe: "typen", typ: "gebaeude", name: "Baustelle (Rohbau, Platzhalter)", x0: 12074, x1: 12914, y0: 0, y1: 18.8, farbe: "#f5a623", geschoss: 4.7, breite: 60 },
      { gruppe: "typen", typ: "gebaeude", name: "Fabrik (Industrie)", x0: 13082, x1: 14062, y0: 0, y1: 14.1, farbe: "#8d7b68", geschoss: 4.7, eg: 9.4, breite: 70 },
      { gruppe: "typen", typ: "gebaeude", name: "Kaserne (Militär, ausserhalb der Stadt)", x0: 14230, x1: 15070, y0: 0, y1: 14.1, farbe: "#7f9a4e", geschoss: 4.7, breite: 60 },
      // Wohnhaus mit Laden im EG (Nicolas 2026-11-11): unten Pizzeria, darueber normale Wohnungen (typisch fuer Gotham, auch fuer Baeckerei, Kiosk, Waschsalon)
      { gruppe: "typen", typ: "gebaeude", name: "Wohnhaus mit Pizzeria (EG Laden, darüber Wohnungen)", x0: 15238, x1: 15378, y0: 0, y1: 23.5, farbe: "#c9a27a", geschoss: 4.7, breite: 10, laden: "Pizzeria", ladenFarbe: "#d94f2b", wohnung: true },
      // Football-Stadion (oben offen, Nicolas 2026-11-11), einklappbar mit den Gebaeudetypen
      { gruppe: "typen", typ: "stadion", name: "Football-Stadion (oben offen)", x0: 15546, x1: 18038, y0: 0, breite: 178, oben: [220, 160], spielfeld: 110, rand: 6, endzone: 9.1, hoehe: 14.1, feld: -2, geschoss: 4.7, reihe: 0.4, tiefe: 0.8 },   // Tribuenen 3 Stockwerke, Sitzreihen 0,4 m hoch / 0,8 m tief, Spielfeld in voller Laenge
      // Detail (Nicolas 2026-11-11, Skizze): Nebensammler beginnt direkt unter dem Gullideckel, faellt im Bogen (oben und unten flach, max. ca. 12 %)
      // und muendet seitlich auf Bodenhoehe in den Hauptsammler; 3 m hoch, damit der Batpod mit Fahrer ueberall durchkommt. Echte Proportionen.
      { typ: "titel", name: "Detail: Gullideckel → Nebensammler → Hauptsammler (echte Proportionen)", x0: 18118, x1: 20578, y0: 14, y1: 14 },
      { typ: "grund", x0: 18098, x1: 20598, y0: -60, y1: 0 },
      { typ: "strasse", name: "Nebenstrasse", x0: 18118, x1: 20578, y0: -0.6, y1: 0 },
      { typ: "neben", name: "Nebensammler (3 m hoch, Batpod passt, Gefälle zum Hauptsammler)", x0: 18138, x1: 20378, ya: -4.2, yb: -17, h: 3, kurve: true },
      { typ: "schacht", name: "Gullideckel + Leiter", x0: 18152, x1: 18165, y0: -1.2, y1: 0 },
      { typ: "schacht", name: "Gullideckel + Leiter", x0: 19252, x1: 19265, y0: -7.6, y1: 0 },
      { typ: "schacht", name: "Gullideckel + Leiter", x0: 20072, x1: 20085, y0: -13.4, y1: 0 },
      { typ: "person", name: "Person (1,8 m)", x0: 18228, y0: -4.26, hoehe: 1.8 },
      { typ: "auto", name: "Batpod mit Fahrer (ca. 2,1 m hoch)", x0: 18418, y0: -4.85, laenge: 3.8, hoehe: 2.1, farbe: "#2a2d31" },
      { typ: "rohr", name: "Hauptsammler", x0: 20358, x1: 20578, y0: -17, y1: -11 },
      // Zum Vergleich: Wayne Manor an der Steilkueste (anderer Ort, gleiche Hoehen). Werte aus dem Spiel: Plateau HILL 25, Klippe Welt 1-15,
      // Meer SEA_Y -34, Batcave unten LY -28 (10 m hoch), oben UY -16 (8,5 m), Tiefgarage GY -5,5 unter dem Plateau
      { typ: "titel", name: "Zum Vergleich: Wayne Manor an der Steilküste", x0: 20638, x1: 21018, y0: 73, y1: 73 },
      { typ: "luft", x0: 20638, x1: 20728, y0: -18, y1: 8 },
      { typ: "wasser", name: "Meer", x0: 20638, x1: 20728, y0: -22, y1: -18 },
      { typ: "profil", name: "Steilküste (Fels, 35-49 m über dem Meer)", farbe: "#5b5246",
        punkte: [[20728, -60], [20728, -18], [20722, -9], [20730, 2], [20724, 13], [20731, 24], [20727, 31], [20763, 33], [20788, 41], [21018, 41], [21018, -60], [20638, -60], [20638, -22], [20728, -22]] },
      // gemessen im Spiel (Orbit-Punkt von Nicolas, x 52 / z 227): Kante Welt +1, Meer -34, Grund am Fuss -38
      { typ: "mass", name: "35 m (gemessen bei x 52 / z 227: Kante Welt +1)", x0: 20663, y0: -18, y1: 17 },
      { typ: "mass", name: "49 m (höchste Stelle, Kante Welt +15)", x0: 20693, y0: -18, y1: 31 },
      { typ: "raum", name: "Tiefgarage Manor", x0: 20838, x1: 20968, y0: 35.5, y1: 40.6, farbe: "#9aa4b2" },
      { typ: "gebaeude", name: "Wayne Manor", x0: 20828, x1: 20978, y0: 41, y1: 51, farbe: "#d8d2c4", geschoss: 4.7, notiz: "EG und 1. OG im Hauptbau (Boden 0,6 / 5,3, Dach 10 m), darueber Theatre, Observatory, Landeplatz" },
      { typ: "schacht", name: "Aufzug", x0: 20928, x1: 20938, y0: -12, y1: 41, farbe: "#e8c547" },
      { typ: "raum", name: "Batcave oben", x0: 20808, x1: 21008, y0: 0, y1: 8.5, farbe: "#c58cff" },
      { typ: "raum", name: "Batcave unten", x0: 20778, x1: 21008, y0: -12, y1: -2, farbe: "#c58cff" },
      { typ: "wasser", name: "Höhlensee", x0: 20743, x1: 20838, y0: -18, y1: -18 },
      { typ: "strasse", name: "Uferstrasse Ost (unten)", x0: 4094, x1: 4324, y0: -6, y1: -5.5 },
    ],
  },
};
