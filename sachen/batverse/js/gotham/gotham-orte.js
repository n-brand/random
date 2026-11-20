// Batverse – Gotham: Gebaeude mit Bedeutung (PLAN-GOTHAM Phase 3, P3b). Klassisches Skript nach gotham-hafen.js.
// Baut alle Orte aus daten.js, die noch keinen eigenen Bau haben: Gericht, Kathedrale, Krankenhaeuser, Kinderheime, Krippen, Stadion, Museen,
// Eventhalle, Club, Banken und Bankautomaten, Hotels, Laeden, Bars/Restaurants, Fast Food, Autohaeuser, Fabriken.
// Grundriss und Hoehe aus der Karte (gedreht wie die Karte), Front zur naechsten Strasse. Huellen aus den Gebaeude-Vorlagen (gbvShell, Fassaden leuchten
// nachts mit den anderen), dazu je Ort ein Schild (ein Atlas fuer alle, leuchtet nachts) und Sonderformen: Saeulenportal (Gericht, Museen),
// Kathedrale (Schiff, Querhaus, zwei Tuerme mit Helm, Rosette), Stadion (Tribuenen in Stufen 0,4/0,8 m, blaue Sitze, Spielfeld, Flutlicht),
// Krankenhaus (rotes Kreuz, Notaufnahme-Vordach), Luxushotel (Vordach in Gold). Kollision je Baukoerper (dkAdd, Daecher begehbar).
"use strict";
const GORT = { done: false, list: [], mats: null };
// Schildtexte (fiktive Namen, keine echten Marken) und Bauart je Ort
const GORT_SIGN = {
  "gericht": "GOTHAM COUNTY COURTHOUSE", "kirche": "", "kh-1": "GOTHAM GENERAL HOSPITAL", "kh-2": "ST. MARY'S HOSPITAL", "kh-3": "EAST END MEDICAL CENTER",
  "heim-1": "ST. AGNES CHILDREN'S HOME", "heim-2": "NARROWS CHILDREN'S HOME", "krippe-1": "LITTLE OWLS DAYCARE", "krippe-2": "SUNNY SIDE DAYCARE", "krippe-3": "BUSY BEES DAYCARE",
  "stadion": "GOTHAM STADIUM", "museum-1": "GOTHAM MUSEUM OF ART", "museum-2": "MUSEUM OF NATURAL HISTORY", "event": "GOTHAM GRAND BALLROOM", "pinguin": "CLUB DES PINGUINS",
  "bank-g1": "FIRST GOTHAM BANK", "bank-g2": "GOTHAM TRUST", "bank-g3": "MERCHANTS BANK OF GOTHAM", "bank-k1": "GOTHAM SAVINGS", "bank-k2": "GOTHAM SAVINGS", "bank-k3": "GOTHAM SAVINGS", "bank-k4": "GOTHAM SAVINGS",
  "hotel-l1": "THE GOTHAM GRAND", "hotel-l2": "HOTEL ROYALE", "hotel-b1": "HOTEL", "hotel-b2": "MOTEL", "hotel-b3": "HOTEL",
  "juw-1": "DIAMOND & CO. JEWELERS", "juw-2": "GOLDSTEIN JEWELERS", "juw-3": "CROWN JEWELERS", "schneider-1": "BESPOKE TAILORS", "schneider-2": "SAVILE TAILORING",
  "kleider-n1": "GOTHAM FASHION", "kleider-n2": "CITY STYLE", "kleider-b1": "DISCOUNT CLOTHES", "kleider-b2": "BARGAIN WEAR", "kleider-b3": "CHEAP & CHIC",
  "waffen-1": "GUNS & AMMO", "waffen-2": "GOTHAM ARMS", "auto-billig": "BUDGET CARS", "auto-teuer": "PRESTIGE MOTORS",
  "bar-1": "BAR", "bar-2": "RESTAURANT", "bar-3": "BAR", "bar-4": "RESTAURANT", "bar-5": "BAR", "bar-6": "RESTAURANT",
  "fastfood-1": "BURGERS", "fastfood-2": "FRIED CHICKEN", "fastfood-3": "PIZZA SLICE", "fastfood-4": "HOT DOGS",
  "fabrik-1": "ACE CHEMICALS", "fabrik-2": "GOTHAM STEEL", "fabrik-3": "KANE TEXTILES", "fabrik-4": "AXIS PLASTICS",
};
const GORT_SKIP = new Set(["wayne-tower", "gcpd", "hafen", "busbahnhof", "taxi", "obdachlos", "manor"]);   // eigener Bau oder spaeter (Parkhaeuser V4, geheim P5/U, Baustellen)
function gortKind(o) {
  const id = o.id;
  if (id === "kirche") return "kirche"; if (id === "stadion") return "stadion"; if (id === "gericht" || id.startsWith("museum")) return "portal";
  if (id.startsWith("kh-")) return "kh"; if (id.startsWith("atm")) return "atm"; if (id.startsWith("hotel-l") || id.startsWith("bank-g")) return "turm";
  if (id.startsWith("fabrik")) return "fabrik"; if (id.startsWith("heim") || id.startsWith("hotel-b")) return "miet"; if (id === "event" || id.startsWith("auto")) return "halle";
  if (id.startsWith("krippe")) return "krippe"; return "laden";
}
// Farben der Schilder [Grund, Schrift]
const GORT_COL = { portal: ["#d8d0bf", "#3a362f"], kh: ["#ffffff", "#c8102e"], turm: ["#101418", "#e8c56a"], laden: ["#1d2229", "#f4efe2"], miet: ["#2a1f1a", "#ff5a4a"], halle: ["#0e1a2a", "#9fd3ff"], krippe: ["#fff4c2", "#2d6fb5"], fabrik: ["#3b3b38", "#f0e6c8"], atm: ["#0b3d6e", "#ffffff"], stadion: ["#0b2d5a", "#ffffff"] };
// Bankautomat direkt beim Wayne Tower (Nicolas 2026-11-17): neues Modell (bankautomat.js, wie in der Werkstatt) auf dem Vorplatz, 4 m vor und 6 m rechts vom Startpunkt
// des Begehens, Front zur Strasse. Kollision (dkAdd), Rechtsklick/E oeffnet das Bankfenster; der Bildschirm zeigt die Seiten des Fensters (konto.js).
function gortWayneAtm() { if (typeof buildBankautomat !== "function" || typeof WALK_START === "undefined" || GORT.wtAtm) return;
  const yaw = WALK_START.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw), x = WALK_START.x + fx * 4 + rx * 6, z = WALK_START.z + fz * 4 + rz * 6;
  const y = groundAt(x, z, 50), h = yaw + Math.PI, g = buildBankautomat(); g.position.set(x, y, z); g.rotation.y = h; scene.add(g); GORT.wtAtm = g;
  dkAdd({ cx: x, cy: y + 1.18, cz: z, ux: Math.cos(h), uz: -Math.sin(h), hl: 0.42, hw: 0.5, hh: 1.18, m: 0.05 });
  const hm = new THREE.Mesh(new THREE.BoxGeometry(1, 2.4, 1.1), new THREE.MeshBasicMaterial({ visible: false })); hm.position.set(x, y + 1.2, z); scene.add(hm);
  gates.push({ name: "Bankautomat (Wayne Tower)", g: hm, call: () => typeof kontoOpen === "function" && kontoOpen(), verbs: ["benutzen", "benutzen"], a: [x, z], b: [x, z], near: 4 }); }
function* gortGen() {
  while (!GSTR.done || !GGEB.done || !GBST.done) yield "wait";
  gbvInit();
  const rt = GOTHAM.manorLage.dreh * Math.PI / 180, ax = Math.cos(rt), az = -Math.sin(rt), e2 = [-az, ax], Y = GOT.STR, GH = GBV.GH, out = new Map();
  const list = GOTHAM.orte.filter(o => !GORT_SKIP.has(o.id) && !/^(parkhaus|container|bunker|schurken|drogen|BS-)/.test(o.id) && !o.aussen);
  // Schild-Atlas: 2 Spalten zu 512 px, Zeilen zu 64 px
  const signs = list.map(o => ({ o, text: o.id.startsWith("atm") ? "ATM" : (GORT_SIGN[o.id] ?? o.name.split(" (")[0].toUpperCase()), kind: gortKind(o) })).filter(s => s.text);
  const rows = Math.ceil(signs.length / 2), AW = 1024, AH = 64 * rows;
  const atlas = canvasTex(AW, AH, (c) => { signs.forEach((sg, i) => { const x = (i % 2) * 512, y = Math.floor(i / 2) * 64, [bg, fg] = GORT_COL[sg.kind] || GORT_COL.laden;
    c.fillStyle = bg; c.fillRect(x, y, 512, 64); c.strokeStyle = fg; c.globalAlpha = 0.5; c.lineWidth = 3; c.strokeRect(x + 4, y + 4, 504, 56); c.globalAlpha = 1;
    let px = 40; const font = sg.kind === "portal" || sg.kind === "turm" ? "Georgia, serif" : "Arial, sans-serif"; c.font = "bold " + px + "px " + font; while (c.measureText(sg.text).width > 480 && px > 12) { px -= 2; c.font = "bold " + px + "px " + font; }
    c.fillStyle = fg; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(sg.text, x + 256, y + 34); sg.u0 = x / AW; sg.u1 = (x + 512) / AW; sg.v1 = 1 - y / AH; sg.v0 = 1 - (y + 64) / AH; sg.ar = Math.min(8, c.measureText(sg.text).width / 40 + 1); }); });
  atlas.wrapS = atlas.wrapT = THREE.ClampToEdgeWrapping;
  const signM = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.5 });
  const M = GORT.mats = { schild: signM, rose: null, rasen: new THREE.MeshStandardMaterial({ map: canvasTex(512, 256, (c, w, h) => { c.fillStyle = "#3f7d34"; c.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? "#3a7530" : "#44843a"; c.fillRect(i * w / 10, 0, w / 10, h); }
    c.strokeStyle = "#f2f2ea"; c.lineWidth = 3; c.strokeRect(10, 10, w - 20, h - 20); for (let i = 1; i < 10; i++) { c.beginPath(); c.moveTo(10 + i * (w - 20) / 10, 10); c.lineTo(10 + i * (w - 20) / 10, h - 10); c.stroke(); } c.fillStyle = "#1d4f8f"; c.fillRect(10, 10, (w - 20) / 12, h - 20); c.fillRect(w - 10 - (w - 20) / 12, 10, (w - 20) / 12, h - 20); }), roughness: 0.95 }) };
  const sgOf = new Map(signs.map(s => [s.o.id, s]));
  yield;
  const col = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  for (const o of list) {
    const [ax, az] = gotAxis(o.x, o.z), e2 = [-az, ax];   // Achse je Ort (Werkstatt dreht einzeln)
    const [cx, cz] = GOT.toGame(o.x, o.z), L1 = o.w, L2 = o.d, P0 = [cx - ax * L1 / 2 - e2[0] * L2 / 2, cz - az * L1 / 2 - e2[1] * L2 / 2];
    const f = gbvFrame({ P0, e1: [ax, az], e2, L1, L2 }), kind = gortKind(o), H = Math.max(4.2, o.h || 6), seed = (o.id.length * 37 + o.x * 7 + o.z * 3) & 255;
    const Wp = (s, t) => { const p = f.W(s, t, 0); return [p[0], p[2]]; };
    // Front: Seite mit der naechsten Fahrbahn (Probe bis 30 m)
    const out4 = [[0, -1], [1, 0], [0, 1], [-1, 0]]; let front = 0, bd = 1e9;
    for (let k = 0; k < 4; k++) { if (kind === "kirche" && L2 > L1 && k % 2) continue; const sd = f.side(k), ms = sd[0] + sd[2] * sd[6] / 2, mt = sd[1] + sd[3] * sd[6] / 2;
      for (let d = 1; d < 30; d += 1.5) { const [x, z] = Wp(ms + out4[k][0] * d, mt + out4[k][1] * d); if (GSTR.onRoad(x, z, 0)) { if (d < bd) { bd = d; front = k; } break; } } }
    const box = (s, t, ls, lt, y0, y1) => { const [x, z] = Wp(s, t); dkAdd({ cx: x, cy: (y0 + y1) / 2, cz: z, ux: ax, uz: az, hl: ls / 2, hw: lt / 2, hh: (y1 - y0) / 2, m: 0.3 }); };
    // Schild auf Seite k (Mitte u laengs), Hoehe y, Breite w (Hoehe aus dem Seitenverhaeltnis), dist vor der Wand
    const sign = (k, u, y, w, dist = 0.12, inset = 0) => { const sg = sgOf.get(o.id); if (!sg) return; const sd = f.side(k), h = Math.min(w / sg.ar * 1.2, w / 3), os = sd[4], ot = sd[5];
      const s = sd[0] + sd[2] * u + os * (dist - inset), t = sd[1] + sd[3] * u + ot * (dist - inset), ow = f.dirW(os, ot), R = [ow[2], 0, -ow[0]], C = f.W(s, t, y);
      const P = (a, b) => [C[0] + R[0] * a, C[1] + b, C[2] + R[2] * a];
      gbvQuad(gbvBucket(out, "schild"), P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2), ow, [[sg.u0, sg.v0], [sg.u1, sg.v0], [sg.u1, sg.v1], [sg.u0, sg.v1]]); };
    const sideLen = k => f.side(k)[6];
    // Muelleimer im Spiel (N26, "weiter mit den Bauideen aus dem Plan", 2026-11-20): neben jedem Strassen-Bankautomaten und neben dem Eingang von Fast Food, Bars und Restaurants; Inhalt wie in der Werkstatt
    if (typeof muellAdd === "function" && (kind === "atm" || /^(fastfood|bar)-/.test(o.id))) { const [As, At, ds, dt, os, ot, len] = f.side(front), atm = kind === "atm", u = len / 2 + Math.min(4, len / 2 - 2);
      const s = atm ? L1 / 2 + ds * 1.25 + os * 0.15 : As + ds * u - os * 0.7, t = atm ? L2 / 2 + dt * 1.25 + ot * 0.15 : At + dt * u - ot * 0.7, y = atm ? Y : Y + 0.05, p = f.W(s, t, y), ow = f.dirW(os, ot);
      const U = muellAdd(scene, "eimer", "gotham-" + o.id, new THREE.Vector3(p[0], p[1], p[2]), Math.atan2(-ow[0], -ow[2])); U.weit = 120; box(s, t, 0.45, 0.45, y, y + 0.9); }
    const shell = (type, glas, N, Hh, ins = 0) => { const P = ins ? (() => { const p = f.W(ins, ins, 0); return [p[0], p[2]]; })() : P0;
      gbvShell({ P0: P, e1: [ax, az], e2, L1: L1 - 2 * ins, L2: L2 - 2 * ins, front, type, N, H: Hh, glas, seed, fire: [0, 0, 0, 0], y: Y }, out); return ins; };
    if (kind !== "atm" && kind !== "stadion") gbvBox(out, "beton", f, L1 / 2, L2 / 2, L1, L2, Y, Y + 0.05);
    if (kind === "atm") { gbvBox(out, "farbe", f, L1 / 2, L2 / 2, 1.3, 0.9, Y, Y + 2.1, col(0x23415e)); gbvBox(out, "farbe", f, L1 / 2, L2 / 2, 1.4, 1.0, Y + 2.1, Y + 2.3, col(0xd9dde2)); sign(front, sideLen(front) / 2, Y + 1.75, 1.1, 0.12, L1 / 2 - 0.45 - (front % 2 ? L1 / 2 - 0.45 : 0)); box(L1 / 2, L2 / 2, 1.3, 0.9, Y, Y + 2.1);
      if (typeof kontoOpen === "function") { const hm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.6), new THREE.MeshBasicMaterial({ visible: false })), hp = Wp(L1 / 2, L2 / 2); hm.position.set(hp[0], Y + 1.2, hp[1]); scene.add(hm);   // S3: Rechtsklick/E oeffnet den Bankautomaten
        gates.push({ name: "Bankautomat", g: hm, call: () => kontoOpen(), verbs: ["benutzen", "benutzen"], a: hp, b: hp, near: 4 }); } }
    else if (kind === "stadion") gortStadion(out, f, o, front, Y, box, sign, M);
    else if (kind === "kirche") gortKirche(out, f, o, front, Y, box, sign, M, col);
    else if (o.id === "waffen-1" || o.id === "waffen-2") { gortWaffenladen({ out, f, o, front, Y, box, L1, L2, H, seed, P0, ax, az, e2 }); sign(front, sideLen(front) / 2, Y + 4.1, Math.min((sideLen(front) - 3) * 0.85, 12), 0.15, 1.5); }   // begehbar (2026-11-19)
    else {
      const ins = kind === "laden" || kind === "krippe" || kind === "atm" ? 1.5 : 4, type = { portal: "buero", kh: "kratzer", turm: "kratzer", laden: "laden", miet: "miet", halle: "lager", krippe: "laden", fabrik: "fabrik" }[kind];
      const glas = kind === "turm" || kind === "kh" || kind === "halle", N = Math.max(1, Math.round(H / GH)), Hb = kind === "halle" || kind === "fabrik" ? H : N * GH;
      if (kind === "halle") { gbvBox(out, "glas", f, L1 / 2, L2 / 2, L1 - 2 * ins, L2 - 2 * ins, Y, Y + Hb); gbvBox(out, "kante", f, L1 / 2, L2 / 2, L1 - 2 * ins + 2, L2 - 2 * ins + 2, Y + Hb, Y + Hb + 0.8); }
      else if (kind === "krippe") { const c = col([0xf2b134, 0x6cc3d5, 0xe86f68][seed % 3]); gbvBox(out, "farbe", f, L1 / 2, L2 / 2, L1 - 2 * ins, L2 - 2 * ins, Y, Y + Hb, c); gbvBox(out, "dach", f, L1 / 2, L2 / 2, L1 - 2 * ins + 1, L2 - 2 * ins + 1, Y + Hb, Y + Hb + 0.4);
        for (let i = 0; i < 4; i++) gbvBoxSide(out, "glas", f, front, ins + 2.5 + i * (sideLen(front) - 2 * ins - 5) / 3, -ins + 0.04, 2.2, 0.1, Y + 1, Y + 3.2); }
      else shell(type, glas, N, Hb, ins);
      // Kollision: Huelle (Kratzer mit Ruecksprung: unten volle Flaeche bis 40 %)
      const yk = type === "kratzer" && L1 - 2 * ins >= 30 && L2 - 2 * ins >= 30 ? Y + Math.round(Hb * 0.4 / GH) * GH : Y + Hb;
      box(L1 / 2, L2 / 2, L1 - 2 * ins - 0.6, L2 - 2 * ins - 0.6, Y, yk); if (yk < Y + Hb - 0.1) box(L1 / 2, L2 / 2, L1 - 2 * ins - 8.6, L2 - 2 * ins - 8.6, yk, Y + Hb);
      const fl = sideLen(front) - 2 * ins;
      if (kind === "portal") gortPortal(out, f, front, ins, fl, Y, box, sign);
      else if (kind === "kh") { gbvBoxSide(out, "farbe", f, front, sideLen(front) / 2, -ins - 4, 14, 8, Y + 4, Y + 4.6, col(0xe8e8e4), true); for (const a of [-6.5, 6.5]) gbvBoxSide(out, "eisen", f, front, sideLen(front) / 2 + a, -ins - 7.5, 0.3, 0.3, Y, Y + 4);
        sign(front, sideLen(front) / 2, Y + 5.6, Math.min(fl * 0.8, 22), 0.12, ins); const cr = col(0xc8102e), [As, At, ds, dt, os, ot] = f.side(front), cs = As + ds * sideLen(front) / 2 - os * (ins + 3), ct = At + dt * sideLen(front) / 2 - ot * (ins + 3);
        gbvBox(out, "farbe", f, cs, ct, 8, 2.4, Y + Hb + 1, Y + Hb + 3.4, cr); gbvBox(out, "farbe", f, cs, ct, 2.4, 2.4, Y + Hb + 1, Y + Hb + 9, cr); }
      else if (kind === "turm") { gbvBoxSide(out, "farbe", f, front, sideLen(front) / 2, -ins - 3, 16, 6, Y + 4.4, Y + 5, col(0xc9a24a), true); for (const a of [-7.5, 7.5]) gbvBoxSide(out, "farbe", f, front, sideLen(front) / 2 + a, -ins - 5.7, 0.3, 0.3, Y, Y + 4.4, col(0xc9a24a));
        sign(front, sideLen(front) / 2, Y + 6.2, Math.min(fl * 0.7, 20), 0.12, ins); sign(front, sideLen(front) / 2, yk - 3, Math.min(fl * 0.8, 26), 0.12, ins); }
      else if (kind === "laden" || kind === "krippe") sign(front, sideLen(front) / 2, Y + (kind === "krippe" ? Hb - 0.9 : 4.1), Math.min(fl * 0.85, 12), 0.15, ins);
      else if (kind === "miet") { sign(front, sideLen(front) / 2, Y + 4.1, Math.min(fl * 0.6, 10), 0.15, ins); gbvDetails({ P0, e1: [ax, az], e2, L1, L2, front, type: "miet", N, H: Hb, seed, fire: [0, 0, 0, 0], y: Y }, out); }
      else sign(front, sideLen(front) / 2, Y + Hb - 2, Math.min(fl * 0.7, 24), 0.15, ins);
    }
    bautAdd({ id: "GO-" + o.id.toUpperCase(), name: o.name.split(" (")[0], art: "Gebäude", poly: [Wp(0, 0), Wp(L1, 0), Wp(L1, L2), Wp(0, L2)], y0: Y - 1, y1: Y + H + 10, info: (sgOf.get(o.id)?.text || o.name) + " · " + Math.round(H) + " m" });
    if (false && (o.id === "waffen-1" || o.id === "waffen-2")) { const sd = f.side(front), u = sd[6] / 2, hp = Wp(sd[0] + sd[2] * u + sd[4], sd[1] + sd[3] * u + sd[5]), hm = new THREE.Mesh(new THREE.BoxGeometry(4, 3.5, 4), new THREE.MeshBasicMaterial({ visible: false }));   // Waffenladen oeffnet den Shop im Handy
      hm.position.set(hp[0], Y + 1.75, hp[1]); scene.add(hm); const sid = o.id === "waffen-1" ? "waffen" : "arms";
      gates.push({ name: (sid === "waffen" ? "Guns & Ammo" : "Gotham Arms") + " (Shop)", g: hm, call: () => typeof handyShop === "function" && handyShop(sid), verbs: ["Waffen ansehen", "Waffen ansehen"], a: hp, b: hp, near: 8 }); }
    if (o.id === "auto-billig" || o.id === "auto-teuer") { const sd = f.side(front), u = sd[6] / 2, P = (d, h) => Wp(sd[0] + sd[2] * u + sd[4] * d, sd[1] + sd[3] * u + sd[5] * d);   // S4: Autohaus oeffnet den Shop, Lieferplatz vor der Front
      GORT.lots = GORT.lots || {}; GORT.lots[o.id] = P(9); const hp = P(1), hm = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 5), new THREE.MeshBasicMaterial({ visible: false })); hm.position.set(hp[0], Y + 1.75, hp[1]); scene.add(hm);
      gates.push({ name: (o.id === "auto-billig" ? "Budget Cars" : "Prestige Motors") + " (Shop)", g: hm, call: () => typeof handyShop === "function" && handyShop(o.id === "auto-billig" ? "billig" : "teuer"), verbs: ["Fahrzeuge ansehen", "Fahrzeuge ansehen"], a: hp, b: hp, near: 8 }); }
    GORT.list.push(o.id); yield;
  }
  const grp = new THREE.Group(); grp.name = "Gotham Orte"; grp.userData.keep = true; grp.userData.noLift = true; const GM = gbvInit();
  for (const [key, b] of out) { if (!b.p.length) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(b.p, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(b.n, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
    if (b.c.length) geo.setAttribute("color", new THREE.Float32BufferAttribute(b.c, 3)); const m = new THREE.Mesh(geo, M[key] || GM[key]); m.name = "Orte " + key; m.castShadow = key !== "schild" && key !== "rasen"; m.receiveShadow = true; grp.add(m); }
  scene.add(grp); GORT.grp = grp;
}
// Saeulenportal vor der Front: Podest mit Stufen, Saeulen, Gebaelk mit Schild, Giebel
function gortPortal(out, f, k, ins, fl, Y, box, sign) {
  const sd = f.side(k), L = sd[6], [As, At, ds, dt, os, ot] = sd, W = Math.min(fl * 0.6, 30), n = Math.max(4, Math.round(W / 4) & ~1 | 0) || 6, at = (u, w) => [As + ds * u + os * (w - ins), At + dt * u + ot * (w - ins)];
  const bx = (u, w, lu, lw, y0, y1, key = "kante") => { const [s, t] = at(u, w); gbvBox(out, key, f, s, t, ds ? lu : lw, ds ? lw : lu, y0, y1); return [s, t, ds ? lu : lw, ds ? lw : lu]; };
  for (let i = 0; i < 5; i++) { const b = bx(L / 2, 2.2 + i * 0.25, W + 2 + i * 0.8, 4.4 + i * 0.5, Y, Y + 1.2 - i * 0.24); box(b[0], b[1], b[2], b[3], Y, Y + 1.2 - i * 0.24); }
  for (let i = 0; i < n; i++) { const u = L / 2 - W / 2 + 1 + i * (W - 2) / (n - 1), [s, t] = at(u, 3); gbvCyl(out, "kante", f, s, t, 0.6, Y + 1.2, Y + 10, 12); box(s, t, 1, 1, Y + 1.2, Y + 10); }
  bx(L / 2, 2.6, W + 1, 5.2, Y + 10, Y + 12); sign(k, L / 2, Y + 11, W * 0.8, 5.25, ins);
  for (let i = 0; i < 6; i++) bx(L / 2, 2.6, (W + 1) * (1 - i / 6), 5, Y + 12 + i * 0.6, Y + 12.6 + i * 0.6);   // Giebel (gestuft)
}
// Kathedrale (Nicolas 2026-11-16: "Fassade der Kirche komplett ueberarbeiten, ganz andere Fenster"; Loch und Fehler an der Rosette): gotisch.
// Werkstein ohne Buerofenster, Spitzbogenfenster mit Buntglas (leuchten nachts), Strebepfeiler mit Fialen, drei Spitzbogenportale, Rosette,
// Mittelschiff mit Obergaden, Seitenschiffe mit Pultdach, Querhaus, Vierungsturm, zwei Westtuerme mit glatten Helmen. Echte Dachprismen mit Giebeln (keine Stufen).
// Lage: u quer zur Front (0..B), w von der Front nach hinten (0..D).
function gortKirche(out, f, o, k, Y, box, sign, M, col) {
  const [As, At, ds, dt, os, ot, L] = f.side(k), D = k % 2 ? o.w : o.d, B = L, H = o.h || 60;
  const at = (u, w) => [As + ds * u - os * w, At + dt * u - ot * w], P = (u, w, y) => { const [s, t] = at(u, w); return f.W(s, t, y); };
  const U = f.dirW(ds, dt), Wd = f.dirW(-os, -ot), nrm = (a, b, y = 0) => [U[0] * a + Wd[0] * b, y, U[2] * a + Wd[2] * b];
  const bx = (u, w, lu, lw, y0, y1, key = "kstein") => { const [s, t] = at(u, w); gbvBox(out, key, f, s, t, ds ? lu : lw, ds ? lw : lu, y0, y1); return [s, t, ds ? lu : lw, ds ? lw : lu]; };
  const coll = (u, w, lu, lw, y0, y1) => { const [s, t] = at(u, w); box(s, t, ds ? lu : lw, ds ? lw : lu, y0, y1); };
  if (!M.kstein) { const st = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#a9a291"; c.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let q = 0; q < 4; q++) { const v = 165 + Math.random() * 30, x = q * 64 + (r % 2) * 32;
      c.fillStyle = `rgb(${v},${v - 6},${v - 18})`; c.fillRect(x + 1, r * 32 + 1, 62, 30); c.fillRect(x + 1 - 256, r * 32 + 1, 62, 30); } c.fillStyle = "rgba(60,55,45,0.18)"; for (let i = 0; i < 300; i++) c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }); st.wrapS = st.wrapT = THREE.RepeatWrapping;
    const glass = (c, x0, y0, w, h, seed) => { let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, C = ["#b8202a", "#2846a8", "#e0b030", "#2f8a4a", "#7a3aa0", "#2a8fb0"];
      for (let y = y0; y < y0 + h; y += 7) for (let x = x0; x < x0 + w; x += 7) { c.fillStyle = C[Math.floor(rnd() * C.length)]; c.fillRect(x, y, 6, 6); } };
    const arch = (c, x, y, w, h) => { c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w * 0.55); c.arc(x + w, y + w * 0.55, w, Math.PI, Math.PI * 1.33, false); c.arc(x, y + w * 0.55, w, Math.PI * 1.67, 0, false); c.lineTo(x + w, y + h); c.closePath(); };
    const lan = canvasTex(64, 192, (c, w, h) => { c.clearRect(0, 0, w, h); c.save(); arch(c, 8, 6, 48, 180); c.fillStyle = "#1a1612"; c.fill(); c.clip(); glass(c, 8, 6, 48, 180, 7); c.restore();
      c.strokeStyle = "#8f877a"; c.lineWidth = 4; arch(c, 8, 6, 48, 180); c.stroke(); c.beginPath(); c.moveTo(32, 46); c.lineTo(32, 186); c.stroke(); c.beginPath(); c.arc(32, 36, 9, 0, 7); c.stroke(); for (const y of [80, 125, 160]) { c.beginPath(); c.moveTo(8, y); c.lineTo(56, y); c.stroke(); } });
    const rose = canvasTex(256, 256, (c, w) => { const r = w / 2; c.clearRect(0, 0, w, w); c.beginPath(); c.arc(r, r, r - 2, 0, Math.PI * 2); c.fillStyle = "#8f877a"; c.fill(); c.beginPath(); c.arc(r, r, r - 8, 0, Math.PI * 2); c.fillStyle = "#1a1612"; c.fill();
      const C = ["#b8202a", "#2846a8", "#e0b030", "#2f8a4a", "#7a3aa0", "#2a8fb0"]; for (let i = 0; i < 16; i++) { c.beginPath(); c.moveTo(r, r); c.arc(r, r, r - 14, i / 16 * Math.PI * 2, (i + 1) / 16 * Math.PI * 2); c.closePath(); c.fillStyle = C[i % 6]; c.fill(); }
      for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * Math.PI * 2; c.beginPath(); c.arc(r + Math.cos(a) * r * 0.7, r + Math.sin(a) * r * 0.7, r * 0.12, 0, 7); c.fillStyle = C[(i + 3) % 6]; c.fill(); }
      c.strokeStyle = "#8f877a"; c.lineWidth = 6; for (const rr of [r - 10, r * 0.55, r * 0.22]) { c.beginPath(); c.arc(r, r, rr, 0, Math.PI * 2); c.stroke(); }
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; c.beginPath(); c.moveTo(r + Math.cos(a) * r * 0.22, r + Math.sin(a) * r * 0.22); c.lineTo(r + Math.cos(a) * (r - 10), r + Math.sin(a) * (r - 10)); c.stroke(); }
      c.beginPath(); c.arc(r, r, r * 0.12, 0, 7); c.fillStyle = "#e0b030"; c.fill(); });
    const portal = canvasTex(128, 192, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 4; i++) { c.save(); arch(c, 8 + i * 8, 8 + i * 8, 112 - i * 16, 184 - i * 8); const v = 150 - i * 22; c.fillStyle = `rgb(${v},${v - 6},${v - 16})`; c.fill(); c.restore(); }
      c.save(); arch(c, 40, 40, 48, 152); c.fillStyle = "#3a2618"; c.fill(); c.restore(); c.fillStyle = "#c9c1ad"; c.fillRect(40, 66, 48, 30); c.fillStyle = "#2a1c12"; c.fillRect(63, 96, 2, 96); for (const y of [120, 150, 180]) c.fillRect(40, y, 48, 2); });
    M.kstein = new THREE.MeshStandardMaterial({ map: st, roughness: 0.9 }); M.kdach = new THREE.MeshStandardMaterial({ color: 0x3d4a52, roughness: 0.8 });
    M.fenster = new THREE.MeshStandardMaterial({ map: lan, emissiveMap: lan, emissive: 0xffffff, emissiveIntensity: 0.05, roughness: 0.4, alphaTest: 0.5 });   // ausserhalb des Bogens durchsichtig
    M.rose = new THREE.MeshStandardMaterial({ map: rose, emissiveMap: rose, emissive: 0xffffff, emissiveIntensity: 0.05, roughness: 0.4, alphaTest: 0.5 }); M.portal = new THREE.MeshStandardMaterial({ map: portal, roughness: 0.85, alphaTest: 0.5 }); }
  const q = (key, a, b, c, d, n, uv = [[0, 0], [1, 0], [1, 1], [0, 1]]) => gbvQuad(gbvBucket(out, key), a, b, c, d, n, uv), tri = (key, a, b, c, n) => gbvTri(gbvBucket(out, key), a, b, c, n, [0, 0], [1, 0], [0.5, 1]);
  // Bild auf einer Wandflaeche: Mitte (u, w), Flaechennormale lokal (a, b), Breite ww, Hoehe y0..y1, 6 cm vor der Wand
  const pane = (key, u, w, a, b, ww, y0, y1) => { const tu = -b, tw = a, cu = u + a * 0.06, cw = w + b * 0.06; q(key, P(cu - tu * ww / 2, cw - tw * ww / 2, y0), P(cu + tu * ww / 2, cw + tw * ww / 2, y0), P(cu + tu * ww / 2, cw + tw * ww / 2, y1), P(cu - tu * ww / 2, cw - tw * ww / 2, y1), nrm(a, b)); };
  // Satteldach entlang w (Mitte uc, halbe Breite hb) bzw. entlang u (Mitte wc), mit Giebeldreiecken aus Stein
  const roofW = (uc, w0, w1, hb, ye, yr) => { const l = Math.hypot(yr - ye, hb), nu = (yr - ye) / l, ny = hb / l;
    q("kdach", P(uc - hb, w0, ye), P(uc - hb, w1, ye), P(uc, w1, yr), P(uc, w0, yr), nrm(-nu, 0, ny)); q("kdach", P(uc + hb, w0, ye), P(uc + hb, w1, ye), P(uc, w1, yr), P(uc, w0, yr), nrm(nu, 0, ny));
    tri("kstein", P(uc - hb, w0, ye), P(uc + hb, w0, ye), P(uc, w0, yr), nrm(0, -1)); tri("kstein", P(uc - hb, w1, ye), P(uc + hb, w1, ye), P(uc, w1, yr), nrm(0, 1)); };
  const roofU = (wc, u0, u1, hb, ye, yr) => { const l = Math.hypot(yr - ye, hb), nw = (yr - ye) / l, ny = hb / l;
    q("kdach", P(u0, wc - hb, ye), P(u1, wc - hb, ye), P(u1, wc, yr), P(u0, wc, yr), nrm(0, -nw, ny)); q("kdach", P(u0, wc + hb, ye), P(u1, wc + hb, ye), P(u1, wc, yr), P(u0, wc, yr), nrm(0, nw, ny));
    tri("kstein", P(u0, wc - hb, ye), P(u0, wc + hb, ye), P(u0, wc, yr), nrm(-1, 0)); tri("kstein", P(u1, wc - hb, ye), P(u1, wc + hb, ye), P(u1, wc, yr), nrm(1, 0)); };
  const pyr = (key, u, w, h, y0, y1) => { const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]], T = P(u, w, y1); for (let i = 0; i < 4; i++) { const [a1, b1] = c[i], [a2, b2] = c[(i + 1) % 4]; tri(key, P(u + a1 * h, w + b1 * h, y0), P(u + a2 * h, w + b2 * h, y0), T, nrm((a1 + a2) / 2, (b1 + b2) / 2, h / (y1 - y0))); } };
  const nw = Math.min(22, B * 0.42), n0 = B / 2 - nw / 2, n1 = B / 2 + nw / 2, tw = Math.min(14, (B - nw) / 2 + 2), aw = Math.min(10, (B - nw) / 2 - 0.5), wT = D * 0.7, Ht = H * 0.62, wE = D - 6;
  // Mittelschiff (Obergaden bis 26 m), Satteldach bis 36 m
  bx(B / 2, (tw + wE) / 2, nw, wE - tw, Y, Y + 26); coll(B / 2, (tw + wE) / 2, nw, wE - tw, Y, Y + 26); roofW(B / 2, tw, wE, nw / 2 + 0.5, Y + 26, Y + 36);
  // Seitenschiffe mit Pultdach (aussen 13 m, an der Obergadenwand 17 m), Strebepfeiler mit Fialen, Fenster
  for (const sx of [-1, 1]) { const uo = sx < 0 ? n0 - aw : n1 + aw, um = sx < 0 ? n0 - aw / 2 : n1 + aw / 2, w0 = tw + 1, w1 = wE - 8;
    bx(um, (w0 + w1) / 2, aw, w1 - w0, Y, Y + 13); coll(um, (w0 + w1) / 2, aw, w1 - w0, Y, Y + 13);
    const ui = sx < 0 ? n0 : n1, l = Math.hypot(4, aw), nu = sx * 4 / l, ny = aw / l;
    q("kdach", P(uo - sx * 0.4, w0, Y + 13), P(uo - sx * 0.4, w1, Y + 13), P(ui, w1, Y + 17), P(ui, w0, Y + 17), nrm(nu, 0, ny));
    for (const ww of [w0, w1]) tri("kstein", P(uo, ww, Y + 13), P(ui, ww, Y + 13), P(ui, ww, Y + 17), nrm(0, ww === w0 ? -1 : 1));
    for (let w = w0 + 3; w < w1 - 2; w += 6) { if (Math.abs(w - wT) < 10) continue; pane("fenster", uo, w, sx, 0, 2.4, Y + 2.5, Y + 10.5);   // Seitenschiff-Fenster
      bx(uo + sx * 0.7, w + 3, 1.4, 1.2, Y, Y + 14); pyr("kstein", uo + sx * 0.7, w + 3, 0.7, Y + 14, Y + 17.5);   // Strebepfeiler mit Fiale
      pane("fenster", ui, w, sx, 0, 2.2, Y + 18, Y + 24.5); } }   // Obergaden
  // Querhaus mit Satteldach, grosse Fenster an den Stirnseiten, Vierungsturm (Dachreiter)
  bx(B / 2, wT, B - 4, 16, Y, Y + 26); coll(B / 2, wT, B - 4, 16, Y, Y + 26); roofU(wT, 2, B - 2, 8.5, Y + 26, Y + 35);
  for (const sx of [-1, 1]) { const ue = sx < 0 ? 2 : B - 2; pane("fenster", ue, wT - 3.2, sx, 0, 3, Y + 4, Y + 18); pane("fenster", ue, wT + 3.2, sx, 0, 3, Y + 4, Y + 18); pane("rose", ue, wT, sx, 0, 6, Y + 19, Y + 25); }
  bx(B / 2, wT, 6, 6, Y + 30, Y + 38); pyr("kdach", B / 2, wT, 3.4, Y + 38, Y + 52);
  // Ostende: hohes Fenster
  pane("fenster", B / 2, wE, 0, 1, 3.4, Y + 4, Y + 20);
  // Westfassade zwischen den Tuermen mit Giebel, Rosette, Mittelportal
  bx(B / 2, 2.5, nw + 0.5, 1, Y, Y + 30); tri("kstein", P(n0 - 0.25, 2, Y + 30), P(n1 + 0.25, 2, Y + 30), P(B / 2, 2, Y + 38), nrm(0, -1)); tri("kstein", P(n0 - 0.25, 3, Y + 30), P(n1 + 0.25, 3, Y + 30), P(B / 2, 3, Y + 38), nrm(0, 1));
  pane("rose", B / 2, 2, 0, -1, 11, Y + 14, Y + 25); pane("portal", B / 2, 2, 0, -1, 7.5, Y, Y + 11.5);
  for (let i = 0; i < 6; i++) pane("fenster", B / 2 - 6.25 + i * 2.5, 2, 0, -1, 1.6, Y + 26, Y + 29.5);   // Galerie ueber der Rosette
  // Westtuerme: Schaft bis Ht, Gesims, Schallfenster, Eckfialen, glatter Helm bis H + 6, Seitenportal
  for (const sx of [-1, 1]) { const u = B / 2 + sx * (nw / 2 + tw / 2 - 0.5), w = tw / 2 + 2; bx(u, w, tw, tw, Y, Y + Ht); coll(u, w, tw, tw, Y, Y + Ht); bx(u, w, tw + 1, tw + 1, Y + Ht, Y + Ht + 1);
    for (const [a, b] of [[0, -1], [sx, 0], [0, 1], [-sx, 0]]) { const cu = u + a * tw / 2, cw = w + b * tw / 2; for (const d of [-2.2, 2.2]) { const ou = cu + (b ? d : 0), ow = cw + (a ? d : 0); pane("fenster", ou, ow, a, b, 2, Y + Ht - 13, Y + Ht - 3); pane("fenster", ou, ow, a, b, 1.6, Y + Ht - 27, Y + Ht - 19); } }
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pyr("kstein", u + a * (tw / 2 - 0.3), w + b * (tw / 2 - 0.3), 0.8, Y + Ht + 1, Y + Ht + 6);
    pyr("kdach", u, w, tw / 2 - 1.2, Y + Ht + 1, Y + H + 6); pane("portal", u, 2, 0, -1, 4.2, Y, Y + 7); }
}
// Stadion: Aussenmauer, Tribuenen rundum in Stufen (2 Sitzreihen je Stufe: 0,8 m hoch, 1,6 m tief), blaue Sitze, Spielfeld, 4 Flutlichtmasten
function gortStadion(out, f, o, k, Y, box, sign, M) {
  const L1 = o.w, L2 = o.d, H = o.h || 14.1, n = Math.round(H / 0.8), step = 1.6, Dp = n * step, blue = [[0.12, 0.3, 0.62], [0.16, 0.38, 0.72], [0.1, 0.24, 0.5]];
  gbvBox(out, "beton", f, L1 / 2, L2 / 2, L1, L2, Y, Y + 0.05);
  // Mauer aussen (Fassade aus Beton mit Fensterbaendern: "stein"), Hoehe H
  for (let kk = 0; kk < 4; kk++) gbvWall(out, "stein", f, kk, 0, f.side(kk)[6], Y, Y + H + 1.2, 0, GBV.GH, 0, 0, Y);
  // Tribuenen: je Stufe ein Rahmen aus 4 Quadern (aussen hoch, innen tief)
  for (let i = 0; i < n; i++) { const w = Dp - i * step, y1 = Y + 0.8 * (n - i), c = blue[i % 3], a0 = Dp - w, ls = L1 - 2 * a0, lt = L2 - 2 * a0;
    gbvBox(out, "farbe", f, L1 / 2, a0 + step / 2, ls, step, Y, y1, c, true); gbvBox(out, "farbe", f, L1 / 2, L2 - a0 - step / 2, ls, step, Y, y1, c, true);
    gbvBox(out, "farbe", f, a0 + step / 2, L2 / 2, step, lt - 2 * step, Y, y1, c, true); gbvBox(out, "farbe", f, L1 - a0 - step / 2, L2 / 2, step, lt - 2 * step, Y, y1, c, true);
    box(L1 / 2, a0 + step / 2, ls, step, Y, y1); box(L1 / 2, L2 - a0 - step / 2, ls, step, Y, y1); box(a0 + step / 2, L2 / 2, step, lt - 2 * step, Y, y1); box(L1 - a0 - step / 2, L2 / 2, step, lt - 2 * step, Y, y1); }
  // Spielfeld (Rasen mit Linien, Endzonen)
  const fo = gbvBucket(out, "rasen"), a = Dp + 4, P = (s, t) => f.W(s, t, Y + 0.08), lng = L1 >= L2;
  gbvQuad(fo, P(a, a), P(L1 - a, a), P(L1 - a, L2 - a), P(a, L2 - a), [0, 1, 0], lng ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 1], [0, 0], [1, 0], [1, 1]]);
  // Flutlichtmasten an den Ecken (Lampenfeld leuchtet nachts ueber das Schild-Material: eigenes Feld im Atlas waere zu klein, darum hell "kante")
  for (const [s, t] of [[3, 3], [L1 - 3, 3], [L1 - 3, L2 - 3], [3, L2 - 3]]) { gbvBox(out, "eisen", f, s, t, 1.2, 1.2, Y, Y + 40); gbvBox(out, "kante", f, s, t, 6, 6, Y + 40, Y + 43); box(s, t, 1.2, 1.2, Y, Y + 40); }
  sign(k, f.side(k)[6] / 2, Y + H - 1.5, 40, 0.15, 0);
  // Eingang: Tor in der Front (Durchgang ohne Kollision waere aufwendig; Stadion vorerst nur von aussen und ueber die Tribuenen-Oberseite)
  box(L1 / 2, 0.6, L1 - 1.2, 1.2, Y, Y + H + 1.2); box(L1 / 2, L2 - 0.6, L1 - 1.2, 1.2, Y, Y + H + 1.2); box(0.6, L2 / 2, 1.2, L2 - 1.2, Y, Y + H + 1.2); box(L1 - 0.6, L2 / 2, 1.2, L2 - 1.2, Y, Y + H + 1.2);
}
TILES.tasks.push({ gen: null, plan() {}, step() { if (GORT.done || TILES.startup || TILES.loading()) return false;
  if (!this.gen) this.gen = gortGen(); const t0 = performance.now();
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { GORT.done = true; this.gen = null; gortWayneAtm(); return false; } if (r.value === "wait") return false; }
  return false; } });
// je Bild (schleife.js): Schilder und Rosette leuchten nachts (nur bei Aenderung)
function gortStep() { const M = GORT.mats; if (!M) return; const n = typeof night === "number" ? night : 0; if (GORT._n === n) return; GORT._n = n;
  M.schild.emissiveIntensity = 0.15 + 0.85 * n; if (M.rose) M.rose.emissiveIntensity = 0.05 + 0.9 * n; if (M.fenster) M.fenster.emissiveIntensity = 0.05 + 0.9 * n; }
// ---- Begehbare Waffenlaeden (Nicolas 2026-11-19, Bild beider Laeden in der Werkstatt: "ich will in beide reingehen koennen – bau es mit einer hellbraungrauen Waffenwand") ----
// Statt Vollkoerper: Erdgeschoss selbst gebaut (Aussenwand Ziegel bzw. Ladenfront mit Tuer 2,6 m in der Mitte, innen helle Wandverkleidung, dunkler Holzboden, Decke mit
// Lichtfeldern), darueber die oberen Geschosse und das Dach aus gbvShell. Innen: grosse hellbraungraue Lochwand an der Rueckwand mit den Schusswaffen des Ladens
// (gunBuild, mehrfach, mit Preisschildern), Theke mit Glasvitrine (Pistolen liegen darin) und Kasse, frei stehende Vitrinen, Regale mit Munitionsschachteln an den
// Seitenwaenden, Fussmatte. Rechtsklick an der Theke oeffnet den Laden im Handy. Kollision: Waende mit Tueroeffnung, Decke, Theke, Vitrinen, Regale. Spiel und Werkstatt.
function gortWaffenladen(c) {
  const { out, f, o, front, Y, box, L1, L2, H, seed } = c, GH = GBV.GH, ins = 1.5, N = Math.max(1, Math.round(H / GH)), Hb = N * GH, uo = seed % 8, vo = Math.floor(seed / 8) % 4, arms = o.id === "waffen-2", sid = arms ? "arms" : "waffen";
  gbvShell({ P0: c.P0, e1: [c.ax, c.az], e2: c.e2, L1, L2, front: -1, type: "laden", N: Math.max(0, N - 1), H: Hb - GH, glas: false, seed, fire: [0, 0, 0, 0], y: Y + GH }, out);   // obere Geschosse, Dach
  const col = h => { const q = new THREE.Color(h); return [q.r, q.g, q.b]; }, Fl = f.side(front)[6], Dp = f.side((front + 1) % 4)[6], um = Fl / 2, tw = 1.3, Hi = GH - 0.3;
  // Aussenwaende Erdgeschoss (Front mit Tuer)
  for (let k = 0; k < 4; k++) { const len = f.side(k)[6];
    if (k !== front) gbvWall(out, "ziegel", f, k, ins, len - ins, Y, Y + GH, ins, GH, uo, vo, Y);
    else { gbvWall(out, "laden", f, k, ins, um - tw, Y, Y + GH, ins, GH, uo, vo, Y); gbvWall(out, "laden", f, k, um + tw, len - ins, Y, Y + GH, ins, GH, uo, vo, Y); gbvWall(out, "ziegel", f, k, um - tw, um + tw, Y + 2.9, Y + GH, ins, GH, uo, vo, Y); } }
  // innen: Wandverkleidung (hell), an der Tuer Laibung; Boden, Decke; Kollision der Waende (0,3 m stark)
  const innen = col(0xf2eee6), wand = (k, a, b, y0, y1, farbe = innen) => { const [As, At, ds, dt, os, ot] = f.side(k), u = (a + b) / 2, w = -ins - 0.16, s = As + ds * u + os * w, t = At + dt * u + ot * w, ls = ds ? b - a : 0.3, lt = ds ? 0.3 : b - a;
    gbvBox(out, "farbe", f, s, t, ls, lt, y0, y1, farbe); box(s, t, ls, lt, y0, y1); };
  for (let k = 0; k < 4; k++) { const len = f.side(k)[6]; if (k !== front) wand(k, ins, len - ins, Y, Y + GH); else { wand(k, ins, um - tw, Y, Y + GH); wand(k, um + tw, len - ins, Y, Y + GH); wand(k, um - tw, um + tw, Y + 2.9, Y + GH); } }
  { const [As, At, ds, dt, os, ot] = f.side(front); for (const sg of [-1, 1]) { const u = um + sg * (tw + 0.03), s = As + ds * u - os * (ins + 0.16), t = At + dt * u - ot * (ins + 0.16); gbvBox(out, "eisen", f, s, t, ds ? 0.12 : 0.36, ds ? 0.36 : 0.12, Y, Y + 2.95); }   // Tuerrahmen
    const s = As + ds * um - os * (ins + 0.16), t = At + dt * um - ot * (ins + 0.16); gbvBox(out, "eisen", f, s, t, ds ? 2 * tw + 0.24 : 0.36, ds ? 0.36 : 2 * tw + 0.24, Y + 2.85, Y + 2.97); }
  gbvBox(out, "farbe", f, L1 / 2, L2 / 2, L1 - 2 * ins - 0.6, L2 - 2 * ins - 0.6, Y + 0.05, Y + 0.08, col(0x4a3a2c));                                 // Holzboden
  if (N > 1) box(L1 / 2, L2 / 2, L1 - 2 * ins - 0.6, L2 - 2 * ins - 0.6, Y + Hi, Y + Hb); else box(L1 / 2, L2 / 2, L1 - 2 * ins - 0.6, L2 - 2 * ins - 0.6, Y + Hi, Y + GH);
  // Einrichtung als eigene Gruppe: lokal x = laengs der Front, z = nach aussen (zur Strasse), Ursprung = Mitte der Front innen am Boden
  const [As, At, ds, dt, os, ot] = f.side(front), O = f.W(As + ds * um - os * (ins + 0.32), At + dt * um - ot * (ins + 0.32), Y + 0.08), ow = f.dirW(os, ot), dwv = f.dirW(ds, dt);
  const g = new THREE.Group(); g.name = "Waffenladen " + o.id; g.position.set(O[0], O[1], O[2]); g.rotation.y = Math.atan2(ow[0], ow[2]); g.userData.keep = true; scene.add(g);
  const sx = Math.cos(g.rotation.y) * dwv[0] - Math.sin(g.rotation.y) * dwv[2] > 0 ? 1 : -1, W2v = Fl / 2 - ins - 0.32, Dv = Dp - 2 * ins - 0.64, hinten = arms ? Dv >= 24 : Dv >= 14 && W2v >= 9.5, W2 = arms || !hinten ? W2v : Math.min(W2v, 6.2), D = !hinten ? Dv : arms ? Dv - 12.3 : Math.round(Dv / 2);   // Hinterraum/Schiessstand nur bei genug Platz (Werkstatt 28 x 20 bzw. 56 x 36 m); auf der Spielkarte (20 x 15 m) ein Raum wie bisher (2026-11-19, Pruefung im Spiel)   // halbe Innenbreite, Innentiefe gesamt (Dv) und Laden (D; dahinter Hinterraum, 2026-11-19)
  const L = (x, z) => { const v = new THREE.Vector3(x, 0, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y); return [O[0] + v.x, O[2] + v.z]; }, lx = [Math.cos(g.rotation.y), -Math.sin(g.rotation.y)];
  const koll = (x, z, bx, bz, h) => { const [cx, cz] = L(x, z); dkAdd({ cx, cy: O[1] + h / 2, cz, ux: lx[0], uz: lx[1], hl: bx / 2, hw: bz / 2, hh: h / 2, m: 0.25 }); };
  const Mt = (c, r = 0.6, m = 0.1, o2 = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...o2 }), add = (geo, m, x, y, z, ry = 0) => { const q = new THREE.Mesh(geo, m); q.position.set(x, y, z); q.rotation.y = ry; q.castShadow = q.receiveShadow = true; g.add(q); return q; };
  const holz = Mt(0x9a6c44, 0.5, 0.05, { emissive: 0x3a2614 }), dunkel = Mt(0x23252a, 0.6, 0.3), glasM = Mt(0xe8f4ff, 0.03, 0.2, { transparent: true, opacity: 0.14 }), weiss = Mt(0xf2f0ea, 0.5), licht = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
  const sockel = Mt(0xeceae4, 0.4, 0.05, { emissive: 0x4a4844 }), kante = Mt(0xd6d0c4, 0.8, 0, { emissive: 0x3a3832 });   // Vitrinen-Sockel hell, Ablage hell (2026-11-19)
  add(new THREE.BoxGeometry(W2 * 2 + 0.5, 0.02, D + 0.5), Mt(0xb9b4aa, 0.3, 0.1, { emissive: 0x403d38 }), 0, 0.01, -D / 2);   // heller polierter Boden
  // Lochwand hellbraungrau an der Rueckwand (Textur mit Loechern), Rahmen, Schild
  const lochT = canvasTex(256, 128, (q, w, h) => { q.fillStyle = "#b3a594"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(60,50,40,.55)"; for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) { q.beginPath(); q.arc(x, y, 2.2, 0, 7); q.fill(); } }, 1, 1);
  const wb = W2 * 2 - (hinten ? 5 : 1.2), lochM = Mt(0xffffff, 0.85, 0, { map: lochT, emissive: 0x3a332a, emissiveMap: lochT }); lochM.map.wrapS = lochM.map.wrapT = THREE.RepeatWrapping; lochM.map.repeat.set(wb / 2, 1.6);
  add(new THREE.BoxGeometry(wb, 3.2, 0.05), lochM, 0, 0.5 + 1.6, -D + 0.03); add(new THREE.BoxGeometry(wb + 0.12, 0.08, 0.1), holz, 0, 0.46, -D + 0.05); add(new THREE.BoxGeometry(wb + 0.12, 0.08, 0.1), holz, 0, 3.74, -D + 0.05);
  add(new THREE.BoxGeometry(W2 * 2 + 0.4, 0.05, D + 0.4), Mt(0xe6e3dc, 0.8, 0, { emissive: 0x8c8a84 }), 0, Hi - 0.05, -D / 2);   // Decke (eigenes Material: das Umgebungslicht von unten ist gruenlich)
  // Waffen an der Lochwand (Raster), Preisschilder; in der Werkstatt laden die Waffen erst spaeter: dann nachholen
  const tz = -D + 2.4, tb = Math.min(W2 * 1.2, 9), vz = tz + 3.2;
  const fuell = () => { if (typeof gunBuild !== "function" || typeof HANDY_SHOPS === "undefined") return setTimeout(fuell, 400);
  const waren = (typeof HANDY_SHOPS !== "undefined" && HANDY_SHOPS[sid] && HANDY_SHOPS[sid].waren || []).filter(w => typeof GUN_SPEC !== "undefined" && GUN_SPEC[w[0]]).map(w => w[0]);
  if (waren.length && typeof gunBuild === "function") { const sp = 1.55, nc = Math.max(1, Math.floor((wb - 0.4) / sp)), rows = [3.2, 2.5, 1.8, 1.15]; let i = 0;
    for (const y of rows) for (let cI = 0; cI < nc; cI++) { const x = -((nc - 1) * sp) / 2 + cI * sp, fr = Math.abs(Math.sin((cI + 1) * 12.9898 + y * 78.233 + (arms ? 3.1 : 0)) * 43758.5453) % 1; if (fr < (arms ? 0.35 : 0.25)) { for (const hx of [-0.3, 0.3]) add(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 5), dunkel, x + hx, y + 0.05, -D + 0.12).rotation.x = Math.PI / 2; continue; }   // freier Platz mit leeren Haken (Nicolas 2026-11-19: "es soll auch Leere geben, wo noch welche hinkoennen")
      const id = waren[i++ % waren.length]; try { const m = gunBuild(id); m.rotation.y = Math.PI / 2; m.position.set(x, y, -D + 0.16); m.traverse(q => { if (q.isMesh) q.castShadow = true; }); g.add(m); } catch (e) {}
      add(new THREE.BoxGeometry(0.16, 0.08, 0.01), weiss, x + 0.45, y - 0.22, -D + 0.07); } }
    for (let k = 0; k < Math.floor((tb - 1.2) / 0.7); k++) { try { const p = gunBuild(k % 2 ? "pistole" : "mp7"); p.rotation.set(0, Math.PI / 2, Math.PI / 2); p.scale.setScalar(0.9); p.position.set(-tb / 2 + 0.6 + k * 0.7, 1.03, tz); g.add(p); } catch (e) {} }
    for (const x of [-W2 * 0.45, W2 * 0.45]) { if (Math.abs(x) < 1.6 || vz > -1.5) continue; try { const p = gunBuild(arms ? "g36c" : "schrotflinte"); p.rotation.set(0, Math.PI / 2, Math.PI / 2); p.scale.setScalar(0.8); p.position.set(x, 0.85, vz); g.add(p); } catch (e) {} } };
  const fuell2 = () => { if (typeof gunBuild !== "function") return setTimeout(fuell2, 400); const W = (HANDY_SHOPS[sid] && HANDY_SHOPS[sid].waren || []).map(w => w[0]).filter(id => GUN_SPEC[id]); vit.forEach(([x, z], i) => { try { const p = gunBuild(W[i % W.length] || "pistole"); p.rotation.set(0, Math.PI / 2, Math.PI / 2); p.scale.setScalar(0.85); p.position.set(x, 0.85, z); g.add(p); } catch (e) {} }); };
  fuell();
  // Theke mit Glasvitrine und Kasse (quer, 2,4 m vor der Rueckwand), dahinter Durchgang
  add(new THREE.BoxGeometry(tb, 0.95, 0.7), holz, 0, 0.475, tz); add(new THREE.BoxGeometry(tb, 0.04, 0.72), dunkel, 0, 0.97, tz);
  add(new THREE.BoxGeometry(tb - 0.6, 0.32, 0.6), glasM, -0.3, 1.15, tz); add(new THREE.BoxGeometry(tb - 0.7, 0.02, 0.04), licht, -0.3, 1.3, tz - 0.27); koll(0, tz, tb, 0.75, 1.3);
  { const kx = tb / 2 - 0.45, alu = Mt(0xb8bcc2, 0.35, 0.6), schirm = canvasTex(256, 160, (q, w, h) => { q.fillStyle = "#0e2a3a"; q.fillRect(0, 0, w, h); q.fillStyle = "#e8f4ff"; q.font = "bold 20px Arial"; q.fillText(arms ? "GOTHAM ARMS · KASSE" : "GUNS & AMMO · KASSE", 12, 28);
      q.font = "16px Arial"; [["Pistole", "2 500 $"], ["9 mm × 32", "150 $"], ["Summe", "2 650 $"]].forEach(([a, b], i) => { q.fillStyle = i === 2 ? "#9fe8a8" : "#cfe0ee"; q.fillText(a, 12, 62 + i * 26); q.fillText(b, 180, 62 + i * 26); }); q.fillStyle = "#2f7de1"; q.fillRect(12, 128, 232, 22); q.fillStyle = "#fff"; q.fillText("Karte einstecken …", 60, 145); });
    add(new THREE.BoxGeometry(0.36, 0.02, 0.25), alu, kx, 1.0, tz + 0.05); add(new THREE.BoxGeometry(0.3, 0.004, 0.16), Mt(0x1a1b1e, 0.6), kx, 1.012, tz + 0.0);   // Laptop: Unterteil, Tastatur
    const deckel = new THREE.Group(); deckel.position.set(kx, 1.01, tz + 0.17); deckel.rotation.x = -0.3; g.add(deckel); const dl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.012), alu); dl.position.y = 0.12; deckel.add(dl);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.2), new THREE.MeshBasicMaterial({ map: schirm })); sc.position.set(0, 0.125, 0.0065); deckel.add(sc);   // Bildschirm zur Kundschaft (Tastatur zur Seite hinter der Theke)
    add(new THREE.BoxGeometry(0.09, 0.03, 0.17), Mt(0x15161a, 0.5), kx - 0.32, 1.015, tz + 0.12); add(new THREE.BoxGeometry(0.07, 0.002, 0.05), Mt(0x9fe8a8, 0.3, 0, { emissive: 0x2a8a4a, emissiveIntensity: 0.8 }), kx - 0.32, 1.032, tz + 0.08);   // Kartenlesegeraet: Gehaeuse, Anzeige
    for (let q = 0; q < 9; q++) add(new THREE.BoxGeometry(0.016, 0.004, 0.012), Mt(0x9aa0a8, 0.5, 0.3), kx - 0.345 + (q % 3) * 0.022, 1.032, tz + 0.13 + Math.floor(q / 3) * 0.018);   // Tasten
    add(new THREE.BoxGeometry(0.06, 0.006, 0.004), Mt(0x050505, 0.8), kx - 0.32, 1.02, tz + 0.205); add(new THREE.BoxGeometry(0.006, 0.006, 0.006), Mt(0x30ff60, 0.3, 0, { emissive: 0x20c040 }), kx - 0.29, 1.033, tz + 0.05); }   // Kartenschlitz, LED
  // frei stehende Vitrinen und Regale mit Munition an den Seitenwaenden
  for (const x of [-W2 * 0.45, W2 * 0.45]) { if (Math.abs(x) < 1.6 || vz > -1.5) continue; add(new THREE.BoxGeometry(1.6, 0.8, 0.8), sockel, x, 0.4, vz); add(new THREE.BoxGeometry(1.64, 0.04, 0.84), kante, x, 0.8, vz); add(new THREE.BoxGeometry(1.6, 0.5, 0.8), glasM, x, 1.05, vz); add(new THREE.BoxGeometry(1.5, 0.02, 0.04), licht, x, 1.28, vz - 0.32); koll(x, vz, 1.6, 0.8, 1.3);
  }
  // grosse Laeden: weitere Reihen von Vitrinen mit Waffen in der Mitte
  const vit = []; for (let z = vz - 0.2 + 3.6; z < -3.2; z += 3.6) for (let x = -W2 + 4; x <= W2 - 4; x += 4.2) { if (Math.abs(x) < 2) continue; add(new THREE.BoxGeometry(2.2, 0.8, 0.9), sockel, x, 0.4, z); add(new THREE.BoxGeometry(2.24, 0.04, 0.94), kante, x, 0.8, z); add(new THREE.BoxGeometry(2.2, 0.5, 0.9), glasM, x, 1.05, z); add(new THREE.BoxGeometry(2.1, 0.02, 0.04), licht, x, 1.28, z - 0.37); koll(x, z, 2.2, 0.9, 1.3); vit.push([x, z]); }
  const munC = [0x6b7a3a, 0x8a2a22, 0x2a4a7a, 0xc9a640];
  for (const sd of [-1, 1]) { const rx = sd * (W2 - 0.3), z0 = -D + 3.4, z1 = -1.8; if (z1 - z0 < 1.5) continue; const lz = z1 - z0, zm = (z0 + z1) / 2;
    for (const y of [0.4, 1.1, 1.8]) add(new THREE.BoxGeometry(0.5, 0.04, lz), holz, rx, y, zm); add(new THREE.BoxGeometry(0.04, 2.2, lz), holz, rx + sd * 0.24, 1.1, zm); koll(rx, zm, 0.55, lz, 2.2);
    let k = 0; for (const y of [0.42, 1.12, 1.82]) for (let z = z0 + 0.15; z < z1 - 0.15; z += 0.24) { const b = add(new THREE.BoxGeometry(0.22, 0.16, 0.18), Mt(munC[k++ % 4], 0.7), rx, y + 0.1, z); } }
  // Lichtfelder an der Decke, Fussmatte, Schild "Kasse"
  for (let z = -1.2; z > -D + 0.6; z -= 2.2) for (let x = -W2 + 1.2; x < W2 - 0.8; x += 2.4) add(new THREE.BoxGeometry(1.6, 0.03, 0.6), licht, x, Hi - 0.1, z);   // mehr und groessere Lichtfelder (2026-11-19)
  add(new THREE.BoxGeometry(wb, 0.05, 0.08), licht, 0, 3.82, -D + 0.12);   // LED-Leiste ueber der Lochwand
  for (let x = -wb / 2 + 1; x < wb / 2; x += 2.2) { add(new THREE.CylinderGeometry(0.07, 0.09, 0.2, 10), dunkel, x, Hi - 0.22, -D + 1.2); const l = add(new THREE.CircleGeometry(0.06, 10), licht, x, Hi - 0.3, -D + 1.15); l.rotation.x = Math.PI / 2 + 0.6; }   // Strahler auf die Wand
  add(new THREE.BoxGeometry(2.0, 0.015, 1.2), Mt(0x1e1f22, 0.95), 0, 0.03, -0.8);
  { const t = canvasTex(256, 64, (q, w, h) => { q.fillStyle = "#1d2229"; q.fillRect(0, 0, w, h); q.fillStyle = "#f4efe2"; q.font = "bold 34px Arial"; q.textAlign = "center"; q.fillText(arms ? "GOTHAM ARMS" : "GUNS & AMMO", w / 2, 44); }), s = add(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: t }), 0, 4.0, -D + 0.08); }
  fuell2();
  if (hinten) gortHinterraum({ add, koll, Mt, g, L, W2, W2v, D, Dv, Hi, arms, licht, holz, dunkel, weiss });
  // Rechtsklick an der Theke oeffnet den Laden im Handy
  const hm = add(new THREE.BoxGeometry(tb, 1.6, 1.4), new THREE.MeshBasicMaterial({ visible: false }), 0, 0.8, tz); hm.castShadow = false; const hp = L(0, tz);
  gates.push({ name: (arms ? "Gotham Arms" : "Guns & Ammo") + " (Theke)", g: hm, call: () => typeof handyShop === "function" && handyShop(sid), verbs: ["Waffen kaufen", "Waffen kaufen"], a: hp, b: hp, near: 4 });
  return Hb; }
// ---- Hinterraum der Waffenlaeden (Nicolas 2026-11-19: "der kleine Waffenladen ist mir zu gross – Haelfte wuerde reichen, ueberleg wie man den Rest fuellen koennte; beim grossen
// haette ich gerne einen grossen Raum, wo man einen Schiessstand hat"). Trennwand bei z = -D mit Tuer an der Seite ds; dahinter bis -Dv:
// klein (Guns & Ammo): Buechsenmacher-Werkstatt (Werkbank mit Schraubstock, Werkzeugwand, zerlegte Pistole), Lager (Regale mit Munitionskisten, Pakete), Waffentresor, Buero-Ecke.
// gross (Gotham Arms): Schiessstand quer ueber die ganze Breite – Schuetzenbereich an der Tuerseite, Kabinen mit Trennwaenden und Ablage, Bahnen bis ca. 40 m, Scheiben an
// Deckenschienen in verschiedenen Abstaenden, schraeger Kugelfang hinten, Prallbleche an der Decke, Ampel "Feuer frei", Gehoerschutz. Lokal: x laengs der Front, z nach aussen.
// ---- Treffer auf den Scheiben im Schiessstand (Nicolas 2026-11-19 "Ja, mit Anzeige"): schusswaffen.js ruft scheibeShot(a, b) mit jedem Schussweg (Auge bis Einschlag).
// Schnittpunkt mit der Scheibenebene, Punkte nach dem Ringbild (Ringe um die Mitte im Rumpf: 10 bis 1, Kopf 10, sonst Papier 0), Einschussloch (bis 40), Anzeige am Pult
// (Abstand, Treffer, Summe, letzter Wert) und Meldung. Rechtsklick aufs Pult: neue Scheibe und naechster Abstand (5, 7, 10, 15, 20, 25, 30 m).
const SCHEIBEN = [], SCH_LOCH = { g: new THREE.CircleGeometry(0.012, 8), m: new THREE.MeshBasicMaterial({ color: 0x0a0a0a }) }, SCH_D = [5, 7, 10, 15, 20, 25, 30];
function scheibeAnzeige(B) { const q = B.cv.getContext("2d"); q.fillStyle = "#0e1a12"; q.fillRect(0, 0, 128, 64); q.fillStyle = "#7cff8c"; q.font = "bold 13px Arial"; q.fillText("BAHN " + B.nr + " · " + B.d + " m", 6, 16);
  q.font = "12px Arial"; q.fillText("Treffer " + B.n + "   Summe " + B.pkt, 6, 34); q.fillStyle = "#ffd43b"; q.font = "bold 14px Arial"; q.fillText(B.last === null ? "–" : "Letzter: " + B.last, 6, 55); B.tx.needsUpdate = true; }
function scheibeWechsel(B) { for (const h of B.holes) B.s.remove(h); B.holes.length = 0; B.n = B.pkt = 0; B.last = null; B.d = SCH_D[(SCH_D.indexOf(B.d) + 1) % SCH_D.length] || 10;
  B.lg.position.x = B.xs - B.ds * Math.min(B.d, B.lang - 2); scheibeAnzeige(B); if (typeof toast === "function") toast("Bahn " + B.nr + ": neue Scheibe, " + B.d + " m"); }
function scheibeShot(a, b) { if (!SCHEIBEN.length) return; const d = b.clone().sub(a), L = d.length(); if (L < 1e-3) return; d.divideScalar(L); let best = null;
  for (const B of SCHEIBEN) { const c = B.s.getWorldPosition(new THREE.Vector3()); if (c.distanceTo(a) > 60) continue; B.s.updateMatrixWorld(); const n = new THREE.Vector3(0, 0, 1).transformDirection(B.s.matrixWorld), dn = d.dot(n); if (Math.abs(dn) < 1e-4) continue;
    const t = c.clone().sub(a).dot(n) / dn; if (t < 0 || t > L || (best && t > best.t)) continue; const p = a.clone().addScaledVector(d, t), lp = B.s.worldToLocal(p.clone()); if (Math.abs(lp.x) > 0.3 || Math.abs(lp.y) > 0.45) continue; best = { B, t, lp }; }
  if (!best) return; const { B, lp } = best, e = Math.hypot(lp.x / 0.6, (lp.y + 0.162) / 0.675), kopf = Math.hypot(lp.x / 0.12, (lp.y - 0.126) / 0.126) < 1;
  const w = kopf ? 10 : e < 0.3 ? Math.max(1, 10 - Math.floor(e / 0.03)) : 0; B.n++; B.pkt += w; B.last = kopf ? "10 Kopf" : w ? String(w) : "0 (Papier)";
  const h = new THREE.Mesh(SCH_LOCH.g, SCH_LOCH.m); h.position.set(lp.x, lp.y, 0.004); B.s.add(h); B.holes.push(h); if (B.holes.length > 40) B.s.remove(B.holes.shift());
  const h2 = h.clone(); h2.position.z = -0.004; h2.rotation.y = Math.PI; B.s.add(h2); B.holes.push(h2); if (B.holes.length > 80) B.s.remove(B.holes.shift());
  scheibeAnzeige(B); if (typeof toast === "function") toast("Bahn " + B.nr + ": " + B.last + " · Summe " + B.pkt); }
function gortHinterraum(c) {
  const { add, koll, Mt, W2, D, Dv, Hi, arms, licht, holz, dunkel, weiss } = c, ds = arms ? -1 : 1, tw = 0.75, tx = ds * (W2 - 1.4), zw = -D - 0.15, T = Dv - D - 0.3, zm = -D - 0.3 - T / 2;
  const wandM = Mt(0xf2eee6, 0.8, 0, { emissive: 0x403e3a });
  // Trennwand mit Tuer, Rahmen, Schild
  for (const [a, b] of [[-W2 - 0.3, Math.min(tx - tw, tx + tw)], [Math.max(tx - tw, tx + tw), W2 + 0.3]].map(([a, b]) => [Math.min(a, b), Math.max(a, b)])) {
    if (b - a < 0.05) continue; add(new THREE.BoxGeometry(b - a, Hi, 0.3), wandM, (a + b) / 2, Hi / 2, zw); koll((a + b) / 2, zw, b - a, 0.3, Hi); }
  add(new THREE.BoxGeometry(2 * tw, Hi - 2.4, 0.3), wandM, tx, 2.4 + (Hi - 2.4) / 2, zw);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.1, 2.45, 0.36), dunkel, tx + s * (tw + 0.02), 1.22, zw); add(new THREE.BoxGeometry(2 * tw + 0.24, 0.1, 0.36), dunkel, tx, 2.42, zw);
  { const t = canvasTex(256, 64, (q, w, h) => { q.fillStyle = arms ? "#7a1a16" : "#2a2d33"; q.fillRect(0, 0, w, h); q.fillStyle = "#fff"; q.font = "bold 30px Arial"; q.textAlign = "center"; q.fillText(arms ? "SCHIESSSTAND" : "NUR PERSONAL", w / 2, 43); });
    add(new THREE.PlaneGeometry(1.4, 0.35), new THREE.MeshBasicMaterial({ map: t }), tx, 2.75, zw + 0.16); }
  // Boden, Decke, Lichter des Hinterraums
  add(new THREE.BoxGeometry(c.W2v * 2 + 0.5, 0.02, T), Mt(arms ? 0x6c6e70 : 0x8a8478, 0.85, 0, { emissive: 0x262624 }), 0, 0.012, zm);
  add(new THREE.BoxGeometry(c.W2v * 2 + 0.4, 0.05, T + 0.2), Mt(0xe6e3dc, 0.8, 0, { emissive: 0x8c8a84 }), 0, Hi - 0.05, zm);
  if (!arms) return gortWerkstattRaum(c, { ds, tx, zm, T, wandM });
  window.GORT_RANGE_D = D + 0.3;   // Beginn des Schiessstands (lokal z < -D), fuer die Geraeusche (ui/geraeusche.js)
  // ---- Schiessstand: Schuetzenbereich (x von der Tuerseite 4 m), Schusslinie bei xs, Bahnen in z, Ziel nach -ds
  const xa = ds * W2, xs = xa - ds * 4.2, xe = -ds * (W2 - 1.0), lang = Math.abs(xe - xs), bw = 1.7, n = Math.max(2, Math.floor((T - 0.6) / bw)), z0 = -D - 0.3 - (T - n * bw) / 2;
  const blech = Mt(0x3a3d42, 0.7, 0.4, { emissive: 0x1c1d20 }), gummi = Mt(0x1a1a1c, 0.95), panel = Mt(0x8a8e92, 0.6, 0.2, { emissive: 0x1e2022 }), rot = new THREE.MeshBasicMaterial({ color: 0xff3030 }), gruen = new THREE.MeshBasicMaterial({ color: 0x30ff60 });
  const scheibe = canvasTex(128, 192, (q, w, h) => { q.fillStyle = "#f4efe2"; q.fillRect(0, 0, w, h); q.fillStyle = "#151515"; q.beginPath(); q.ellipse(w / 2, h * 0.36, w * 0.2, h * 0.14, 0, 0, 7); q.fill(); q.fillRect(w * 0.18, h * 0.5, w * 0.64, h * 0.46);
    q.strokeStyle = "#f4efe2"; q.lineWidth = 2; for (const r of [0.1, 0.2, 0.3]) { q.beginPath(); q.ellipse(w / 2, h * 0.68, w * r, h * r * 0.75, 0, 0, 7); q.stroke(); } q.fillStyle = "#e33"; q.beginPath(); q.arc(w / 2, h * 0.68, 5, 0, 7); q.fill(); });
  const scM = new THREE.MeshStandardMaterial({ map: scheibe, roughness: 0.9, side: THREE.DoubleSide, emissive: 0x555248, emissiveMap: scheibe });
  for (let i = 0; i <= n; i++) { const z = z0 - i * bw;   // Trennwaende der Kabinen (1,6 m lang, 2 m hoch) und Deckenschienen
    add(new THREE.BoxGeometry(1.6, 2.0, 0.06), panel, xs + ds * 0.5, 1.0, z); koll(xs + ds * 0.5, z, 1.6, 0.08, 2.0); }
  for (let i = 0; i < n; i++) { const z = z0 - (i + 0.5) * bw, d = [7, 10, 15, 25, 12, 20, 8, 30][i % 8], xd = xs - ds * Math.min(d, lang - 2);
    add(new THREE.BoxGeometry(0.5, 0.06, bw - 0.1), holz, xs - ds * 0.1, 1.05, z); add(new THREE.BoxGeometry(0.06, 1.0, bw - 0.1), panel, xs - ds * 0.33, 0.52, z);   // Ablage, Brett darunter
    add(new THREE.BoxGeometry(lang, 0.06, 0.06), blech, (xs + xe) / 2, Hi - 0.35, z);   // Schiene der Scheibe
    const lg = new THREE.Group(); lg.position.set(xd, 0, z); c.g.add(lg); const mk = (geo, m, x, y, zz) => { const q = new THREE.Mesh(geo, m); q.position.set(x, y, zz); lg.add(q); return q; };   // Scheibe mit Laufkatze und Draht faehrt als Ganzes
    mk(new THREE.BoxGeometry(0.1, 0.12, 0.1), dunkel, 0, Hi - 0.42, 0); mk(new THREE.BoxGeometry(0.02, Hi - 2.2, 0.02), blech, 0, (Hi - 0.42 + 1.75) / 2 + 0.05, 0);
    const s = mk(new THREE.PlaneGeometry(0.6, 0.9), scM, 0, 1.4, 0); s.rotation.y = Math.PI / 2;
    add(new THREE.BoxGeometry(0.3, 0.14, 0.24), Mt(0x1a1b1e, 0.5), xs + ds * 0.05, 1.15, z - 0.45);   // Bedienpult mit Anzeige (zum Schuetzen)
    const cv = document.createElement("canvas"); cv.width = 128; cv.height = 64; const tx = new THREE.CanvasTexture(cv), an = add(new THREE.PlaneGeometry(0.24, 0.12), new THREE.MeshBasicMaterial({ map: tx }), xs + ds * 0.205, 1.17, z - 0.45, ds * Math.PI / 2); an.castShadow = false;
    const B = { nr: i + 1, lg, s, cv, tx, d, xs, ds, lang, holes: [], n: 0, pkt: 0, last: null }; SCHEIBEN.push(B); scheibeAnzeige(B);
    const pm = add(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshBasicMaterial({ visible: false }), xs + ds * 0.05, 1.2, z - 0.45); pm.castShadow = false; const [px, pz] = c.L(xs + ds * 0.05, z - 0.45);
    gates.push({ name: "Bahn " + (i + 1) + " (Scheibe)", g: pm, call: () => scheibeWechsel(B), verbs: ["wechseln / Abstand", "wechseln / Abstand"], a: [px, pz], b: [px, pz], near: 2.5 });
    const gh = add(new THREE.TorusGeometry(0.09, 0.025, 6, 14, Math.PI), Mt(0xc8202a, 0.5), xs + ds * 0.9, 1.75, z + bw / 2 - 0.12); gh.rotation.x = 0; }   // Gehoerschutz am Haken
  koll(xs - ds * 0.1, z0 - n * bw / 2, 0.55, n * bw, 1.1);   // Ablagen als Sperre: in die Bahnen geht man nicht
  // Kugelfang (schraeg, Gummigranulat) und Prallbleche an der Decke, Seitenwaende dunkel
  { const kf = add(new THREE.BoxGeometry(0.4, Hi * 1.25, n * bw + 0.4), gummi, xe - ds * 0.5, Hi / 2, z0 - n * bw / 2); kf.rotation.z = ds * 0.6; }
  for (let x = xs - ds * 3; Math.abs(x - xs) < lang - 3; x -= ds * 4) { const p = add(new THREE.BoxGeometry(1.4, 0.04, n * bw), blech, x, Hi - 0.7, z0 - n * bw / 2); p.rotation.z = ds * 0.5; }
  add(new THREE.BoxGeometry(lang, Hi - 0.1, 0.06), Mt(0x55585e, 0.9, 0, { emissive: 0x2a2c30 }), (xs + xe) / 2, Hi / 2, -D - 0.31); add(new THREE.BoxGeometry(lang, Hi - 0.1, 0.06), Mt(0x55585e, 0.9, 0, { emissive: 0x2a2c30 }), (xs + xe) / 2, Hi / 2, -Dv + 0.04);
  // Licht: hell im Schuetzenbereich, Strahler auf die Scheiben; Ampel "Feuer frei" und Schild ueber der Schusslinie
  for (let z = z0 - 0.8; z > z0 - n * bw; z -= 2.4) add(new THREE.BoxGeometry(2.4, 0.03, 0.6), licht, xa - ds * 2.2, Hi - 0.1, z);
  for (let x = xs - ds * 6; Math.abs(x - xs) < lang - 1; x -= ds * 6) for (let i = 0; i < n; i += 2) add(new THREE.BoxGeometry(0.4, 0.03, 0.4), licht, x, Hi - 0.12, z0 - (i + 0.5) * bw);
  for (const [y, m] of [[2.55, rot], [2.3, gruen]]) add(new THREE.SphereGeometry(0.09, 12, 8), m, xs + ds * 0.1, y, z0 + 0.1);
  { const t = canvasTex(512, 64, (q, w, h) => { q.fillStyle = "#1d2229"; q.fillRect(0, 0, w, h); q.fillStyle = "#ffd43b"; q.font = "bold 24px Arial"; q.textAlign = "center"; q.fillText("SCHUSSLINIE · GEHÖRSCHUTZ TRAGEN", w / 2, 43); });
    const s = add(new THREE.PlaneGeometry(Math.min(6, n * bw), 0.4), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }), xs + ds * 0.2, 2.9, z0 - n * bw / 2, ds * Math.PI / 2); s.castShadow = false; }
  // Bank und Waffenablage im Wartebereich
  add(new THREE.BoxGeometry(0.45, 0.45, 3), holz, xa - ds * 0.5, 0.225, z0 - n * bw / 2 - 1.5); koll(xa - ds * 0.5, z0 - n * bw / 2 - 1.5, 0.45, 3, 0.45);
  return { xs, n }; }
// kleiner Laden (Nicolas 2026-11-19: "auch in der Laenge zu lang"): Laden nur ca. 12 m breit in der Mitte; links, rechts und hinten ein Personalbereich in U-Form:
// links (gegenueber der Tuer) Buechsenmacher-Werkstatt, rechts Buero mit Pausenecke, hinten Lager mit Regalen, Waffentresor und Packtisch. W2 = halbe Ladenbreite, W2v = halbe Innenbreite.
function gortWerkstattRaum(c, r) {
  const { add, koll, Mt, W2, W2v, D, Dv, Hi, licht, holz, dunkel, weiss } = c, { ds, zm, T, wandM } = r, stahl = Mt(0x8a9096, 0.4, 0.6), gruen = Mt(0x4b5a3a, 0.7), karton = Mt(0xb08a5a, 0.85);
  const sb = W2v - W2 - 0.3, sm = W2 + 0.3 + sb / 2;   // Breite und Mitte der Seitenraeume (|x|)
  // Seitenwaende des Ladens (Personalbereich daneben), Boden, Decke, Licht der Seitenraeume
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(0.3, Hi, D + 0.3), wandM, s * (W2 + 0.15), Hi / 2, -D / 2 + 0.15); koll(s * (W2 + 0.15), -D / 2 + 0.15, 0.3, D + 0.3, Hi);
    add(new THREE.BoxGeometry(sb + 0.2, 0.02, D + 0.3), Mt(0x8a8478, 0.85, 0, { emissive: 0x262624 }), s * sm, 0.012, -D / 2); add(new THREE.BoxGeometry(sb + 0.3, 0.05, D + 0.4), Mt(0xe6e3dc, 0.8, 0, { emissive: 0x8c8a84 }), s * sm, Hi - 0.05, -D / 2);
    for (let z = -1.5; z > -D; z -= 2.6) add(new THREE.BoxGeometry(1.2, 0.03, 0.4), licht, s * sm, Hi - 0.1, z); }
  for (let x = -W2v + 1.5; x < W2v - 1; x += 3.6) add(new THREE.BoxGeometry(1.2, 0.03, 0.4), licht, x, Hi - 0.1, zm);
  // links: Werkbank an der Aussenwand (laengs), Werkzeugwand, Schraubstock, Lampe, Reinigungsmatte mit Pistole, Hocker
  const wx = -ds * (W2v - 0.45), wl = Math.min(4.5, D - 1.5), wz = -D / 2 - 0.3, rot = ds > 0 ? Math.PI / 2 : -Math.PI / 2;
  add(new THREE.BoxGeometry(0.8, 0.08, wl), holz, wx, 0.92, wz); add(new THREE.BoxGeometry(0.7, 0.86, wl), Mt(0x5a5f66, 0.6, 0.3), wx, 0.44, wz); koll(wx, wz, 0.8, wl, 1.0);
  const tafel = canvasTex(256, 128, (q, w, h) => { q.fillStyle = "#9c8e7c"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(50,40,30,.5)"; for (let y = 6; y < h; y += 12) for (let x = 6; x < w; x += 12) q.fillRect(x, y, 2, 2);
    q.strokeStyle = "#2a2c30"; q.lineWidth = 5; for (let i = 0; i < 9; i++) { const x = 18 + i * 26; q.beginPath(); q.moveTo(x, 20); q.lineTo(x + (i % 2 ? 4 : -4), 20 + 40 + (i % 3) * 14); q.stroke(); } q.fillStyle = "#c8202a"; q.fillRect(20, 96, 60, 14); q.fillRect(150, 92, 40, 20); });
  add(new THREE.BoxGeometry(0.04, 1.4, wl), Mt(0xffffff, 0.8, 0, { map: tafel, emissive: 0x2a2620, emissiveMap: tafel }), wx - ds * 0.38, 1.85, wz);
  const ix = wx + ds * 0.15;   // Innenkante der Werkbank
  add(new THREE.BoxGeometry(0.14, 0.16, 0.2), stahl, ix, 1.05, wz - wl / 2 + 0.4); add(new THREE.BoxGeometry(0.3, 0.03, 0.03), stahl, ix + ds * 0.15, 1.1, wz - wl / 2 + 0.4);   // Schraubstock
  add(new THREE.BoxGeometry(0.5, 0.006, 0.9), Mt(0x2a6a3a, 0.9), wx, 0.965, wz + 0.4);   // Reinigungsmatte
  if (typeof gunBuild === "function") { try { const p = gunBuild("pistole"); p.rotation.set(0, 0, Math.PI / 2); p.position.set(wx, 1.0, wz + 0.3); c.g.add(p); } catch (e) {} }
  for (let k = 0; k < 4; k++) add(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6), stahl, wx + 0.1, 0.975, wz + 1.0 + k * 0.06).rotation.x = Math.PI / 2;
  { const lz = wz - 0.6; add(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), dunkel, wx - ds * 0.1, 1.3, lz); add(new THREE.ConeGeometry(0.12, 0.14, 12), Mt(0x2a6a9a, 0.5), wx + ds * 0.05, 1.6, lz); add(new THREE.CircleGeometry(0.1, 12), licht, wx + ds * 0.05, 1.53, lz).rotation.x = Math.PI / 2; }
  add(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 14), dunkel, ix + ds * 0.7, 0.7, wz); add(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 6), stahl, ix + ds * 0.7, 0.35, wz);   // Hocker
  // Schrank mit Ersatzteilen an der Ladenwand gegenueber der Werkbank
  { const sx = -ds * (W2 + 0.6); add(new THREE.BoxGeometry(0.6, 2.0, 1.8), Mt(0x5a5f66, 0.6, 0.3), sx, 1.0, wz); koll(sx, wz, 0.6, 1.8, 2.0); for (let k = 0; k < 6; k++) add(new THREE.BoxGeometry(0.02, 0.22, 0.25), stahl, sx - ds * 0.31, 0.4 + Math.floor(k / 2) * 0.6, wz - 0.4 + (k % 2) * 0.8); }
  // rechts: Buero (Tisch, Stuhl, Laptop, Ordner, Regal) und Pausenecke (Sofa, Kuehlschrank, Kaffeemaschine)
  { const bx = ds * sm, bz = -1.6; add(new THREE.BoxGeometry(1.6, 0.05, 0.7), holz, bx, 0.75, bz); for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.05, 0.75, 0.65), dunkel, bx + s * 0.75, 0.375, bz); koll(bx, bz, 1.6, 0.7, 0.8);
    add(new THREE.BoxGeometry(0.34, 0.02, 0.24), Mt(0xb8bcc2, 0.35, 0.6), bx - 0.3, 0.785, bz); for (let k = 0; k < 5; k++) add(new THREE.BoxGeometry(0.06, 0.3, 0.25), Mt([0xc8202a, 0x2a4a8a, 0x2a6a3a][k % 3], 0.7), bx + 0.4 + k * 0.07, 0.93, bz + 0.15);
    add(new THREE.BoxGeometry(0.5, 0.06, 0.5), dunkel, bx, 0.48, bz - 0.7); add(new THREE.BoxGeometry(0.5, 0.55, 0.06), dunkel, bx, 0.8, bz - 0.95); add(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), stahl, bx, 0.23, bz - 0.7);
    const rx = ds * (W2v - 0.25); add(new THREE.BoxGeometry(0.4, 2.0, 1.4), holz, rx, 1.0, bz - 0.2); koll(rx, bz - 0.2, 0.4, 1.4, 2.0); for (let k = 0; k < 12; k++) add(new THREE.BoxGeometry(0.3, 0.3, 0.06), Mt([0xc8202a, 0x2a4a8a, 0x2a6a3a, 0x8a8a8a][k % 4], 0.7), rx - ds * 0.03, 0.55 + Math.floor(k / 4) * 0.6, bz - 0.7 + (k % 4) * 0.2 + 0.1);
    const pz = -D + 1.6, sofa = Mt(0x6a2a24, 0.9); add(new THREE.BoxGeometry(0.8, 0.42, 1.9), sofa, ds * (W2v - 0.45), 0.21, pz); add(new THREE.BoxGeometry(0.2, 0.85, 1.9), sofa, ds * (W2v - 0.1), 0.45, pz); koll(ds * (W2v - 0.4), pz, 0.9, 1.9, 0.85);
    add(new THREE.BoxGeometry(0.5, 0.42, 0.8), holz, ds * (W2v - 1.3), 0.21, pz); add(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 10), weiss, ds * (W2v - 1.3), 0.47, pz + 0.15);
    const kx = ds * (W2 + 0.65), kz = -D + 0.9; add(new THREE.BoxGeometry(0.65, 1.7, 0.65), Mt(0xe8e8e4, 0.4, 0.1), kx, 0.85, kz); koll(kx, kz, 0.65, 0.65, 1.7); add(new THREE.BoxGeometry(0.3, 0.38, 0.3), Mt(0x15161a, 0.5, 0.3), kx, 1.89, kz); add(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 10), weiss, kx + ds * 0.05, 1.75, kz + 0.2); }
  // hinten: Lager – Schwerlastregale an der Rueckwand, Waffentresor in der Ecke, Packtisch mit Paketen
  const rz = -Dv + 0.55; for (let x = -W2v + 1.6; x < W2v - 2.6; x += 2.7) { for (const y of [0.15, 0.95, 1.75, 2.55]) add(new THREE.BoxGeometry(2.4, 0.05, 0.9), Mt(0xc86a1a, 0.6, 0.2), x, y, rz);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.06, 2.7, 0.06), Mt(0x2a4a8a, 0.5, 0.3), x + sx * 1.17, 1.35, rz + sz * 0.42); koll(x, rz, 2.45, 0.95, 2.7);
    let k = 0; for (const y of [0.18, 0.98, 1.78, 2.58]) for (let q = -0.9; q <= 0.9; q += 0.45) { const kis = k++ % 3; add(new THREE.BoxGeometry(0.38, kis ? 0.3 : 0.45, kis ? 0.5 : 0.7), kis === 1 ? gruen : karton, x + q, y + (kis ? 0.17 : 0.25), rz); } }
  { const sx = ds * (W2v - 0.8), sz = -Dv + 0.7; add(new THREE.BoxGeometry(1.1, 2.0, 0.8), Mt(0x2a2d33, 0.45, 0.6), sx, 1.0, sz); koll(sx, sz, 1.1, 0.8, 2.0);
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16), stahl, sx, 1.1, sz + 0.42).rotation.x = Math.PI / 2; for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.03, 0.26, 0.03), stahl, sx, 1.1, sz + 0.46).rotation.z = k * Math.PI / 3;
    add(new THREE.BoxGeometry(0.1, 0.06, 0.02), Mt(0x30ff60, 0.3, 0, { emissive: 0x20a040 }), sx + 0.35, 1.45, sz + 0.41); }
  { const px = -ds * (W2 - 1.5), pz = -D - 1.4; add(new THREE.BoxGeometry(1.4, 0.9, 0.7), holz, px, 0.45, pz); koll(px, pz, 1.4, 0.7, 0.9); add(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12), Mt(0x9a7a4a, 0.5), px - 0.4, 0.98, pz).rotation.z = Math.PI / 2;
    for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(0.5, 0.35, 0.4), karton, px + 0.2 + (k % 2) * 0.05, 1.075 + 0.36 * Math.floor(k / 2), pz + (k % 2 ? 0.1 : -0.1)).rotation.y = k * 0.3; }
  return { werkstatt: true }; }
