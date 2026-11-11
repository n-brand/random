// Gotham City - Planungsdaten fuer die 2D-Karte (gotham/index.html) und spaeter fuer den 3D-Aufbau.
// NUR DATEN. Zum Anpassen einfach Zahlen aendern oder Eintraege kopieren, Seite neu laden.
//
// Koordinaten wie im Spiel: Welt-Meter, Rondell von Wayne Manor = 0 / 0, Osten = +x, NORDEN = -z (auf der Karte oben).
// Klick auf die Karte zeigt die Koordinate des Punkts (zum Abschreiben in diese Datei).
//
// Formate:
//   Polygon  [[x, z], [x, z], ...]          Linie  [[x, z], ...] mit w = Breite in m
//   ort      { id, typ, name, x, z, w, d, h?, ebene?, notiz?, status? }
//            typ  = Schluessel aus TYPEN (Farbe, Gruppe), w/d = Groesse Ost-West/Nord-Sued in m, h = Hoehe in m (Gebaeude),
//            ebene = 0 Strasse, negative Zahl = unter der Erde (Tiefgarage -1, Geheimstock -2, Kanal -3 ...),
//            status = "geplant" (Vorgabe) | "baustelle" | "gebaut"
//   bezirk   { name, wohlstand 0..1, poly }  wohlstand steuert spaeter Hoehe/Art der Fuellbauten (1 = Tuerme, 0 = kleine Mietshaeuser,
//            Gassen, Fabriken); zwischen den Bezirken wird weich ueberblendet (dynamischer Uebergang reich -> arm).
//   raster   Strassenraster: Avenues (Nord-Sued) bei den x-Werten, Strassen (Ost-West) bei den z-Werten, nur auf der Insel.

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

const GOTHAM = {
  // Sichtbereich beim Oeffnen der Karte
  ansicht: { x0: -3900, z0: -2700, x1: 1500, z1: 2300 },

  // Meer: bestehende Kueste der Welt (vereinfacht als Linie x + z = 283 im Suedosten) und neue Suedkueste vor Gotham (z 1450)
  meer: [[-4200, 1450], [-1170, 1450], [-1100, 1383], [-500, 783], [0, 283], [500, -217], [1000, -717], [1700, -1417], [1700, 2600], [-4200, 2600]],

  // Hauptinsel von Gotham zwischen Westfluss und Ostfluss
  insel: [[-2960, -1500], [-2200, -1560], [-1120, -1500], [-1090, -900], [-1135, -300], [-1080, 300], [-1125, 900], [-1105, 1450], [-2960, 1450], [-2995, 800], [-2950, 200], [-2990, -500]],
  inseln: [
    { name: "Arkham-Insel", poly: [[-3520, 1640], [-3180, 1600], [-3130, 1780], [-3250, 1900], [-3500, 1880]] },
  ],

  fluesse: [
    { name: "Ostfluss", w: 110, linie: [[-1060, -2700], [-1030, -1500], [-1040, -900], [-1080, -300], [-1025, 300], [-1065, 900], [-1050, 1450]] },
    { name: "Westfluss", w: 140, linie: [[-3070, -2700], [-3060, -1500], [-3080, -500], [-3030, 200], [-3075, 800], [-3040, 1450]] },
  ],

  bezirke: [
    { name: "Uptown (sehr reich)", wohlstand: 0.95, poly: [[-2600, -1560], [-1120, -1500], [-1090, -900], [-1110, -500], [-2600, -500]] },
    { name: "Midtown / Zentrum", wohlstand: 0.85, poly: [[-2600, -500], [-1110, -500], [-1135, -300], [-1080, 300], [-2200, 300], [-2600, 300]] },
    { name: "Westseite (Mittelstand)", wohlstand: 0.6, poly: [[-2960, -1500], [-2600, -1560], [-2600, 300], [-2950, 200], [-2990, -500]] },
    { name: "Südstadt (gemischt)", wohlstand: 0.45, poly: [[-2200, 300], [-1080, 300], [-1125, 900], [-1105, 1450], [-2200, 1450]] },
    { name: "Fabrikviertel", wohlstand: 0.25, poly: [[-2950, 200], [-2200, 300], [-2200, 800], [-2995, 800]] },
    { name: "The Narrows (arm, Hafen)", wohlstand: 0.1, poly: [[-2995, 800], [-2200, 800], [-2200, 1450], [-2960, 1450]] },
  ],

  // Strassenraster (Avenues Nord-Sued bei x, Strassen Ost-West bei z), breit = Hauptachsen
  raster: {
    avenues: [-2900, -2750, -2600, -2450, -2300, -2150, -1950, -1800, -1650, -1500, -1350, -1200],
    strassen: [-1450, -1350, -1250, -1150, -1050, -950, -850, -750, -650, -550, -450, -350, -250, -150, -50, 50, 150, 250, 350, 450, 550, 650, 750, 850, 950, 1050, 1150, 1250, 1350],
    breit: { avenues: [-2050, -1500], strassen: [-50, 650] },
    w: 14, wBreit: 24,
  },
  // Seitengassen (New-York-Stil: Muell, Waescheleinen, Feuertreppen) - dichtes Zusatzraster nur in diesen Bereichen
  gassen: [{ x0: -2960, x1: -2200, z0: 800, z1: 1440, schritt: 50 }],

  // Strassen ausserhalb des Rasters (Highway zur Manor, Bruecken, Zufahrten)
  strassen: [
    { name: "Hauptstrasse (besteht)", w: 8, besteht: true, linie: [[-61, 200], [0, 168], [48, 138], [78, 108], [100, 78], [128, 55], [172, 36], [210, 0], [232, -60], [244, -130], [256, -217]] },
    { name: "Gotham Highway (Manor - Zentrum, mehretagige Brücke)", w: 22, linie: [[-61, 200], [-300, 260], [-650, 290], [-950, 300], [-1180, 300], [-1500, 300]] },
    { name: "Nordbrücke Ost", w: 18, linie: [[-1250, -900], [-850, -900], [-500, -700]] },
    { name: "Südbrücke Ost", w: 18, linie: [[-1250, 1050], [-850, 1050], [-600, 700]] },
    { name: "Westbrücke Nord", w: 16, linie: [[-2900, -650], [-3250, -650], [-3500, -650]] },
    { name: "Westbrücke Süd", w: 16, linie: [[-2900, 450], [-3250, 450], [-3500, 450]] },
    { name: "Arkham-Brücke", w: 10, linie: [[-2900, 1350], [-3150, 1500], [-3300, 1700]] },
    { name: "Zufahrt Militärstützpunkt", w: 12, linie: [[-1950, -1500], [-1950, -1800], [-2000, -2100]] },
  ],
  bruecken: [   // Abschnitte ueber Wasser (fuer die Karte hervorgehoben)
    { name: "Highway-Brücke (2 Ebenen, darunter Obdachlose und Club)", w: 22, linie: [[-1180, 300], [-950, 300]] },
    { name: "Nordbrücke", w: 18, linie: [[-1120, -900], [-950, -900]] },
    { name: "Südbrücke", w: 18, linie: [[-1130, 1050], [-960, 1050]] },
    { name: "Westbrücke Nord", w: 16, linie: [[-2985, -650], [-3150, -650]] },
    { name: "Westbrücke Süd", w: 16, linie: [[-2955, 450], [-3130, 450]] },
    { name: "Arkham-Brücke", w: 10, linie: [[-2960, 1440], [-3220, 1640]] },
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
    depot: { name: "Abstellanlage (Züge ausser Betrieb, am Gleisnetz)", x: -1300, z: -250, w: 120, d: 60, gleis: [[-1400, 0], [-1340, -150], [-1300, -250]] },
    graffiti: [{ text: "NBR", x: -2620, z: 600 }],
  },

  // Bus: Linien als Strecken auf dem Raster, Haltestellen zwischen den U-Bahn-Stationen
  bus: {
    linien: [
      { name: "Linie 1 Ring innen", linie: [[-1500, -650], [-1500, 650], [-2450, 650], [-2450, -650], [-1500, -650]] },
      { name: "Linie 2 Nord-Süd", linie: [[-2050, -1450], [-2050, 1350]] },
      { name: "Linie 3 Manor-Express", linie: [[-1550, 150], [-1500, 300], [-950, 300], [-61, 200]] },
    ],
    halte: [[-1500, -400], [-1500, 200], [-1500, 500], [-1800, 650], [-2150, 650], [-2450, 350], [-2450, -100], [-2450, -450], [-2150, -650], [-1800, -650],
      [-2050, -1250], [-2050, -850], [-2050, 350], [-2050, 950], [-2050, 1300], [-700, 290]],
  },

  // Abwasserkanaele: ein zusammenhaengendes Netz; Gitter = Auslass in Fluss oder Meer (vereinzelt), Zugang = Uebergang von U-Bahn-Tunneln
  kanal: {
    linien: [
      [[-2050, -1450], [-2050, 1440]], [[-2950, -100], [-1110, -100]], [[-2950, 900], [-1110, 900]], [[-2700, -1100], [-2700, 1440]],
      [[-1450, -1300], [-1450, 1300]], [[-2700, -1100], [-1100, -1100]], [[-2050, 1440], [-2050, 1445]],
    ],
    gitter: [[-1110, -1100], [-1110, -100], [-1110, 900], [-2955, -100], [-2990, 900], [-2050, 1445]],
    zugang: [[-1400, 0], [-2700, 0], [-2050, 1100], [-2050, -1100]],
    hub: { name: "Zentraler Knoten unter dem Wayne Tower (grösster Teil des Netzes, Schurkenbasis)", x: -2050, z: -100, r: 160 },
  },

  orte: [
    // --- Wahrzeichen ---
    { id: "wayne-tower", typ: "wahrzeichen", name: "Wayne Tower", x: -2050, z: -100, w: 70, d: 70, h: 320,
      notiz: "Zentrum. Befahrbare Tiefgarage (-1). Darunter geheimer Stock (-2): Tumbler und weitere Prototypen, Gadgets. Darunter Kanal-Hub mit Schurkenbasis (-3)." },
    { id: "gcpd", typ: "oeffentlich", name: "Polizeipräsidium (Batsignal auf dem Dach)", x: -2300, z: 250, w: 80, d: 60, h: 45 },
    { id: "arkham", typ: "wahrzeichen", name: "Arkham Asylum", x: -3330, z: 1760, w: 220, d: 160, h: 30, notiz: "Eigene Insel vor der Küste, nur über die Arkham-Brücke." },
    { id: "hafen", typ: "industrie", name: "Hafen / Containerterminal", x: -2600, z: 1400, w: 620, d: 90, notiz: "Kräne, Container, Lagerhallen." },
    // --- Oeffentlich ---
    { id: "gericht", typ: "oeffentlich", name: "Gerichtsgebäude", x: -2150, z: 400, w: 70, d: 50, h: 35 },
    { id: "kirche", typ: "oeffentlich", name: "Kathedrale", x: -2450, z: -250, w: 50, d: 90, h: 60 },
    { id: "kh-1", typ: "gesundheit", name: "Krankenhaus Uptown", x: -1550, z: -1300, w: 90, d: 70, h: 50 },
    { id: "kh-2", typ: "gesundheit", name: "Krankenhaus Westseite", x: -2750, z: 50, w: 80, d: 60, h: 40 },
    { id: "kh-3", typ: "gesundheit", name: "Krankenhaus Südstadt", x: -1850, z: 1150, w: 80, d: 60, h: 35 },
    { id: "heim-1", typ: "gesundheit", name: "Kinderheim West", x: -2750, z: -300, w: 40, d: 30, h: 12 },
    { id: "heim-2", typ: "gesundheit", name: "Kinderheim Narrows", x: -2300, z: 1200, w: 40, d: 30, h: 12 },
    { id: "krippe-1", typ: "gesundheit", name: "Kinderkrippe Uptown", x: -1400, z: -900, w: 25, d: 20, h: 6 },
    { id: "krippe-2", typ: "gesundheit", name: "Kinderkrippe Westseite", x: -2450, z: 450, w: 25, d: 20, h: 6 },
    { id: "krippe-3", typ: "gesundheit", name: "Kinderkrippe Südstadt", x: -1950, z: 800, w: 25, d: 20, h: 6 },
    // --- Freizeit ---
    { id: "stadion", typ: "freizeit", name: "Football-Stadion", x: -1400, z: 780, w: 220, d: 160, h: 40 },
    { id: "museum-1", typ: "freizeit", name: "Kunstmuseum", x: -1700, z: -1050, w: 100, d: 60, h: 25 },
    { id: "museum-2", typ: "freizeit", name: "Naturkundemuseum", x: -2250, z: -1150, w: 90, d: 70, h: 25 },
    { id: "event", typ: "freizeit", name: "Eventgebäude (Spendengala, Hochzeit)", x: -1800, z: -750, w: 90, d: 60, h: 20 },
    { id: "pinguin", typ: "freizeit", name: "Club des Pinguins (unter der Highway-Brücke)", x: -1210, z: 380, w: 50, d: 40, h: 10, ebene: -1, notiz: "Mehretagen-Bereich: Highway oben, Strasse unten, darunter Obdachlose." },
    { id: "obdachlos", typ: "freizeit", name: "Unter der Brücke: Obdachlosenlager", x: -1190, z: 300, w: 60, d: 30, ebene: -1 },
    // --- Banken ---
    { id: "bank-g1", typ: "bank", name: "Grossbank (Tresorkeller)", x: -1950, z: -350, w: 60, d: 50, h: 120 },
    { id: "bank-g2", typ: "bank", name: "Grossbank (Tresorkeller)", x: -1650, z: -600, w: 60, d: 50, h: 150 },
    { id: "bank-g3", typ: "bank", name: "Grossbank (Tresorkeller)", x: -2250, z: -800, w: 55, d: 45, h: 90 },
    { id: "bank-k1", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -2650, z: 950, w: 15, d: 12, h: 5 },
    { id: "bank-k2", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -1700, z: 700, w: 15, d: 12, h: 5 },
    { id: "bank-k3", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -2500, z: -1000, w: 15, d: 12, h: 5 },
    { id: "bank-k4", typ: "bank", name: "Kleine Bank (3 Automaten)", x: -1350, z: -200, w: 15, d: 12, h: 5 },
    ...[[-1900, -150], [-1600, 100], [-2350, -350], [-2550, 650], [-2150, 1000], [-1300, 500], [-1800, -1250], [-2850, -800], [-2450, 1300], [-1650, 1300], [-2200, 50], [-1450, -500]]
      .map(([x, z], i) => ({ id: "atm-" + (i + 1), typ: "atm", name: "Bankautomat", x, z, w: 4, d: 4 })),
    // --- Hotels ---
    { id: "hotel-l1", typ: "hotel", name: "Luxushotel", x: -1850, z: -1200, w: 60, d: 50, h: 180 },
    { id: "hotel-l2", typ: "hotel", name: "Luxushotel", x: -2350, z: -600, w: 55, d: 45, h: 140 },
    { id: "hotel-b1", typ: "hotel", name: "Billighotel", x: -2700, z: 1050, w: 30, d: 25, h: 20 },
    { id: "hotel-b2", typ: "hotel", name: "Billighotel", x: -1550, z: 1100, w: 30, d: 25, h: 18 },
    { id: "hotel-b3", typ: "hotel", name: "Billighotel", x: -2800, z: 450, w: 30, d: 25, h: 18 },
    // --- Laeden ---
    { id: "juw-1", typ: "laden", name: "Juwelier", x: -1950, z: -650, w: 20, d: 15, h: 8 },
    { id: "juw-2", typ: "laden", name: "Juwelier", x: -1750, z: -950, w: 20, d: 15, h: 8 },
    { id: "juw-3", typ: "laden", name: "Juwelier", x: -2300, z: -450, w: 20, d: 15, h: 8 },
    { id: "schneider-1", typ: "laden", name: "Massschneider (teuer)", x: -2050, z: -900, w: 18, d: 14, h: 8 },
    { id: "schneider-2", typ: "laden", name: "Massschneider (teuer)", x: -1650, z: -850, w: 18, d: 14, h: 8 },
    { id: "kleider-n1", typ: "laden", name: "Kleiderladen (normal)", x: -1900, z: 500, w: 30, d: 20, h: 8 },
    { id: "kleider-n2", typ: "laden", name: "Kleiderladen (normal)", x: -2400, z: 150, w: 30, d: 20, h: 8 },
    { id: "kleider-b1", typ: "laden", name: "Kleider-Billigladen", x: -2600, z: 1150, w: 25, d: 18, h: 6 },
    { id: "kleider-b2", typ: "laden", name: "Kleider-Billigladen", x: -1800, z: 1000, w: 25, d: 18, h: 6 },
    { id: "kleider-b3", typ: "laden", name: "Kleider-Billigladen", x: -2500, z: 700, w: 25, d: 18, h: 6 },
    { id: "waffen-1", typ: "laden", name: "Waffenladen", x: -2600, z: 550, w: 20, d: 15, h: 6 },
    { id: "waffen-2", typ: "laden", name: "Waffenladen", x: -1500, z: 950, w: 20, d: 15, h: 6 },
    { id: "auto-billig", typ: "laden", name: "Autohaus (billig)", x: -2750, z: 650, w: 70, d: 50, h: 8, notiz: "Echte Filiale der Fahrzeug-Kette aus dem Computer-Shop." },
    { id: "auto-teuer", typ: "laden", name: "Autohaus (teuer)", x: -1600, z: -1150, w: 70, d: 50, h: 12 },
    { id: "auto-militaer", typ: "militaer", name: "Fahrzeughandel Militär", x: -2150, z: -2150, w: 80, d: 60, h: 10, notiz: "Am Militärstützpunkt." },
    // --- Essen ---
    ...[[-1600, -300], [-2150, -550], [-2550, -650], [-1850, 250], [-1450, 450], [-2350, 600]].map(([x, z], i) => ({ id: "bar-" + (i + 1), typ: "essen", name: i % 2 ? "Restaurant" : "Bar", x, z, w: 20, d: 15, h: 8 })),
    ...[[-2700, 1250], [-2450, 950], [-2850, 750], [-2300, 1300]].map(([x, z], i) => ({ id: "fastfood-" + (i + 1), typ: "essen", name: "Billig-Fast-Food", x, z, w: 15, d: 12, h: 5 })),
    // --- Verkehr ---
    { id: "busbahnhof", typ: "verkehr", name: "Busbahnhof", x: -1580, z: 150, w: 90, d: 50, h: 10 },
    { id: "taxi", typ: "verkehr", name: "Taxi-Depot (Taxis ausser Betrieb)", x: -2600, z: 420, w: 70, d: 45, h: 10 },
    ...[[-1900, -250], [-1600, 350], [-2350, -900], [-2700, 700], [-1750, 850]].map(([x, z], i) => ({ id: "parkhaus-" + (i + 1), typ: "verkehr", name: "Parkhaus", x, z, w: 40, d: 30, h: 18 })),
    // --- Industrie ---
    ...[[-2850, 350], [-2650, 300], [-2400, 650], [-2850, 600]].map(([x, z], i) => ({ id: "fabrik-" + (i + 1), typ: "industrie", name: "Fabrik", x, z, w: 70, d: 45, h: 15 })),
    // --- Geheim ---
    { id: "container-base", typ: "geheim", name: "Container mit geheimer Batman-Basis", x: -2940, z: 1330, w: 14, d: 4, ebene: -1,
      notiz: "Am Westfluss beim Hafen. Innen: Batmobil in der Mitte, Anzug fährt aus dem Boden, Motorrad und Batpod fahren aus der Wand, Decke aus Lampen, Computer, aufklappbare Wand mit Waffen und Gadgets, Geheimwand mit Tresor (Goldbarren, Bargeld)." },
    { id: "schurkenbasis", typ: "geheim", name: "Schurkenbasis im Kanalnetz", x: -2050, z: -60, w: 120, d: 80, ebene: -3,
      notiz: "Waffen unter Planen, herumliegende Waffen, Tisch mit Computer, Boxsack, Gitterboden, darunter fliessendes Abwasser." },
    ...[[-2850, 1100], [-2550, 1350], [-2350, 1050], [-2750, 900]].map(([x, z], i) => ({ id: "drogen-" + (i + 1), typ: "geheim", name: "Geheimes Drogenversteck", x, z, w: 10, d: 10 })),
    // --- Baustellen (eine Vorlage, mehrfach eingesetzt) ---
    ...[[-2050, -1350], [-1350, -650], [-2800, -1200], [-1700, 550], [-2400, -1350], [-1450, 1300], [-2850, -50], [-2100, 650]]
      .map(([x, z], i) => ({ id: "baustelle-" + (i + 1), typ: "baustelle", name: "Baustelle (Platzhalter)", x, z, w: 60, d: 50, status: "baustelle" })),
    // --- Militaer ---
    { id: "militaer-nord", typ: "militaer", name: "Militärstützpunkt (ausserhalb der Stadt)", x: -2000, z: -2300, w: 650, d: 420 },
    { id: "militaer-insel", typ: "militaer", name: "Militärinsel (Südosten, zusätzlich)", x: 950, z: 1150, w: 500, d: 380 },
    // --- Bestehend ---
    { id: "manor", typ: "manor", name: "Wayne Manor (besteht)", x: -20, z: 15, w: 70, d: 95, status: "gebaut" },
  ],
};
