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
const HANDY = { page: "home", hist: [], owned: [], col: {} };   // owned: { key, c, x, z, y, h, C }
const handyHex = c => "#" + c.toString(16).padStart(6, "0");
const handyName = k => (HANDY_CAT[k].spec() || {}).name || k;
// Lieferplatz: Hof des Autohauses (Kartenort, Strassenhoehe) bzw. Vorplatz Wayne Tower
function handyLot(shop) { const o = shop.ort && typeof GOTHAM !== "undefined" ? GOTHAM.orte.find(q => q.id === shop.ort) : null;
  if (o) { const L = typeof GORT !== "undefined" && GORT.lots && GORT.lots[o.id], [x, z] = L || GOT.toGame(o.x, o.z); return { x, z, y: GOT.STR + 0.5 }; } const s = typeof WALK_START !== "undefined" ? WALK_START : { x: 0, z: 0, y: 0 }; return { x: s.x + 6, z: s.z, y: s.y }; }
function handySpawn(o) { const K = HANDY_CAT[o.key]; if (!K || !K.spec()) return null; const c = o.c ?? K.cols[0] ?? 0x16181b;
  o.C = addVehicle(K.spec(), () => K.build(c), o.x, o.z, o.y, o.h || 0, handyName(o.key) + " (gekauft)", c); return o.C; }
function handySave() { try { localStorage.setItem("wm-gekauft", JSON.stringify(HANDY.owned.map(o => { const C = o.C; if (C && Number.isFinite(C.x)) { o.x = C.x; o.z = C.z; o.y = C.y; o.h = C.h; } return { key: o.key, c: o.c, x: +o.x.toFixed(2), z: +o.z.toFixed(2), y: +o.y.toFixed(2), h: +(o.h || 0).toFixed(3) }; }))); } catch (e) {} }
function handyBuyWare(shopId, key) { const shop = HANDY_SHOPS[shopId], it = shop.waren.find(i => i[0] === key); if (!it || !INV_ITEMS[key]) return;
  if (!kontoKann(it[1])) return toast("Nicht genug Guthaben: " + kontoFmt(it[1]) + " nötig");
  const put = invAdd(key, it[2]); if (!put) return toast("Kein Platz im Inventar");
  const pr = Math.round(it[1] * put / it[2]); kontoAus(pr, shop.name + ": " + INV_ITEMS[key].name + (put > 1 ? " (" + put + ")" : "")); toast(INV_ITEMS[key].name + (put > 1 ? " × " + put : "") + " gekauft – im Inventar" + (put < it[2] ? " (nur " + put + " hatten Platz)" : "")); handyRender(); }
function handyBuy(shopId, key) {
  const shop = HANDY_SHOPS[shopId], it = shop.items.find(i => i[0] === key), K = HANDY_CAT[key]; if (!it || !K.spec()) return;
  if (!kontoKann(it[1])) return toast("Nicht genug Guthaben: " + kontoFmt(it[1]) + " nötig, du hast " + kontoFmt(kontoStand()));
  kontoAus(it[1], shop.name + ": " + handyName(key));
  const lot = handyLot(shop), o = { key, c: HANDY.col[key] ?? K.cols[0], x: lot.x, z: lot.z, y: lot.y, h: 0 }; HANDY.owned.push(o); const C = handySpawn(o);
  let here = false; if (typeof walking !== "undefined" && walking && !ghost && !(CAR && CAR.on)) here = summonVehicle(C);
  if (!here) { if (typeof areaEnsure === "function") areaEnsure(lot.x, lot.z); toast(handyName(key) + " gekauft – steht " + (shop.ort ? "beim Autohaus " + shop.name : "vor dem Wayne Tower") + " (App Garage: holen)"); }
  handySave(); if (here) handyClose(); else handyRender();
}
// Darstellung
const HANDY_APPS = [["web", "Internet", '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'], ["bank", "Bank", '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>'], ["garage", "Garage", '<path d="M3 20V9l9-5 9 5v11M7 20v-6h10v6M7 17h10"/>']];
function handyGo(p, push = true) { if (push && HANDY.page !== p) HANDY.hist.push(HANDY.page); HANDY.page = p; handyRender(); const sc = document.querySelector("#handy .h-screen"); if (sc) sc.scrollTop = 0; }
function handyRender() {
  const box = document.getElementById("handy"); if (!box || box.hidden) return; const p = HANDY.page, sc = box.querySelector(".h-screen"), url = box.querySelector(".h-url");
  const shop = HANDY_SHOPS[p.split(":")[1]];
  url.textContent = p === "home" ? "" : p === "web" ? "gotham.web" : p === "bank" ? "gothamcitybank.gotham" : p === "garage" ? "Garage" : shop ? shop.url : "";
  box.querySelector(".h-bar").hidden = p === "home"; box.querySelector(".h-money").textContent = kontoFmt(kontoStand());
  if (p === "home") sc.innerHTML = '<div class="h-apps">' + HANDY_APPS.map(([id, n, svg]) => '<button type="button" class="h-app" data-go="' + id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + svg + "</svg><span>" + n + "</span></button>").join("") + "</div>";
  else if (p === "web") sc.innerHTML = '<div class="h-page"><h2>Gotham Web</h2><p class="h-sub">Läden</p>' + Object.entries(HANDY_SHOPS).map(([id, s]) => '<button type="button" class="h-link" data-go="shop:' + id + '" style="--c:' + s.farbe + '"><b>' + s.name + "</b><span>" + s.slogan + "</span></button>").join("") +
    '<p class="h-sub">Dienste</p><button type="button" class="h-link" data-go="bank" style="--c:#4a8fd6"><b>Gotham City Bank</b><span>Kontostand und Buchungen</span></button></div>';
  else if (p === "bank") sc.innerHTML = '<div class="h-page"><h2>Gotham City Bank</h2><div class="h-big">' + kontoFmt(kontoStand()) + '</div><p class="h-sub">Bargeld ein- und auszahlen geht an jedem Bankautomaten.</p><ul class="bank-log">' +
    (KONTO.log.slice(0, 12).map(b => "<li><span>" + b.grund.replace(/[<&]/g, "") + '</span><b class="' + (b.n < 0 ? "neg" : "pos") + '">' + (b.n > 0 ? "+" : "") + kontoFmt(b.n) + "</b></li>").join("") || "<li><span>Noch keine Buchungen</span></li>") + "</ul></div>";
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
function handyOpen(page) { const b = document.getElementById("handy"); if (!b) return; if (b.hidden) { if (typeof dragging !== "undefined" && dragging) { dragging = false; document.body.classList.remove("looking"); if (document.pointerLockElement) document.exitPointerLock(); } keys.clear(); b.hidden = false; HANDY.hist = []; HANDY.page = "home"; }
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
    if (d.holen) { const o = HANDY.owned[+d.holen]; if (o && o.C && summonVehicle(o.C)) { handySave(); handyClose(); } } });
  document.getElementById("btn-handy")?.addEventListener("click", e => { e.currentTarget.blur(); handyIsOpen() ? handyClose() : handyOpen(); }); }
