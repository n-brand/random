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
    kueste: [[-4524,573], [-4500,560], [-4100,640], [-3700,700], [-3200,1000], [-2400,1550], [-1650,1420], [-1100,1620]],   // erster Punkt seit 2026-11-23 = Naht am Kreis der heutigen Welt (vorher -5200/600, gerades Stueck)
    kuesteAlt: [[-573, 1451], [103, 1658], [780, 1864], [1726, 2154]],
    // Kuestenstreifen oestlich der Manor (2026-11-20, rote Linie) eingesetzt: karte-kueste.js LAND_XZ, hier dessen Seeseite in Kartenkoordinaten.
    // Wasser so, wie es heute im Spiel ist (Nicolas 2026-11-20, Spielbild: "die Bucht ist nicht auf der Karte"): im Spiel abgetastet (terrainH unter SEA_Y,
    // 20-m-Raster im Kreis der heutigen Welt, Wasserlinie, vereinfacht 15 m), in Kartenkoordinaten. Ring 1 = Meer mit Fluessen (am Kreisrand abgeschnitten),
    // Ring 2 = Gotham-Insel darin. Bei Wayne Manor gilt im Spiel seaD (karte-kueste.js): grosse Bucht westlich der Manor, die Kueste laeuft nach Nordosten,
    // suedlich und oestlich der Manor ist Meer – kuesteAlt oben ist ein aelterer, gerader Stand (das Spiel nutzt ihn nur im Gotham-Raster). Nur fuer die Planungskarte.
    spiel: [[[3576,-434], [3548,-430], [3450,-413], [3354,-385], [3274,-335], [3200,-269], [3163,-172], [3125,-78], [3082,7], [3017,66], [2930,124], [2851,164], [2792,195], [2728,238], [2657,302], [2593,363], [2521,432], [2456,491], [2382,551], [2298,590], [2208,625], [2130,647], [2077,647], [2016,645], [1939,651], [1871,644], [1808,650], [1745,649], [1679,651], [1615,653], [1522,651], [1390,646], [1283,638], [1195,661], [1101,723], [1029,783], [964,816], [860,859], [852,886], [728,952], [641,1043], [553,1090], [231,1465], [-7,1614], [-254,1553], [-318,1519], [-360,1462], [-457,1491], [-521,1457], [-697,1551], [-760,1562], [-800,1549], [-819,1514], [-761,1325], [-772,1262], [-854,1193], [-920,1069], [-1057,1131], [-1084,1122], [-1132,1182], [-1112,1262], [-912,1382], [-934,1405], [-1110,1351], [-1201,1264], [-1346,1205], [-1553,1156], [-1492,909], [-1390,674], [-1217,446], [-1033,280], [-947,144], [-872,-55], [-723,-202], [-611,-375], [-533,-632], [-519,-775], [-530,-882], [-568,-953], [-561,-1025], [-636,-1166], [-855,-1366], [-968,-1578], [-1032,-1612], [-1050,-1648], [-1253,-1710], [-1423,-1688], [-1476,-1659], [-1691,-1681], [-1798,-1669], [-2036,-1520], [-2063,-1528], [-2292,-1406], [-2455,-1116], [-2544,-1069], [-2705,-1074], [-2840,-1115], [-3152,-1063], [-3287,-1104], [-3547,-1124], [-3715,-1057], [-3742,-1066], [-3927,-945], [-4031,-799], [-4092,-551], [-4065,-203], [-3933,89], [-3906,97], [-3849,203], [-3528,508], [-3471,659], [-3492,726], [-3518,763], [-3607,765], [-3860,673], [-4093,661], [-4524,573], [-4571,677], [-4614,1108], [-4610,1627], [-4543,2135], [-4515,2188], [-4473,2437], [-4406,2606], [-4415,2633], [-4320,2854], [-4328,2881], [-4234,3058], [-4242,3085], [-3979,3579], [-3952,3588], [-3775,3878], [-3461,4255], [-3095,4604], [-2648,4933], [-2258,5156], [-1760,5367], [-1395,5478], [-865,5581], [-417,5615], [-14,5605], [494,5538], [547,5510], [796,5468], [965,5401], [992,5410], [1213,5315], [1240,5323], [1417,5229], [1444,5237], [1938,4974], [1947,4947], [2237,4770], [2614,4456], [2963,4090], [3292,3643], [3515,3253], [3726,2755], [3837,2390], [3940,1860], [3974,1412], [3951,858], [3867,359], [3760,30], [3769,3], [3722,-85], [3730,-112]], [[-1009,-1058], [-1210,-1223], [-1267,-1374], [-1313,-1417], [-1489,-1471], [-1650,-1476], [-1721,-1438], [-1773,-1366], [-2029,-1252], [-2175,-1016], [-2405,-893], [-2791,-937], [-2853,-927], [-3003,-825], [-3092,-823], [-3381,-941], [-3426,-939], [-3567,-864], [-3689,-709], [-3718,-615], [-3719,-319], [-3662,-169], [-3635,-160], [-3569,-37], [-3413,129], [-3303,207], [-3203,267], [-3147,373], [-3116,560], [-2948,834], [-2921,842], [-2874,930], [-2710,1024], [-2515,1306], [-2406,1384], [-2284,1421], [-2249,1402], [-2070,1398], [-1911,1313], [-1842,1231], [-1796,1082], [-1785,804], [-1724,557], [-1403,182], [-1269,-206], [-1174,-325], [-1034,-445], [-974,-545], [-936,-666], [-933,-872]]],
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
  // Danach (Bilder mit spitzen V und Haken): Fehler im Erzeugen behoben – Richtung "aussen" kippte in tiefen Buchten (jetzt aus dem Umlaufsinn), an der Grenze
  // zur heutigen Welt sprang die Verformung auf 0 (jetzt ueber 1,2 km weich), Grundform vor den Zacken geglaettet (ca. 320 m), Kaps rund statt spitz.
  // vorgelagerte Inselchen; Enden fest, mind. 400 m ausserhalb der heutigen Welt, alle ca. 150 m ein Punkt (erzeugt, fester Zufall).
  // Davor ("jetzt abrunden"): fein unterteilt (100 m), dreimal Gauss-geglaettet (sigma 900 m), Enden fest an der Suedkueste, mind. 400 m ausserhalb der heutigen Welt, alle ca. 700 m ein Punkt.
  welt: {
    // abgerundeter Umriss vor der Ueberarbeitung (zum Vergleichen)
    umriss0: [[-5200,600], [-5910,440], [-6660,400], [-7410,240], [-8070,-50], [-8630,-580], [-8930,-1250], [-9060,-1950], [-9110,-2720], [-9120,-3500], [-9120,-4290], [-9110,-5080], [-9070,-5830], [-8940,-6520], [-8640,-7180], [-8070,-7710], [-7390,-8010], [-6700,-8200], [-5990,-8370], [-5270,-8570], [-4550,-8800], [-3820,-9010], [-3060,-9170], [-2290,-9260], [-1520,-9280], [-750,-9230], [10,-9090], [740,-8860], [1460,-8540], [2140,-8150], [2790,-7720], [3430,-7280], [4070,-6900], [4730,-6590], [5400,-6350], [6120,-6070], [6720,-5680], [7150,-5130], [7400,-4400], [7530,-3670], [7620,-2890], [7700,-2100], [7800,-1500], [8100,-1050], [8600,-700], [9400,-150], [10050,550], [10900,1400], [11800,2200], [12700,2900], [13540,3700], [13950,3820], [14250,4000], [14300,4250], [14050,4480], [13500,4520], [13200,4560], [12000,4750], [10800,5150], [9700,5545], [8500,5600], [7200,5300], [6200,4900], [5600,4550], [5250,4050], [5120,3450], [5300,2700], [5700,1800], [5900,1100], [5650,400], [5150,-100], [4500,-400], [3531,-572], [2600,600], [1726,2154]],
    umriss: [[-4524, 573], [-4594, 578], [-4664, 585], [-4733, 593], [-4803, 598], [-4873, 601], [-4943, 600], [-5012, 597], [-5080, 594], [-5148, 590], [-5217, 584], [-5291, 573],
      [-5369, 557], [-5450, 538], [-5533, 518], [-5614, 497], [-5694, 475], [-5773, 451], [-5852, 426], [-5930, 400], [-6009, 374], [-6088, 347], [-6166, 317], [-6243, 282],
      [-6320, 244], [-6396, 207], [-6473, 178], [-6550, 160], [-6629, 156], [-6709, 163], [-6790, 179], [-6873, 199], [-6956, 220], [-7039, 239], [-7125, 261], [-7221, 310],
      [-7298, 286], [-7371, 249], [-7449, 230], [-7524, 200], [-7621, 228], [-7736, 286], [-7843, 313], [-7929, 290], [-8002, 240], [-8078, 195], [-8144, 136], [-8190, 48],
      [-8224, -51], [-8251, -152], [-8258, -269], [-8285, -355], [-8293, -456], [-8270, -577], [-8274, -666], [-8291, -739], [-8330, -835], [-8361, -933], [-8364, -1007], [-8424, -1087],
      [-8442, -1188], [-8460, -1289], [-8501, -1346], [-8542, -1405], [-8581, -1466], [-8634, -1525], [-8691, -1586], [-8737, -1652], [-8832, -1710], [-8905, -1775], [-8930, -1850], [-8966, -1924],
      [-9006, -1998], [-9055, -2073], [-9078, -2151], [-9094, -2230], [-9091, -2311], [-9081, -2392], [-9054, -2474], [-9003, -2557], [-8963, -2638], [-8931, -2719], [-8936, -2797], [-9002, -2874],
      [-9109, -2950], [-9220, -3026], [-9313, -3104], [-9395, -3182], [-9429, -3261], [-9488, -3340], [-9547, -3419], [-9593, -3498], [-9645, -3577], [-9673, -3657], [-9660, -3736], [-9679, -3816],
      [-9732, -3895], [-9773, -3975], [-9807, -4055], [-9847, -4135], [-9904, -4215], [-10000, -4296], [-10059, -4337], [-10096, -4418], [-10068, -4499], [-10085, -4580], [-10101, -4662], [-10121, -4744],
      [-10174, -4827], [-10195, -4911], [-10174, -4993], [-10126, -5076], [-10093, -5159], [-10074, -5243], [-10038, -5327], [-10006, -5411], [-9990, -5497], [-9953, -5581], [-9908, -5666], [-9865, -5750],
      [-9842, -5837], [-9823, -5925], [-9797, -6012], [-9740, -6095], [-9677, -6177], [-9586, -6252], [-9459, -6317], [-9384, -6345], [-9313, -6373], [-9205, -6433], [-9116, -6496], [-9034, -6556],
      [-8957, -6616], [-8874, -6670], [-8780, -6716], [-8713, -6770], [-8633, -6814], [-8539, -6846], [-8463, -6883], [-8371, -6905], [-8258, -6907], [-8167, -6916], [-8085, -6925], [-7992, -6919],
      [-7915, -6922], [-7826, -6906], [-7726, -6870], [-7634, -6871], [-7538, -6860], [-7481, -6902], [-7407, -6919], [-7338, -6897], [-7270, -6872], [-7191, -6885], [-7106, -6891], [-7031, -6933],
      [-6953, -6985], [-6904, -7040], [-6859, -7114], [-6821, -7226], [-6807, -7300], [-6793, -7382], [-6779, -7466], [-6764, -7551], [-6746, -7628], [-6688, -7706], [-6611, -7715], [-6540, -7753],
      [-6468, -7786], [-6400, -7842], [-6332, -7899], [-6259, -7937], [-6176, -7937], [-6084, -7900], [-6005, -7917], [-5937, -7979], [-5873, -8055], [-5807, -8122], [-5739, -8181], [-5671, -8237],
      [-5608, -8307], [-5543, -8372], [-5471, -8412], [-5413, -8497], [-5363, -8610], [-5305, -8691], [-5236, -8736], [-5165, -8775], [-5104, -8845], [-5052, -8945], [-4995, -9030], [-4927, -9080],
      [-4832, -9040], [-4775, -8993], [-4677, -8945], [-4597, -8956], [-4525, -8996], [-4451, -9030], [-4378, -9069], [-4321, -9164], [-4265, -9267], [-4199, -9339], [-4120, -9367], [-4036, -9373],
      [-3947, -9362], [-3862, -9367], [-3784, -9400], [-3708, -9447], [-3617, -9424], [-3527, -9410], [-3442, -9412], [-3347, -9364], [-3259, -9350], [-3175, -9351], [-3083, -9309], [-2997, -9298],
      [-2912, -9287], [-2821, -9229], [-2734, -9189], [-2647, -9149], [-2560, -9095], [-2475, -9050], [-2392, -9004], [-2309, -8955], [-2225, -8876], [-2144, -8835], [-2066, -8804], [-1984, -8683],
      [-1944, -8609], [-1904, -8541], [-1866, -8473], [-1828, -8402], [-1790, -8328], [-1753, -8253], [-1717, -8180], [-1682, -8112], [-1614, -7992], [-1580, -7929], [-1516, -7808], [-1453, -7695],
      [-1391, -7638], [-1297, -7605], [-1238, -7541], [-1145, -7543], [-1051, -7550], [-962, -7529], [-895, -7567], [-829, -7600], [-736, -7600], [-650, -7563], [-558, -7560], [-464, -7563],
      [-368, -7574], [-297, -7604], [-194, -7628], [-118, -7665], [-22, -7657], [68, -7626], [153, -7583], [233, -7525], [334, -7524], [418, -7478], [522, -7477], [598, -7490],
      [673, -7497], [756, -7521], [835, -7455], [904, -7445], [1008, -7501], [1126, -7578], [1191, -7626], [1260, -7680], [1327, -7726], [1425, -7754], [1502, -7742], [1605, -7772],
      [1720, -7819], [1841, -7872], [1942, -7888], [2045, -7905], [2149, -7922], [2262, -7952], [2366, -7963], [2472, -7978], [2541, -8010], [2611, -8042], [2703, -8031], [2768, -7981],
      [2858, -7968], [2957, -7968], [3051, -7960], [3128, -7928], [3214, -7911], [3297, -7890], [3362, -7842], [3436, -7809], [3522, -7797], [3620, -7804], [3707, -7795], [3786, -7777],
      [3870, -7769], [3915, -7699], [3982, -7666], [4094, -7709], [4181, -7714], [4253, -7695], [4326, -7678], [4392, -7649], [4451, -7608], [4500, -7547], [4506, -7400], [4504, -7313],
      [4510, -7241], [4549, -7149], [4597, -7073], [4652, -7011], [4714, -6961], [4770, -6898], [4827, -6832], [4888, -6776], [4945, -6709], [4999, -6631], [5049, -6543], [5111, -6482],
      [5174, -6421], [5214, -6300], [5266, -6212], [5331, -6157], [5406, -6131], [5464, -6062], [5505, -5951], [5534, -5820], [5543, -5743], [5548, -5658], [5552, -5577], [5559, -5504],
      [5565, -5433], [5579, -5304], [5602, -5208], [5635, -5142], [5695, -5078], [5755, -5027], [5820, -4993], [5881, -4960], [5949, -4906], [6041, -4912], [6143, -4950], [6257, -4989],
      [6363, -5011], [6447, -4972], [6517, -4917], [6634, -4920], [6711, -4929], [6831, -4919], [6910, -4881], [6991, -4839], [7067, -4791], [7154, -4744], [7234, -4690], [7331, -4640],
      [7436, -4588], [7533, -4530], [7637, -4472], [7739, -4411], [7837, -4347], [7925, -4278], [8012, -4209], [8103, -4139], [8199, -4070], [8293, -3999], [8347, -3921], [8391, -3841],
      [8425, -3761], [8490, -3684], [8538, -3606], [8579, -3527], [8628, -3449], [8656, -3369], [8666, -3287], [8729, -3211], [8760, -3132], [8728, -3046], [8665, -2958], [8614, -2872],
      [8604, -2791], [8559, -2707], [8511, -2623], [8470, -2541], [8438, -2461], [8422, -2385], [8418, -2311], [8371, -2233], [8330, -2157], [8321, -2087], [8383, -2004], [8397, -1919],
      [8415, -1842], [8400, -1757], [8365, -1660], [8327, -1582], [8290, -1496], [8328, -1419], [8307, -1326], [8298, -1232], [8375, -1165], [8446, -1141], [8508, -1106], [8559, -1055],
      [8622, -1017], [8668, -953], [8690, -851], [8695, -723], [8702, -592], [8730, -492], [8804, -456], [8869, -408], [8920, -340], [8968, -269], [8999, -179], [9031, -92],
      [9100, -56], [9175, -25], [9245, 11], [9300, 65], [9334, 142], [9363, 222], [9423, 269], [9484, 315], [9542, 366], [9600, 418], [9651, 476], [9711, 528],
      [9828, 526], [9937, 531], [10056, 529], [10155, 545], [10237, 577], [10313, 614], [10409, 632], [10491, 663], [10543, 724], [10564, 815], [10593, 900], [10649, 958],
      [10713, 1007], [10778, 1057], [10822, 1127], [10854, 1209], [10900, 1279], [10954, 1340], [11008, 1400], [11045, 1479], [11073, 1568], [11086, 1673], [11084, 1796], [11116, 1883],
      [11194, 1918], [11301, 1919], [11393, 1936], [11435, 2011], [11540, 2013], [11611, 2052], [11672, 2104], [11743, 2143], [11811, 2185], [11861, 2250], [11926, 2295], [11996, 2335],
      [12055, 2387], [12109, 2447], [12158, 2512], [12220, 2561], [12279, 2613], [12335, 2671], [12394, 2723], [12448, 2783], [12511, 2832], [12586, 2869], [12646, 2923], [12706, 2978],
      [12772, 3026], [12829, 3085], [12886, 3145], [12948, 3199], [13009, 3253], [13073, 3305], [13135, 3358], [13197, 3410], [13259, 3461], [13323, 3508], [13391, 3548], [13453, 3594],
      [13513, 3642], [13575, 3684], [13637, 3724], [13700, 3760], [13759, 3799], [13843, 3856], [13911, 3922], [13964, 3988], [13980, 4062], [13950, 4137], [13890, 4181], [13822, 4212],
      [13754, 4280], [13688, 4353], [13601, 4409], [13536, 4433], [13466, 4449], [13395, 4463], [13322, 4473], [13248, 4480], [13173, 4489], [13097, 4498], [13020, 4503], [12941, 4500],
      [12859, 4491], [12776, 4479], [12691, 4464], [12604, 4447], [12514, 4419], [12419, 4372], [12319, 4306], [12215, 4234], [12119, 4205], [12033, 4230], [11948, 4261], [11856, 4257],
      [11761, 4245], [11668, 4240], [11580, 4256], [11487, 4250], [11397, 4254], [11321, 4299], [11261, 4394], [11210, 4506], [11155, 4604], [11088, 4662], [11013, 4695], [10935, 4720],
      [10874, 4789], [10856, 4858], [10840, 4931], [10789, 5027], [10732, 5104], [10681, 5198], [10628, 5285], [10577, 5379], [10521, 5461], [10480, 5586], [10432, 5698], [10374, 5786],
      [10315, 5881], [10251, 5967], [10180, 6038], [10115, 6143], [10046, 6245], [9962, 6301], [9860, 6283], [9755, 6248], [9661, 6260], [9572, 6305], [9481, 6346], [9384, 6346],
      [9289, 6358], [9195, 6394], [9101, 6449], [9004, 6480], [8906, 6484], [8808, 6493], [8710, 6491], [8611, 6511], [8509, 6559], [8412, 6532], [8320, 6474], [8227, 6434],
      [8140, 6364], [8060, 6269], [7982, 6179], [7909, 6074], [7830, 6015], [7741, 6005], [7666, 5938], [7589, 5882], [7503, 5866], [7418, 5847], [7341, 5800], [7263, 5759],
      [7186, 5715], [7114, 5657], [7057, 5555], [7011, 5428], [6955, 5337], [6882, 5295], [6805, 5264], [6730, 5229], [6671, 5157], [6636, 5029], [6589, 4938], [6527, 4884],
      [6448, 4868], [6374, 4843], [6308, 4802], [6254, 4738], [6219, 4646], [6168, 4586], [6090, 4575], [6008, 4569], [5936, 4545], [5883, 4496], [5858, 4416], [5847, 4327],
      [5832, 4251], [5730, 4216], [5659, 4190], [5626, 4094], [5631, 4018], [5633, 3948], [5582, 3872], [5518, 3830], [5423, 3792], [5384, 3732], [5370, 3630], [5377, 3560],
      [5389, 3457], [5407, 3390], [5398, 3320], [5373, 3247], [5372, 3174], [5385, 3102], [5397, 3028], [5375, 2944], [5361, 2860], [5364, 2778], [5357, 2692], [5336, 2599],
      [5317, 2505], [5353, 2431], [5377, 2352], [5370, 2262], [5350, 2165], [5336, 2072], [5342, 1988], [5398, 1925], [5456, 1864], [5489, 1793], [5521, 1723], [5509, 1640],
      [5480, 1555], [5502, 1453], [5492, 1351], [5477, 1256], [5438, 1169], [5377, 1117], [5323, 1073], [5332, 1002], [5264, 948], [5269, 874], [5265, 796], [5278, 700],
      [5294, 624], [5291, 554], [5213, 500], [5118, 463], [5047, 408], [4968, 408], [4878, 379], [4854, 309], [4851, 203], [4833, 108], [4802, 27], [4768, -50],
      [4731, -125], [4688, -192], [4637, -248], [4580, -300], [4514, -346], [4455, -376], [4391, -399], [4323, -419], [4252, -441], [4180, -463], [4104, -482], [4028, -498],
      [3951, -508], [3873, -513], [3794, -508], [3717, -494], [3640, -467], [3576, -434], [3498, -382], [3420, -319], [3367, -273], [3313, -223], [3259, -171], [3203, -116],
      [3147, -58], [3092, 2], [3036, 62], [2978, 125], [2922, 190], [2867, 255], [2812, 323], [2757, 390], [2704, 460], [2652, 531], [2601, 602], [2559, 663],
      [2517, 730], [2474, 800], [2430, 874], [2385, 950], [2340, 1028], [2295, 1107], [2249, 1188], [2204, 1269], [2160, 1350], [2116, 1430], [2073, 1510], [2030, 1588],
      [1990, 1664], [1950, 1737], [1913, 1807], [1877, 1874], [1844, 1937], [1798, 2022], [1759, 2095], [1726, 2154]],
    // Nahtstellen (Nicolas 2026-11-23, Punkte -5671/401, -4555/628, 3652/-221): Umriss beginnt im Westen genau dort, wo die Spielkueste den Kreis der heutigen Welt trifft
    // (gerades Altstueck leicht gezackt, Knick geglaettet), im Osten durch den Nahtpunkt gefuehrt (Versatz ueber 1,6 km weich verteilt).
    // vorgelagerte Inselchen (Madagaskar-Vergleich): [x, z, Radius, Zufall]
    eilande: [[-10247,-1799,368,190], [-10490,-3411,126,864], [-7033,-9662,312,218], [-6999,-8098,254,286], [-1850,-9568,357,573], [-1041,-8313,241,568], [5785,-8647,205,730], [12085,526,248,770], [11953,1008,328,683], [16070,-7922,520,412]],
    heute: { x: -323, z: 1318, r: 4300 },
    // Namen (Nicolas 2026-11-23: "mach mir Vorschläge für die grosse Insel und für die kleinen, ich brauch Namen und möchte die auch so anzeigen"). VORSCHLAG, OFFENE-FRAGEN 63.
    name: "Gotham Island", nameVorschlaege: ["Gotham Island", "Grand Gotham", "New Gotham", "Wayne Island", "Isle of Ravens"],
    eilandNamen: ["Fog Island", "Seal Rock", "Raven Island", "Crow’s Nest", "Lighthouse Key", "Smuggler’s Key", "Black Reef", "Storm Rock", "Hangman’s Isle", "Lantern Isle"],   // gleiche Reihenfolge wie eilande (Gull Rock 2026-11-23 entfernt, lag an Raven Island)
    namen: [{ x: -2300, z: -5800, text: "Festland Nord (neu)", sub: "Gelände in Kacheln, noch ohne Bäume" }, { x: -6800, z: -3600, text: "Festland West (neu)" },
      { x: 4800, z: -3600, text: "Festland Ost (neu)" }, { x: -900, z: -10300, text: "Meer" }, { x: -11200, z: 1200, text: "Meer" }, { x: 13500, z: 600, text: "Meer" }, { x: 10200, z: 3700, text: "Festland Südost (neu)" }, { x: 6500, z: 6200, text: "Meer" },
      { x: -2600, z: 1650, text: "Hafen (N53: später neu, viel grösser, mit Docks)", klein: true }],
  },
  // Arkham-Insel und Militaerinsel (Nicolas 2026-11-23: "plan noch die Inseln mit Arkham und Militaerinsel"; PLAN-GOTHAM "Spaeter"). ENTWURF nur fuer die Planungskarte (Ebene Insel-Welt),
  // im Spiel noch nichts. Arkham: im Meer suedwestlich der Narrows (mind. 1,1 km vom Ufer, so nah wie moeglich am Faehranleger der Harbor Road -2580/1100), ca. 840 x 600 m,
  // Asylum mit Hauptbau, Hochsicherheitstrakt, Verwaltung, Werkstatt und Mauer, Anleger zur Stadt; Autofaehre von der Harbor Road. Militaerinsel: im Meer suedlich von Gotham bei -2456/5346
  // (Nicolas), ca. 3,3 x 1,1 km Ost-West, Landebahn 2,6 km (Kampfjet), Rollweg, vier Hangars, Tower, Hafen mit Pier. gebaeude/hangars: [x, z, Breite, Tiefe, Drehung].
  arkham: {"name":"Arkham-Insel", "sub":"Arkham Asylum · nur mit der Fähre", "umriss":[[-3742,1583], [-3684,1524], [-3632,1498], [-3580,1489], [-3526,1493], [-3472,1516], [-3421,1555], [-3370,1595], [-3313,1633], [-3230,1698], [-3152,1777], [-3110,1841], [-3080,1900], [-3057,1956], [-3048,2011], [-3058,2061], [-3080,2107], [-3110,2154], [-3166,2209], [-3233,2247], [-3287,2259], [-3333,2271], [-3377,2290], [-3427,2297], [-3482,2281], [-3540,2244], [-3600,2193], [-3677,2109], [-3742,2020], [-3773,1956], [-3800,1900], [-3826,1846], [-3836,1793], [-3826,1746], [-3805,1701], [-3784,1651]], "gebaeude":[[-3424,1958,170,70,3.9688824620831706, "Hauptbau"], [-3561,1839,70,50,3.9688824620831706, "Hochsicherheit"], [-3285,2020,60,40,3.9688824620831706, "Verwaltung"], [-3411,1810,90,30,3.9688824620831706, "Werkstatt"]], "mauer":[[-3357,2222], [-3736,1810], [-3508,1600], [-3129,2013]], "anleger":[-3230,1698]},
  arkhamFaehre: {"name":"Arkham-Fähre", "sub":"Autofähre Narrows – Arkham", "route":[[-2580,1100], [-2900,1379], [-3230,1698]]},
  militaerinsel: {"name":"Fort Graystone", "sub":"Militärinsel · Landebahn, Hangars, Hafen · Kampfjet", "umriss":[[2192,3615], [2249,3615], [2305,3636], [2361,3657], [2418,3677], [2470,3706], [2517,3744], [2561,3784], [2604,3826], [2652,3862], [2707,3886], [2763,3909], [2818,3931], [2870,3962], [2915,4001], [2958,4043], [3001,4085], [3043,4128], [3085,4170], [3126,4214], [3166,4259], [3206,4303], [3246,4348], [3285,4394], [3319,4443], [3356,4491], [3394,4537], [3434,4581], [3476,4625], [3520,4666], [3566,4704], [3619,4731], [3676,4750], [3730,4776], [3780,4809], [3832,4839], [3886,4865], [3938,4896], [3980,4938], [4014,4987], [4043,5040], [4069,5094], [4089,5151], [4101,5209], [4109,5269], [4113,5329], [4112,5388], [4103,5447], [4075,5500], [4029,5539], [3974,5560], [3918,5581], [3869,5615], [3826,5657], [3790,5705], [3760,5757], [3723,5804], [3680,5846], [3640,5890], [3601,5936], [3562,5982], [3527,6031], [3503,6085], [3491,6144], [3485,6204], [3484,6264], [3488,6324], [3495,6383], [3503,6443], [3513,6502], [3521,6561], [3507,6617], [3450,6611], [3393,6591], [3341,6563], [3296,6522], [3254,6480], [3210,6439], [3163,6402], [3108,6378], [3049,6371], [2989,6375], [2930,6384], [2871,6395], [2813,6409], [2756,6429], [2701,6454], [2648,6481], [2591,6495], [2532,6484], [2474,6467], [2419,6444], [2367,6415], [2316,6382], [2267,6349], [2215,6317], [2166,6284], [2116,6250], [2067,6216], [2020,6178], [1978,6135], [1944,6086], [1919,6032], [1921,5974], [1952,5922], [1973,5867], [1972,5807], [1942,5755], [1897,5716], [1848,5681], [1797,5650], [1739,5635], [1679,5633], [1619,5635], [1560,5634], [1504,5611], [1457,5574], [1413,5534], [1370,5491], [1329,5448], [1290,5402], [1250,5358], [1207,5316], [1161,5277], [1111,5245], [1067,5205], [1045,5149], [1038,5090], [1049,5031], [1079,4980], [1123,4939], [1161,4893], [1179,4836], [1175,4777], [1145,4726], [1098,4689], [1042,4671], [982,4669], [922,4665], [863,4673], [806,4692], [751,4716], [698,4745], [644,4771], [589,4795], [540,4829], [499,4872], [467,4923], [446,4979], [434,5038], [426,5097], [420,5157], [413,5216], [403,5275], [388,5333], [363,5388], [324,5434], [280,5474], [233,5512], [181,5541], [124,5560], [66,5574], [8,5588], [-51,5601], [-108,5619], [-164,5640], [-222,5658], [-273,5688], [-310,5735], [-343,5784], [-384,5828], [-434,5861], [-493,5871], [-553,5869], [-612,5858], [-667,5833], [-715,5798], [-760,5758], [-798,5712], [-825,5659], [-841,5601], [-841,5541], [-836,5482], [-822,5423], [-814,5364], [-816,5304], [-829,5246], [-854,5191], [-881,5137], [-904,5082], [-922,5025], [-937,4967], [-946,4908], [-951,4848], [-949,4788], [-938,4729], [-914,4675], [-877,4627], [-835,4585], [-787,4548], [-733,4523], [-677,4502], [-624,4474], [-575,4439], [-526,4406], [-473,4377], [-418,4353], [-364,4327], [-314,4294], [-270,4253], [-228,4210], [-179,4176], [-120,4170], [-64,4191], [-10,4217], [48,4231], [108,4236], [168,4235], [227,4227], [285,4210], [342,4193], [399,4173], [454,4149], [510,4127], [564,4103], [618,4076], [672,4050], [726,4023], [778,3994], [829,3963], [883,3935], [938,3912], [994,3890], [1046,3861], [1097,3829], [1155,3826], [1209,3853], [1261,3883], [1314,3911], [1367,3939], [1423,3961], [1482,3970], [1541,3977], [1599,3993], [1655,4014], [1712,4033], [1765,4061], [1807,4103], [1848,4148], [1897,4181], [1956,4187], [2015,4173], [2068,4147], [2113,4107], [2144,4056], [2166,4000], [2178,3941], [2183,3882], [2188,3822], [2187,3762], [2179,3702], [2178,3643]], "piste":{"mitte":[1834,4670], "l":2600, "b":60, "dreh":0.1571}, "rollweg":[[649,4351], [3059,4733]], "hangars":[[790,4231,90,70,0.1571], [967,4259,90,70,0.1571], [1145,4288,90,70,0.1571], [1323,4316,160,70,0.1571], [1501,4344,90,70,0.1571]], "turm":[1865,4473], "hafen":{"pier":[[363,5388], [649,5532]], "becken":[780,5598]}},   // Umriss nach Nicolas 2026-11-23 (rote Linie: "Militaerinsel soll mehr so sein und weiter rechts"; aus dem Bild ausgelesen, Kreis der heutigen Welt eingepasst), ca. 5 x 3 km mit Bucht nach Suedwesten; Landebahn = laengste Gerade mit 110 m Rand (2,6 km, 9 Grad), Hangars und Tower nordseitig, Pier in der Bucht
  // Arkham-Insel mit Faehre und Anlegern (Nicolas 2026-11-12): frueher hier, 2026-11-23 als GOTHAM.arkham neu geplant (oben) (siehe PLAN-GOTHAM.md "Spaeter")
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
