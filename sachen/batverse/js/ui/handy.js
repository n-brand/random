// Batverse – S4 Handy mit Browser und Fahrzeug-Shop (PLAN-GOTHAM Phase 9, Nicolas 2026-11-16 "Ja, S4"; Vorbild: Handy-Internet in GTA V, eigene Seiten und Namen).
// Taste P oder Knopf "Handy": Startbildschirm mit Apps Internet, Bank, Garage. Internet: Startseite "Gotham Web" mit drei Haendlern (billig, teuer, Militaer) und der Bank.
// Kauf bucht ueber das Konto (S3, kontoAus) und liefert: zu Fuss vor den Spieler (summonVehicle), sonst bzw. ohne Platz auf den Hof des Autohauses (Militaer: Vorplatz Wayne Tower).
// Gekaufte Fahrzeuge bleiben (localStorage wm-gekauft, Lage alle 5 s); App Garage holt sie. Die Autohaeuser in Gotham (gotham-orte.js) oeffnen ihren Shop per Rechtsklick (handyShop).
"use strict";
const HANDY_SHOPS = {
  billig: { name: "Budget Cars", url: "budgetcars.gotham", ort: "auto-billig", farbe: "#f2b134", slogan: "Gebraucht, ehrlich, fahrbereit. Fabrikviertel.",
    items: [["bike", 9000], ["streetfighter", 14000], ["taxi", 18000], ["tow", 45000], ["delorean", 65000], ["nachtfalke", 120000]] },
  teuer: { name: "Prestige Motors", url: "prestige-motors.gotham", ort: "auto-teuer", farbe: "#e8c56a", slogan: "Exklusive Fahrzeuge für Gotham. Uptown.",
    items: [["gclass", 180000], ["aventador", 420000], ["spectre", 430000], ["rolls", 460000], ["terzo", 2500000]] },
  // Waffenlaeden (Nicolas 2026-11-17 "weiter"): Ware = Gegenstaende ins Inventar, [id, Preis, Anzahl]; bezahlt vom Konto
  waffen: { name: "Guns & Ammo", url: "gunsandammo.gotham", ort: "waffen-1", farbe: "#d8443a", slogan: "Pistolen, Flinten, Munition. Seit 1952.",
    waren: [["pistole", 2500, 1], ["schrotflinte", 6500, 1], ["munition", 150, 32], ["schrot", 180, 16]] },
  arms: { name: "Gotham Arms", url: "gotham-arms.gotham", ort: "waffen-2", farbe: "#8a9a5b", slogan: "Schweres Gerät für Profis.",
    waren: [["mg", 18000, 1], ["sniper", 24000, 1], ["munition", 150, 32], ["gewehrmunition", 400, 20]] },
  militaer: { name: "Gotham Defense Supply", url: "defense-supply.gotham", ort: null, farbe: "#7f9a4e", slogan: "Ausgemustertes Militärgerät. Lieferung frei Haus.",
    items: [["haul", 900000], ["tank", 3500000], ["tumbler", 5000000]] },
};
// Katalog: Spezifikation, Bau (Farbe c), Farben zur Wahl (leer = feste Farbe), Art
const HANDY_CAT = {
  bike: { spec: () => SPEC_BIKE, build: c => buildBike(c), cols: [0xb81d24, 0x1f4f9a, 0x1a1a1a, 0xe0e0e0], art: "Motorrad" },
  streetfighter: { spec: () => SPEC_STREETFIGHTER, build: () => buildStreetfighter(), cols: [], art: "Motorrad" },
  taxi: { spec: () => SPEC_TAXI, build: () => buildTaxi(), cols: [], art: "Auto" },
  tow: { spec: () => SPEC_TOW, build: () => buildTowTruck(), cols: [], art: "Nutzfahrzeug" },
  delorean: { spec: () => SPEC_DELOREAN, build: () => buildDelorean(), cols: [], art: "Auto" },
  nachtfalke: { spec: () => SPEC_NACHTFALKE, build: c => buildNachtfalke(c), cols: [0x0f1012, 0x6b1f2a, 0x1f3f6b, 0xd0d4d8], art: "Auto" },
  gclass: { spec: () => SPEC_GCLASS, build: c => buildGClass(c), cols: [0x17191c, 0xd8dadc, 0x4a5a3a, 0x30343a], art: "Geländewagen" },
  aventador: { spec: () => SPEC_AVENTADOR, build: c => buildAventador(c), cols: [0xe07012, 0x2a7a3a, 0x1a1a1a, 0xf0f0f0], art: "Sportwagen" },
  spectre: { spec: () => SPEC_SPECTRE, build: c => buildSpectre(c), cols: [0xd2aa3c, 0x8a8f96, 0x1a1a1a, 0x2a3f6b], art: "Elektro-Coupé" },
  rolls: { spec: () => SPEC_ROLLS, build: c => buildRolls(c), cols: [0x1a1a1a, 0x6b1f2a, 0x1e3a6b, 0xc0c4c8], art: "Limousine" },
  terzo: { spec: () => SPEC_TERZO, build: () => buildTerzo(), cols: [], art: "Hypercar" },
  haul: { spec: () => SPEC_HAUL, build: () => buildHaulTruck(), cols: [], art: "Muldenkipper" },
  tank: { spec: () => SPEC_TANK, build: c => buildTank(c), cols: [0x4d5a36, 0x8a7a55, 0x5a5f63], art: "Panzer" },
  tumbler: { spec: () => SPEC_TUMBLER, build: c => buildTumbler(c, c), cols: [0x16181b, 0x4a4f55, 0x5a5f3a], art: "Prototyp" },
};
const HANDY = { page: "home", hist: [], owned: [], col: {}, modell: "handy-wayne", sel: 0, call: null };
// Zwei Handys als Gegenstand (Nicolas 2026-11-18, N32: "krasse Gaming-Performance Wayne Enterprises und normales Buero-Zeugs einer anderen Firma; Handy als Item, in der Hand Rechtsklick -> Handy unten rechts wie GTA V,
// Pfeiltasten und Enter; der Browser geht im Querformat vor den ganzen Bildschirm, andere Apps bleiben hochkant unten rechts"). Nicht jedes Handy hat jede App (wie die Laptops).
const HANDY_MODELLE = { "handy-wayne": { name: "Wayne Phone X", cls: "m-wayne", apps: ["web", "bank", "garage", "kontakte", "einst"] }, "handy-office": { name: "Ardent Office 12", cls: "m-office", apps: ["web", "bank", "kontakte", "einst"] } };
const HANDY_KONTAKTE = [["Polizei (GCPD)", "911", "Gotham City Police Department. Was ist passiert, und wo sind Sie?"], ["Taxi", "555-0199", "Gotham Cab, guten Tag! Wir schicken Ihnen einen Wagen – etwa fünf Minuten."], ["Krankenwagen", "911", "Notruf Rettungsdienst. Ist jemand verletzt? Bleiben Sie bitte am Telefon."], ["Feuerwehr", "911", "Gotham Fire Department. Wo brennt es?"], ["Alfred", "Privat", "Ja, Master Wayne? Soll ich den Wagen vorbereiten?", "handy-wayne"]];
const handyQuer = p => p === "web" || p === "bank" || p.startsWith("shop:");   // Browser-Seiten im Querformat
const handyApps = () => HANDY_APPS.filter(a => (HANDY_MODELLE[HANDY.modell] || HANDY_MODELLE["handy-wayne"]).apps.includes(a[0]));
function handyEigen() { if (typeof invHeld === "function" && HANDY_MODELLE[invHeld()]) return invHeld(); if (typeof invHas === "function") for (const k in HANDY_MODELLE) if (invHas(k)) return k; return null; }   // gehaltenes oder erstes Handy im Inventar   // owned: { key, c, x, z, y, h, C }
const handyHex = c => "#" + c.toString(16).padStart(6, "0");
const handyName = k => (HANDY_CAT[k].spec() || {}).name || k;
// Lieferplatz: Hof des Autohauses (Kartenort, Strassenhoehe) bzw. Vorplatz Wayne Tower
function handyLot(shop) { const o = shop.ort && typeof GOTHAM !== "undefined" ? GOTHAM.orte.find(q => q.id === shop.ort) : null;
  if (o) { const L = typeof GORT !== "undefined" && GORT.lots && GORT.lots[o.id], [x, z] = L || GOT.toGame(o.x, o.z); return { x, z, y: GOT.STR + 0.5 }; } const s = typeof WALK_START !== "undefined" ? WALK_START : { x: 0, z: 0, y: 0 }; return { x: s.x + 6, z: s.z, y: s.y }; }
function handySpawn(o) { const K = HANDY_CAT[o.key]; if (!K || !K.spec()) return null; const c = o.c ?? K.cols[0] ?? 0x16181b;
  if (typeof addVehicle !== "function") return null;   // Werkstatt: keine Fahrzeuge aus dem Handy
  o.C = addVehicle(K.spec(), () => K.build(c), o.x, o.z, o.y, o.h || 0, handyName(o.key) + " (gekauft)", c); return o.C; }
function handySave() { try { localStorage.setItem("wm-gekauft", JSON.stringify(HANDY.owned.map(o => { const C = o.C; if (C && Number.isFinite(C.x)) { o.x = C.x; o.z = C.z; o.y = C.y; o.h = C.h; } return { key: o.key, c: o.c, x: +o.x.toFixed(2), z: +o.z.toFixed(2), y: +o.y.toFixed(2), h: +(o.h || 0).toFixed(3) }; }))); } catch (e) {} }
function handyBuyWare(shopId, key) { const shop = HANDY_SHOPS[shopId], it = shop.waren.find(i => i[0] === key); if (!it || !INV_ITEMS[key]) return;
  if (!kontoKann(it[1])) return toast("Nicht genug Guthaben: " + kontoFmt(it[1]) + " nötig");
  const put = invAdd(key, it[2]); if (!put) return toast("Kein Platz im Inventar");
  const pr = Math.round(it[1] * put / it[2]); kontoAus(pr, shop.name + ": " + INV_ITEMS[key].name + (put > 1 ? " (" + put + ")" : "")); toast(INV_ITEMS[key].name + (put > 1 ? " × " + put : "") + " gekauft – im Inventar" + (put < it[2] ? " (nur " + put + " hatten Platz)" : "")); handyRender(); }
function handyBuy(shopId, key) {
  const shop = HANDY_SHOPS[shopId], it = shop.items.find(i => i[0] === key), K = HANDY_CAT[key]; if (!it || !K.spec()) return; if (typeof addVehicle !== "function") return toast("In der Werkstatt kann man Fahrzeuge nur ansehen");
  if (!kontoKann(it[1])) return toast("Nicht genug Guthaben: " + kontoFmt(it[1]) + " nötig, du hast " + kontoFmt(kontoStand()));
  kontoAus(it[1], shop.name + ": " + handyName(key));
  const lot = handyLot(shop), o = { key, c: HANDY.col[key] ?? K.cols[0], x: lot.x, z: lot.z, y: lot.y, h: 0 }; HANDY.owned.push(o); const C = handySpawn(o);
  let here = false; if (typeof walking !== "undefined" && walking && !ghost && !(CAR && CAR.on)) here = summonVehicle(C);
  if (!here) { if (typeof areaEnsure === "function") areaEnsure(lot.x, lot.z); toast(handyName(key) + " gekauft – steht " + (shop.ort ? "beim Autohaus " + shop.name : "vor dem Wayne Tower") + " (App Garage: holen)"); }
  handySave(); if (here) handyClose(); else handyRender();
}
// Eigenes Hintergrundbild (Nicolas 2026-11-18, N41: "eigenes Hintergrundbild fuer Handy und Laptop hochladen, stark verpixelt gespeichert, um Speicher zu sparen"):
// Bild auf w x h Pixel verkleinern (Ausschnitt wie cover), als JPEG-dataURL (ca. 1-3 KB); angezeigt mit image-rendering: pixelated.
function handyPixel(file, w, h) { return new Promise((ok, no) => { if (!file || !String(file.type).startsWith("image/")) return no(new Error("kein Bild")); const u = URL.createObjectURL(file), im = new Image();
  im.onload = () => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"), k = Math.max(w / im.width, h / im.height); x.imageSmoothingQuality = "high";
    x.drawImage(im, (w - im.width * k) / 2, (h - im.height * k) / 2, im.width * k, im.height * k); URL.revokeObjectURL(u); ok(c.toDataURL("image/jpeg", 0.85)); };
  im.onerror = () => { URL.revokeObjectURL(u); no(new Error("Bild nicht lesbar")); }; im.src = u; }); }
const HANDY_BG = (() => { try { return JSON.parse(localStorage.getItem("wm-handy-bg") || "{}") || {}; } catch (e) { return {}; } })();   // je Modell: dataURL
const handyBgSave = () => { try { localStorage.setItem("wm-handy-bg", JSON.stringify(HANDY_BG)); } catch (e) { toast("Bild konnte nicht gespeichert werden"); } };
// Darstellung
const HANDY_APPS = [["kontakte", "Kontakte", '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'], ["web", "Internet", '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'], ["bank", "Bank", '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>'], ["garage", "Garage", '<path d="M3 20V9l9-5 9 5v11M7 20v-6h10v6M7 17h10"/>'], ["einst", "Einstellungen", '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>']];
function handyGo(p, push = true) { if (push && HANDY.page !== p) HANDY.hist.push(HANDY.page); HANDY.page = p; handyRender(); const sc = document.querySelector("#handy .h-screen"); if (sc) sc.scrollTop = 0; }
function handyRender() {
  const box = document.getElementById("handy"); if (!box || box.hidden) return; const p = HANDY.page, sc = box.querySelector(".h-screen"), url = box.querySelector(".h-url");
  const shop = HANDY_SHOPS[p.split(":")[1]];
  url.textContent = p === "home" ? "" : p === "web" ? "gotham.web" : p === "bank" ? "gothamcitybank.gotham" : p === "garage" ? "Garage" : p === "kontakte" ? "Kontakte" : p === "einst" ? "Einstellungen" : shop ? shop.url : "";
  const M = HANDY_MODELLE[HANDY.modell] || HANDY_MODELLE["handy-wayne"], ph = box.querySelector(".h-phone"), quer = handyQuer(p); ph.className = "h-phone " + M.cls + (quer ? " quer" : ""); box.classList.toggle("quer", quer);
  box.querySelector(".h-modell") || box.querySelector(".h-top").insertAdjacentHTML("afterbegin", '<span class="h-modell"></span>'); box.querySelector(".h-modell").textContent = M.name;
  { const bg = p === "home" && HANDY_BG[HANDY.modell]; sc.style.background = bg ? "#000 url(" + bg + ") center/cover" : ""; sc.style.imageRendering = bg ? "pixelated" : ""; sc.classList.toggle("h-bgimg", !!bg); }   // eigenes Hintergrundbild auf dem Startbildschirm
  box.querySelector(".h-bar").hidden = p === "home"; box.querySelector(".h-money").textContent = kontoFmt(kontoStand());
  if (p === "home") sc.innerHTML = '<div class="h-apps">' + handyApps().map(([id, n, svg], i) => '<button type="button" class="h-app' + (i === HANDY.sel ? " foc" : "") + '" data-go="' + id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + svg + "</svg><span>" + n + "</span></button>").join("") + "</div>";
  else if (p === "web") sc.innerHTML = '<div class="h-page"><h2>Gotham Web</h2><p class="h-sub">Läden</p>' + Object.entries(HANDY_SHOPS).map(([id, s]) => '<button type="button" class="h-link" data-go="shop:' + id + '" style="--c:' + s.farbe + '"><b>' + s.name + "</b><span>" + s.slogan + "</span></button>").join("") +
    '<p class="h-sub">Dienste</p><button type="button" class="h-link" data-go="bank" style="--c:#4a8fd6"><b>Gotham City Bank</b><span>Kontostand und Buchungen</span></button></div>';
  else if (p === "bank") sc.innerHTML = '<div class="h-page"><h2>Gotham City Bank</h2><div class="h-big">' + kontoFmt(kontoStand()) + '</div><p class="h-sub">Bargeld ein- und auszahlen geht an jedem Bankautomaten.</p><ul class="bank-log">' +
    (KONTO.log.slice(0, 12).map(b => "<li><span>" + b.grund.replace(/[<&]/g, "") + '</span><b class="' + (b.n < 0 ? "neg" : "pos") + '">' + (b.n > 0 ? "+" : "") + kontoFmt(b.n) + "</b></li>").join("") || "<li><span>Noch keine Buchungen</span></li>") + "</ul></div>";
  else if (p === "kontakte") { const C = HANDY.call; sc.innerHTML = C ? '<div class="h-page h-anruf"><div class="h-av">' + C.k[0][0] + '</div><h2>' + C.k[0] + '</h2><p class="h-sub">' + (C.st === "waehlt" ? "Wählt " + C.k[1] + " …" : "Verbunden") + '</p>' + (C.st === "verbunden" ? '<p class="h-sprech">„' + C.k[2] + '“</p>' : "") + '<button type="button" class="h-buy h-auflegen" data-auflegen="1">Auflegen</button></div>'
      : '<div class="h-page"><h2>Kontakte</h2>' + HANDY_KONTAKTE.filter(k => !k[3] || k[3] === HANDY.modell).map((k, i) => '<div class="h-car"><i style="background:#2c5d9a"></i><div><b>' + k[0] + '</b><span>' + k[1] + '</span></div><button type="button" data-anruf="' + HANDY_KONTAKTE.indexOf(k) + '">Anrufen</button></div>').join("") + '</div>'; }
  else if (p === "einst") { const bg = HANDY_BG[HANDY.modell]; sc.innerHTML = '<div class="h-page"><h2>Einstellungen</h2><p class="h-sub">Hintergrundbild</p><div class="h-bgprev"' + (bg ? ' style="background-image:url(' + bg + ')"' : "") + '>' + (bg ? "" : "Standard") + '</div>' +
    '<label class="h-link h-upl" style="--c:#4a8fd6"><b>Eigenes Bild hochladen</b><span>Wird stark verpixelt gespeichert (48 x 96 Pixel), damit es wenig Speicher braucht.</span><input type="file" accept="image/*" class="h-file" hidden></label>' + (bg ? '<button type="button" class="h-link" data-bgweg="1" style="--c:#d6343b"><b>Standard-Hintergrund</b><span>Eigenes Bild entfernen</span></button>' : "") + "</div>"; }
  else if (p === "garage") sc.innerHTML = '<div class="h-page"><h2>Meine Fahrzeuge</h2>' + (HANDY.owned.map((o, i) => '<div class="h-car"><i style="background:' + handyHex(o.c ?? 0x16181b) + '"></i><div><b>' + handyName(o.key) + "</b><span>" + HANDY_CAT[o.key].art + '</span></div><button type="button" data-holen="' + i + '">Holen</button></div>').join("") || '<p class="h-sub">Noch nichts gekauft. Im Internet findest du drei Händler.</p>') + "</div>";
  else if (shop && shop.waren) { const sid = p.split(":")[1];
    sc.innerHTML = '<div class="h-page h-shop" style="--c:' + shop.farbe + '"><div class="h-hero"><h2>' + shop.name + "</h2><span>" + shop.slogan + "</span></div>" + shop.waren.map(([k, pr, n]) => { const I = INV_ITEMS[k]; if (!I) return ""; const has = invCount(k);
      return '<div class="h-item"><div class="h-it-top"><svg class="h-ware" viewBox="0 0 26 26" aria-hidden="true">' + I.svg + '</svg><div><b>' + I.name + (n > 1 ? " × " + n : "") + "</b><span>" + I.art + (has ? " · " + has + " im Inventar" : "") + '</span></div><div class="h-price">' + kontoFmt(pr) + "</div></div>" +
        '<button type="button" class="h-buy" data-ware="' + sid + ":" + k + '"' + (kontoKann(pr) ? "" : " disabled") + ">" + (kontoKann(pr) ? "Kaufen" : "Zu wenig Guthaben") + "</button></div>"; }).join("") + "</div>"; }
  else if (shop) { const sid = p.split(":")[1];
    sc.innerHTML = '<div class="h-page h-shop" style="--c:' + shop.farbe + '"><div class="h-hero"><h2>' + shop.name + "</h2><span>" + shop.slogan + "</span></div>" + shop.items.map(([k, pr]) => { const K = HANDY_CAT[k]; if (!K.spec()) return ""; const sel = HANDY.col[k] ?? K.cols[0], n = HANDY.owned.filter(o => o.key === k).length;
      return '<div class="h-item"><div class="h-it-top"><div><b>' + handyName(k) + "</b><span>" + K.art + (n ? " · " + n + " in deiner Garage" : "") + '</span></div><div class="h-price">' + kontoFmt(pr) + "</div></div>" +
        (K.cols.length ? '<div class="h-cols">' + K.cols.map(c => '<button type="button" class="h-col' + (c === sel ? " sel" : "") + '" data-col="' + k + ":" + c + '" style="background:' + handyHex(c) + '" aria-label="Farbe"></button>').join("") + "</div>" : "") +
        '<button type="button" class="h-buy" data-buy="' + sid + ":" + k + '"' + (kontoKann(pr) ? "" : " disabled") + ">" + (kontoKann(pr) ? "Kaufen und liefern" : "Zu wenig Guthaben") + "</button></div>"; }).join("") + "</div>"; }
}
const handyIsOpen = () => { const b = document.getElementById("handy"); return b && !b.hidden; };
function handyOpen(page, modell) { const b = document.getElementById("handy"); if (!b) return; if (b.hidden) { const m = modell || handyEigen(); if (!m) return toast("Kein Handy dabei – im Inventar fehlt ein Handy"); HANDY.modell = m; HANDY.sel = 0; HANDY.call = null; if (typeof dragging !== "undefined" && dragging) { dragging = false; document.body.classList.remove("looking"); if (document.pointerLockElement) document.exitPointerLock(); } keys.clear(); b.hidden = false; HANDY.hist = []; HANDY.page = "home"; }
  if (page) handyGo(page); else handyRender(); }
function handyClose() { const b = document.getElementById("handy"); if (!b || b.hidden) return; b.hidden = true; if (typeof grabMouse === "function") grabMouse(); }
const handyShop = id => handyOpen("shop:" + id);
// Aufbau: gekaufte Fahrzeuge zurueck an ihren Platz, Klicks, Lage alle 5 s speichern
{ try { const d = JSON.parse(localStorage.getItem("wm-gekauft") || "[]"); if (Array.isArray(d)) for (const o of d) if (HANDY_CAT[o.key] && Number.isFinite(o.x)) { HANDY.owned.push(o); handySpawn(o); } } catch (e) {}
  setInterval(() => { if (HANDY.owned.length) handySave(); }, 5000);
  kontoOn(() => handyRender());
  document.getElementById("handy")?.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; b.blur(); const d = b.dataset;
    if (b.classList.contains("h-close")) return handyClose(); if (b.classList.contains("h-back")) { HANDY.page = HANDY.hist.pop() || "home"; return handyRender(); } if (b.classList.contains("h-home")) return handyGo("home");
    if (d.go) return handyGo(d.go); if (d.col) { const [k, c] = d.col.split(":"); HANDY.col[k] = +c; return handyRender(); }
    if (d.buy) { const [s, k] = d.buy.split(":"); return handyBuy(s, k); }
    if (d.ware) { const [s, k] = d.ware.split(":"); return handyBuyWare(s, k); }
    if (d.anruf) { const k = HANDY_KONTAKTE[+d.anruf]; HANDY.call = { k, st: "waehlt" }; handyRender(); clearTimeout(HANDY.callT); HANDY.callT = setTimeout(() => { if (HANDY.call && HANDY.call.k === k) { HANDY.call.st = "verbunden"; handyRender(); } }, 1600); return; }
    if (d.bgweg) { delete HANDY_BG[HANDY.modell]; handyBgSave(); return handyRender(); }
    if (d.auflegen) { HANDY.call = null; return handyRender(); }
    if (d.holen) { const o = HANDY.owned[+d.holen]; if (o && o.C && summonVehicle(o.C)) { handySave(); handyClose(); } } });
  document.getElementById("handy")?.addEventListener("change", e => { if (!e.target.classList.contains("h-file")) return; const m = HANDY.modell;
    handyPixel(e.target.files[0], 48, 96).then(u => { HANDY_BG[m] = u; handyBgSave(); handyRender(); toast("Hintergrundbild gesetzt"); }).catch(er => toast("Bild: " + er.message)); });
  document.getElementById("btn-handy")?.addEventListener("click", e => { e.currentTarget.blur(); handyIsOpen() ? handyClose() : handyOpen(); }); }
// Tastatur, solange das Handy offen ist: Pfeiltasten waehlen Apps, Enter oeffnet, Ruecktaste zurueck, Pfeil hoch/runter blaettert auf Seiten, Esc oder P legt es weg
addEventListener("keydown", e => { if (!handyIsOpen() || e.target.closest?.("input, textarea")) return; const k = e.key, home = HANDY.page === "home", n = handyApps().length;
  if (k === "Escape" || e.code === "KeyP") { e.preventDefault(); handyClose(); }
  else if (home && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(k)) { e.preventDefault(); const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[k]; HANDY.sel = Math.max(0, Math.min(n - 1, HANDY.sel + d)); handyRender(); }
  else if (home && k === "Enter") { e.preventDefault(); const a = handyApps()[HANDY.sel]; if (a) handyGo(a[0]); }
  else if (!home && k === "Backspace") { e.preventDefault(); if (HANDY.call) { HANDY.call = null; return handyRender(); } HANDY.page = HANDY.hist.pop() || "home"; handyRender(); }
  else if (!home && (k === "ArrowDown" || k === "ArrowUp")) { e.preventDefault(); const sc = document.querySelector("#handy .h-screen"); if (sc) sc.scrollTop += k === "ArrowDown" ? 80 : -80; }
  e.stopImmediatePropagation(); }, true);
// mit dem Handy in der Hand: Rechtsklick oeffnet es
// kein Browser-Menue: der Rechtsklick oeffnet das Handy und gibt die Maus frei, beim Loslassen kaeme sonst das Kontextmenue (Nicolas 2026-11-18, Bild)
addEventListener("contextmenu", e => { if (handyIsOpen() || performance.now() - (HANDY.openT || -1e9) < 800) e.preventDefault(); }, true);
addEventListener("mousedown", e => { if (e.button !== 2 || !document.pointerLockElement || typeof invHeld !== "function" || !HANDY_MODELLE[invHeld()]) return; HANDY.openT = performance.now(); e.preventDefault(); e.stopImmediatePropagation(); handyOpen(null, invHeld()); }, true);
// 3D in der Hand: flaches Handy mit leuchtendem Bildschirm, Kamera hinten
for (const id of Object.keys(HANDY_MODELLE)) { const bau = () => { const g = new THREE.Group(), w = id === "handy-wayne", body = new THREE.MeshStandardMaterial({ color: w ? 0x0b0c0e : 0xb9c0c8, metalness: w ? 0.5 : 0.7, roughness: 0.3 }),
    scr = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: w ? 0x3a2a08 : 0x1d3550, emissiveIntensity: 1.4 }), b = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.155, 0.009), body), s = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.142), scr);
  s.position.z = 0.0047; g.add(b, s); if (w) { const rim = new THREE.Mesh(new THREE.BoxGeometry(0.077, 0.157, 0.006), new THREE.MeshStandardMaterial({ color: 0xc9a640, metalness: 0.9, roughness: 0.25 })); g.add(rim); }
  for (let k = 0; k < (w ? 3 : 1); k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.004, 14), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6 })); c.rotation.x = Math.PI / 2; c.position.set(-0.022 + (k % 2) * 0.014, 0.06 - Math.floor(k / 2) * 0.014, -0.006); g.add(c); }
  g.scale.setScalar(1.6); g.rotation.set(-0.35, 0.45, 0.12); return g; };
  if (typeof HAND3D !== "undefined") HAND3D[id] = bau; else (window.HAND3D_VOR = window.HAND3D_VOR || {})[id] = bau; }   // im Spiel laedt tresor.js (HAND3D) spaeter und uebernimmt HAND3D_VOR