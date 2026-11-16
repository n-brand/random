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
    const shell = (type, glas, N, Hh, ins = 0) => { const P = ins ? (() => { const p = f.W(ins, ins, 0); return [p[0], p[2]]; })() : P0;
      gbvShell({ P0: P, e1: [ax, az], e2, L1: L1 - 2 * ins, L2: L2 - 2 * ins, front, type, N, H: Hh, glas, seed, fire: [0, 0, 0, 0], y: Y }, out); return ins; };
    if (kind !== "atm" && kind !== "stadion") gbvBox(out, "beton", f, L1 / 2, L2 / 2, L1, L2, Y, Y + 0.05);
    if (kind === "atm") { gbvBox(out, "farbe", f, L1 / 2, L2 / 2, 1.3, 0.9, Y, Y + 2.1, col(0x23415e)); gbvBox(out, "farbe", f, L1 / 2, L2 / 2, 1.4, 1.0, Y + 2.1, Y + 2.3, col(0xd9dde2)); sign(front, sideLen(front) / 2, Y + 1.75, 1.1, 0.12, L1 / 2 - 0.45 - (front % 2 ? L1 / 2 - 0.45 : 0)); box(L1 / 2, L2 / 2, 1.3, 0.9, Y, Y + 2.1); }
    else if (kind === "stadion") gortStadion(out, f, o, front, Y, box, sign, M);
    else if (kind === "kirche") gortKirche(out, f, o, front, Y, box, sign, M, col);
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
// Kathedrale: Schiff, Seitenschiffe, Querhaus, zwei Westtuerme mit Helm, Rosette; Laengsachse = laengere Seite, Front an einer Schmalseite
function gortKirche(out, f, o, k, Y, box, sign, M, col) {
  const [As, At, ds, dt, os, ot, L] = f.side(k), D = k % 2 ? o.w : o.d, B = L, at = (u, w) => [As + ds * u - os * w, At + dt * u - ot * w];   // u quer (0..B), w laengs von der Front (0..D)
  const bx = (u, w, lu, lw, y0, y1, key = "stein", c) => { const [s, t] = at(u, w); gbvBox(out, key, f, s, t, ds ? lu : lw, ds ? lw : lu, y0, y1, c); return [s, t, ds ? lu : lw, ds ? lw : lu]; };
  const nave = B * 0.42, H = o.h || 60, roof = col(0x3d4a52);
  let b = bx(B / 2, D / 2 + 4, nave, D - 18, Y, Y + 26); box(b[0], b[1], b[2], b[3], Y, Y + 26);
  for (const sx of [-1, 1]) { b = bx(B / 2 + sx * (nave / 2 + 5), D / 2 + 6, 10, D - 26, Y, Y + 13); box(b[0], b[1], b[2], b[3], Y, Y + 13);
    for (let i = 0; i < 5; i++) bx(B / 2 + sx * (nave / 2 + 10 - i * 1.2), D / 2 + 6, 1.4, D - 26, Y + 13 + i * 0.9, Y + 13.9 + i * 0.9, "farbe", roof); }
  b = bx(B / 2, D * 0.7, B - 4, 16, Y, Y + 26); box(b[0], b[1], b[2], b[3], Y, Y + 26);   // Querhaus
  for (let i = 0; i < 9; i++) { bx(B / 2, D / 2 + 4, nave * (1 - i / 9) + 0.4, D - 18, Y + 26 + i * 1.3, Y + 27.3 + i * 1.3, "farbe", roof); bx(B / 2, D * 0.7, B - 4, 16 * (1 - i / 9) + 0.4, Y + 26 + i * 1.3, Y + 27.3 + i * 1.3, "farbe", roof); }   // Satteldaecher (gestuft)
  const tw = Math.min(14, B * 0.26);
  for (const sx of [-1, 1]) { const u = B / 2 + sx * (nave / 2 + tw / 2 - 1); b = bx(u, tw / 2 + 2, tw, tw, Y, Y + H * 0.62); box(b[0], b[1], b[2], b[3], Y, Y + H * 0.62);
    bx(u, tw / 2 + 2, tw + 1, tw + 1, Y + H * 0.62, Y + H * 0.62 + 1, "kante");
    const [s, t] = at(u, tw / 2 + 2), y0 = Y + H * 0.62 + 1, n = 14; for (let i = 0; i < n; i++) gbvBox(out, "farbe", f, s, t, tw * (1 - i / n) * 0.9 + 0.3, tw * (1 - i / n) * 0.9 + 0.3, y0 + i * (H * 0.38 + 6) / n, y0 + (i + 1) * (H * 0.38 + 6) / n, roof); }
  bx(B / 2, 3, nave + 2, 2, Y, Y + 30, "stein");   // Westwand zwischen den Tuermen
  bx(B / 2, 1.7, 7, 0.6, Y, Y + 9, "eisen");   // Portal
  // Rosette (eigene Ebene vor der Westwand)
  if (!M.rose) { const t = canvasTex(256, 256, (c, w) => { const r = w / 2; c.fillStyle = "#1a1410"; c.fillRect(0, 0, w, w); const C = ["#b8202a", "#2846a8", "#e0b030", "#2f8a4a", "#7a3aa0"];
      for (let i = 0; i < 16; i++) { c.beginPath(); c.moveTo(r, r); c.arc(r, r, r - 10, i / 16 * 6.283, (i + 1) / 16 * 6.283); c.fillStyle = C[i % 5]; c.fill(); }
      c.strokeStyle = "#1a1410"; c.lineWidth = 7; for (const rr of [r - 10, r * 0.62, r * 0.3]) { c.beginPath(); c.arc(r, r, rr, 0, 7); c.stroke(); } for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; c.beginPath(); c.moveTo(r + Math.cos(a) * r * 0.3, r + Math.sin(a) * r * 0.3); c.lineTo(r + Math.cos(a) * (r - 10), r + Math.sin(a) * (r - 10)); c.stroke(); }
      c.beginPath(); c.rect(0, 0, w, w); c.arc(r, r, r - 6, 0, 7, true); c.fillStyle = "#8f8a80"; c.fill("evenodd"); });
    M.rose = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.1, roughness: 0.4 }); }
  const [s, t] = at(B / 2, 1.9), ow = f.dirW(os, ot), R = [ow[2], 0, -ow[0]], C = f.W(s, t, Y + 19), r = Math.min(6, nave * 0.38), P = (a, b2) => [C[0] + R[0] * a, C[1] + b2, C[2] + R[2] * a];
  gbvQuad(gbvBucket(out, "rose"), P(-r, -r), P(r, -r), P(r, r), P(-r, r), ow, [[0, 0], [1, 0], [1, 1], [0, 1]]);
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
  while (performance.now() - t0 < 3) { const r = this.gen.next(); if (r.done) { GORT.done = true; this.gen = null; return false; } if (r.value === "wait") return false; }
  return false; } });
// je Bild (schleife.js): Schilder und Rosette leuchten nachts (nur bei Aenderung)
function gortStep() { const M = GORT.mats; if (!M) return; const n = typeof night === "number" ? night : 0; if (GORT._n === n) return; GORT._n = n;
  M.schild.emissiveIntensity = 0.15 + 0.85 * n; if (M.rose) M.rose.emissiveIntensity = 0.1 + 0.9 * n; }
