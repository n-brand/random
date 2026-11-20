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
  // von dort nach Nordosten bis zur Spitze [14100, 3950], Ostkueste im Bogen nach aussen ab [7780, -1400]; danach Zacken neu erzeugt (Suedost voll zackig).
  // vorgelagerte Inselchen; Enden fest, mind. 400 m ausserhalb der heutigen Welt, alle ca. 150 m ein Punkt (erzeugt, fester Zufall).
  // Davor ("jetzt abrunden"): fein unterteilt (100 m), dreimal Gauss-geglaettet (sigma 900 m), Enden fest an der Suedkueste, mind. 400 m ausserhalb der heutigen Welt, alle ca. 700 m ein Punkt.
  welt: {
    // abgerundeter Umriss vor der Ueberarbeitung (zum Vergleichen)
    umriss0: [[-5200,600], [-5910,440], [-6660,400], [-7410,240], [-8070,-50], [-8630,-580], [-8930,-1250], [-9060,-1950], [-9110,-2720], [-9120,-3500], [-9120,-4290], [-9110,-5080], [-9070,-5830], [-8940,-6520], [-8640,-7180], [-8070,-7710], [-7390,-8010], [-6700,-8200], [-5990,-8370], [-5270,-8570], [-4550,-8800], [-3820,-9010], [-3060,-9170], [-2290,-9260], [-1520,-9280], [-750,-9230], [10,-9090], [740,-8860], [1460,-8540], [2140,-8150], [2790,-7720], [3430,-7280], [4070,-6900], [4730,-6590], [5400,-6350], [6120,-6070], [6720,-5680], [7150,-5130], [7400,-4400], [7530,-3670], [7620,-2890], [7700,-2100], [7780,-1400], [8600,-900], [9400,-150], [10050,550], [10428,1153], [10703,1657], [11150,2350], [11618,2983], [12350,3000], [12990,3120], [13540,3700], [14100,3950], [13200,4280], [12000,4750], [10800,5150], [9700,5545], [8703,5121], [7707,4697], [6710,4273], [5713,3850], [4716,3426], [3720,3002], [2723,2578], [1726,2154]],
    umriss: [[-5200, 600], [-5277, 572], [-5354, 546], [-5432, 525], [-5510, 506], [-5587, 476], [-5661, 441], [-5742, 428], [-5827, 432], [-5910, 442], [-5990, 443], [-6067, 419],
      [-6145, 384], [-6223, 365], [-6301, 349], [-6379, 324], [-6457, 313], [-6533, 310], [-6610, 314], [-6679, 255], [-6745, 190], [-6811, 142], [-6889, 121], [-6971, 116],
      [-7058, 139], [-7146, 163], [-7229, 174], [-7300, 147], [-7369, 114], [-7434, 74], [-7509, 60], [-7598, 70], [-7693, 88], [-7787, 102], [-7879, 113], [-7960, 91],
      [-8035, 50], [-8123, 30], [-8189, -28], [-8247, -94], [-8321, -139], [-8376, -198], [-8415, -276], [-8432, -376], [-8470, -454], [-8517, -518], [-8559, -584], [-8590, -654],
      [-8591, -740], [-8549, -840], [-8491, -955], [-8431, -1071], [-8394, -1177], [-8384, -1271], [-8364, -1341], [-8327, -1412], [-8303, -1496], [-8280, -1572], [-8292, -1650], [-8370, -1716],
      [-8439, -1743], [-8504, -1772], [-8577, -1838], [-8612, -1902], [-8653, -1965], [-8750, -2026], [-8873, -2089], [-8937, -2122], [-8998, -2157], [-9059, -2194], [-9124, -2231], [-9188, -2267],
      [-9294, -2342], [-9404, -2416], [-9465, -2453], [-9544, -2531], [-9581, -2615], [-9649, -2699], [-9661, -2782], [-9604, -2867], [-9593, -2948], [-9602, -3026], [-9613, -3104], [-9685, -3181],
      [-9726, -3258], [-9703, -3337], [-9699, -3417], [-9693, -3496], [-9665, -3577], [-9584, -3657], [-9500, -3737], [-9468, -3816], [-9464, -3895], [-9484, -3974], [-9535, -4053], [-9605, -4133],
      [-9693, -4213], [-9761, -4254], [-9835, -4295], [-9922, -4376], [-9968, -4458], [-10035, -4539], [-10117, -4619], [-10216, -4699], [-10317, -4779], [-10400, -4859], [-10471, -4945], [-10578, -5037],
      [-10638, -5130], [-10624, -5221], [-10555, -5310], [-10476, -5390], [-10411, -5466], [-10363, -5543], [-10304, -5619], [-10212, -5693], [-10139, -5743], [-10054, -5790], [-9970, -5834], [-9896, -5878],
      [-9826, -5921], [-9742, -5959], [-9639, -5992], [-9522, -6021], [-9402, -6046], [-9285, -6069], [-9170, -6087], [-9055, -6105], [-8945, -6124], [-8838, -6144], [-8731, -6163], [-8621, -6182],
      [-8508, -6200], [-8405, -6221], [-8321, -6228], [-8246, -6233], [-8175, -6236], [-8071, -6243], [-7988, -6252], [-7914, -6275], [-7906, -6360], [-7894, -6443], [-7867, -6519], [-7847, -6598],
      [-7907, -6646], [-7902, -6676], [-7830, -6730], [-7762, -6777], [-7717, -6849], [-7690, -6940], [-7668, -7025], [-7694, -7114], [-7726, -7225], [-7735, -7324], [-7716, -7393], [-7657, -7452],
      [-7592, -7498], [-7555, -7608], [-7522, -7729], [-7471, -7800], [-7433, -7905], [-7388, -8005], [-7326, -8071], [-7268, -8161], [-7208, -8249], [-7134, -8279], [-7051, -8278], [-6971, -8287],
      [-6899, -8327], [-6824, -8357], [-6745, -8374], [-6663, -8385], [-6578, -8385], [-6491, -8372], [-6406, -8365], [-6332, -8405], [-6264, -8469], [-6197, -8536], [-6121, -8561], [-6044, -8580],
      [-5974, -8615], [-5905, -8654], [-5834, -8689], [-5768, -8748], [-5697, -8785], [-5622, -8809], [-5548, -8834], [-5470, -8840], [-5392, -8845], [-5325, -8888], [-5255, -8924], [-5192, -8979],
      [-5138, -9073], [-5073, -9130], [-4994, -9146], [-4913, -9152], [-4830, -9157], [-4745, -9160], [-4664, -9175], [-4567, -9137], [-4460, -9065], [-4362, -9015], [-4258, -8943], [-4204, -8898],
      [-4098, -8820], [-3995, -8751], [-3890, -8665], [-3789, -8580], [-3699, -8523], [-3625, -8534], [-3547, -8525], [-3458, -8481], [-3361, -8419], [-3265, -8357], [-3171, -8308], [-3078, -8262],
      [-2994, -8172], [-2949, -8107], [-2905, -8031], [-2861, -7951], [-2818, -7868], [-2778, -7794], [-2710, -7697], [-2635, -7643], [-2553, -7646], [-2475, -7675], [-2387, -7628], [-2297, -7560],
      [-2240, -7510], [-2166, -7518], [-2090, -7483], [-2002, -7536], [-1923, -7618], [-1844, -7697], [-1765, -7766], [-1685, -7818], [-1631, -7869], [-1548, -7866], [-1495, -7795], [-1413, -7789],
      [-1330, -7823], [-1247, -7845], [-1167, -7822], [-1089, -7774], [-1001, -7771], [-946, -7847], [-888, -7918], [-805, -7952], [-720, -8048], [-667, -8108], [-613, -8175], [-561, -8235],
      [-468, -8294], [-377, -8339], [-290, -8407], [-207, -8487], [-120, -8566], [-36, -8618], [44, -8644], [125, -8651], [210, -8651], [307, -8692], [402, -8725], [484, -8718],
      [578, -8758], [667, -8779], [741, -8753], [834, -8779], [926, -8794], [1008, -8783], [1109, -8817], [1204, -8836], [1282, -8819], [1370, -8824], [1463, -8825], [1553, -8817],
      [1659, -8839], [1765, -8853], [1854, -8834], [1904, -8764], [1955, -8695], [2030, -8667], [2095, -8624], [2160, -8579], [2242, -8553], [2319, -8519], [2383, -8461], [2446, -8397],
      [2493, -8311], [2513, -8193], [2519, -8054], [2547, -7947], [2573, -7838], [2569, -7757], [2563, -7675], [2577, -7550], [2604, -7445], [2638, -7350], [2658, -7238], [2680, -7127],
      [2718, -7038], [2754, -6947], [2803, -6874], [2856, -6806], [2935, -6761], [3034, -6745], [3144, -6754], [3246, -6755], [3345, -6753], [3440, -6760], [3519, -6739], [3605, -6731],
      [3696, -6730], [3760, -6678], [3822, -6614], [3886, -6553], [3959, -6501], [4031, -6445], [4105, -6403], [4203, -6420], [4305, -6447], [4392, -6443], [4479, -6432], [4563, -6409],
      [4653, -6403], [4713, -6443], [4782, -6507], [4849, -6570], [4908, -6616], [5010, -6668], [5103, -6693], [5186, -6690], [5268, -6684], [5379, -6756], [5440, -6806], [5498, -6846],
      [5609, -6909], [5670, -6952], [5734, -6999], [5794, -7037], [5902, -7080], [5992, -7086], [6075, -7076], [6181, -7124], [6291, -7184], [6417, -7218], [6540, -7177], [6679, -7163],
      [6749, -7158], [6854, -7075], [6884, -7000], [6914, -6927], [6947, -6831], [6992, -6755], [7041, -6685], [7073, -6588], [7119, -6528], [7171, -6480], [7232, -6443], [7303, -6417],
      [7380, -6396], [7452, -6365], [7527, -6334], [7604, -6303], [7675, -6263], [7730, -6209], [7762, -6130], [7777, -6037], [7813, -5961], [7932, -5905], [7989, -5850], [8023, -5780],
      [8048, -5705], [8090, -5641], [8143, -5582], [8206, -5526], [8259, -5463], [8294, -5391], [8319, -5316], [8323, -5231], [8290, -5134], [8251, -5035], [8288, -4962], [8353, -4881],
      [8384, -4773], [8430, -4668], [8440, -4557], [8419, -4439], [8414, -4343], [8419, -4264], [8427, -4187], [8442, -4110], [8462, -4034], [8472, -3945], [8480, -3855], [8485, -3764],
      [8527, -3679], [8513, -3586], [8435, -3498], [8363, -3410], [8289, -3323], [8242, -3238], [8195, -3154], [8165, -3070], [8148, -2987], [8102, -2902], [8061, -2816], [8037, -2733],
      [8046, -2654], [8078, -2577], [8135, -2503], [8194, -2429], [8258, -2356], [8317, -2284], [8408, -2215], [8535, -2152], [8612, -2122], [8695, -2093], [8783, -2065], [8866, -2036],
      [8938, -2005], [9041, -1938], [9100, -1866], [9151, -1793], [9239, -1851], [9278, -1962], [9300, -2088], [9298, -2224], [9271, -2364], [9243, -2514], [9185, -2644], [9109, -2754],
      [9030, -2851], [8955, -2943], [9049, -2943], [9116, -2899], [9182, -2854], [9243, -2801], [9299, -2738], [9348, -2665], [9394, -2586], [9451, -2530], [9505, -2470], [9552, -2402],
      [9590, -2325], [9624, -2244], [9650, -2155], [9672, -2066], [9693, -1978], [9711, -1891], [9725, -1803], [9716, -1734], [9704, -1662], [9690, -1588], [9678, -1515], [9668, -1386],
      [9681, -1281], [9721, -1205], [9812, -1183], [9841, -1096], [9839, -975], [9848, -857], [9853, -730], [9845, -593], [9836, -523], [9826, -452], [9813, -379], [9793, -301],
      [9767, -219], [9741, -141], [9725, -71], [9712, 49], [9701, 168], [9698, 280], [9695, 391], [9705, 490], [9718, 587], [9710, 685], [9716, 766], [9720, 843],
      [9725, 915], [9770, 1006], [9805, 1077], [9840, 1148], [9880, 1217], [9929, 1275], [9982, 1329], [10024, 1389], [10019, 1480], [10063, 1542], [10127, 1598], [10176, 1664],
      [10201, 1748], [10221, 1839], [10314, 1887], [10401, 1934], [10431, 2015], [10479, 2082], [10533, 2141], [10586, 2200], [10621, 2271], [10639, 2353], [10667, 2428], [10691, 2513],
      [10735, 2585], [10797, 2645], [10870, 2697], [10937, 2752], [11024, 2786], [11080, 2842], [11132, 2902], [11209, 2943], [11275, 2992], [11353, 3093], [11449, 3179], [11741, 2741],
      [11809, 2714], [11908, 2758], [11989, 2795], [12068, 2863], [12148, 2919], [12230, 2963], [12309, 3004], [12384, 3059], [12454, 3128], [12515, 3226], [12590, 3264], [12671, 3275],
      [12758, 3253], [12833, 3216], [12922, 3174], [13018, 3068], [13084, 3124], [13174, 3157], [13262, 3193], [13327, 3241], [13373, 3307], [13413, 3380], [13461, 3445], [13523, 3488],
      [13589, 3517], [13666, 3521], [13763, 3483], [13546, 4057], [13626, 4110], [13689, 4169], [13737, 4263], [14173, 3478], [14266, 3513], [14373, 3589], [14486, 3731], [14554, 3952],
      [14449, 4160], [14311, 4272], [14198, 4323], [14111, 4350], [14039, 4364], [13945, 4339], [13867, 4358], [13799, 4406], [13723, 4430], [13648, 4458], [13571, 4480], [13473, 4445],
      [13372, 4400], [13277, 4372], [13182, 4345], [13090, 4329], [12996, 4312], [12915, 4326], [12837, 4347], [12760, 4371], [12685, 4400], [12599, 4403], [12513, 4403], [12448, 4457],
      [12371, 4484], [12279, 4469], [12198, 4482], [12115, 4492], [12028, 4484], [11959, 4522], [11887, 4550], [11822, 4599], [11767, 4676], [11706, 4744], [11641, 4797], [11586, 4884],
      [11534, 4976], [11473, 5044], [11381, 5019], [11284, 4976], [11191, 4948], [11110, 4956], [11033, 4975], [10957, 4997], [10877, 5007], [10806, 5046], [10740, 5100], [10666, 5134],
      [10577, 5124], [10487, 5114], [10414, 5149], [10349, 5206], [10280, 5252], [10197, 5261], [10114, 5268], [10036, 5288], [9957, 5306], [9875, 5317], [9804, 5321], [9727, 5324],
      [9691, 5264], [9650, 5198], [9547, 5188], [9463, 5180], [9388, 5151], [9326, 5091], [9280, 4995], [9231, 4905], [9168, 4849], [9077, 4856], [8979, 4883], [8896, 4872],
      [8815, 4859], [8724, 4866], [8631, 4880], [8551, 4864], [8483, 4820], [8408, 4791], [8306, 4825], [8189, 4895], [8077, 4953], [7986, 4963], [7905, 4948], [7820, 4944],
      [7719, 4976], [7603, 5045], [7488, 5110], [7393, 5128], [7324, 5086], [7248, 5059], [7185, 5002], [7121, 4946], [7034, 4948], [6950, 4940], [6873, 4914], [6806, 4866],
      [6727, 4849], [6649, 4827], [6590, 4760], [6535, 4686], [6481, 4608], [6437, 4506], [6385, 4424], [6313, 4388], [6228, 4381], [6142, 4379], [6055, 4380], [5952, 4417],
      [5837, 4481], [5726, 4539], [5645, 4524], [5584, 4461], [5533, 4376], [5471, 4318], [5394, 4293], [5309, 4287], [5228, 4272], [5167, 4212], [5104, 4155], [5023, 4139],
      [4961, 4080], [4917, 3978], [4864, 3898], [4805, 3832], [4740, 3779], [4665, 3750], [4604, 3689], [4533, 3650], [4432, 3684], [4351, 3668], [4279, 3633], [4193, 3631],
      [4192, 3531], [4207, 3394], [4208, 3289], [4161, 3194], [4089, 3159], [4015, 3128], [3941, 3096], [3868, 3065], [3794, 3033], [3720, 3002], [3646, 2971], [3572, 2939],
      [3498, 2908], [3425, 2876], [3351, 2845], [3277, 2814], [3203, 2782], [3129, 2751], [3055, 2719], [2981, 2688], [2908, 2657], [2834, 2625], [2760, 2594], [2686, 2562],
      [2612, 2531], [2538, 2499], [2465, 2468], [2391, 2437], [2317, 2405], [2243, 2374], [2169, 2342], [2095, 2311], [2021, 2280], [1948, 2248], [1874, 2217], [1800, 2185],
      [1726, 2154]],
    // vorgelagerte Inselchen (Madagaskar-Vergleich): [x, z, Radius, Zufall]
    eilande: [[-9631,-1522,256,989], [-11015,-2841,301,359], [-9652,-7154,155,573], [-8561,-9087,132,498], [-9726,-7143,279,265], [-4417,-9785,371,235], [-2818,-9210,338,789], [3718,-9334,387,88], [10315,-4404,122,195], [9850,-3609,367,200], [4367,4758,257,233]],
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
