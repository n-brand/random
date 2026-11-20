// Gotham City - Planungsdaten fuer die 2D-Karte (gotham/index.html), die Seitenansicht (gotham/schnitt.html) und spaeter den 3D-Aufbau.
// NUR DATEN. Zum Anpassen Zahlen aendern oder Eintraege kopieren, Seite neu laden. Die Karte prueft selbst und zeigt Konflikte
// (Ort auf einer Hauptstrasse, ausserhalb der Insel, Orte uebereinander) rot an und listet sie rechts.
//
// Koordinaten: Welt-Meter, x nach rechts (+x), z nach unten (+z) auf der Karte. Himmelsrichtungen gelten wie bei Wayne Manor im Spiel: die Manor liegt um
// manorLage.dreh Grad gedreht, darum zeigt Norden (Spiel -z) hier um denselben Winkel im Uhrzeigersinn gedreht (Kompass-Stern unten rechts auf der Karte).
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
  // Nicolas 2026-11-12: Insel um 4 m angehoben (vorher Strasse -16), damit unter der Strasse Decken und Reserve zum Wasser Platz haben
  hoehen: { strasse: -12, wasser: -34 },

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
    west: { name: "Südfluss", breite: 400 },
    ost: { name: "Nordfluss", breite: 440 },
    nord: { name: "Westkanal", breite: 180 },
    sued: { name: "Hafenbecken (Meer)", breite: 400 },
    rundung: 140,   // Festland-Ufer abrunden (m): groesser = runder, aber schmale Kanaele werden etwas schmaler

    // Kueste von West nach Ost: suedlich davon Meer. Die Inselspitze ragt ins Meer (Hafen), danach geht sie in die bestehende Kueste im Suedosten ueber
    // Wayne Manor (Nicolas 2026-11-12): liegt bei [-323, 1318] dieser Karte und ist um 62 Grad nach rechts (im Uhrzeigersinn) gedreht (Nicolas: Hauptstrasse geht ohne Knick in den Highway), damit ihre
    // Steilkueste an die Kueste von Gotham passt (manorLage). kuesteAlt = Steilkueste der Manor (Spiel-Punkte [0, 283], [500, -217], [1000, -717],
    // [1700, -1417]): erst um manorLage.dreh gedreht, dann verschoben.
    kueste: [[-5200, 600], [-4500, 560], [-4100, 640], [-3700, 700], [-3200, 1000], [-2400, 1550], [-1650, 1420], [-1100, 1620]],
    kuesteAlt: [[-573, 1451], [103, 1658], [780, 1864], [1726, 2154]],
    // Wasser so, wie es heute im Spiel ist (Nicolas 2026-11-20, Spielbild: "die Bucht ist nicht auf der Karte"): im Spiel abgetastet (terrainH unter SEA_Y,
    // 20-m-Raster im Kreis der heutigen Welt, Wasserlinie, vereinfacht 15 m), in Kartenkoordinaten. Ring 1 = Meer mit Fluessen (am Kreisrand abgeschnitten),
    // Ring 2 = Gotham-Insel darin. Bei Wayne Manor gilt im Spiel seaD (karte-kueste.js): grosse Bucht westlich der Manor, die Kueste laeuft nach Nordosten,
    // suedlich und oestlich der Manor ist Meer – kuesteAlt oben ist ein aelterer, gerader Stand (das Spiel nutzt ihn nur im Gotham-Raster). Nur fuer die Planungskarte.
    spiel: [[[3531,-572], [3262,-418], [3235,-426], [3111,-361], [3103,-334], [2961,-258], [2899,-248], [2891,-221], [2679,-108], [2652,-116], [2581,-79], [2573,-52], [2343,70], [2316,62], [2273,108], [2246,99], [2061,220], [1981,240], [1972,267], [1814,352], [1786,344], [1663,409], [1655,436], [1425,558], [1398,550], [1390,577], [1231,662], [1204,653], [1054,756], [1046,783], [860,859], [852,886], [728,952], [641,1043], [553,1090], [231,1465], [-7,1614], [-254,1553], [-318,1519], [-360,1462], [-457,1491], [-521,1457], [-697,1551], [-760,1562], [-800,1549], [-819,1514], [-761,1325], [-772,1262], [-854,1193], [-920,1069], [-1057,1131], [-1084,1122], [-1132,1182], [-1112,1262], [-912,1382], [-934,1405], [-1110,1351], [-1201,1264], [-1346,1205], [-1553,1156], [-1492,909], [-1390,674], [-1217,446], [-1033,280], [-947,144], [-872,-55], [-723,-202], [-611,-375], [-533,-632], [-519,-775], [-530,-882], [-568,-953], [-561,-1025], [-636,-1166], [-855,-1366], [-968,-1578], [-1032,-1612], [-1050,-1648], [-1253,-1710], [-1423,-1688], [-1476,-1659], [-1691,-1681], [-1798,-1669], [-2036,-1520], [-2063,-1528], [-2292,-1406], [-2455,-1116], [-2544,-1069], [-2705,-1074], [-2840,-1115], [-3152,-1063], [-3287,-1104], [-3547,-1124], [-3715,-1057], [-3742,-1066], [-3927,-945], [-4031,-799], [-4092,-551], [-4065,-203], [-3933,89], [-3906,97], [-3849,203], [-3528,508], [-3471,659], [-3492,726], [-3518,763], [-3607,765], [-3860,673], [-4093,661], [-4524,573], [-4571,677], [-4614,1108], [-4610,1627], [-4543,2135], [-4515,2188], [-4473,2437], [-4406,2606], [-4415,2633], [-4320,2854], [-4328,2881], [-4234,3058], [-4242,3085], [-3979,3579], [-3952,3588], [-3775,3878], [-3461,4255], [-3095,4604], [-2648,4933], [-2258,5156], [-1760,5367], [-1395,5478], [-865,5581], [-417,5615], [-14,5605], [494,5538], [547,5510], [796,5468], [965,5401], [992,5410], [1213,5315], [1240,5323], [1417,5229], [1444,5237], [1938,4974], [1947,4947], [2237,4770], [2614,4456], [2963,4090], [3292,3643], [3515,3253], [3726,2755], [3837,2390], [3940,1860], [3974,1412], [3951,858], [3867,359], [3760,30], [3769,3], [3722,-85], [3730,-112]], [[-1009,-1058], [-1210,-1223], [-1267,-1374], [-1313,-1417], [-1489,-1471], [-1650,-1476], [-1721,-1438], [-1773,-1366], [-2029,-1252], [-2175,-1016], [-2405,-893], [-2791,-937], [-2853,-927], [-3003,-825], [-3092,-823], [-3381,-941], [-3426,-939], [-3567,-864], [-3689,-709], [-3718,-615], [-3719,-319], [-3662,-169], [-3635,-160], [-3569,-37], [-3413,129], [-3303,207], [-3203,267], [-3147,373], [-3116,560], [-2948,834], [-2921,842], [-2874,930], [-2710,1024], [-2515,1306], [-2406,1384], [-2284,1421], [-2249,1402], [-2070,1398], [-1911,1313], [-1842,1231], [-1796,1082], [-1785,804], [-1724,557], [-1403,182], [-1269,-206], [-1174,-325], [-1034,-445], [-974,-545], [-936,-666], [-933,-872]]],
  },
  // Ganze Welt als eine grosse Insel (PLAN-GOTHAM N54, Nicolas 2026-11-20: "das Ganze soll eine riesige Insel werden (auch Festland); Festland soll nach oben hin
  // schon mal ohne Baeume einfach mal so in Kacheln gebaut werden und drumherum Wasser – erst aber in der Planungskarte planen"). ENTWURF, im Spiel noch nichts davon.
  // umriss: neue Kueste vom Westende der heutigen Kueste (wasser.kueste[0]) nach Norden, ueber den Norden nach Osten und zurueck bis zum Ostende der Manor-Kueste
  // (wasser.kuesteAlt, letzter Punkt; davor deren Verlaengerung nach Osten); der Sueden bleibt die bestehende Kueste (kueste + kuesteAlt). Ausserhalb = Meer.
  // Die Insel umschliesst die ganze heutige Spielwelt (heute: Kreis LIMIT_WORLD 4,3 km um die Manor, sonst gaebe es dort ploetzlich Meer); neu zu bauen ist das
  // Land ausserhalb dieses Kreises (vor allem Festland Nord ueber dem Westkanal), zuerst nur Gelaende in Kacheln ohne Baeume.
  // Nicolas 2026-11-20 (Bild mit roter Linie): "in der vertikalen Mitte horizontal schneiden und noch hoeher ziehen" – Kueste noerdlich von z -2200 um 3000 m nach Norden
  // verschoben, dazwischen gerade Kuesten (je zwei Punkte auf x der Schnittstelle). Danach ("jetzt noch links und rechts ziehen"): senkrecht bei x -5500 und 4100 (knapp
  // ausserhalb der heutigen Spielwelt) geschnitten, Kueste links davon 3000 m nach links, rechts davon 3000 m nach rechts, oben gerade Stuecke dazwischen.
  // Dann (Nicolas: Karte von Madagaskar, "analysiere nur Inselform und Silhouette, warum die echter aussieht als unsere, und pass unsere an"): Kueste mit Formen in
  // mehreren Groessen (Buchten bis 1,7 km, Kaps, Halbinsel im Nordosten, Flussmuendung im Westen) und Rauschen (2,6 km / 1,1 km / 420 m / 170 m), Ostkueste glatter (30 %),
  // Danach (Nicolas: "die neue Form ist zu rund, es soll mehr Zacken geben"): Rauschen staerker und feiner (3 km / 1,4 km / 600 m / 260 m / 120 m, bis 520 m), zehn
  // weitere kleine Buchten und Kaps, Ostkueste 45 %, kaum geglaettet, alle ca. 70 m ein Punkt (erzeugt aus umriss0, fester Zufall).
  // Danach (Nicolas 2026-11-20, Skizze Suedost): Grundumriss (umriss0) im Suedosten erweitert – Suedkueste in Richtung der Manor-Kueste weiter bis ca. [9700, 5545],
  // von dort nach Nordosten bis zur breit gerundeten Spitze um [14250, 4200] (vorher spitz: die Zacken schnitten dort einen schmalen Schlitz), Ostkueste im Bogen nach aussen ab [7780, -1400]; danach Zacken neu erzeugt (Suedost voll zackig).
  // Danach (Nicolas 2026-11-20 "Karte anpassen": Land stiess am Kreisrand gegen das heutige Meer): die Kueste schliesst bei [3531, -572] an die echte Spiel-Kueste
  // (laeuft dort nach Nordosten) an, geht weiter nach Nordosten und im Bogen nach Sueden (x ca. 5100-5900) zum Festland Suedost: das Meer suedoestlich der Manor
  // wird eine grosse Bucht, Wayne Manor bleibt am Meer; im Kreis gilt die Spiel-Kueste (wasser.spiel).
  // vorgelagerte Inselchen; Enden fest, mind. 400 m ausserhalb der heutigen Welt, alle ca. 150 m ein Punkt (erzeugt, fester Zufall).
  // Davor ("jetzt abrunden"): fein unterteilt (100 m), dreimal Gauss-geglaettet (sigma 900 m), Enden fest an der Suedkueste, mind. 400 m ausserhalb der heutigen Welt, alle ca. 700 m ein Punkt.
  welt: {
    // abgerundeter Umriss vor der Ueberarbeitung (zum Vergleichen)
    umriss0: [[-5200,600], [-5910,440], [-6660,400], [-7410,240], [-8070,-50], [-8630,-580], [-8930,-1250], [-9060,-1950], [-9110,-2720], [-9120,-3500], [-9120,-4290], [-9110,-5080], [-9070,-5830], [-8940,-6520], [-8640,-7180], [-8070,-7710], [-7390,-8010], [-6700,-8200], [-5990,-8370], [-5270,-8570], [-4550,-8800], [-3820,-9010], [-3060,-9170], [-2290,-9260], [-1520,-9280], [-750,-9230], [10,-9090], [740,-8860], [1460,-8540], [2140,-8150], [2790,-7720], [3430,-7280], [4070,-6900], [4730,-6590], [5400,-6350], [6120,-6070], [6720,-5680], [7150,-5130], [7400,-4400], [7530,-3670], [7620,-2890], [7700,-2100], [7780,-1400], [8600,-900], [9400,-150], [10050,550], [10428,1153], [10703,1657], [11150,2350], [11618,2983], [12350,3000], [12990,3120], [13540,3700], [13950,3820], [14250,4000], [14300,4250], [14050,4480], [13500,4520], [13200,4560], [12000,4750], [10800,5150], [9700,5545], [8500,5600], [7200,5300], [6200,4900], [5400,4300], [5100,3500], [5300,2700], [5700,1800], [5900,900], [5800,0], [5400,-700], [4800,-1000], [4100,-900], [3531,-572], [2600,600], [1726,2154]],
    umriss: [[-5200, 600], [-5274, 571], [-5339, 543], [-5417, 520], [-5501, 494], [-5594, 484], [-5690, 481], [-5781, 463], [-5872, 468], [-5953, 470], [-6029, 459], [-6106, 450],
      [-6184, 446], [-6264, 466], [-6344, 496], [-6427, 534], [-6510, 552], [-6594, 555], [-6677, 550], [-6760, 537], [-6836, 481], [-6911, 424], [-6989, 391], [-7053, 298],
      [-7114, 201], [-7173, 113], [-7235, 51], [-7297, 0], [-7360, -49], [-7415, -125], [-7481, -160], [-7555, -166], [-7625, -181], [-7694, -195], [-7800, -210], [-7882, -206],
      [-7977, -191], [-8082, -168], [-8192, -152], [-8274, -182], [-8382, -187], [-8507, -181], [-8631, -185], [-8701, -183], [-8771, -183], [-8898, -205], [-9009, -250], [-9091, -322],
      [-9158, -409], [-9211, -503], [-9280, -588], [-9321, -683], [-9317, -792], [-9288, -905], [-9233, -1020], [-9174, -1132], [-9100, -1243], [-9017, -1350], [-8958, -1446], [-8950, -1526],
      [-8952, -1604], [-8921, -1687], [-8903, -1768], [-8889, -1849], [-8877, -1931], [-8880, -2009], [-8871, -2087], [-8849, -2167], [-8861, -2244], [-8854, -2324], [-8833, -2406], [-8829, -2487],
      [-8844, -2567], [-8866, -2648], [-8963, -2725], [-9036, -2800], [-9112, -2875], [-9174, -2913], [-9236, -2951], [-9322, -3028], [-9381, -3106], [-9468, -3184], [-9545, -3263], [-9608, -3341],
      [-9651, -3419], [-9691, -3497], [-9738, -3576], [-9780, -3655], [-9821, -3734], [-9857, -3814], [-9856, -3894], [-9847, -3974], [-9859, -4055], [-9890, -4135], [-9925, -4215], [-9984, -4294],
      [-10030, -4374], [-10072, -4454], [-10096, -4535], [-10118, -4616], [-10155, -4698], [-10206, -4781], [-10202, -4864], [-10157, -4947], [-10113, -5027], [-10073, -5107], [-10044, -5189], [-10066, -5272],
      [-10100, -5357], [-10151, -5444], [-10231, -5536], [-10285, -5630], [-10319, -5728], [-10350, -5827], [-10362, -5924], [-10361, -6021], [-10405, -6124], [-10421, -6224], [-10378, -6318], [-10340, -6417],
      [-10276, -6515], [-10196, -6612], [-10136, -6713], [-10052, -6802], [-9934, -6876], [-9868, -6909], [-9792, -6938], [-9717, -6965], [-9603, -7030], [-9477, -7090], [-9400, -7114], [-9317, -7133],
      [-9225, -7147], [-9126, -7154], [-9022, -7155], [-8913, -7148], [-8801, -7135], [-8692, -7116], [-8589, -7096], [-8495, -7075], [-8405, -7051], [-8314, -7021], [-8222, -6985], [-8129, -6944],
      [-8037, -6899], [-7947, -6853], [-7863, -6808], [-7790, -6771], [-7678, -6726], [-7591, -6701], [-7561, -6778], [-7501, -6801], [-7438, -6766], [-7364, -6725], [-7302, -6757], [-7231, -6774],
      [-7130, -6759], [-7039, -6786], [-6995, -6845], [-6949, -6909], [-6909, -6984], [-6862, -7037], [-6784, -7119], [-6733, -7205], [-6671, -7269], [-6605, -7327], [-6540, -7389], [-6477, -7462],
      [-6414, -7533], [-6357, -7628], [-6333, -7698], [-6314, -7789], [-6294, -7881], [-6270, -7956], [-6214, -8075], [-6155, -8181], [-6083, -8235], [-6007, -8269], [-5927, -8281], [-5855, -8317],
      [-5787, -8365], [-5721, -8425], [-5663, -8508], [-5610, -8613], [-5554, -8702], [-5492, -8768], [-5428, -8825], [-5373, -8910], [-5311, -8969], [-5234, -8983], [-5170, -9038], [-5102, -9079],
      [-5015, -9069], [-4941, -9101], [-4865, -9128], [-4780, -9130], [-4707, -9169], [-4629, -9191], [-4541, -9180], [-4460, -9194], [-4381, -9211], [-4303, -9231], [-4230, -9274], [-4156, -9317],
      [-4080, -9356], [-3990, -9344], [-3902, -9336], [-3821, -9357], [-3735, -9359], [-3659, -9403], [-3585, -9461], [-3501, -9474], [-3413, -9474], [-3324, -9462], [-3227, -9406], [-3129, -9333],
      [-3033, -9261], [-2947, -9241], [-2855, -9175], [-2762, -9096], [-2681, -9099], [-2603, -9121], [-2523, -9134], [-2442, -9131], [-2364, -9161], [-2285, -9188], [-2203, -9168], [-2120, -9126],
      [-2039, -9102], [-1960, -9090], [-1880, -9061], [-1800, -8999], [-1721, -8913], [-1644, -8848], [-1568, -8767], [-1494, -8653], [-1420, -8587], [-1347, -8531], [-1276, -8464], [-1207, -8395],
      [-1140, -8326], [-1074, -8271], [-1012, -8197], [-953, -8116], [-899, -8020], [-850, -7887], [-800, -7789], [-749, -7704], [-702, -7605], [-647, -7568], [-554, -7563], [-474, -7509],
      [-430, -7438], [-399, -7327], [-354, -7277], [-259, -7304], [-182, -7361], [-95, -7442], [-21, -7472], [69, -7447], [174, -7458], [258, -7504], [347, -7562], [437, -7532],
      [544, -7535], [637, -7502], [721, -7524], [811, -7558], [897, -7582], [969, -7578], [1070, -7556], [1163, -7516], [1262, -7483], [1354, -7502], [1440, -7507], [1511, -7484],
      [1578, -7454], [1696, -7506], [1760, -7540], [1862, -7556], [1962, -7568], [2054, -7568], [2119, -7524], [2222, -7534], [2291, -7565], [2363, -7599], [2433, -7630], [2503, -7661],
      [2576, -7695], [2653, -7737], [2733, -7781], [2809, -7820], [2877, -7848], [3009, -7894], [3075, -7916], [3177, -7916], [3235, -7854], [3305, -7811], [3405, -7813], [3522, -7844],
      [3642, -7884], [3749, -7909], [3840, -7913], [3927, -7913], [4024, -7930], [4133, -7968], [4204, -7947], [4269, -7919], [4345, -7914], [4425, -7918], [4497, -7912], [4582, -7865],
      [4651, -7846], [4696, -7783], [4720, -7673], [4736, -7541], [4757, -7414], [4783, -7295], [4811, -7176], [4831, -7036], [4841, -6964], [4850, -6885], [4857, -6801], [4865, -6718],
      [4877, -6642], [4891, -6570], [4927, -6440], [4965, -6311], [5006, -6186], [5044, -6059], [5079, -5923], [5093, -5847], [5106, -5765], [5118, -5682], [5133, -5604], [5172, -5483],
      [5225, -5391], [5286, -5316], [5330, -5211], [5372, -5116], [5405, -5021], [5432, -4940], [5519, -4957], [5609, -4974], [5669, -4918], [5753, -4905], [5840, -4914], [5934, -4942],
      [6006, -4974], [6079, -5002], [6150, -5016], [6225, -5023], [6305, -5029], [6402, -5043], [6476, -5030], [6560, -4985], [6657, -4939], [6718, -4902], [6779, -4835], [6820, -4750],
      [6847, -4687], [6949, -4643], [7036, -4590], [7127, -4534], [7220, -4477], [7330, -4423], [7412, -4362], [7434, -4287], [7478, -4216], [7547, -4150], [7634, -4085], [7726, -4020],
      [7806, -3952], [7852, -3878], [7921, -3807], [8012, -3737], [8116, -3671], [8191, -3599], [8250, -3524], [8360, -3453], [8475, -3383], [8564, -3311], [8619, -3236], [8648, -3158],
      [8645, -3078], [8682, -3002], [8680, -2920], [8613, -2831], [8588, -2746], [8556, -2660], [8513, -2574], [8480, -2490], [8491, -2412], [8537, -2337], [8537, -2245], [8516, -2144],
      [8490, -2034], [8468, -1930], [8441, -1838], [8406, -1771], [8313, -1728], [8242, -1702], [8160, -1664], [8150, -1594], [8213, -1533], [8281, -1510], [8365, -1499], [8457, -1485],
      [8534, -1426], [8610, -1353], [8690, -1286], [8757, -1202], [8854, -1172], [8950, -1145], [9026, -1095], [9086, -1030], [9151, -970], [9249, -945], [9388, -962], [9507, -958],
      [9595, -922], [9662, -867], [9718, -803], [9747, -716], [9742, -599], [9745, -493], [9784, -411], [9845, -350], [9917, -299], [9968, -229], [10002, -143], [10019, -43],
      [10047, 46], [10095, 113], [10137, 184], [10177, 255], [10207, 332], [10230, 411], [10278, 496], [10335, 568], [10483, 578], [10574, 574], [10661, 573], [10743, 574],
      [10819, 579], [10891, 586], [10962, 592], [11091, 606], [11194, 636], [11327, 650], [11420, 653], [11508, 658], [11582, 669], [11699, 705], [11812, 735], [11935, 742],
      [12007, 739], [12127, 743], [12212, 774], [12308, 799], [12369, 870], [12432, 912], [12492, 958], [12545, 1011], [12633, 1039], [12693, 1084], [12699, 1176], [12753, 1254],
      [12797, 1350], [12799, 1477], [12782, 1550], [12756, 1625], [12724, 1698], [12688, 1765], [12634, 1864], [12587, 1930], [12480, 1892], [12359, 1839], [12292, 1803], [11018, 4194],
      [11160, 4245], [11303, 4282], [11439, 4309], [11568, 4327], [11686, 4333], [11797, 4329], [11893, 4314], [11976, 4286], [12046, 4247], [12103, 4203], [12187, 4114], [12237, 4037],
      [12283, 3977], [12329, 3922], [12389, 3852], [12459, 3762], [12535, 3664], [12605, 3553], [12675, 3432], [12714, 3370], [12759, 3309], [12808, 3253], [12981, 3044], [13026, 3130],
      [13067, 3201], [13117, 3264], [13159, 3340], [13217, 3404], [13268, 3477], [13318, 3549], [13368, 3618], [13420, 3683], [13472, 3741], [13555, 3779], [13650, 3693], [13734, 3684],
      [13813, 3650], [13883, 3663], [13971, 3631], [14091, 3581], [13938, 4127], [14057, 4107], [14151, 4126], [14131, 4172], [14084, 4214], [14074, 4275], [14023, 4321], [13956, 4301],
      [13919, 4351], [13856, 4402], [13773, 4410], [13687, 4411], [13604, 4440], [13528, 4442], [13452, 4466], [13359, 4474], [13267, 4468], [13189, 4484], [13101, 4465], [13031, 4423],
      [12954, 4375], [12881, 4403], [12832, 4337], [12753, 4381], [12700, 4309], [12617, 4355], [12558, 4262], [12479, 4361], [12442, 4429], [12365, 4532], [12283, 4601], [12201, 4654],
      [12127, 4738], [12055, 4805], [11981, 4833], [11901, 4832], [11827, 4853], [11754, 4883], [11685, 4927], [11617, 4974], [11556, 5041], [11504, 5133], [11441, 5193], [11371, 5230],
      [11312, 5301], [11251, 5367], [11200, 5460], [11158, 5577], [11095, 5633], [11018, 5642], [10945, 5665], [10856, 5651], [10758, 5612], [10670, 5600], [10567, 5558], [10476, 5550],
      [10404, 5588], [10330, 5625], [10254, 5658], [10178, 5697], [10101, 5737], [10016, 5758], [9928, 5772], [9841, 5789], [9754, 5802], [9664, 5786], [9571, 5735], [9483, 5696],
      [9407, 5739], [9330, 5793], [9249, 5836], [9167, 5871], [9082, 5873], [8996, 5861], [8911, 5827], [8825, 5828], [8739, 5852], [8652, 5847], [8565, 5841], [8478, 5814],
      [8396, 5813], [8304, 5866], [8204, 5941], [8105, 5991], [8011, 6000], [7924, 5975], [7838, 5949], [7754, 5915], [7662, 5916], [7567, 5930], [7486, 5895], [7424, 5797],
      [7369, 5688], [7293, 5658], [7213, 5647], [7133, 5645], [7057, 5610], [6978, 5563], [6899, 5523], [6820, 5485], [6742, 5448], [6679, 5376], [6626, 5283], [6570, 5206],
      [6508, 5149], [6436, 5118], [6369, 5076], [6301, 5038], [6225, 5016], [6135, 5018], [6030, 5030], [5943, 5007], [5841, 5005], [5738, 5002], [5646, 4974], [5572, 4920],
      [5500, 4862], [5433, 4798], [5340, 4764], [5255, 4717], [5219, 4617], [5187, 4521], [5605, 4099], [5542, 4059], [5488, 4009], [5423, 3962], [5346, 3915], [5295, 3853],
      [5262, 3783], [5233, 3712], [5146, 3650], [5094, 3578], [5097, 3500], [5057, 3423], [5017, 3340], [5010, 3257], [5013, 3173], [5012, 3086], [4991, 2992], [4982, 2900],
      [4970, 2806], [4946, 2706], [4917, 2601], [4926, 2514], [5009, 2460], [5106, 2410], [5225, 2373], [5344, 2339], [5414, 2327], [5488, 2318], [5608, 2286], [5674, 2227],
      [5725, 2159], [5798, 2099], [5890, 2045], [5926, 1968], [5925, 1879], [5951, 1795], [6003, 1721], [6051, 1646], [6090, 1567], [6114, 1483], [6131, 1398], [6168, 1316],
      [6151, 1223], [6122, 1130], [6115, 1042], [6092, 954], [6067, 868], [6088, 783], [6094, 698], [6103, 611], [6166, 519], [6180, 428], [6167, 340], [6144, 254],
      [6134, 166], [6126, 78], [6076, 1], [6059, -83], [6069, -188], [6052, -287], [6034, -387], [6022, -494], [6004, -600], [5999, -718], [5963, -820], [5903, -908],
      [5847, -1003], [5798, -1109], [5724, -1214], [5636, -1306], [5524, -1367], [5388, -1377], [4871, -472], [4821, -533], [4732, -521], [4654, -524], [4580, -526], [4494, -512],
      [4401, -493], [4272, -581], [4193, -720], [4126, -817], [4070, -862], [3991, -864], [3893, -831], [3798, -786], [3731, -744], [3658, -689], [3576, -616], [3510, -551],
      [3446, -484], [3377, -408], [3328, -354], [3279, -297], [3228, -238], [3177, -176], [3124, -112], [3071, -46], [3018, 22], [2964, 91], [2911, 162], [2857, 233],
      [2804, 306], [2752, 379], [2700, 452], [2649, 526], [2600, 600], [2559, 663], [2517, 730], [2474, 800], [2430, 874], [2385, 950], [2340, 1028], [2295, 1107],
      [2249, 1188], [2204, 1269], [2160, 1350], [2116, 1430], [2073, 1510], [2030, 1588], [1990, 1664], [1950, 1737], [1913, 1807], [1877, 1874], [1844, 1937], [1798, 2022],
      [1759, 2095], [1726, 2154]],
    // vorgelagerte Inselchen (Madagaskar-Vergleich): [x, z, Radius, Zufall]
    eilande: [[-10715,-2531,309,488], [-10997,-2786,352,315], [-7109,-9009,267,518], [-7494,-9243,205,541], [-7935,-8788,348,882], [-1091,-9622,236,885], [-1767,-9664,196,918], [5797,-8103,221,523], [13364,-5,300,354], [13137,200,358,988]],
    heute: { x: -323, z: 1318, r: 4300 },
    namen: [{ x: -2300, z: -5800, text: "Festland Nord (neu)", sub: "Gelände in Kacheln, noch ohne Bäume" }, { x: -6800, z: -3600, text: "Festland West (neu)" },
      { x: 4800, z: -3600, text: "Festland Ost (neu)" }, { x: -900, z: -10300, text: "Meer" }, { x: -9900, z: -1800, text: "Meer" }, { x: 13500, z: 600, text: "Meer" }, { x: 10200, z: 3700, text: "Festland Südost (neu)" }, { x: 6500, z: 6200, text: "Meer" },
      { x: -2600, z: 1650, text: "Hafen (N53: später neu, viel grösser, mit Docks)", klein: true }],
  },
  // Arkham-Insel mit Faehre und Anlegern (Nicolas 2026-11-12): wie die Militaerinsel erst spaeter, darum hier entfernt (siehe PLAN-GOTHAM.md "Spaeter")
  inseln: [
  ],

  bezirke: [
    // Bezirke an der Inselform (Nicolas 2026-11-12): Uptown im breiten Nordosten, Westseite im Westlappen, Narrows und Hafen an der Suedspitze
    { name: "Uptown (sehr reich)", wohlstand: 0.95, poly: [[-2600, -1700], [-800, -1700], [-800, -480], [-1500, -460], [-2100, -560], [-2600, -560]],
      netz: { winkel: 9, abstand: [150, 70], krumm: 22, luecken: 0.05, breite: 8 } },
    { name: "Midtown / Zentrum", wohlstand: 0.85, poly: [[-2600, -560], [-2100, -560], [-1500, -460], [-800, -480], [-800, 330], [-1500, 380], [-2250, 300], [-2600, 250]],
      netz: { winkel: -5, abstand: [110, 64], krumm: 14, luecken: 0.06, breite: 8 } },
    { name: "Südseite (Mittelstand)", wohlstand: 0.6, poly: [[-3900, -1100], [-2600, -1100], [-2600, 250], [-3900, 300]],
      netz: { winkel: 22, abstand: [92, 74], krumm: 34, luecken: 0.1, breite: 8 } },
    { name: "Oststadt (gemischt)", wohlstand: 0.45, poly: [[-2250, 300], [-1500, 380], [-800, 330], [-800, 950], [-2200, 950], [-2200, 780]],
      netz: { winkel: -16, abstand: [96, 80], krumm: 30, luecken: 0.12, breite: 8 } },
    { name: "Fabrikviertel", wohlstand: 0.25, poly: [[-3900, 300], [-2600, 250], [-2250, 300], [-2200, 780], [-3900, 780]],
      netz: { winkel: 4, abstand: [170, 120], krumm: 14, luecken: 0.25, breite: 8 } },
    { name: "The Narrows (arm, Hafen)", wohlstand: 0.1, poly: [[-3900, 780], [-2200, 780], [-2200, 950], [-800, 950], [-800, 1600], [-3900, 1600]],
      netz: { winkel: 33, abstand: [58, 44], krumm: 16, luecken: 0.16, breite: 6 } },
  ],

  // Hauptstrassen (frei gezogen, weiche Kurven). Nebenstrassen kommen automatisch aus den Bezirken (netz).
  // Breiten (Nicolas 2026-11-12: Strassen schmaler, Test im Spiel: Spuren waren 4,5 m): vierspurig 13-16 m (Spuren ca. 3,3-3,5 m), zweispurig 8-10 m,
  // Nebenstrassen 8 m, Gassen 6 m; vorher 16-24 / 10-12 / 7 m
  hauptstrassen: [
    { id: "ring", name: "Wayne Circle (Ring um den Wayne Tower, zweistöckig)", w: 14, geschlossen: true, zweistock: true, linie: ellipse(-2050, -100, 290, 245) },
    { id: "parkrow", name: "Park Row (zweistöckig)", w: 16, zweistock: true, linie: [["O", 300], [-1770, -10]] },   // Zwischenpunkt -1640/180 weg (Nicolas 2026-11-14, G2-Abschluss: Knick 27 Grad hinter dem Brueckenanschluss)
    { id: "uptown-ave", name: "Uptown Avenue", w: 14, linie: [[-2050, -345], [-2000, -700], [-1980, -1000], [-1955, "N"]] },
    { id: "gotham-blvd", name: "Gotham Boulevard", w: 14, linie: [[-2050, 145], [-1990, 500], [-2080, 900], [-2120, 1240]] },
    { id: "westside", name: "Southside Drive", w: 13, linie: [[-2340, -100], [-2600, -230], [-2800, -480], [-2860, -700]] },
    // Nicolas 2026-11-12: direkter Hauptsammler vom Hub (Schurkenbasis) nach Westen bis unter die Uferstrasse West
    { id: "west-ave", name: "South Avenue", w: 14, linie: [[-2340, -100], [-2800, -125], [-3200, -160], ["W", -170]] },
    { id: "diag-nord", name: "Old Broadway (West)", w: 14, linie: [[-1395.7, -1229], [-1500, -1000], [-1680, -720], [-1835, -257]] },   // Ende bis auf den Wayne Circle (Nicolas 2026-11-12: Luecke, endete 37 m davor); Anfang am Ende der Nebenstrasse bei -1396/-1229 (2026-11-13: begann im Gras, 26 m daneben; am Westende der Uferstrasse lag sie spitz ueber deren Spuren)
    { id: "diag-sued", name: "Old Broadway (Ost)", w: 14, linie: [[-2290, 30], [-2470, 400], [-2600, 750], [-2580, 1100]] },
    { id: "crosstown", name: "Crosstown Expressway", w: 16, linie: [["O", -880], [-1300, -860], [-1620, -930], [-2050, -880], [-2450, -800], [-2860, -700], ["W", -730]] },
    // Harbor Road (Nicolas 2026-11-12: Bruecke neu analysiert): von der Suedbruecke quer durch die Narrows zum Faehranleger (Arkham)
    { id: "sued-road", name: "Harbor Road", w: 13, linie: [["O", 800], [-2150, 1000], [-2380, 1090], [-2580, 1100]] },   // Zwischenpunkt -1950/860 weg (2026-11-14: S-Kurve 24/26 Grad direkt hinter dem Brueckenanschluss)
    { id: "industrial", name: "Industrial Way", w: 13, linie: [[-2470, 400], [-2720, 470], ["W", 520]] },
    { id: "ufer-ost", name: "Uferstrasse Nord (zweistöckig)", w: 14, zweistock: true, ufer: { seite: "ost", abstand: 95, von: -1300, bis: 1050 }, ende: [-1932, 1104] },   // bis 1050 statt 1100 (2026-11-14: Knick 27 Grad, die Kurve zum Ende war nur 15 m lang)   // ende: bis zur Kreuzung der Nebenstrassen (Nicolas 2026-11-13: endete 15 m davor im Gras)
    { id: "ufer-west", name: "Uferstrasse Süd", w: 10, ufer: { seite: "west", abstand: 70, von: -850, bis: 700 }, anfang: [-3461, -865], ende: [-2820, 770] },   // anfang: in Fahrtrichtung zurueck bis auf die Nebenstrasse (begann 10 m daneben); ende: endete auf der Wiese, 137 m bis zur naechsten Nebenstrasse (Nicolas 2026-11-13)
    // ausserhalb der Insel
    // Gotham Highway (Nicolas 2026-11-12, Skizze bei [-1032, 709]): laeuft auf dem Festland Nord von der Nordbruecke (Crosstown) im Bogen hinunter zur
    // Ostbruecke (Harbor); die Gotham-Highway-Bruecke muendet im Bogen von unten ein. Zur Manor fuehrt (vorerst) nur eine normale Strasse.
    { id: "highway", name: "Gotham Highway", w: 14, linie: [["Oa", -880], [-420, -600], [-420, -150], [-520, 300], [-760, 560], [-960, 700], [-1080, 740], ["Oa", 800]] },
    // Festland Ost: verbindet die Enden von Nord-, Highway- und Suedbruecke (vorher endeten Nord- und Suedbruecke ohne Strasse)
    { id: "highway-bruecke", name: "Gotham Highway (Zubringer Highway-Brücke)", w: 14, linie: [["Oa", 300], [-930, 628], [-790, 535], [-640, 430]] },   // muendet im Bogen in den Highway
    // Nicolas 2026-11-12: Strasse von der Suedbruecke muendet kurz nach der Bruecke in den Highway (ab dort eine Strasse)
    { id: "manor-strasse", name: "Strasse nach Wayne Manor", w: 8, linie: [[-528, 1358], [-760, 1200], [-900, 950], [-960, 700]] },   // ab Suedwest-Ende der Manor-Hauptstrasse (Spiel -61 / 200), ohne Knick; normale Strasse, kein Highway
    { id: "nord-zufahrt", name: "Zufahrt Westen (über die Westkanal-Brücke)", w: 10, linie: [[-2424, "Na"], [-2470, -1450], [-2560, -1800]] },
    { id: "nord-anschluss", name: "Anschluss Westkanal-Brücke", w: 10, linie: [[-2424, -870], [-2445, -800]] },
    { id: "hauptstrasse", name: "Hauptstrasse (besteht)", w: 8, besteht: true, linie: [[-528, 1358], [-471, 1397], [-422, 1425], [-382, 1438], [-345, 1443], [-311, 1457], [-274, 1487], [-224, 1503], [-161, 1495], [-94, 1472], [-11, 1442]] },   // Spiel-Punkte (-61 / 200 ... 256 / -217) mit manorLage umgerechnet
    { id: "west-nord", name: "Zufahrt Süden (West)", w: 10, linie: [["Wa", -730], [-4250, -760], [-4450, -820]] },
    { id: "west-sued", name: "Zufahrt Süden (Ost)", w: 10, linie: [["Wa", 520], [-3700, 480], [-4100, 520]] },
  ],
  // Haengebruecken (Fahrbahn auf Strassenhoehe; Tuerme stehen automatisch an den Ufern)
  // spanne = Laenge ueber dem Wasser zwischen den Tuermen (m) fuer die Seitenansicht; die Karte misst nach und meldet, wenn die Zahl nicht mehr stimmt
  bruecken: [
    { name: "Gotham-Highway-Brücke", spanne: 414, w: 18, seite: "ost", z: 300 },
    { name: "Nordbrücke (Crosstown)", spanne: 430, w: 16, seite: "ost", z: -880 },
    // Nicolas 2026-11-12: vorher bei z 1050, dort war der Ostfluss schon Meer - die Bruecke endete im Wasser, ohne Strasse am Ostufer
    { name: "Ostbrücke (Harbor)", spanne: 436, w: 14, seite: "ost", z: 800 },
    // Nicolas 2026-11-12: Bruecke nach Norden ueber den Nordkanal (bei x -2424 / z -946)
    { name: "Westkanal-Brücke", spanne: 272, w: 14, seite: "nord", x: -2424 },
    { name: "Westbrücke", spanne: 364, w: 14, seite: "west", z: -730 },
    { name: "Südbrücke", spanne: 416, w: 14, seite: "west", z: 520 },
  ],
  // Faehren (Nicolas 2026-11-12: nach Arkham eine Faehre statt einer Bruecke): Route uebers Wasser von Anleger zu Anleger
  faehren: [
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
        stationen: [{ name: "Uptown", a: 250 }, { name: "Kunstmuseum", a: 300 }, { name: "Diamond District", a: 355 }, { name: "Uptown Nord", a: 40 }, { name: "Crosstown", a: 205 }] },
      { name: "Ring 3 Südseite", farbe: "#74c0fc", cx: -3030, cz: -320, rx: 470, rz: 380,
        stationen: [{ name: "Südseite", a: 180 }, { name: "Southside Drive", a: 250 }, { name: "Südseite West", a: 300 }, { name: "Krankenhaus Süd", a: 90 }, { name: "Industrial Way", a: 130 }] },
      { name: "Ring 4 Ost", farbe: "#a9e34b", cx: -2230, cz: 800, rx: 320, rz: 450,
        stationen: [{ name: "Stadion", a: 330 }, { name: "Oststadt", a: 20 }, { name: "Hafen", a: 90 }, { name: "Narrows", a: 150, notiz: "Graffiti NBR im Tunnel Richtung Fabrikviertel" }, { name: "Fabrikviertel", a: 210 }] },
    ],
    depot: { name: "Abstellanlage (Züge ausser Betrieb, am Gleisnetz)", x: -1450, z: -330, w: 120, d: 60, gleis: [[-1780, 100], [-1650, -120], [-1500, -300]] },
    graffiti: [{ text: "NBR", x: -2620, z: 600 }],
  },

  // Bus: Linien folgen Hauptstrassen (ids), Haltestellen automatisch alle ca. 400 m
  bus: {
    abstand: 400,
    linien: [
      { name: "Linie 1 Zentrum", farbe: "#3ec7ff", strassen: ["ring", "parkrow", "ufer-ost"] },
      { name: "Linie 2 West-Ost", farbe: "#7de0ff", strassen: ["uptown-ave", "gotham-blvd"] },
      { name: "Linie 3 Manor-Express", farbe: "#2fa3e0", strassen: ["manor-strasse", "highway-bruecke", "highway", "parkrow"] },
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
      // Vorplatz (Nicolas 2026-11-14 "Ja, Vorplatz"): Seite s (+z), 40 m tief; frei: Rand um den Turm ohne Fuellbauten. Faellt weg: FB-0425, FB-0546, FB-0547
      vorplatz: { seite: "s", tiefe: 40 }, frei: 20,
      notiz: "Zentrum, im Wayne Circle. Befahrbare Tiefgarage (2 Ebenen). Direkt darunter geheimer Stock (Vorbild karten/planung/wayne-geheimstock-vorbild.png: weite niedrige Halle, viele runde Pfeiler, runde Deckenlampen, graue Wände, glänzender Boden): Tumbler, Prototypen, Gadgets. Darunter Kanal-Hub mit Schurkenbasis." },
    { id: "gcpd", typ: "oeffentlich", name: "Polizeipräsidium (Batsignal auf dem Dach)", x: -2200, z: 330, w: 80, d: 60, h: 45 },
    { id: "hafen", typ: "industrie", name: "Hafen / Containerterminal", x: -2070, z: 1350, w: 420, d: 90, ufer: true, notiz: "An der Ostspitze der Insel, direkt am Meer (Schiffe müssen unter keiner Brücke durch). Kräne, Container, Lagerhallen." },
    // --- Oeffentlich ---
    { id: "gericht", typ: "oeffentlich", name: "Gerichtsgebäude", x: -1880, z: 330, w: 70, d: 50, h: 35 },
    { id: "kirche", typ: "oeffentlich", name: "Kathedrale", x: -2560, z: 40, w: 50, d: 90, h: 60 },
    { id: "kh-1", typ: "gesundheit", name: "Krankenhaus Uptown", x: -1560, z: -1300, w: 90, d: 70, h: 50 },
    { id: "kh-2", typ: "gesundheit", name: "Krankenhaus Südseite", x: -2680, z: -40, w: 80, d: 60, h: 40 },
    { id: "kh-3", typ: "gesundheit", name: "Krankenhaus Oststadt", x: -1930, z: 1180, w: 80, d: 60, h: 35 },
    { id: "heim-1", typ: "gesundheit", name: "Kinderheim Süd", x: -2750, z: -300, w: 40, d: 30, h: 12 },
    { id: "heim-2", typ: "gesundheit", name: "Kinderheim Narrows", x: -2300, z: 1260, w: 40, d: 30, h: 12 },
    { id: "krippe-1", typ: "gesundheit", name: "Kinderkrippe Uptown", x: -1400, z: -740, w: 25, d: 20, h: 6 },
    { id: "krippe-2", typ: "gesundheit", name: "Kinderkrippe Südseite", x: -2420, z: -330, w: 25, d: 20, h: 6 },
    { id: "krippe-3", typ: "gesundheit", name: "Kinderkrippe Oststadt", x: -1960, z: 700, w: 25, d: 20, h: 6 },
    // --- Freizeit ---
    { id: "stadion", typ: "freizeit", form: "stadion", name: "Football-Stadion (oben offen)", x: -2150, z: 540, w: 220, d: 160, h: 14.1, notiz: "Oben offen, kein Dach. Tribünen 3 Stockwerke (je 4,7 m), Sitzreihen 0,4 m hoch und 0,8 m tief. Ränge rundum, Spielfeld in der Mitte." },
    { id: "museum-1", typ: "freizeit", name: "Kunstmuseum", x: -1700, z: -1160, w: 100, d: 60, h: 25 },
    { id: "museum-2", typ: "freizeit", name: "Naturkundemuseum", x: -2060, z: -1000, w: 90, d: 70, h: 25 },
    { id: "event", typ: "freizeit", name: "Eventgebäude (Spendengala, Hochzeit)", x: -1900, z: -560, w: 90, d: 60, h: 20 },
    { id: "pinguin", typ: "freizeit", name: "Club des Pinguins (Eingang an der unteren Uferstrasse)", x: -1770, z: 470, w: 50, d: 40, h: 12, ebene: -5.5,
      notiz: "Eingang an der unteren Strasse (Lower Level) unter der Uferstrasse Nord. Geht über mehrere Ebenen nach unten (siehe Seitenansicht)." },
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
    { id: "waffen-1", typ: "laden", name: "Waffenladen", x: -2620, z: 560, w: 28, d: 20, h: 8 },   // Guns & Ammo, vergroessert wie in der Werkstatt (Nicolas 2026-11-19 "Ja, vergroessern"; vorher 20 x 15 x 6)
    { id: "waffen-2", typ: "laden", name: "Waffenladen", x: -1840, z: 910, w: 56, d: 36, h: 13 },   // Gotham Arms, vergroessert (2026-11-19; FB-0188 entfaellt)
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
      notiz: "Ganz normaler 20-Fuss-Seecontainer am Nordufer (Nicolas 2026-11-12: bei x -1470 / z 181) (Foto von Nicolas): blau, Wellblech, zweiflügelige Tür mit Verriegelungsstangen, keine Fenster. 6,06 x 2,44 x 2,59 m, innen ca. 5,9 m lang. Er ist ein Aufzug (fährt samt Auto hinunter)." },
    { id: "bunker", typ: "geheim", name: "Batman-Basis unter dem Container (Halle mit Lichtdecke)", x: -1540, z: 181, w: 90, d: 50, ebene: -5.5,
      notiz: "Flache, weite Halle auf Höhe der Tiefgarage 1 (Boden 5,5 m unter der Strasse, ca. 4,7 m hoch): Sichtbetonwände, die ganze Decke ein Raster aus Lichtpaneelen (Foto von Nicolas), glatter Betonboden. Batmobil in der Mitte, Anzug fährt aus dem Boden, Motorrad und Batpod fahren aus der Wand, hinten Reifenstapel und Werkbank, Computer, aufklappbare Wand mit Waffen und Gadgets, Geheimwand mit Tresor (Goldbarren, Bargeld)." },
    { id: "schurkenbasis", typ: "geheim", name: "Schurkenbasis im Kanalnetz", x: -2050, z: -60, w: 120, d: 80, ebene: -28.5,
      notiz: "Runde, hohe Halle im Kanal-Hub direkt unter dem geheimen Wayne-Stock (der Tumbler steht genau darüber), Vorbild karten/planung/schurkenbasis-vorbild-*: Pfeiler rundum, Stahlstege mit Geländern auf mehreren Ebenen, Gitterboden, Abwasser stürzt als Wasserfall in einen gemauerten Kanal. Dazu Waffen unter Planen, herumliegende Waffen, Tisch mit Computer, Boxsack." },
    ...[[-2780, 930], [-2480, 1260], [-2350, 1050], [-2750, 900]].map(([x, z], i) => ({ id: "drogen-" + (i + 1), typ: "geheim", name: "Geheimes Drogenversteck", x, z, w: 10, d: 10 })),
    // --- Baustellen (eine Vorlage, mehrfach eingesetzt) ---
    ...[[-2030, -1100], [-1300, -620], [-2780, -860], [-1850, 460], [-2580, -830], [-2000, 1270], [-2700, -230], [-2200, 680]]
      .map(([x, z], i) => ({ id: "BS-" + String(i + 1).padStart(2, "0"), typ: "baustelle", name: "Baustelle BS-" + String(i + 1).padStart(2, "0") + " (Platzhalter)",   // klare ID (Nicolas 2026-11-12)
        x, z, w: 60, d: 50, status: "baustelle" })),
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
      { y: 47, name: "Wayne Manor: Dach (Welt 35)" },
      { y: 37, name: "Wayne Manor: Plateau / Erdgeschoss (Welt 25)" },
      { y: 27, name: "Klippenkante bei der Manor, höchste Stelle (Welt 15)" },
      { y: 0.15, name: "Gehsteig: Bordstein 15 cm über der Fahrbahn (auch unten)" },
      { y: 0, name: "Strasse = Brückenfahrbahn (Welt −12)" },
      { y: -1, name: "Unterkante Fahrbahnplatte (1 m), Tiefgarage 1 licht 4,5 m" },
      { y: -5.5, name: "Tiefgarage 1 = untere Strasse = Club-Bar = Batman-Basis" },
      { y: -6, name: "Unterkante Decke (0,5 m), Tiefgarage 2 licht 5 m" },
      { y: -11, name: "Tiefgarage 2 = U-Bahn-Bahnsteig" },
      { y: -11.5, name: "Unterkante Bodenplatte Tiefgarage 2 (0,5 m)" },
      { y: -17.5, name: "Club: Keller / VIP" },
      { y: -13.5, name: "Club: Tanzfläche" },
      { y: -1.2, name: "Nebensammler: Scheitel unter dem Gullideckel" },
      { y: -11, name: "Geheimer Wayne-Stock (direkt unter dem Wayne Tower, 2 Tiefgaragen hoch)" },
      { y: -17, name: "Kanal-Sohle (Hauptsammler) = Galerie Kanal-Hub (Hallenboden -25)" },
      { y: -10, name: "Kanal-Auslass (Rohr oben)" },
      { y: 13, name: "Klippenkante bei der Manor, tiefste Stelle (Welt 1)" },
      { y: -4, name: "Batcave oben (Welt −16)" },
      { y: -16, name: "Batcave unten (Welt −28)" },
      { y: -22, name: "Wasserspiegel (Fluss, Meer, Welt −34) / Auslass-Sohle" },
      { y: -26, name: "Meeresgrund am Fuss der Manor-Klippe (Welt −38)" },
      { y: -34, name: "Flussgrund (Welt −46)" },
    ],
    teile: [
      // typ: wasser, grund, mauer, deck, strasse, raum, gebaeude, turm, rohr, text; x0/x1 waagrecht, y0/y1 senkrecht (m)
      { typ: "grund", x0: 0, x1: 4750, y0: -60, y1: 0 },
      { typ: "wasser", name: "Südfluss", x0: 0, x1: 400, y0: -34, y1: -22 },
      { typ: "wasser", name: "Nordfluss", x0: 4350, x1: 4750, y0: -34, y1: -22 },
      { typ: "luft", x0: 0, x1: 400, y0: -22, y1: 0 }, { typ: "luft", x0: 4350, x1: 4750, y0: -22, y1: 0 },
      { typ: "mauer", name: "Kaimauer", x0: 400, x1: 426, y0: -34, y1: 0 },
      { typ: "mauer", name: "Kaimauer", x0: 4324, x1: 4350, y0: -34, y1: 0 },
      // Flussufer (Nicolas 2026-11-11): am Fuss der Kaimauer ein Streifen Kies/Sand knapp ueber dem Wasser, dann weich tiefer bis zum Grund
      { typ: "ufer", name: "Kies/Sand am Ufer, dann tiefer", seite: "west", x0: 0, x1: 400, y0: -34, kies: 0.6, strand: 45 },
      { typ: "ufer", name: "Kies/Sand am Ufer, dann tiefer", seite: "ost", x0: 4350, x1: 4750, y0: -34, kies: 0.6, strand: 45 },
      { typ: "deck", name: "Südbrücke (Fahrbahn)", x0: 0, x1: 528, y0: -1.5, y1: 0 },
      { typ: "turm", name: "Brückenturm", x0: 371, x1: 397, y0: -22, y1: 62 },
      { typ: "deck", name: "Highway-Brücke (Fahrbahn)", x0: 4222, x1: 4750, y0: -1.5, y1: 0 },
      { typ: "turm", name: "Brückenturm", x0: 4353, x1: 4379, y0: -22, y1: 62 },
      { typ: "kabel", x0: 0, x1: 384, y0: 2, y1: 62 }, { typ: "kabel", x0: 4366, x1: 4750, y0: 2, y1: 62 },
      // Kanal: Hauptsammler quer durch, an beiden Ufern Absturzschacht und Auslass auf Wasserhoehe
      { typ: "rohr", name: "Hauptsammler (begehbar, 6 m)", x0: 400, x1: 1112, y0: -17, y1: -11 },
      { typ: "rohr", name: "Hauptsammler", x0: 1687, x1: 4350, y0: -17, y1: -11 },
      { typ: "text", name: "Hauptsammler führt hier neben\nClub und U-Bahn vorbei", x0: 1132, x1: 1672, y0: -14, y1: -14 },
      { typ: "schacht", name: "Absturzschacht", x0: 426, x1: 448, y0: -22, y1: -11, farbe: "#7bd88f" }, { typ: "schacht", name: "Absturzschacht", x0: 4302, x1: 4324, y0: -22, y1: -11, farbe: "#7bd88f" },
      { typ: "auslass", name: "Kanal-Auslass (Rohr 6 m, Gitter, Pflaster, Treppe)", x0: 320, x1: 448, y0: -22, y1: -14, seite: "west" },
      { typ: "auslass", name: "Kanal-Auslass (Rohr 6 m, Gitter, Pflaster, Treppe)", x0: 4302, x1: 4430, y0: -22, y1: -14, seite: "ost" },
      { typ: "schacht", name: "Gullideckel + Leiter", x0: 895, x1: 908, y0: -11, y1: 0 }, { typ: "schacht", name: "Gullideckel + Leiter", x0: 3136, x1: 3149, y0: -11, y1: 0 },
      // Narrows
      { typ: "strasse", name: "Uferstr. Süd", x0: 426, x1: 576, y0: -0.6, y1: 0 },
      { typ: "container", name: "Container = Aufzug (20 Fuss, keine Fenster)", x0: 540, y0: 0, laenge: 6.06, hoehe: 2.59, farbe: "#1f3f8f" },
      { typ: "schacht", name: "Aufzugschacht", x0: 540, x1: 625, y0: -5.5, y1: 0, farbe: "#ff4fd8" },
      { typ: "raum", name: "Batman-Basis (Lichtdecke)", x0: 432, x1: 704, y0: -5.5, y1: -0.8, farbe: "#ff4fd8", licht: true },
      { typ: "gebaeude", name: "Mietshaus (Narrows)", x0: 640, x1: 892, y0: 0, y1: 18.8, geschoss: 4.7, breite: 18 },
      // zweistoeckige Strasse mit Club
      { typ: "deck", name: "Zweistöckige Strasse: oben normaler Verkehr", x0: 892, x1: 1292, y0: -1, y1: 0 },
      { typ: "strasse", name: "Untere Strasse (Lower Level)", x0: 892, x1: 1292, y0: -6, y1: -5.5 },
      { typ: "deck", name: "Gehsteig +0,15", x0: 892, x1: 932, y0: 0, y1: 0.15 }, { typ: "deck", name: "Gehsteig +0,15", x0: 1252, x1: 1292, y0: 0, y1: 0.15 },
      { typ: "deck", name: "Gehsteig unten +0,15", x0: 892, x1: 932, y0: -5.5, y1: -5.35 }, { typ: "deck", name: "Gehsteig unten +0,15", x0: 1252, x1: 1292, y0: -5.5, y1: -5.35 },
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
      { typ: "raum", name: "Tiefgarage 1", x0: 2756, x1: 3012, y0: -5.5, y1: -1, farbe: "#9aa4b2" },
      { typ: "raum", name: "Tiefgarage 2", x0: 2756, x1: 3012, y0: -11, y1: -6, farbe: "#9aa4b2" },
      { typ: "deck", name: "Fahrbahnplatte (1 m)", x0: 2756, x1: 3012, y0: -1, y1: 0 }, { typ: "deck", name: "Decke (0,5 m)", x0: 2756, x1: 3012, y0: -6, y1: -5.5 }, { typ: "deck", name: "Bodenplatte (0,5 m)", x0: 2756, x1: 3012, y0: -11.5, y1: -11 },
      { typ: "strasse", name: "Strasse", x0: 2736, x1: 3036, y0: -0.6, y1: 0 },
      { typ: "raum", name: "Geheimer Wayne-Stock\n(Tumbler, Prototypen)", x0: 1756, x1: 2736, y0: -11, y1: 0, farbe: "#ff4fd8" },
      { typ: "raum", name: "Kanal-Hub / Schurkenbasis", x0: 1692, x1: 2746, y0: -25, y1: -12.3, farbe: "#7bd88f" },
      // Midtown und Uferstrasse Ost
      { typ: "strasse", name: "Strasse", x0: 3046, x1: 3222, y0: -0.6, y1: 0 },
      { typ: "gebaeude", name: "Bank (Midtown)", x0: 3238, x1: 4078, y0: 0, y1: 60, geschoss: 4.7, eg: 7, breite: 60 },
      // Bank: Tresorkeller auf der Hoehe der Tiefgarage 1, direkt daneben (Nicolas 2026-11-11), darunter Tiefgarage 2
      { typ: "raum", name: "Tiefgarage 1", x0: 3238, x1: 3658, y0: -5.5, y1: -1, farbe: "#9aa4b2" },
      { typ: "raum", name: "Tresorkeller", x0: 3658, x1: 4078, y0: -5.5, y1: -1, farbe: "#3ddc97" },
      { typ: "raum", name: "Tiefgarage 2", x0: 3238, x1: 4078, y0: -11, y1: -6, farbe: "#9aa4b2" },
      { typ: "deck", name: "Fahrbahnplatte (1 m)", x0: 3238, x1: 4078, y0: -1, y1: 0 }, { typ: "deck", name: "Decke (0,5 m)", x0: 3238, x1: 4078, y0: -6, y1: -5.5 }, { typ: "deck", name: "Bodenplatte (0,5 m)", x0: 3238, x1: 4078, y0: -11.5, y1: -11 },
      { typ: "deck", name: "Uferstrasse Nord (oben)", x0: 4094, x1: 4324, y0: -1, y1: 0 },
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
      { gruppe: "typen", typ: "gebaeude", name: "Baustelle (Lückenfüller: Erde, Material, Stangen, Bauzaun)", x0: 12074, x1: 12914, y0: 0, y1: 3.2, farbe: "#f5a623", breite: 60 },
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
      { typ: "luft", x0: 20638, x1: 20728, y0: -22, y1: 4 },
      { typ: "wasser", name: "Meer", x0: 20638, x1: 20728, y0: -26, y1: -22 },
      { typ: "profil", name: "Steilküste (Fels, 35-49 m über dem Meer)", farbe: "#5b5246",
        punkte: [[20728, -60], [20728, -22], [20722, -13], [20730, -2], [20724, 9], [20731, 20], [20727, 27], [20763, 29], [20788, 37], [21018, 37], [21018, -60], [20638, -60], [20638, -26], [20728, -26]] },
      // gemessen im Spiel (Orbit-Punkt von Nicolas, x 52 / z 227): Kante Welt +1, Meer -34, Grund am Fuss -38
      { typ: "mass", name: "35 m (gemessen bei x 52 / z 227: Kante Welt +1)", x0: 20663, y0: -22, y1: 13 },
      { typ: "mass", name: "49 m (höchste Stelle, Kante Welt +15)", x0: 20693, y0: -22, y1: 27 },
      { typ: "raum", name: "Tiefgarage Manor", x0: 20838, x1: 20968, y0: 31.5, y1: 36.6, farbe: "#9aa4b2" },
      { typ: "gebaeude", name: "Wayne Manor", x0: 20828, x1: 20978, y0: 37, y1: 47, farbe: "#d8d2c4", geschoss: 4.7, notiz: "EG und 1. OG im Hauptbau (Boden 0,6 / 5,3, Dach 10 m), darueber Theatre, Observatory, Landeplatz" },
      { typ: "schacht", name: "Aufzug", x0: 20928, x1: 20938, y0: -16, y1: 37, farbe: "#e8c547" },
      { typ: "raum", name: "Batcave oben", x0: 20808, x1: 21008, y0: -4, y1: 4.5, farbe: "#c58cff" },
      { typ: "raum", name: "Batcave unten", x0: 20778, x1: 21008, y0: -16, y1: -6, farbe: "#c58cff" },
      { typ: "wasser", name: "Höhlensee", x0: 20743, x1: 20838, y0: -22, y1: -22 },
      { typ: "strasse", name: "Uferstrasse Nord (unten)", x0: 4094, x1: 4324, y0: -6, y1: -5.5 },
    ],
  },
};
