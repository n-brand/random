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
  // Danach (Nicolas 2026-11-20, Bild mit zwei Kreisen: "die noch anpassen"): Keil zwischen Ostkueste und Suedost-Arm und Zipfel am Nordende der Bucht entfernt
  // (Ostkueste als Bogen nach aussen, Nordende der Bucht rund); breite Buchten statt schmaler Muendungen; Pruefung auch auf Einschnitte unter 600 m.
  // vorgelagerte Inselchen; Enden fest, mind. 400 m ausserhalb der heutigen Welt, alle ca. 150 m ein Punkt (erzeugt, fester Zufall).
  // Davor ("jetzt abrunden"): fein unterteilt (100 m), dreimal Gauss-geglaettet (sigma 900 m), Enden fest an der Suedkueste, mind. 400 m ausserhalb der heutigen Welt, alle ca. 700 m ein Punkt.
  welt: {
    // abgerundeter Umriss vor der Ueberarbeitung (zum Vergleichen)
    umriss0: [[-5200,600], [-5910,440], [-6660,400], [-7410,240], [-8070,-50], [-8630,-580], [-8930,-1250], [-9060,-1950], [-9110,-2720], [-9120,-3500], [-9120,-4290], [-9110,-5080], [-9070,-5830], [-8940,-6520], [-8640,-7180], [-8070,-7710], [-7390,-8010], [-6700,-8200], [-5990,-8370], [-5270,-8570], [-4550,-8800], [-3820,-9010], [-3060,-9170], [-2290,-9260], [-1520,-9280], [-750,-9230], [10,-9090], [740,-8860], [1460,-8540], [2140,-8150], [2790,-7720], [3430,-7280], [4070,-6900], [4730,-6590], [5400,-6350], [6120,-6070], [6720,-5680], [7150,-5130], [7400,-4400], [7530,-3670], [7620,-2890], [7700,-2100], [7800,-1500], [8100,-1050], [8600,-700], [9400,-150], [10050,550], [10900,1400], [11800,2200], [12700,2900], [13540,3700], [13950,3820], [14250,4000], [14300,4250], [14050,4480], [13500,4520], [13200,4560], [12000,4750], [10800,5150], [9700,5545], [8500,5600], [7200,5300], [6200,4900], [5600,4550], [5250,4050], [5120,3450], [5300,2700], [5700,1800], [5900,1100], [5650,400], [5150,-100], [4500,-400], [3531,-572], [2600,600], [1726,2154]],
    umriss: [[-5200, 600], [-5275, 576], [-5342, 553], [-5418, 525], [-5500, 489], [-5586, 447], [-5675, 407], [-5767, 383], [-5859, 382], [-5941, 370], [-6018, 332], [-6098, 296],
      [-6178, 247], [-6257, 207], [-6336, 206], [-6413, 194], [-6486, 171], [-6563, 206], [-6640, 231], [-6716, 225], [-6800, 258], [-6884, 274], [-6964, 265], [-7046, 265],
      [-7123, 240], [-7201, 222], [-7283, 224], [-7380, 275], [-7482, 330], [-7577, 349], [-7665, 346], [-7751, 335], [-7830, 302], [-7913, 275], [-7991, 235], [-8041, 144],
      [-8103, 80], [-8164, 17], [-8223, -43], [-8272, -117], [-8311, -203], [-8318, -319], [-8337, -416], [-8350, -512], [-8348, -613], [-8346, -703], [-8352, -776], [-8385, -869],
      [-8452, -944], [-8517, -990], [-8524, -1065], [-8528, -1142], [-8561, -1208], [-8579, -1280], [-8636, -1338], [-8732, -1386], [-8837, -1435], [-8898, -1498], [-8931, -1569], [-8963, -1641],
      [-9005, -1714], [-9064, -1786], [-9081, -1865], [-9098, -1946], [-9112, -2024], [-9114, -2104], [-9121, -2185], [-9119, -2267], [-9092, -2351], [-9061, -2434], [-9061, -2517], [-9057, -2599],
      [-9093, -2680], [-9136, -2758], [-9176, -2835], [-9233, -2912], [-9300, -2989], [-9344, -3067], [-9400, -3146], [-9475, -3224], [-9524, -3302], [-9534, -3380], [-9529, -3459], [-9533, -3537],
      [-9565, -3616], [-9645, -3695], [-9655, -3775], [-9689, -3854], [-9787, -3934], [-9852, -4014], [-9891, -4095], [-9947, -4175], [-9973, -4255], [-9991, -4334], [-10001, -4414], [-10038, -4494],
      [-10063, -4575], [-10072, -4656], [-10072, -4738], [-10068, -4821], [-10036, -4903], [-9986, -4984], [-9948, -5063], [-9947, -5145], [-9961, -5228], [-9984, -5311], [-9993, -5395], [-10007, -5481],
      [-10020, -5570], [-10025, -5660], [-10063, -5756], [-10125, -5854], [-10140, -5947], [-10094, -6037], [-10004, -6118], [-9941, -6155], [-9873, -6191], [-9768, -6267], [-9678, -6345], [-9571, -6419],
      [-9483, -6494], [-9427, -6573], [-9339, -6641], [-9245, -6704], [-9155, -6765], [-9061, -6823], [-8963, -6877], [-8881, -6934], [-8753, -6964], [-8627, -6985], [-8509, -6999], [-8437, -6993],
      [-8362, -6980], [-8292, -6965], [-8179, -6948], [-8073, -6932], [-7951, -6896], [-7822, -6844], [-7740, -6834], [-7664, -6870], [-7585, -6886], [-7493, -6890], [-7413, -6898], [-7340, -6900],
      [-7243, -6880], [-7170, -6866], [-7094, -6847], [-7015, -6905], [-7005, -6978], [-6996, -7052], [-6967, -7176], [-6928, -7266], [-6875, -7326], [-6821, -7401], [-6766, -7488], [-6708, -7577],
      [-6653, -7682], [-6586, -7739], [-6506, -7743], [-6418, -7718], [-6334, -7701], [-6255, -7712], [-6184, -7765], [-6110, -7814], [-6032, -7849], [-5967, -7937], [-5899, -8014], [-5830, -8066],
      [-5755, -8093], [-5681, -8124], [-5606, -8154], [-5533, -8190], [-5466, -8247], [-5412, -8349], [-5355, -8439], [-5312, -8573], [-5295, -8652], [-5274, -8720], [-5224, -8820], [-5151, -8850],
      [-5063, -8833], [-4984, -8846], [-4905, -8860], [-4823, -8868], [-4740, -8871], [-4665, -8901], [-4597, -8952], [-4533, -9018], [-4469, -9082], [-4412, -9173], [-4340, -9214], [-4270, -9266],
      [-4209, -9352], [-4130, -9378], [-4049, -9400], [-3975, -9452], [-3887, -9451], [-3806, -9476], [-3734, -9541], [-3648, -9547], [-3561, -9554], [-3477, -9569], [-3388, -9568], [-3302, -9578],
      [-3219, -9604], [-3136, -9635], [-3047, -9625], [-2955, -9589], [-2869, -9589], [-2778, -9554], [-2687, -9503], [-2602, -9503], [-2517, -9501], [-2429, -9453], [-2340, -9383], [-2251, -9283],
      [-2206, -9224], [-2162, -9159], [-2118, -9085], [-2075, -9005], [-2032, -8933], [-1991, -8870], [-1950, -8802], [-1909, -8710], [-1869, -8595], [-1829, -8479], [-1791, -8378], [-1754, -8291],
      [-1718, -8209], [-1682, -8134], [-1647, -8070], [-1579, -7953], [-1512, -7845], [-1444, -7801], [-1377, -7780], [-1311, -7753], [-1247, -7723], [-1152, -7705], [-1058, -7720], [-970, -7690],
      [-881, -7661], [-793, -7626], [-700, -7617], [-608, -7606], [-510, -7624], [-443, -7646], [-344, -7666], [-245, -7682], [-158, -7648], [-114, -7584], [-36, -7525], [9, -7465],
      [106, -7456], [206, -7454], [284, -7487], [352, -7491], [393, -7427], [438, -7373], [514, -7309], [584, -7309], [689, -7379], [787, -7433], [866, -7447], [955, -7408],
      [1048, -7445], [1166, -7523], [1232, -7572], [1293, -7609], [1384, -7624], [1476, -7639], [1575, -7662], [1643, -7630], [1734, -7638], [1858, -7698], [1930, -7738], [2004, -7781],
      [2071, -7813], [2183, -7839], [2295, -7863], [2400, -7874], [2484, -7852], [2565, -7826], [2654, -7811], [2748, -7804], [2832, -7781], [2924, -7770], [2991, -7795], [3063, -7825],
      [3181, -7849], [3300, -7875], [3369, -7902], [3470, -7906], [3514, -7832], [3570, -7777], [3654, -7765], [3754, -7780], [3878, -7836], [3990, -7875], [4087, -7893], [4204, -7947],
      [4297, -7967], [4339, -7903], [4358, -7800], [4376, -7694], [4412, -7616], [4461, -7559], [4512, -7497], [4547, -7403], [4575, -7290], [4610, -7189], [4666, -7127], [4701, -7020],
      [4738, -6914], [4793, -6847], [4858, -6805], [4923, -6763], [4978, -6695], [5036, -6632], [5099, -6577], [5152, -6491], [5203, -6396], [5244, -6276], [5287, -6156], [5337, -6057],
      [5391, -5973], [5439, -5864], [5475, -5723], [5489, -5647], [5504, -5573], [5517, -5500], [5528, -5429], [5546, -5293], [5564, -5185], [5590, -5111], [5644, -5042], [5696, -4967],
      [5764, -4923], [5840, -4913], [5913, -4914], [5984, -4919], [5993, -4849], [6090, -4863], [6200, -4903], [6302, -4927], [6386, -4898], [6455, -4851], [6533, -4804], [6617, -4763],
      [6698, -4736], [6802, -4707], [6932, -4677], [7001, -4660], [7075, -4643], [7160, -4627], [7245, -4610], [7318, -4588], [7445, -4538], [7566, -4484], [7691, -4429], [7770, -4405],
      [7850, -4380], [7922, -4351], [7986, -4320], [8048, -4288], [8110, -4255], [8229, -4188], [8311, -4114], [8375, -4039], [8492, -3973], [8579, -3901], [8630, -3823], [8675, -3746],
      [8744, -3670], [8819, -3593], [8819, -3506], [8802, -3420], [8792, -3336], [8784, -3253], [8781, -3172], [8773, -3091], [8704, -3002], [8626, -2911], [8567, -2821], [8531, -2733],
      [8475, -2644], [8399, -2554], [8380, -2473], [8386, -2396], [8404, -2325], [8413, -2252], [8401, -2179], [8370, -2084], [8404, -2003], [8398, -1925], [8342, -1852], [8315, -1771],
      [8279, -1699], [8236, -1637], [8244, -1562], [8301, -1512], [8349, -1454], [8410, -1405], [8498, -1397], [8558, -1366], [8568, -1284], [8599, -1203], [8649, -1128], [8709, -1051],
      [8796, -999], [8839, -939], [8878, -867], [8922, -797], [8980, -739], [9057, -705], [9156, -700], [9242, -668], [9307, -602], [9363, -523], [9417, -444], [9503, -407],
      [9615, -400], [9699, -359], [9770, -305], [9827, -240], [9898, -190], [9993, -165], [10063, -172], [10139, -185], [10214, -196], [10285, -206], [10406, -207], [10504, -194],
      [10601, -182], [10695, -167], [10763, -123], [10842, -62], [10919, -36], [11028, -36], [11159, -57], [11265, -52], [11339, -15], [11388, 46], [11448, 97], [11509, 146],
      [11560, 206], [11613, 262], [11652, 331], [11669, 423], [11647, 555], [11671, 639], [11740, 676], [11814, 709], [11886, 743], [11949, 787], [11986, 860], [12048, 906],
      [12138, 920], [12214, 949], [12274, 995], [12326, 1049], [12405, 1073], [12469, 1112], [12511, 1174], [12544, 1242], [12545, 1351], [12560, 1442], [12601, 1502], [12633, 1574],
      [12663, 1653], [12714, 1710], [12759, 1777], [12790, 1866], [12838, 1936], [12886, 2009], [12925, 2097], [12953, 2200], [12961, 2328], [12854, 2528], [12873, 2637], [12831, 2749],
      [12873, 2829], [12865, 2902], [12913, 2978], [12946, 3071], [12996, 3147], [13056, 3213], [13112, 3282], [13171, 3347], [13229, 3409], [13285, 3470], [13340, 3527], [13393, 3579],
      [13469, 3648], [13539, 3702], [13639, 3769], [13721, 3805], [13793, 3811], [13886, 3812], [13995, 3822], [14036, 3935], [14051, 4045], [14019, 4154], [13906, 4205], [14026, 4180],
      [14097, 4208], [14085, 4288], [14021, 4318], [13980, 4373], [13894, 4404], [13817, 4427], [13730, 4422], [13645, 4447], [13566, 4467], [13453, 4473], [13360, 4478], [13267, 4463],
      [13187, 4474], [13129, 4450], [13032, 4427], [12963, 4445], [12880, 4400], [12789, 4330], [12704, 4339], [12643, 4219], [12549, 4203], [12473, 4000], [12374, 3993], [12282, 3726],
      [12191, 3801], [12103, 3888], [12063, 3945], [11978, 4033], [11881, 4050], [11803, 4127], [11744, 4251], [11717, 4319], [11692, 4387], [11630, 4479], [11558, 4526], [11494, 4599],
      [11427, 4659], [11368, 4741], [11321, 4851], [11276, 4965], [11229, 5072], [11194, 5208], [11150, 5321], [11097, 5407], [11030, 5452], [10974, 5519], [10922, 5604], [10874, 5698],
      [10803, 5727], [10725, 5738], [10653, 5769], [10587, 5819], [10517, 5864], [10438, 5895], [10360, 5936], [10280, 5979], [10186, 5988], [10095, 6017], [10003, 6047], [9908, 6067],
      [9826, 6147], [9789, 6207], [9710, 6310], [9623, 6376], [9534, 6425], [9438, 6422], [9340, 6393], [9245, 6400], [9146, 6331], [9097, 6279], [9003, 6228], [8910, 6235],
      [8816, 6266], [8721, 6294], [8624, 6316], [8525, 6341], [8424, 6358], [8331, 6343], [8239, 6313], [8149, 6276], [8064, 6211], [7991, 6098], [7919, 5999], [7843, 5927],
      [7763, 5875], [7672, 5875], [7587, 5854], [7513, 5795], [7454, 5691], [7395, 5597], [7333, 5522], [7278, 5431], [7220, 5358], [7163, 5271], [7111, 5149], [7052, 5055],
      [6973, 5029], [6884, 5029], [6797, 5026], [6713, 5019], [6630, 5009], [6559, 4976], [6491, 4943], [6413, 4936], [6334, 4936], [6268, 4913], [6231, 4834], [6175, 4723],
      [6113, 4642], [6045, 4593], [5973, 4568], [5898, 4557], [5829, 4539], [5740, 4495], [5675, 4468], [5610, 4423], [5594, 4334], [5605, 4234], [5209, 4474], [5158, 4393],
      [5117, 4309], [5064, 4232], [5022, 4151], [5013, 4056], [5036, 3953], [5003, 3870], [4998, 3777], [5045, 3677], [5085, 3584], [5097, 3495], [5092, 3413], [5080, 3336],
      [5107, 3262], [5175, 3195], [5211, 3123], [5242, 3047], [5272, 2970], [5265, 2878], [5301, 2797], [5369, 2725], [5421, 2670], [5465, 2608], [5525, 2551], [5614, 2505],
      [5647, 2432], [5655, 2344], [5716, 2280], [5754, 2206], [5791, 2131], [5843, 2064], [5898, 2000], [5958, 1943], [6008, 1873], [6078, 1800], [6128, 1723], [6130, 1628],
      [6084, 1516], [6067, 1417], [6099, 1331], [6126, 1240], [6132, 1143], [6117, 1047], [6163, 945], [6222, 830], [6241, 717], [6217, 616], [6196, 515], [6226, 390],
      [6216, 280], [6173, 186], [6119, 98], [6071, 1], [6027, -101], [5965, -193], [5869, -251], [5773, -303], [5713, -389], [5639, -457], [5540, -491], [5442, -521],
      [5346, -547], [4799, 195], [4733, 135], [4698, 67], [4604, 42], [4524, 55], [4449, 24], [4366, -13], [4295, -38], [4251, -155], [4262, -299], [4261, -409],
      [4211, -507], [4134, -543], [4053, -571], [3972, -596], [3890, -614], [3809, -625], [3727, -626], [3648, -615], [3569, -590], [3505, -558], [3428, -505], [3352, -439],
      [3301, -389], [3250, -334], [3199, -275], [3148, -212], [3097, -146], [3047, -76], [2997, -5], [2946, 69], [2896, 144], [2847, 220], [2797, 297], [2747, 373],
      [2698, 450], [2649, 526], [2600, 600], [2559, 663], [2517, 730], [2474, 800], [2430, 874], [2385, 950], [2340, 1028], [2295, 1107], [2249, 1188], [2204, 1269],
      [2160, 1350], [2116, 1430], [2073, 1510], [2030, 1588], [1990, 1664], [1950, 1737], [1913, 1807], [1877, 1874], [1844, 1937], [1798, 2022], [1759, 2095], [1726, 2154]],
    // vorgelagerte Inselchen (Madagaskar-Vergleich): [x, z, Radius, Zufall]
    eilande: [[-11537,-3608,312,218], [-10249,-3259,254,286], [-7665,-7967,357,573], [-6868,-8377,241,568], [-7711,-8955,205,730], [-1358,-9273,248,770], [-1175,-8925,328,683], [5503,-8132,272,996], [12708,-858,186,917], [13425,-680,290,354]],
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
