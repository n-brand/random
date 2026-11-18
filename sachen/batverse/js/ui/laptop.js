// Batverse – Laptops (Nicolas 2026-11-17, Notizen N5: "in der Werkstatt einen Laptop platzieren, aehnlich wie der Bankautomat, nur mit anderem UI und anderen Funktionen;
// direkt daneben einen zweiten mit anderem Hardware-Design; Software gleich, aber nicht jeder PC hat jede App; Benutzername schon drin; entsperrt / ohne Passwort / mit Passwort;
// Apps Web (angeheftete Seiten wie GTA V, ueberall angemeldet), Kontakte (Polizei, Taxi, Krankenwagen, Feuerwehr), E-Mail, Karten"). Plan: PLAN-LAPTOP.md.
// Klassisches Skript fuer Werkstatt (vor werkstatt.js) und spaeter das Spiel. Beim Laden nur Daten und Funktionen; Oberflaeche und Stile entstehen beim ersten Oeffnen.
// 3D: buildLaptop(id), buildLaptopTisch() (Tisch mit A und B; Gruppen tragen userData.kind "laptop" und userData.id). Oeffnen: laptopOpen(id), Schliessen: laptopClose().
// Gespeichert (localStorage): wm-boerse (Kurse, Verlauf, Depot), wm-immo (eigene Immobilien), wm-mail (Kaufbestaetigungen). Konto, Inventar: konto.js, inventar.js.
"use strict";
const LAPTOP_DEF = {
  A: { name: "Wayne Book", user: "Bruce Wayne", lock: "offen", pw: "", apps: ["web", "kontakte", "mail", "karten", "einst"], hw: "silber", wp: 0 },
  B: { name: "Nightfall X17", user: "Bruce Wayne", lock: "passwort", pw: "gotham", hint: "Die Stadt, klein geschrieben", apps: ["web", "mail", "karten", "einst"], hw: "schwarz", wp: 1 },
};
// lock: "offen" = entsperrt, "ohne" = kein Passwort (Anmelden per Klick), "passwort" = Passwort noetig
const LT = { cur: null, el: null, locked: {}, off: {}, sleep: {}, boot: null, pmenu: false, app: null, web: "start", hist: [], mail: 0, call: null, err: "", tick: 0, map: null, screens: {} };

const LT_APPS = {
  web: ["Web", "#2f7de1", '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'],
  kontakte: ["Kontakte", "#2fa36b", '<circle cx="12" cy="9" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>'],
  mail: ["E-Mail", "#e0a32f", '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'],
  einst: ["Einstellungen", "#6b7380", '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'],
  karten: ["Karten", "#d1453b", '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>'],
};
// Symbole der Oberflaeche (Linien wie die App-Symbole; Nicolas 2026-11-17: "Icons muessen verschoenert werden")
const LT_IC = { back: '<path d="M15 5l-7 7 7 7"/>', home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h4v-5h4v5h4v-9"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>', go: '<path d="M5 12h14M13 6l6 6-6 6"/>', power: '<path d="M12 3v8M6.5 6.5a8 8 0 1 0 11 0"/>',
  mond: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>', neu: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>' };
const ltSvg = (p, s = 24) => '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>";
const ltEsc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ltFmt = n => typeof kontoFmt === "function" ? kontoFmt(n) : Math.round(n).toLocaleString("de-CH") + " $";
const ltLoad = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v || d; } catch (e) { return d; } };
const ltSave = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

// ---- Web-Seiten (angeheftet, ueberall angemeldet) ----
const LT_SITES = [
  ["budget", "Budget Cars", "budgetcars.gotham", "#f2b134", "Gebrauchtwagen, Fabrikviertel"],
  ["prestige", "Prestige Motors", "prestige-motors.gotham", "#b8954a", "Luxusfahrzeuge, Uptown"],
  ["defense", "Defense Supply", "defense-supply.gotham", "#6f8a45", "Ausgemustertes Militärgerät"],
  ["guns", "Guns & Ammo", "gunsandammo.gotham", "#d8443a", "Pistolen, Flinten, Munition"],
  ["arms", "Gotham Arms", "gotham-arms.gotham", "#7d8c50", "Schweres Gerät"],
  ["boerse", "Gotham Stock Exchange", "gse.gotham", "#1f9d6b", "Aktien und Depot"],
  ["bank", "Gotham City Bank", "gothamcitybank.gotham", "#2f6fd6", "Konto, Bargeld, Buchungen"],
  ["immo", "Gotham Estates", "gotham-estates.gotham", "#8a5bd6", "Immobilien kaufen, eigene Objekte"],
];
// Einstellungen je Laptop (App "Einstellungen", Nicolas 2026-11-17): Hintergrund, Helligkeit, Sperre/Passwort, Cookies (Anmeldungen auf Websites), Verlauf. localStorage wm-laptops.
const LTS = (() => { try { return JSON.parse(localStorage.getItem("wm-laptops") || "null") || {}; } catch (e) { return {}; } })();
const ltSaveCfg = () => { try { localStorage.setItem("wm-laptops", JSON.stringify(LTS)); } catch (e) {} };
function ltD(id) { const D = LAPTOP_DEF[id]; if (!D) return null; const S = LTS[id] || (LTS[id] = {});
  if (!S.cookies) S.cookies = LT_SITES.map(x => x[0]); if (!S.verlauf) S.verlauf = []; if (S.hell === undefined) S.hell = 1;
  return { ...D, ...S, apps: D.apps }; }
const ltSet = (id, k, v) => { ltD(id); LTS[id][k] = v; ltSaveCfg(); };
for (const id in LAPTOP_DEF) LT.locked[id] = ltD(id).lock !== "offen";
// Kataloge: im Spiel aus handy.js (HANDY_SHOPS), sonst (Werkstatt) diese Kopie der Namen und Preise
const LT_SHOPMAP = { budget: "billig", prestige: "teuer", defense: "militaer", guns: "waffen", arms: "arms" };
const LT_CARS = { budget: [["Motorrad", 9000], ["Streetfighter", 14000], ["Gotham Taxi", 18000], ["Abschleppwagen", 45000], ["DeLorean", 65000], ["Nachtfalke", 120000]],
  prestige: [["G-Klasse", 180000], ["Aventador", 420000], ["Spectre", 430000], ["Rolls-Royce", 460000], ["Terzo Millennio", 2500000]],
  defense: [["Muldenkipper", 900000], ["Panzer", 3500000], ["Tumbler", 5000000]] };
const LT_WAREN = { guns: [["pistole", 2500, 1], ["schrotflinte", 6500, 1], ["munition", 150, 32], ["schrot", 180, 16]], arms: [["mg", 18000, 1], ["sniper", 24000, 1], ["g36", 22000, 1], ["g36c", 19000, 1], ["akm", 15000, 1], ["mp7", 16000, 1], ["mp5", 14000, 1], ["mg34", 30000, 1], ["sturmmunition", 450, 30], ["munition", 150, 32], ["gewehrmunition", 400, 20]] };

// ---- Boerse: Kurse laufen zufaellig weiter (je 4 s ein Schritt, verpasste Zeit beim Oeffnen bis 60 Schritte) ----
const LT_STOCKS = [["WYNE", "Wayne Enterprises", 412], ["PMG", "Prestige Motors Group", 88], ["BGC", "Budget Cars", 14.5], ["ACE", "Ace Chemicals", 37], ["KANE", "Kane Textiles", 22], ["GARM", "Gotham Arms", 64], ["GCB", "Gotham City Bank", 129], ["GTRN", "Gotham Transit", 9.8]];
const LTB = ltLoad("wm-boerse", null) || { p: {}, h: {}, d: {}, t: Date.now() };
for (const [s, , p0] of LT_STOCKS) { if (!LTB.p[s]) LTB.p[s] = p0; if (!LTB.h[s]) LTB.h[s] = [p0]; }
function ltStockStep(n) { for (let k = 0; k < n; k++) for (const [s, , p0] of LT_STOCKS) { const p = LTB.p[s], drift = (p0 - p) / p0 * 0.01, q = Math.max(0.5, p * (1 + drift + (Math.random() - 0.5) * 0.03)); LTB.p[s] = Math.round(q * 100) / 100; const h = LTB.h[s]; h.push(LTB.p[s]); if (h.length > 48) h.shift(); }
  LTB.t = Date.now(); ltSave("wm-boerse", LTB); }
function ltStockCatchUp() { const n = Math.min(60, Math.floor((Date.now() - (LTB.t || Date.now())) / 4000)); if (n > 0) ltStockStep(n); }

// ---- Immobilien (Bruce besitzt Manor und Tower; Angebote kaufbar, Wert steigt langsam mit der Spielzeit) ----
const LT_IMMO = [
  { id: "manor", name: "Wayne Manor", ort: "Anwesen ausserhalb der Stadt", preis: 85000000, eigen: true, map: null },
  { id: "tower", name: "Wayne Tower", ort: "Zentrum, Wayne Circle", preis: 1200000000, eigen: true, map: [-2050, -100] },
  { id: "penthouse", name: "Penthouse Uptown", ort: "Uptown, 48. Stock", preis: 4200000, map: [-1700, -1200] },
  { id: "loft", name: "Loft in den Narrows", ort: "Narrows, Fabrikgebäude", preis: 380000, map: [-2650, 1050] },
  { id: "diner", name: "Diner East End", ort: "East End, mit Wohnung darüber", preis: 240000, map: [-1450, 600] },
  { id: "halle", name: "Lagerhalle am Hafen", ort: "Hafen, 1 200 m²", preis: 650000, map: [-3050, 1500] },
  { id: "garage", name: "Tiefgaragenplatz Midtown", ort: "Midtown", preis: 95000, map: [-2250, 300] },
  { id: "wohnung", name: "Wohnung Midtown", ort: "Midtown, 3 Zimmer", preis: 820000, map: [-2350, 200] },
];
const LTI = ltLoad("wm-immo", null) || { own: {} };
for (const o of LT_IMMO) if (o.eigen && !LTI.own[o.id]) LTI.own[o.id] = { preis: o.preis, t: Date.now() - 10 * 20 * 60000 };   // seit 10 Spieltagen im Besitz
const ltImmoWert = id => { const o = LTI.own[id]; if (!o) return 0; const tage = (Date.now() - o.t) / (20 * 60000); return Math.round(o.preis * (1 + 0.001 * tage) / 1000) * 1000; };   // +0,1 % je Spieltag (20 min)

// ---- E-Mails ----
const LT_MAILS = [
  { von: "Gotham City Bank", betreff: "Willkommen im Online-Banking", text: "Hallo Bruce Wayne,\n\nIhr Online-Banking ist eingerichtet. Kontostand und Buchungen finden Sie jederzeit unter gothamcitybank.gotham.\n\nFreundliche Grüsse\nGotham City Bank" },
  { von: "Gotham Estates", betreff: "Wertschätzung Ihrer Immobilien", text: "Sehr geehrter Herr Wayne,\n\ndie aktuelle Wertschätzung Ihrer Objekte finden Sie in Ihrem Konto unter gotham-estates.gotham. Wayne Manor und Wayne Tower sind erfasst.\n\nGotham Estates" },
  { von: "Gotham Gazette", betreff: "Newsletter: Neues Casino in Uptown eröffnet", text: "Art déco in Schwarz und Gold: das neue Casino in Uptown hat seine Türen geöffnet. Neonbuchstaben, Roulette auf dem Dach, Suchscheinwerfer in der Nacht.\n\nGotham Gazette" },
  { von: "Gotham Stock Exchange", betreff: "Ihr Depot ist bereit", text: "Sie können ab sofort Aktien von Wayne Enterprises und weiteren Gotham-Firmen handeln. Kurse aktualisieren sich laufend.\n\nGSE" },
];
const LTM = ltLoad("wm-mail", null) || { list: [] };
function ltMailAdd(von, betreff, text) { LTM.list.unshift({ t: Date.now(), von, betreff, text }); LTM.list.length = Math.min(LTM.list.length, 30); ltSave("wm-mail", LTM); }
function ltMails() { const log = typeof KONTO !== "undefined" ? KONTO.log.slice(0, 5).map(b => ({ t: b.t, von: "Gotham City Bank", betreff: "Kontobewegung: " + (b.n > 0 ? "+" : "") + ltFmt(b.n), text: "Buchung: " + b.grund + "\nBetrag: " + ltFmt(b.n) + "\nZeit: " + new Date(b.t).toLocaleString("de-CH") })) : [];
  return [...LTM.list, ...log, ...LT_MAILS.map((m, i) => ({ ...m, t: 0, fest: i }))]; }

// ---- Kontakte ----
const LT_KONTAKTE = [
  ["polizei", "Polizei (GCPD)", "911", "#2f5fd6", "Gotham City Police Department, Notruf. Ein Streifenwagen ist unterwegs zu Ihrem Standort."],
  ["taxi", "Gotham Cab Co.", "555-0199", "#e8b400", "Gotham Cab Co., guten Tag. Ein Taxi ist in wenigen Minuten bei Ihnen."],
  ["kranken", "Krankenwagen", "911", "#d9343b", "Rettungsdienst Gotham General. Ein Krankenwagen ist auf dem Weg."],
  ["feuerwehr", "Feuerwehr", "911", "#e2622b", "Gotham Fire Department. Ein Löschfahrzeug ist alarmiert."],
];

// ---- 3D-Modelle ----
function ltCanvas(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
// Eigenes Hintergrundbild (Nicolas 2026-11-18, N41: "eigenes Hintergrundbild fuer Handy und Laptop hochladen, stark verpixelt gespeichert, um Speicher zu sparen"):
// Bild auf w x h Pixel verkleinern (Ausschnitt wie cover), als JPEG-dataURL (ca. 1-3 KB); angezeigt mit image-rendering: pixelated.
function ltPixel(file, w, h) { return new Promise((ok, no) => { if (!file || !String(file.type).startsWith("image/")) return no(new Error("kein Bild")); const u = URL.createObjectURL(file), im = new Image();
  im.onload = () => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"), k = Math.max(w / im.width, h / im.height); x.imageSmoothingQuality = "high";
    x.drawImage(im, (w - im.width * k) / 2, (h - im.height * k) / 2, im.width * k, im.height * k); URL.revokeObjectURL(u); ok(c.toDataURL("image/jpeg", 0.85)); };
  im.onerror = () => { URL.revokeObjectURL(u); no(new Error("Bild nicht lesbar")); }; im.src = u; }); }
const LT_IMG = {};   // geladene eigene Bilder fuer den 3D-Bildschirm
function ltWpStyle(D) { return D.wp === 3 && D.bild ? "background:#000 url(" + D.bild + ") center/cover;image-rendering:pixelated;" : ""; }
function ltWallpaper(c, w, h, wp, bild) {
  if (wp === 3 && bild) { let im = LT_IMG[bild]; if (!im) { im = LT_IMG[bild] = new Image(); im.onload = () => { for (const id in LT.screens) ltScreenDraw(id); }; im.src = bild; }
    c.fillStyle = "#000"; c.fillRect(0, 0, w, h); if (im.complete && im.naturalWidth) { c.imageSmoothingEnabled = false; c.drawImage(im, 0, 0, w, h); c.imageSmoothingEnabled = true; } return; }
  const g = c.createLinearGradient(0, 0, w * 0.4, h);
  if (wp === 1) { g.addColorStop(0, "#2a0608"); g.addColorStop(0.55, "#120405"); g.addColorStop(1, "#050505"); }
  else if (wp === 2) { g.addColorStop(0, "#0f2e2a"); g.addColorStop(0.6, "#2c6e63"); g.addColorStop(1, "#e8c07a"); }
  else { g.addColorStop(0, "#0d1b3d"); g.addColorStop(0.6, "#3b2a6b"); g.addColorStop(1, "#c76b4a"); }
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = wp === 1 ? "rgba(255,40,50,.18)" : "rgba(255,230,190,.85)"; c.beginPath(); c.arc(w * 0.78, h * 0.22, h * 0.07, 0, Math.PI * 2); c.fill();
  c.fillStyle = wp === 1 ? "#0a0203" : wp === 2 ? "#08201c" : "#0b0f1f"; let x = 0, r = 7; while (x < w) { r = (r * 9301 + 49297) % 233280; const bw = w * (0.03 + r / 233280 * 0.05), bh = h * (0.12 + ((r * 7) % 100) / 100 * 0.3); c.fillRect(x, h - bh, bw, bh); x += bw + w * 0.004; }
}
function ltScreenDraw(id) {
  const T = LT.screens[id]; if (!T) return; const cv = T.image, c = cv.getContext("2d"), w = cv.width, h = cv.height, D = ltD(id);
  if (LT.off[id] || LT.sleep[id] || (LT.boot && LT.cur === id)) { c.fillStyle = "#000"; c.fillRect(0, 0, w, h); if (!LT.off[id] && !LT.sleep[id]) { c.fillStyle = D.hw === "silber" ? "#e9ecef" : "#ff2a36"; c.textAlign = "center"; c.font = "bold " + h * 0.16 + "px Georgia, serif"; c.fillText(D.hw === "silber" ? "W" : "NIGHTFALL", w / 2, h * 0.55); } T.needsUpdate = true; return; }   // aus bzw. startet
  ltWallpaper(c, w, h, D.wp, D.bild); c.textAlign = "center"; c.fillStyle = "#fff";
  const now = ltTime();
  if (LT.locked[id]) { c.font = "300 " + h * 0.2 + "px Segoe UI, Arial"; c.fillText(now, w / 2, h * 0.36); c.beginPath(); c.fillStyle = "rgba(255,255,255,.2)"; c.arc(w / 2, h * 0.56, h * 0.08, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fff"; c.font = "600 " + h * 0.06 + "px Segoe UI, Arial"; c.fillText(D.user, w / 2, h * 0.76); }
  else { c.fillStyle = "rgba(10,12,18,.75)"; c.fillRect(0, h * 0.92, w, h * 0.08); for (const [k, a] of D.apps.entries()) { c.fillStyle = LT_APPS[a][1]; c.fillRect(w * 0.03, h * (0.05 + k * 0.13), h * 0.09, h * 0.09); }
    if (LT.cur === id && LT.app) { c.fillStyle = "#f4f5f7"; c.fillRect(w * 0.06, h * 0.06, w * 0.88, h * 0.8); c.fillStyle = "#e3e6ea"; c.fillRect(w * 0.06, h * 0.06, w * 0.88, h * 0.06); c.fillStyle = "#333"; c.font = "600 " + h * 0.04 + "px Segoe UI, Arial"; c.textAlign = "left"; c.fillText(LT_APPS[LT.app][0], w * 0.08, h * 0.105); } }
  T.needsUpdate = true;
}
function buildLaptop(id) {
  const D = ltD(id), sil = D.hw === "silber", g = new THREE.Group(), W = sil ? 0.31 : 0.37, Dp = sil ? 0.215 : 0.26, t = sil ? 0.014 : 0.028;
  const body = new THREE.MeshStandardMaterial({ color: sil ? 0xc5cad1 : 0x17191c, metalness: sil ? 0.6 : 0.2, roughness: sil ? 0.35 : 0.6 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(W, t, Dp), body); base.position.y = t / 2; g.add(base);
  const keyT = ltCanvas(256, 128, (c, w, h) => { c.fillStyle = sil ? "#aeb3ba" : "#0d0e10"; c.fillRect(0, 0, w, h); for (let r = 0; r < 5; r++) for (let k = 0; k < 14; k++) { const kw = w / 14.6, kh = h / 6.2; c.fillStyle = sil ? "#22252a" : "#1b1d21"; c.fillRect(6 + k * (kw + 1.4), 6 + r * (kh + 3), kw - 2, kh - 2); if (!sil) { c.fillStyle = "rgba(230,40,50,.55)"; c.fillRect(8 + k * (kw + 1.4), 4 + r * (kh + 3) + kh - 4, kw - 6, 1.5); } } c.fillStyle = sil ? "#22252a" : "#1b1d21"; c.fillRect(w * 0.28, 6 + 5 * (h / 6.2 + 3), w * 0.44, h / 6.2 - 2); });
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, Dp * 0.42), new THREE.MeshStandardMaterial({ map: keyT, emissive: sil ? 0x000000 : 0xffffff, emissiveMap: sil ? null : keyT, emissiveIntensity: sil ? 0 : 0.35, roughness: 0.7 }));
  kb.rotation.x = -Math.PI / 2; kb.position.set(0, t + 0.0008, -0.01 + Dp * 0.06); g.add(kb);
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.32, Dp * 0.22), new THREE.MeshStandardMaterial({ color: sil ? 0xb4b9c0 : 0x202226, roughness: 0.45 })); pad.rotation.x = -Math.PI / 2; pad.position.set(0, t + 0.0008, -Dp * 0.32); g.add(pad);
  if (!sil) { const led = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, 0.004, 0.003), new THREE.MeshBasicMaterial({ color: 0xff2a36 })); led.position.set(0, t * 0.45, -Dp / 2 - 0.0015); g.add(led);
    for (let k = 0; k < 6; k++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.004), new THREE.MeshStandardMaterial({ color: 0x050505 })); v.position.set(-W * 0.3 + k * W * 0.12, t * 0.5, Dp / 2 + 0.001); g.add(v); } }
  // Deckel (Scharnier hinten), ca. 108 Grad offen
  const lt = sil ? 0.006 : 0.011, piv = new THREE.Group(); piv.position.set(0, t, Dp / 2); piv.rotation.x = 0.32; g.add(piv);   // nach hinten geneigt (vorher -0,32: Deckel kippte ueber die Tastatur, Nicolas 2026-11-17)
  const lid = new THREE.Mesh(new THREE.BoxGeometry(W, Dp, lt), body); lid.position.set(0, Dp / 2, 0); piv.add(lid);
  const scr = ltCanvas(512, 320, () => {}); LT.screens[id] = scr;
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, Dp * 0.86), new THREE.MeshStandardMaterial({ map: scr, emissive: 0xffffff, emissiveMap: scr, emissiveIntensity: 0.75, roughness: 0.3 }));
  sm.position.set(0, Dp / 2 + (sil ? 0.004 : 0.006), -lt / 2 - 0.0008); sm.rotation.y = Math.PI; piv.add(sm);
  const logoT = ltCanvas(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); if (sil) { c.fillStyle = "#e9ecef"; c.font = "bold 92px Georgia, serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("W", w / 2, h / 2 + 4); }
    else { c.strokeStyle = "#ff2a36"; c.lineWidth = 8; c.beginPath(); c.moveTo(10, 100); c.lineTo(64, 20); c.lineTo(118, 100); c.stroke(); c.beginPath(); c.moveTo(40, 100); c.lineTo(64, 64); c.lineTo(88, 100); c.stroke(); } });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(sil ? 0.05 : 0.08, sil ? 0.05 : 0.08), new THREE.MeshStandardMaterial({ map: logoT, transparent: true, emissive: sil ? 0x000000 : 0xff2a36, emissiveMap: sil ? null : logoT, emissiveIntensity: sil ? 0 : 0.9, metalness: sil ? 0.8 : 0 }));
  logo.position.set(0, Dp / 2, lt / 2 + 0.0008); piv.add(logo);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.kind = "laptop"; g.userData.id = id; g.name = "Laptop " + D.name; ltScreenDraw(id); return g;
}
function buildLaptopTisch() {
  const g = new THREE.Group(), holz = new THREE.MeshStandardMaterial({ color: 0x4a3122, roughness: 0.55 }), met = new THREE.MeshStandardMaterial({ color: 0x2a2d31, metalness: 0.6, roughness: 0.4 });
  // Tisch nach links verlaengert (Nicolas 2026-11-17: Batarang-Etui neben die Laptops), x -1,35 .. 0,85
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.8), holz); top.position.set(-0.25, 0.74, 0); g.add(top);
  for (const x of [-1.3, 0.8]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.04), met); l.position.set(x, 0.36, sz * 0.35); g.add(l); }
  const A = buildLaptop("A"), B = buildLaptop("B"); A.position.set(-0.42, 0.76, 0.02); A.rotation.y = 0.08; B.position.set(0.42, 0.76, 0.0); B.rotation.y = -0.08; g.add(A, B);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.095, 18), new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.4 })); mug.position.set(0.02, 0.81, 0.18); g.add(mug);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.5 })); mouse.scale.set(0.9, 0.45, 1.4); mouse.position.set(0.78, 0.775, -0.05); g.add(mouse);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.userData.kind = "tisch"; g.name = "Laptop-Tisch"; return g;
}

// ---- Oberflaeche ----
function ltTime() { if (typeof DAY !== "undefined") { const m = Math.floor(((DAY.t + 0.25) % 1) * 1440); return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); } const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
const LT_CSS = `
#laptop{position:fixed;inset:0;z-index:42;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);font-family:"Segoe UI",system-ui,sans-serif}
#laptop[hidden]{display:none}
.lt-dev{display:flex;flex-direction:column;align-items:center;transform-origin:center}
.lt-lid{position:relative;padding:16px 16px 22px;border-radius:16px 16px 4px 4px}
.lt-silber .lt-lid{background:linear-gradient(#dfe3e8,#b7bcc4);box-shadow:inset 0 0 0 1px #8d939b,0 20px 60px rgba(0,0,0,.6)}
.lt-schwarz .lt-lid{background:linear-gradient(#1d1f23,#0d0e10);box-shadow:inset 0 0 0 1px #3a0d10,0 0 24px rgba(255,40,54,.25),0 20px 60px rgba(0,0,0,.7);padding:12px 12px 28px}
.lt-cam{position:absolute;top:6px;left:50%;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:#22262c}
.lt-brand{position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:11px;letter-spacing:.2em;font-weight:700}
.lt-silber .lt-brand{color:#6c727a}.lt-schwarz .lt-brand{color:#ff3a46;text-shadow:0 0 6px #ff2a36}
.lt-base{height:18px;border-radius:0 0 22px 22px;width:calc(100% + 80px)}
.lt-silber .lt-base{background:linear-gradient(#cfd3d9,#979ca3)}.lt-schwarz .lt-base{background:linear-gradient(#202226,#0b0c0e);border-bottom:3px solid #ff2a36;box-shadow:0 3px 12px rgba(255,42,54,.5)}
.lt-scr{position:relative;width:960px;height:600px;overflow:hidden;color:#fff;border-radius:3px;background:#000}
.lt-wp0{background:linear-gradient(160deg,#0d1b3d,#3b2a6b 60%,#c76b4a)}
.lt-wp2{background:linear-gradient(160deg,#0f2e2a,#2c6e63 60%,#e8c07a)}
.lt-wp1{background:radial-gradient(circle at 75% 25%,#5a0d12,#120607 55%,#050505)}
.lt-sky{position:absolute;left:0;right:0;bottom:0;height:38%;pointer-events:none;opacity:.95}
.lt-lock{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center}
.lt-clock{font-size:84px;font-weight:300;line-height:1}.lt-date{font-size:16px;opacity:.85;margin-bottom:26px}
.lt-ava{width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center;font-size:34px;font-weight:700;border:2px solid rgba(255,255,255,.35)}
.lt-user{font-size:22px;font-weight:600}
.lt-pwrow{display:flex;gap:6px}.lt-pw{width:230px;padding:9px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.45);background:rgba(0,0,0,.35);color:#fff;font-size:15px;outline:none}
.lt-btn{display:inline-flex;align-items:center;justify-content:center;padding:9px 18px;border-radius:8px;border:0;background:rgba(255,255,255,.22);color:#fff;font-size:15px;cursor:pointer;font-family:inherit}.lt-btn:hover{background:rgba(255,255,255,.32)}
.lt-err{color:#ffb4b4;min-height:18px;font-size:13px}.lt-hint{font-size:12px;opacity:.7}
.lt-shake{animation:lt-shake .35s}@keyframes lt-shake{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
.lt-icons{position:absolute;left:16px;top:16px;display:grid;gap:12px}
.lt-ic{width:86px;display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;color:#fff;cursor:pointer;font:12px "Segoe UI",sans-serif;text-shadow:0 1px 3px #000;padding:6px;border-radius:8px}.lt-ic:hover{background:rgba(255,255,255,.12)}
.lt-ic i{width:50px;height:50px;border-radius:12px;display:grid;place-items:center;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.4)}
.lt-bar{position:absolute;left:0;right:0;bottom:0;height:44px;background:rgba(10,12,18,.78);display:flex;align-items:center;gap:4px;padding:0 10px}
.lt-tb{width:36px;height:36px;border-radius:8px;border:0;background:transparent;color:#fff;cursor:pointer;display:grid;place-items:center}.lt-tb:hover,.lt-tb.on{background:rgba(255,255,255,.16)}
.lt-tb.on{box-shadow:inset 0 -2px 0 #6ab0ff}
.lt-pmenu{position:absolute;right:6px;bottom:52px;background:rgba(20,12,14,.42);backdrop-filter:blur(22px) saturate(1.5);-webkit-backdrop-filter:blur(22px) saturate(1.5);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:6px;box-shadow:0 12px 32px rgba(0,0,0,.45);display:flex;flex-direction:column;min-width:250px;z-index:3}   /* wie Nicolas' Bild (2026-11-17) */
.lt-pmenu button{display:flex;align-items:center;gap:18px;padding:10px 16px;border:0;background:none;color:#fff;font:17px "Segoe UI",sans-serif;border-radius:6px;cursor:pointer;text-align:left}.lt-pmenu button svg{stroke-width:1.5}.lt-pmenu button:hover{background:rgba(255,255,255,.1)}
.lt-sleep{cursor:pointer}
.lt-boot{position:absolute;inset:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;font-size:15px;color:#bbb}
.lt-logo{font:700 64px Georgia,serif;color:#e9ecef;letter-spacing:.08em}
.lt-spin{width:34px;height:34px;border:3px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:lt-spin 1s linear infinite}@keyframes lt-spin{to{transform:rotate(360deg)}}
.lt-offbtn{width:72px;height:72px;border-radius:50%;border:2px solid #3a3d44;background:#0d0e10;color:#9aa0a8;display:grid;place-items:center;cursor:pointer}.lt-offbtn:hover{color:#fff;border-color:#6ab0ff;box-shadow:0 0 14px rgba(106,176,255,.5)}
.lt-leave{position:absolute;top:14px;right:18px;display:flex;align-items:center;gap:8px;padding:8px 14px;border:0;border-radius:999px;background:rgba(20,22,28,.85);color:#fff;font:600 14px "Segoe UI",sans-serif;cursor:pointer;z-index:2}.lt-leave small{opacity:.6;font-weight:400}.lt-leave:hover{background:rgba(40,44,54,.95)}
.lt-einst{display:grid;grid-template-columns:200px 1fr;height:100%}.lt-enav{padding:12px 8px;background:rgba(127,127,127,.08);display:flex;flex-direction:column;gap:2px}
.lt-enav button{text-align:left;padding:9px 14px;border:0;border-radius:6px;background:none;color:inherit;font:14px "Segoe UI",sans-serif;cursor:pointer}.lt-enav button:hover{background:rgba(127,127,127,.15)}.lt-enav button.on{background:rgba(47,125,225,.18);box-shadow:inset 3px 0 0 #2f7de1;font-weight:600}
.lt-ebody{padding:18px 24px;overflow:auto}.lt-ebody h2{margin:0 0 10px}.lt-ebody .lt-row span{opacity:.75}
.lt-upl{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:12px}.lt-upl label{cursor:pointer}.lt-upl span{flex-basis:100%;font-size:12px;opacity:.65}.lt-usbmenu{right:auto;left:120px}.lt-wps{display:flex;gap:12px}.lt-wps button{width:140px;height:88px;border-radius:8px;border:3px solid transparent;cursor:pointer}.lt-wps button.on{border-color:#2f7de1}
.lt-hell{width:280px}
.lt-opt{display:grid;grid-template-columns:22px 1fr;column-gap:10px;align-items:center;width:100%;max-width:420px;text-align:left;padding:10px 12px;margin-bottom:6px;border:1px solid rgba(127,127,127,.3);border-radius:8px;background:none;color:inherit;cursor:pointer;font:14px "Segoe UI",sans-serif}
.lt-opt i{grid-row:span 2;width:16px;height:16px;border-radius:50%;border:2px solid #8a9099}.lt-opt.on{border-color:#2f7de1}.lt-opt.on i{border:5px solid #2f7de1}.lt-opt span{font-size:12px;opacity:.7}
.lt-pwset{display:flex;gap:8px;flex-wrap:wrap}.lt-pwset input{padding:8px 10px;border-radius:7px;border:1px solid rgba(127,127,127,.4);background:transparent;color:inherit;font-size:14px}
.lt-err2{color:#d6343b;font-size:13px;min-height:18px;margin-top:6px}
.lt-card{display:flex;flex-direction:column;gap:6px;align-items:flex-start;padding:14px 16px;margin-bottom:12px;border:1px solid rgba(127,127,127,.3);border-radius:10px}.lt-card span{font-size:13px;opacity:.75}
.lt-confirm{display:flex;flex-direction:column;gap:8px;font-size:14px;font-weight:600}.lt-confirm div{display:flex;gap:8px}
.lt-chk{display:flex;align-items:center;gap:8px;font-size:13px;margin:4px 0 2px;cursor:pointer}
.lt-login{max-width:380px;display:flex;flex-direction:column;gap:6px}.lt-login h3{margin:0}.lt-login label{font-size:12px;opacity:.7;margin-top:6px}.lt-field{padding:9px 12px;border-radius:7px;border:1px solid rgba(127,127,127,.35);font-size:14px}.lt-field small{opacity:.6}.lt-login .lt-buy{margin-top:10px;align-self:flex-start}
.lt-time{margin-left:auto;font-size:13px;text-align:right;line-height:1.2;padding-right:4px}
.lt-win{position:absolute;left:30px;top:20px;right:30px;bottom:60px;background:#f4f5f7;color:#1c1f24;border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.55);display:flex;flex-direction:column;overflow:hidden}
.lt-wt{height:36px;flex:none;display:flex;align-items:center;gap:8px;padding:0 4px 0 14px;background:#e3e6ea;font-weight:600;font-size:13px}
.lt-x{margin-left:auto;width:40px;height:30px;border:0;border-radius:6px;background:transparent;cursor:pointer;color:inherit;display:grid;place-items:center}.lt-x:hover{background:#e0464f;color:#fff}
.lt-wc{flex:1;overflow:auto;position:relative}
.lt-schwarz .lt-win{background:#17191d;color:#e6e8eb}.lt-schwarz .lt-wt{background:#0f1012}.lt-schwarz .lt-row{border-color:rgba(255,255,255,.08)}.lt-schwarz .lt-addr{background:#101114;border-color:#222}.lt-schwarz .lt-url{background:#1f2125;color:#ddd}.lt-schwarz .lt-mi.sel{background:#2a1416}.lt-schwarz .lt-mlist{border-color:#222}
.lt-addr{display:flex;gap:6px;align-items:center;padding:6px 10px;background:#fff;border-bottom:1px solid #dde}
.lt-nav{width:32px;height:32px;border:0;border-radius:50%;background:transparent;cursor:pointer;color:inherit;display:grid;place-items:center;opacity:.8}.lt-nav:hover{background:rgba(127,127,127,.18);opacity:1}
.lt-url{flex:1;display:flex;align-items:center;padding:6px 14px;border-radius:999px;background:#eef0f3;font-size:13px;color:#333}.lt-lockic{color:#2fa36b;margin-right:6px;display:inline-flex}
.lt-fav{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:22px}
.lt-tile{border:0;border-radius:12px;padding:16px;text-align:left;color:#fff;cursor:pointer;min-height:92px;background:var(--c);font-family:inherit;display:flex;flex-direction:column;gap:6px;box-shadow:0 3px 10px rgba(0,0,0,.18)}
.lt-tile b{font-size:16px}.lt-tile span{font-size:12px;opacity:.9}.lt-tile:hover{filter:brightness(1.08)}
.lt-page{padding:18px 24px}.lt-page h2{margin:0 0 4px;font-size:24px}.lt-sub{margin:0 0 14px;font-size:13px;opacity:.7}
.lt-hero{background:var(--c);color:#fff;padding:18px 24px}.lt-hero h2{margin:0;font-size:26px}.lt-hero span{font-size:13px;opacity:.9}
.lt-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,.08);font-size:14px}.lt-row b{flex:1}.lt-row small{opacity:.65}
.lt-price{font-weight:700;min-width:110px;text-align:right}
.lt-buy{padding:7px 14px;border-radius:7px;border:0;background:var(--c,#2f6fd6);color:#fff;cursor:pointer;font-family:inherit;font-weight:600}.lt-buy:disabled{opacity:.4;cursor:default}.lt-buy.sell{background:#7a7f87}
.lt-big{font-size:34px;font-weight:700;margin:6px 0 2px}
.lt-up{color:#1f9d55}.lt-dn{color:#d6343b}
.lt-ware{width:40px;height:40px;flex:none;background:rgba(0,0,0,.08);border-radius:6px}
.lt-call{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;text-align:center;padding:20px}
.lt-call i{width:90px;height:90px;border-radius:50%;display:grid;place-items:center;color:#fff}.lt-hang{background:#d6343b}
.lt-mail{display:grid;grid-template-columns:300px 1fr;height:100%}.lt-mlist{border-right:1px solid #dde;overflow:auto}
.lt-mi{padding:10px 14px;border-bottom:1px solid rgba(0,0,0,.06);cursor:pointer;font-size:13px}.lt-mi b{display:block;font-size:13px}.lt-mi span{opacity:.75}.lt-mi.sel{background:#e3edfb}
.lt-mread{padding:18px 22px;overflow:auto;white-space:pre-wrap;font-size:14px;line-height:1.5}.lt-mread h3{margin:0 0 4px;white-space:normal}
.lt-map{position:absolute;left:0;top:0;width:100%;height:100%;display:block;cursor:grab;background:#1c3550}
.lt-mapui{position:absolute;left:12px;top:12px;display:flex;flex-direction:column;gap:6px;width:250px}
.lt-mapui input{padding:8px 12px;border-radius:8px;border:0;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:14px}
.lt-mapres{background:#fff;color:#222;border-radius:8px;max-height:220px;overflow:auto;box-shadow:0 2px 8px rgba(0,0,0,.3)}.lt-mapres button{display:block;width:100%;text-align:left;border:0;background:none;padding:7px 12px;cursor:pointer;font:13px "Segoe UI",sans-serif}.lt-mapres button:hover{background:#eef3fb}
.lt-zoom{position:absolute;right:12px;bottom:12px;display:flex;flex-direction:column;gap:4px}.lt-zoom button{width:34px;height:34px;border-radius:8px;border:0;font-size:18px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3)}
`;
function ltEnsure() {
  if (LT.el) return LT.el; const st = document.createElement("style"); st.textContent = LT_CSS; document.head.appendChild(st);
  const el = document.createElement("div"); el.id = "laptop"; el.hidden = true; document.body.appendChild(el); LT.el = el;
  el.addEventListener("click", ltClick); el.addEventListener("contextmenu", e => e.preventDefault());
  el.addEventListener("change", e => { if (!e.target.classList.contains("lt-file")) return; const id = LT.cur;
    ltPixel(e.target.files[0], 96, 60).then(u => { ltSet(id, "bild", u); ltSet(id, "wp", 3); ltRender(); ltScreenDraw(id); toast("Hintergrundbild gesetzt"); }).catch(er => toast("Bild: " + er.message)); });
  el.addEventListener("input", e => { if (e.target.classList.contains("lt-search")) { LT.mapQ = e.target.value; ltMapResults(); }
    if (e.target.classList.contains("lt-mitEinst")) LT.mitEinst = e.target.checked;
    if (e.target.classList.contains("lt-hell")) { ltSet(LT.cur, "hell", +e.target.value); const sc = LT.el.querySelector(".lt-scr"); if (sc) sc.style.filter = "brightness(" + e.target.value + ")"; } });
  addEventListener("keydown", e => { if (!laptopIsOpen()) return;                                   // solange offen: Tasten nicht ans Spiel (Tippen geht trotzdem ins Feld)
    if (LT.cur && LT.sleep[LT.cur] && e.key !== "Escape") { ltPower("wach"); e.preventDefault(); }   // Taste weckt
    else if (e.key === "Escape") { e.preventDefault(); if (LT.pmenu) { LT.pmenu = false; ltRender(); } else if (LT.app) { LT.app = null; LT.call = null; ltRender(); } else laptopClose(); }
    else if (e.key === "Enter" && e.target.classList?.contains("lt-pw")) ltLogin(e.target.value);
    e.stopImmediatePropagation(); }, true);
  addEventListener("keyup", e => { if (laptopIsOpen()) e.stopImmediatePropagation(); }, true);
  addEventListener("resize", () => { if (laptopIsOpen()) ltFit(); });
  return el;
}
function ltFit() { const d = LT.el.querySelector(".lt-dev"); if (!d) return; d.style.transform = ""; const k = Math.min(1, (innerWidth - 30) / (d.offsetWidth + 10), (innerHeight - 30) / (d.offsetHeight + 10)); d.style.transform = k < 1 ? "scale(" + k.toFixed(3) + ")" : ""; }
const laptopIsOpen = () => !!(LT.el && !LT.el.hidden);
function laptopOpen(id) { const D = LAPTOP_DEF[id]; if (!D) return; ltEnsure();
  if (typeof dragging !== "undefined" && dragging) { dragging = false; document.body.classList.remove("looking"); } if (document.pointerLockElement) document.exitPointerLock(); if (typeof keys !== "undefined" && keys.clear) keys.clear();
  LT.cur = id; LT.app = null; LT.call = null; LT.err = ""; LT.pmenu = false; LT.web = "start"; LT.hist = []; LT.el.hidden = false; ltStockCatchUp(); ltRender();
  clearInterval(LT.tick); LT.tick = setInterval(() => { ltStockStep(1); if (LT.app === "web" && LT.web === "boerse") ltRender(); else { const t = LT.el.querySelector(".lt-time b"); if (t) t.textContent = ltTime(); } }, 4000); }
function laptopClose() { if (!laptopIsOpen()) return; LT.el.hidden = true; clearInterval(LT.tick); const id = LT.cur; LT.app = null; LT.call = null; LT.cur = null; ltScreenDraw(id); if (typeof grabMouse === "function") grabMouse(); }
// Ein/Aus (Nicolas 2026-11-17: der Ein/Aus-Knopf soll nicht direkt ausschalten): Menue Sperren / Neu starten / Herunterfahren
function ltBoot(id, text, then) { LT.boot = text; LT.pmenu = false; LT.app = null; LT.call = null; ltRender(); ltScreenDraw(id); setTimeout(() => { if (LT.boot !== text) return; LT.boot = null; then(); if (LT.cur === id) ltRender(); ltScreenDraw(id); }, 1800); }
function ltPower(what) { const id = LT.cur, D = ltD(id);
  if (what === "lock") { LT.pmenu = false; LT.locked[id] = true; LT.app = null; LT.call = null; ltRender(); ltScreenDraw(id); }
  else if (what === "schlaf") { LT.pmenu = false; LT.app = null; LT.call = null; LT.sleep[id] = true; ltRender(); ltScreenDraw(id); }
  else if (what === "wach") { LT.sleep[id] = false; LT.locked[id] = D.lock !== "offen"; ltRender(); ltScreenDraw(id); }
  else if (what === "neu") ltBoot(id, "Wird neu gestartet …", () => { LT.locked[id] = D.lock !== "offen"; });
  else if (what === "aus") ltBoot(id, "Wird heruntergefahren …", () => { LT.off[id] = true; LT.locked[id] = D.lock !== "offen"; });
  else if (what === "an") { LT.off[id] = false; ltBoot(id, "", () => { LT.locked[id] = D.lock !== "offen"; }); } }
function ltLogin(pw) { const id = LT.cur, D = ltD(id);
  if (D.lock === "passwort" && pw !== D.pw) { LT.err = pw ? "Falsches Passwort" : "Passwort eingeben"; ltRender(); const r = LT.el.querySelector(".lt-pwrow"); if (r) { r.classList.add("lt-shake"); } const f = LT.el.querySelector(".lt-pw"); if (f) f.focus(); return; }
  LT.locked[id] = false; LT.err = ""; ltRender(); ltScreenDraw(id); }
function ltClick(e) {
  const b = e.target.closest("[data-a]"); if (!b) { if (LT.pmenu) { LT.pmenu = false; ltRender(); } return; } const a = b.dataset.a, v = b.dataset.v; e.stopPropagation(); b.blur?.();
  if (a === "power") { LT.pmenu = !LT.pmenu; return ltRender(); }
  if (a.startsWith("usb") && typeof usbClick === "function" && usbClick(a, v)) { ltRender(); ltScreenDraw(LT.cur); return; }   // USB-Sticks (ui/usb.js)
  if (a === "pw") return ltPower(v);
  if (LT.pmenu) LT.pmenu = false;
  if (a === "login") return ltLogin((LT.el.querySelector(".lt-pw") || {}).value || "");
  if (a === "lock") { LT.locked[LT.cur] = true; LT.app = null; LT.call = null; ltRender(); ltScreenDraw(LT.cur); return; }
  if (a === "aus") return laptopClose();
  if (a === "app") { LT.app = v; LT.call = null; if (v === "web") { LT.web = "start"; LT.hist = []; } ltRender(); ltScreenDraw(LT.cur); return; }
  if (a === "zu") { LT.app = null; LT.call = null; ltRender(); ltScreenDraw(LT.cur); return; }
  if (a === "go") { if (LT.web !== v) LT.hist.push(LT.web); LT.web = v; const V = ltD(LT.cur).verlauf; V.unshift({ s: v, t: Date.now() }); V.length = Math.min(V.length, 40); ltSet(LT.cur, "verlauf", V); return ltRender(); }
  if (a === "est") { LT.est = v; LT.confirm = null; LT.err2 = ""; return ltRender(); }
  if (a === "bildweg") { const D = ltD(LT.cur); ltSet(LT.cur, "bild", null); if (D.wp === 3) ltSet(LT.cur, "wp", 0); ltRender(); ltScreenDraw(LT.cur); return; }
  if (a === "cfg") { const [k, x] = v.split(":"); if (k === "lock" && x === "passwort" && !ltD(LT.cur).pw) { LT.err2 = "Zuerst unten ein Passwort festlegen"; return ltRender(); } ltSet(LT.cur, k, k === "wp" ? +x : x); LT.err2 = ""; ltRender(); ltScreenDraw(LT.cur); return; }
  if (a === "setpw") { const p = (LT.el.querySelector(".lt-newpw") || {}).value || "", hn = (LT.el.querySelector(".lt-newhint") || {}).value || ""; if (p.length < 3) { LT.err2 = "Passwort mit mindestens 3 Zeichen"; return ltRender(); } ltSet(LT.cur, "pw", p); ltSet(LT.cur, "hint", hn); ltSet(LT.cur, "lock", "passwort"); LT.err2 = ""; toast("Passwort festgelegt"); return ltRender(); }
  if (a === "frage") { LT.confirm = v; return ltRender(); }
  if (a === "nein") { LT.confirm = null; return ltRender(); }
  if (a === "loeschen") { if (v === "cookies") return ltResetAll(!!LT.mitEinst); else { ltSet(LT.cur, "verlauf", []); toast("Verlauf gelöscht"); } LT.confirm = null; return ltRender(); }
  if (a === "back") { LT.web = LT.hist.pop() || "start"; return ltRender(); }
  if (a === "home") { LT.hist = []; LT.web = "start"; return ltRender(); }
  if (a === "car") return ltBuyCar(v);
  if (a === "ware") return ltBuyWare(v);
  if (a === "aktie") return ltTrade(v);
  if (a === "immo") return ltBuyImmo(v);
  if (a === "call") { const K = LT_KONTAKTE.find(k => k[0] === v); LT.call = { k: K, t: 0 }; ltRender(); setTimeout(() => { if (LT.call && LT.call.k === K) { LT.call.t = 1; ltRender(); } }, 1600); return; }
  if (a === "hang") { LT.call = null; return ltRender(); }
  if (a === "mail") { LT.mail = +v; return ltRender(); }
  if (a === "mapz") { const M = LT.map; if (M) { M.s *= v === "+" ? 1.4 : 1 / 1.4; ltMapDraw(); } return; }
  if (a === "mapgo") { const o = ltOrteAlle()[+v]; if (o && LT.map) { LT.map.cx = o.x; LT.map.cz = o.z; LT.map.s = Math.max(LT.map.s, 0.9); LT.map.hl = o; ltMapDraw(); } return; }
}
// Kaeufe
function ltBuyCar(v) { const [site, i] = v.split(":"), it = ltCarList(site)[+i]; if (!it) return;
  if (typeof handyBuy === "function" && it.key) { handyBuy(LT_SHOPMAP[site], it.key); ltMailAdd(ltSiteName(site), "Bestellung: " + it.name, "Vielen Dank für Ihren Kauf: " + it.name + " für " + ltFmt(it.preis) + ".\nLieferung wie gewählt."); return ltRender(); }
  toast("Fahrzeuge werden nur im Spiel geliefert (Werkstatt: nur ansehen)"); }
function ltBuyWare(v) { const [site, i] = v.split(":"), [id, pr, n] = ltWaren(site)[+i] || []; if (!id || typeof INV_ITEMS === "undefined" || !INV_ITEMS[id]) return toast("Diese Ware gibt es hier nicht");
  if (!kontoKann(pr)) return toast("Nicht genug Guthaben"); const put = invAdd(id, n); if (!put) return toast("Kein Platz im Inventar");
  const p = Math.round(pr * put / n); kontoAus(p, ltSiteName(site) + ": " + INV_ITEMS[id].name + (put > 1 ? " (" + put + ")" : "")); ltMailAdd(ltSiteName(site), "Bestellung: " + INV_ITEMS[id].name, "Vielen Dank für Ihren Kauf: " + put + " × " + INV_ITEMS[id].name + " für " + ltFmt(p) + ".\nDie Ware liegt in Ihrem Inventar.");
  toast(INV_ITEMS[id].name + (put > 1 ? " × " + put : "") + " gekauft – im Inventar"); ltRender(); }
function ltTrade(v) { const [s, n] = v.split(":"), k = +n, p = LTB.p[s]; LTB.d[s] = LTB.d[s] || 0;
  if (k > 0) { const sum = Math.round(p * k); if (!kontoKann(sum)) return toast("Nicht genug Guthaben"); kontoAus(sum, "GSE: " + k + " × " + s); LTB.d[s] += k; }
  else { const q = Math.min(-k, LTB.d[s]); if (!q) return toast("Keine " + s + "-Aktien im Depot"); kontoEin(Math.round(p * q), "GSE: Verkauf " + q + " × " + s); LTB.d[s] -= q; }
  ltSave("wm-boerse", LTB); ltRender(); }
function ltBuyImmo(id) { const o = LT_IMMO.find(q => q.id === id); if (!o || LTI.own[id]) return; if (!kontoKann(o.preis)) return toast("Nicht genug Guthaben: " + ltFmt(o.preis) + " nötig");
  kontoAus(o.preis, "Gotham Estates: " + o.name); LTI.own[id] = { preis: o.preis, t: Date.now() }; ltSave("wm-immo", LTI); ltMailAdd("Gotham Estates", "Kaufvertrag: " + o.name, "Herzlichen Glückwunsch, Herr Wayne!\n\nDer Kauf von " + o.name + " (" + o.ort + ") für " + ltFmt(o.preis) + " ist abgeschlossen. Das Objekt erscheint unter 'Meine Immobilien'."); toast(o.name + " gekauft"); ltRender(); }
const ltSiteName = id => (LT_SITES.find(s => s[0] === id) || [, id])[1];
function ltCarList(site) { const H = typeof HANDY_SHOPS !== "undefined" ? HANDY_SHOPS[LT_SHOPMAP[site]] : null;
  if (H && H.items && typeof handyName === "function") return H.items.map(([k, p]) => ({ key: k, name: handyName(k), preis: p }));
  return (LT_CARS[site] || []).map(([n, p]) => ({ name: n, preis: p })); }
const ltWaren = site => (typeof HANDY_SHOPS !== "undefined" && HANDY_SHOPS[LT_SHOPMAP[site]]?.waren) || LT_WAREN[site] || [];
// Karten: alle Orte (die Werkstatt filtert GOTHAM.orte, gotham-shim.js haelt die Liste in GOTHAM_ORTE_ALLE)
const ltOrteAlle = () => typeof GOTHAM_ORTE_ALLE !== "undefined" ? GOTHAM_ORTE_ALLE : typeof GOTHAM !== "undefined" ? GOTHAM.orte : [];

// Seiten des Browsers
function ltWebPage() {
  const W = LT.web, S = LT_SITES.find(s => s[0] === W), url = S ? S[2] : "gotham.web/start";
  let h = '<div class="lt-addr"><button class="lt-nav" data-a="back" title="Zurück">' + ltSvg(LT_IC.back, 18) + '</button><button class="lt-nav" data-a="home" title="Startseite">' + ltSvg(LT_IC.home, 18) + '</button><div class="lt-url"><span class="lt-lockic">' + ltSvg(LT_IC.lock, 13) + '</span>https://' + url + '</div></div>';
  if (W === "start") { const Dx = ltD(LT.cur); return h + '<div class="lt-page"><h2>Favoriten</h2><p class="lt-sub">' + "Angemeldet als Bruce Wayne" + "</p></div>" + '<div class="lt-fav" style="padding-top:0">' + LT_SITES.map(([id, n, , c, d]) => '<button class="lt-tile" style="--c:' + c + '" data-a="go" data-v="' + id + '"><b>' + n + "</b><span>" + d + "</span></button>").join("") + "</div>" + (Dx.verlauf.length ? '<div class="lt-page" style="padding-top:0"><p class="lt-sub">Zuletzt besucht: ' + [...new Set(Dx.verlauf.map(q => q.s))].slice(0, 5).map(ltSiteName).join(" · ") + "</p></div>" : ""); }
  const hero = '<div class="lt-hero" style="--c:' + S[3] + '"><h2>' + S[1] + "</h2><span>" + S[4] + " · angemeldet als Bruce Wayne · Konto " + ltFmt(KONTO.stand) + "</span></div>";
  if (LT_CARS[W]) return h + hero + '<div class="lt-page" style="--c:' + S[3] + '">' + ltCarList(W).map((it, i) => '<div class="lt-row"><b>' + ltEsc(it.name) + '</b><span class="lt-price">' + ltFmt(it.preis) + '</span><button class="lt-buy" data-a="car" data-v="' + W + ":" + i + '"' + (kontoKann(it.preis) ? "" : " disabled") + ">Kaufen</button></div>").join("") + "</div>";
  if (W === "guns" || W === "arms") return h + hero + '<div class="lt-page" style="--c:' + S[3] + '">' + ltWaren(W).map(([id, pr, n], i) => { const I = typeof INV_ITEMS !== "undefined" ? INV_ITEMS[id] : null; if (!I) return "";
    return '<div class="lt-row"><svg class="lt-ware" viewBox="0 0 26 26">' + I.svg + "</svg><b>" + I.name + (n > 1 ? " × " + n : "") + "<br><small>" + I.art + (invCount(id) ? " · " + invCount(id) + " im Inventar" : "") + '</small></b><span class="lt-price">' + ltFmt(pr) + '</span><button class="lt-buy" data-a="ware" data-v="' + W + ":" + i + '"' + (kontoKann(pr) ? "" : " disabled") + ">Kaufen</button></div>"; }).join("") + "</div>";
  if (W === "bank") return h + hero + '<div class="lt-page"><p class="lt-sub">Kontostand</p><div class="lt-big">' + ltFmt(KONTO.stand) + '</div><p class="lt-sub">Bargeld: ' + ltFmt(KONTO.bar) + ' · Ein- und Auszahlen am Bankautomaten</p><h3>Letzte Buchungen</h3>' +
    (KONTO.log.slice(0, 12).map(b => '<div class="lt-row"><b>' + ltEsc(b.grund) + "<br><small>" + new Date(b.t).toLocaleString("de-CH") + '</small></b><span class="lt-price ' + (b.n < 0 ? "lt-dn" : "lt-up") + '">' + (b.n > 0 ? "+" : "") + ltFmt(b.n) + "</span></div>").join("") || '<p class="lt-sub">Noch keine Buchungen</p>') + "</div>";
  if (W === "boerse") { let dep = 0; const rows = LT_STOCKS.map(([s, n]) => { const p = LTB.p[s], hh = LTB.h[s], p0 = hh[0], ch = (p - p0) / p0 * 100, d = LTB.d[s] || 0; dep += d * p;
      const mn = Math.min(...hh), mx = Math.max(...hh), pts = hh.map((q, i) => (i / Math.max(1, hh.length - 1) * 100).toFixed(1) + "," + (28 - (q - mn) / ((mx - mn) || 1) * 26).toFixed(1)).join(" ");
      return '<div class="lt-row"><b>' + s + "<br><small>" + n + '</small></b><svg width="110" height="30" viewBox="0 0 100 30"><polyline points="' + pts + '" fill="none" stroke="' + (ch >= 0 ? "#1f9d55" : "#d6343b") + '" stroke-width="1.6"/></svg><span class="lt-price">' + p.toFixed(2) + ' $<br><small class="' + (ch >= 0 ? "lt-up" : "lt-dn") + '">' + (ch >= 0 ? "+" : "") + ch.toFixed(1) + " %</small></span><small style=\"min-width:70px;text-align:right\">Depot " + d + '</small><button class="lt-buy" data-a="aktie" data-v="' + s + ':1">+1</button><button class="lt-buy" data-a="aktie" data-v="' + s + ':10">+10</button><button class="lt-buy sell" data-a="aktie" data-v="' + s + ':-1"' + (d ? "" : " disabled") + ">−1</button></div>"; }).join("");
    return h + hero + '<div class="lt-page" style="--c:' + S[3] + '"><p class="lt-sub">Depotwert</p><div class="lt-big">' + ltFmt(dep) + '</div><p class="lt-sub">Kurse laufen alle 4 s weiter. Kauf und Verkauf über Ihr Konto.</p>' + rows + "</div>"; }
  if (W === "immo") { const eig = LT_IMMO.filter(o => LTI.own[o.id]), ang = LT_IMMO.filter(o => !LTI.own[o.id]), sum = eig.reduce((a, o) => a + ltImmoWert(o.id), 0);
    return h + hero + '<div class="lt-page" style="--c:' + S[3] + '"><h3>Meine Immobilien</h3><p class="lt-sub">Gesamtwert ' + ltFmt(sum) + "</p>" + eig.map(o => { const w = ltImmoWert(o.id), k = LTI.own[o.id].preis, d = (w - k) / k * 100;
      return '<div class="lt-row"><b>' + o.name + "<br><small>" + o.ort + " · gekauft für " + ltFmt(k) + '</small></b><span class="lt-price">' + ltFmt(w) + '<br><small class="lt-up">+' + d.toFixed(1) + " %</small></span></div>"; }).join("") +
      '<h3 style="margin-top:18px">Angebote</h3>' + (ang.map(o => '<div class="lt-row"><b>' + o.name + "<br><small>" + o.ort + '</small></b><span class="lt-price">' + ltFmt(o.preis) + '</span><button class="lt-buy" data-a="immo" data-v="' + o.id + '"' + (kontoKann(o.preis) ? "" : " disabled") + ">Kaufen</button></div>").join("") || '<p class="lt-sub">Alles gekauft.</p>') + "</div>"; }
  return h;
}
function ltAppBody(a) {
  if (a === "usb" && typeof usbBody === "function") return usbBody();
  if (a === "web") return ltWebPage();
  if (a === "kontakte") { const C = LT.call;
    if (C) { const [, n, nr, col, txt] = C.k; return '<div class="lt-call"><i style="background:' + col + '">' + ltSvg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>', 40) + "</i><h2 style=\"margin:0\">" + n + "</h2><div>" + nr + "</div><p>" + (C.t ? "Verbunden<br><br><i style=\"display:block;width:auto;height:auto;background:none;color:inherit;font-style:italic\">«" + txt + "»</i>" : "Wählt …") + '</p><button class="lt-buy lt-hang" data-a="hang">Auflegen</button></div>'; }
    return '<div class="lt-page"><h2>Kontakte</h2><p class="lt-sub">Notdienste und Taxi</p>' + LT_KONTAKTE.map(([id, n, nr, col]) => '<div class="lt-row"><i style="width:36px;height:36px;border-radius:50%;background:' + col + ';display:grid;place-items:center;color:#fff">' + ltSvg('<circle cx="12" cy="9" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>', 18) + "</i><b>" + n + "<br><small>" + nr + '</small></b><button class="lt-buy" style="--c:#2fa36b" data-a="call" data-v="' + id + '">Anrufen</button></div>').join("") + "</div>"; }
  if (a === "mail") { const L = ltMails(), m = L[Math.min(LT.mail, L.length - 1)];
    return '<div class="lt-mail"><div class="lt-mlist">' + L.map((q, i) => '<div class="lt-mi' + (i === LT.mail ? " sel" : "") + '" data-a="mail" data-v="' + i + '"><b>' + ltEsc(q.von) + "</b><span>" + ltEsc(q.betreff) + "</span></div>").join("") + '</div><div class="lt-mread">' + (m ? "<h3>" + ltEsc(m.betreff) + '</h3><p class="lt-sub">Von ' + ltEsc(m.von) + (m.t ? " · " + new Date(m.t).toLocaleString("de-CH") : "") + "</p>" + ltEsc(m.text) : "") + "</div></div>"; }
  if (a === "einst") return ltEinst();
  if (a === "karten") return '<canvas class="lt-map"></canvas><div class="lt-mapui"><input class="lt-search" placeholder="Ort suchen …" value="' + ltEsc(LT.mapQ || "") + '"><div class="lt-mapres"></div></div><div class="lt-zoom"><button data-a="mapz" data-v="+">+</button><button data-a="mapz" data-v="-">−</button></div>';
  return "";
}
const LT_EST = [["system", "System"], ["bild", "Personalisierung"], ["konto", "Anmeldung"], ["daten", "Datenschutz"], ["apps", "Apps"]];
// Cookies loeschen = echte Spieldaten im Browser (Nicolas 2026-11-17: "die Cookies in echt loeschen, also dass das Inventar und das Konto zurueckgesetzt werden").
// Spielstand-Schluessel immer, Einstellungen nur mit Haken. Danach wird nichts mehr gespeichert (sonst schriebe die laufende Seite beim Verlassen den alten Stand zurueck) und neu geladen.
const LT_SPIELDATEN = [["wm-inv", "Inventar"], ["wm-konto", "Konto, Bargeld, Wochenlimit"], ["wm-guns", "Magazine der Waffen"], ["wm-gekauft", "gekaufte Fahrzeuge"], ["wm-stand", "Spielstand (Position, Modus)"], ["wm-boerse", "Börse und Depot"], ["wm-immo", "Immobilien"], ["wm-mail", "E-Mails"], ["wm-laptops", "Laptop-Einstellungen und Verlauf"]];
const LT_EINSTDATEN = ["wm-res", "wm-shadow", "wm-range", "wm-detail", "wm-auto", "wm-perf", "wm-vol", "wm-time", "wm-time-run", "wm-stand-auto", "wm-minikarte"];
const ltSpiel = () => typeof BV_NS !== "undefined" && BV_NS === "werkstatt" ? "der Werkstatt" : "von Gotham";   // Werkstatt hat eigenen Speicher (werkstatt/speicher.js)
function ltResetAll(mitEinst) {
  const keys = [...LT_SPIELDATEN.map(k => k[0]), ...(mitEinst ? LT_EINSTDATEN : [])];
  try { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (String(k).startsWith("wm-")) return; return orig.call(this, k, v); };   // ab jetzt nichts mehr zurueckschreiben
    for (const k of keys) localStorage.removeItem(k); } catch (e) {}
  try { walking = false; } catch (e) {}                                    // sonst fragt das Spiel beim Neuladen nach (beforeunload)
  LT.el.innerHTML = '<div class="lt-dev"><div class="lt-lid" style="padding:40px 60px;color:#fff;background:#111;border-radius:14px;text-align:center;font:16px Segoe UI,sans-serif">Spieldaten ' + ltSpiel() + ' gelöscht – startet neu …</div></div>';
  setTimeout(() => location.reload(), 900); }
function ltEinst() {
  const id = LT.cur, D = ltD(id), sec = LT.est || "system", nav = '<div class="lt-enav">' + LT_EST.map(([k, n]) => '<button class="' + (k === sec ? "on" : "") + '" data-a="est" data-v="' + k + '">' + n + "</button>").join("") + "</div>";
  let b = "";
  if (sec === "system") b = "<h2>System</h2>" + [["Gerätename", D.name], ["Modell", D.hw === "silber" ? "Wayne Book 14 (Aluminium)" : "Nightfall X17 Gaming"], ["Benutzer", D.user], ["Betriebssystem", "WayneOS 3.2"], ["Speicher", D.hw === "silber" ? "412 GB frei von 1 TB" : "1,3 TB frei von 2 TB"], ["Akku", D.hw === "silber" ? "87 %" : "54 % (Netzteil)"]].map(([k, v]) => '<div class="lt-row"><b>' + k + "</b><span>" + v + "</span></div>").join("");
  else if (sec === "bild") b = "<h2>Personalisierung</h2><p class=\"lt-sub\">Hintergrund</p><div class=\"lt-wps\">" + [0, 1, 2].map(w => '<button class="lt-wp' + w + (D.wp === w ? " on" : "") + '" data-a="cfg" data-v="wp:' + w + '" title="Hintergrund ' + (w + 1) + '"></button>').join("") + (D.bild ? '<button class="lt-wp3' + (D.wp === 3 ? " on" : "") + '" data-a="cfg" data-v="wp:3" title="Eigenes Bild" style="background:#000 url(' + D.bild + ') center/cover;image-rendering:pixelated"></button>' : "") + '</div><div class="lt-upl"><label class="lt-buy">Eigenes Bild hochladen<input type="file" accept="image/*" class="lt-file" hidden></label>' + (D.bild ? '<button class="lt-buy sell" data-a="bildweg">Eigenes Bild entfernen</button>' : "") + '<span>Wird stark verpixelt gespeichert (96 x 60 Pixel), damit es wenig Speicher braucht.</span></div><p class="lt-sub" style="margin-top:18px">Helligkeit</p><input class="lt-hell" type="range" min="0.4" max="1" step="0.05" value="' + D.hell + '">';
  else if (sec === "konto") { const L = D.lock;
    b = "<h2>Anmeldung</h2><p class=\"lt-sub\">Wie der Laptop beim Sperren und Starten geschützt ist.</p>" + [["offen", "Entsperrt", "Kein Sperrbildschirm beim Start"], ["ohne", "Ohne Passwort", "Anmelden per Klick"], ["passwort", "Mit Passwort", D.pw ? "Passwort ist festgelegt" : "Noch kein Passwort"]].map(([k, n, t]) => '<button class="lt-opt' + (L === k ? " on" : "") + '" data-a="cfg" data-v="lock:' + k + '"><i></i><b>' + n + "</b><span>" + t + "</span></button>").join("") +
      '<p class="lt-sub" style="margin-top:18px">Neues Passwort</p><div class="lt-pwset"><input class="lt-newpw" type="password" placeholder="Neues Passwort" autocomplete="off"><input class="lt-newhint" placeholder="Hinweis (optional)" value="' + ltEsc(D.hint || "") + '"><button class="lt-buy" data-a="setpw">Festlegen</button></div><div class="lt-err2">' + ltEsc(LT.err2 || "") + "</div>"; }
  else if (sec === "daten") { const da = LT_SPIELDATEN.filter(([k]) => { try { return localStorage.getItem(k) !== null; } catch (e) { return false; } });
    const ck = '<div class="lt-card"><b>Cookies und Spieldaten ' + ltSpiel() + '</b><span>Löscht die im Browser gespeicherten Daten ' + ltSpiel() + ' (das andere Spiel bleibt unverändert): ' + LT_SPIELDATEN.map(([k, n]) => n).join(", ") + '. Danach startet das Spiel neu mit Startguthaben und Startinventar. Gespeichert sind gerade ' + da.length + " von " + LT_SPIELDATEN.length + ' Bereichen.</span><label class="lt-chk"><input type="checkbox" class="lt-mitEinst"' + (LT.mitEinst ? " checked" : "") + '> Auch Einstellungen löschen (Grafik, Ladeweite, Lautstärke, Uhrzeit, Minikarte)</label>' +
      (LT.confirm === "cookies" ? '<div class="lt-confirm">Wirklich alles löschen? Das kann nicht rückgängig gemacht werden.<div><button class="lt-buy" style="--c:#d6343b" data-a="loeschen" data-v="cookies">Alles löschen</button><button class="lt-buy sell" data-a="nein">Abbrechen</button></div></div>' : '<button class="lt-buy" style="--c:#d6343b" data-a="frage" data-v="cookies">Cookies löschen</button>') + "</div>";
    const vl = '<div class="lt-card"><b>Browserverlauf</b><span>' + D.verlauf.length + (D.verlauf.length === 1 ? " Eintrag" : " Einträge") + "</span>" + (LT.confirm === "verlauf" ? '<div class="lt-confirm">Ganzen Verlauf löschen?<div><button class="lt-buy" style="--c:#d6343b" data-a="loeschen" data-v="verlauf">Löschen</button><button class="lt-buy sell" data-a="nein">Abbrechen</button></div></div>' : '<button class="lt-buy" style="--c:#d6343b" data-a="frage" data-v="verlauf">Verlauf löschen</button>') + "</div>";
    b = "<h2>Datenschutz</h2>" + ck + vl; }
  else if (sec === "apps") b = "<h2>Apps</h2>" + D.apps.map(a => '<div class="lt-row"><i style="width:34px;height:34px;border-radius:8px;background:' + LT_APPS[a][1] + ';display:grid;place-items:center;color:#fff">' + ltSvg(LT_APPS[a][2], 18) + "</i><b>" + LT_APPS[a][0] + "</b><span>installiert</span></div>").join("") + (LAPTOP_DEF.A.apps.length !== D.apps.length ? '<p class="lt-sub" style="margin-top:12px">Nicht installiert: ' + LAPTOP_DEF.A.apps.filter(a => !D.apps.includes(a)).map(a => LT_APPS[a][0]).join(", ") + "</p>" : "");
  return '<div class="lt-einst">' + nav + '<div class="lt-ebody">' + b + "</div></div>";
}
function ltRender() {
  const el = LT.el, id = LT.cur, D = ltD(id); if (!el || !D) return;
  const sky = '<svg class="lt-sky" viewBox="0 0 960 230" preserveAspectRatio="none"><path fill="' + (D.wp === 1 ? "#0a0203" : D.wp === 2 ? "#08201c" : "#0b0f1f") + '" d="M0 230V150h40v-30h30v50h40V90h25v-20h20v20h25v70h35V60h50v100h30v-40h40v-50h20V40h12v30h20v100h40v-60h50v110h30V80h45v30h25v60h40v-90h35v120h30v-50h40v30h50V100h30v130z"/></svg>';
  let s = "";
  const logo = D.hw === "silber" ? '<div class="lt-logo">W</div>' : '<div class="lt-logo" style="color:#ff2a36;text-shadow:0 0 12px #ff2a36">NIGHTFALL</div>';
  if (LT.sleep[id]) s = '<div class="lt-scr"><div class="lt-boot lt-sleep" data-a="pw" data-v="wach" title="Aufwecken"></div></div>';
  else if (LT.off[id]) s = '<div class="lt-scr"><div class="lt-boot"><button class="lt-offbtn" data-a="pw" data-v="an" title="Einschalten">' + ltSvg('<path d="M12 3v8M6.5 6.5a8 8 0 1 0 11 0"/>', 30) + '</button><span>Ausgeschaltet – zum Einschalten klicken</span></div></div>';
  else if (LT.boot !== null) s = '<div class="lt-scr"><div class="lt-boot">' + logo + '<div class="lt-spin"></div><span>' + ltEsc(LT.boot) + "</span></div></div>";
  else if (LT.locked[id]) { const pw = D.lock === "passwort";
    s = '<div class="lt-scr lt-wp' + D.wp + '" style="' + ltWpStyle(D) + 'filter:brightness(' + D.hell + ')">' + (D.wp === 3 && D.bild ? "" : sky) + '<div class="lt-lock"><div class="lt-clock">' + ltTime() + '</div><div class="lt-date">' + new Date().toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long" }) + '</div><div class="lt-ava">BW</div><div class="lt-user">' + D.user + "</div>" +
      (pw ? '<div class="lt-pwrow"><input class="lt-pw" type="password" placeholder="Passwort" autocomplete="off"><button class="lt-btn" data-a="login" title="Anmelden">' + ltSvg(LT_IC.go, 18) + '</button></div><div class="lt-err">' + ltEsc(LT.err) + '</div><div class="lt-hint">Hinweis: ' + ltEsc(D.hint || "") + "</div>" : '<button class="lt-btn" data-a="login">Anmelden</button><div class="lt-hint">Kein Passwort eingerichtet</div>') + (typeof usbLock === "function" ? usbLock() : "") + "</div></div>"; }
  else { const apps = D.apps.concat(LT.usb ? ["usb"] : []);   // USB-Laufwerk, solange ein Stick steckt (ui/usb.js, N39)
    s = '<div class="lt-scr lt-wp' + D.wp + '" style="' + ltWpStyle(D) + 'filter:brightness(' + D.hell + ')">' + (D.wp === 3 && D.bild ? "" : sky) + '<div class="lt-icons">' + apps.map(a => '<button class="lt-ic" data-a="app" data-v="' + a + '"><i style="background:' + LT_APPS[a][1] + '">' + ltSvg(LT_APPS[a][2], 28) + "</i>" + LT_APPS[a][0] + "</button>").join("") + "</div>" +
      (LT.app ? '<div class="lt-win"><div class="lt-wt">' + ltSvg(LT_APPS[LT.app][2], 16) + LT_APPS[LT.app][0] + '<button class="lt-x" data-a="zu" title="Schliessen">' + ltSvg(LT_IC.x, 16) + '</button></div><div class="lt-wc">' + ltAppBody(LT.app) + "</div></div>" : "") +
      '<div class="lt-bar"><button class="lt-tb" data-a="lock" title="Sperren">' + ltSvg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', 18) + "</button>" + apps.map(a => '<button class="lt-tb' + (LT.app === a ? " on" : "") + '" data-a="app" data-v="' + a + '" title="' + LT_APPS[a][0] + '" style="color:' + LT_APPS[a][1] + '">' + ltSvg(LT_APPS[a][2], 20) + "</button>").join("") +
      (typeof usbTaskbar === "function" ? usbTaskbar() : "") + (LT.pmenu ? '<div class="lt-pmenu">' + [["lock", LT_IC.lock, "Sperren"], ["schlaf", LT_IC.mond, "Energie sparen"], ["aus", LT_IC.power, "Herunterfahren"], ["neu", LT_IC.neu, "Neu starten"]].map(([v, ic, t]) => '<button data-a="pw" data-v="' + v + '">' + ltSvg(ic, 22) + t + "</button>").join("") + "</div>" : "") + '<div class="lt-time"><b>' + ltTime() + "</b><br>" + D.user + '</div><button class="lt-tb' + (LT.pmenu ? " on" : "") + '" data-a="power" title="Ein/Aus">' + ltSvg('<path d="M12 3v8M6.5 6.5a8 8 0 1 0 11 0"/>', 18) + "</button></div></div>"; }
  el.innerHTML = '<button class="lt-leave" data-a="aus" title="Laptop verlassen (Esc)">' + ltSvg(LT_IC.x, 16) + 'Verlassen <small>Esc</small></button><div class="lt-dev lt-' + D.hw + '"><div class="lt-lid"><div class="lt-cam"></div>' + s + '<div class="lt-brand">' + (D.hw === "silber" ? "WAYNE" : "NIGHTFALL") + '</div></div><div class="lt-base"></div></div>';
  ltFit(); const pwf = el.querySelector(".lt-pw"); if (pwf) setTimeout(() => pwf.focus(), 0);
  if (LT.app === "karten") ltMapInit();
}
// ---- Karten-App: Gotham aus den Kartendaten ----
function ltMapInit() {
  const cv = LT.el.querySelector(".lt-map"); if (!cv) return; const r = cv.getBoundingClientRect(), k = cv.offsetWidth ? 1 : 1; cv.width = cv.offsetWidth * k || 900; cv.height = cv.offsetHeight * k || 500;
  if (!LT.map) { const A = typeof GOTHAM !== "undefined" ? GOTHAM.ansicht : { x0: -4600, z0: -2100, x1: 200, z1: 2100 }; LT.map = { cx: (A.x0 + A.x1) / 2, cz: (A.z0 + A.z1) / 2, s: Math.min(cv.width / (A.x1 - A.x0), cv.height / (A.z1 - A.z0)) * 0.95 }; }
  let drag = null;
  cv.onpointerdown = e => { drag = [e.clientX, e.clientY, LT.map.cx, LT.map.cz]; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; };
  cv.onpointermove = e => { if (!drag) return; const sc = cv.width / cv.getBoundingClientRect().width; LT.map.cx = drag[2] - (e.clientX - drag[0]) * sc / LT.map.s; LT.map.cz = drag[3] - (e.clientY - drag[1]) * sc / LT.map.s; ltMapDraw(); };
  cv.onpointerup = () => { drag = null; cv.style.cursor = "grab"; };
  cv.onwheel = e => { e.preventDefault(); e.stopPropagation(); LT.map.s *= e.deltaY < 0 ? 1.18 : 1 / 1.18; ltMapDraw(); };
  ltMapDraw(); ltMapResults();
}
function ltMapDraw() {
  const cv = LT.el && LT.el.querySelector(".lt-map"); if (!cv || typeof GOTHAM === "undefined") return; const c = cv.getContext("2d"), M = LT.map, W = cv.width, H = cv.height;
  M.s = Math.max(0.05, Math.min(4, M.s)); const X = x => (x - M.cx) * M.s + W / 2, Z = z => (z - M.cz) * M.s + H / 2;
  const poly = (pts, close = true) => { c.beginPath(); if (!Array.isArray(pts)) return; pts.forEach(([x, z], i) => i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z))); if (close) c.closePath(); };
  c.fillStyle = "#1c3550"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#e8e4da"; poly(GOTHAM.insel.umriss); c.fill();
  for (const I of GOTHAM.inseln || []) if (I.umriss) { poly(I.umriss); c.fill(); }
  c.save(); poly(GOTHAM.insel.umriss); c.clip();                          // Bezirke nur auf der Insel
  for (const b of GOTHAM.bezirke) { const w = b.wohlstand ?? 0.5; c.fillStyle = "hsla(" + (20 + w * 180) + ",35%," + (78 - w * 8) + "%,.55)"; poly(b.poly); c.fill(); }
  c.restore();
  c.lineCap = "round"; c.lineJoin = "round";
  for (const r of GOTHAM.hauptstrassen) { if (!Array.isArray(r.linie)) continue; c.strokeStyle = "#fff"; c.lineWidth = Math.max(1.5, (r.w || 10) * M.s); poly(r.linie, !!r.geschlossen); c.stroke(); }
  for (const r of GOTHAM.bruecken || []) if (r.linie) { c.strokeStyle = "#c9c3b4"; c.lineWidth = Math.max(1.5, (r.w || 12) * M.s); poly(r.linie, false); c.stroke(); }
  c.font = "600 12px Segoe UI, sans-serif"; c.textAlign = "center";
  for (const b of GOTHAM.bezirke) { const n = b.poly.length, cx = b.poly.reduce((a, p) => a + p[0], 0) / n, cz = b.poly.reduce((a, p) => a + p[1], 0) / n; c.fillStyle = "rgba(40,40,50,.6)"; c.fillText(b.name.split(" (")[0], X(cx), Z(cz)); }
  const orte = ltOrteAlle(); for (const o of orte) { const big = o.typ === "wahrzeichen" || o.h > 150; if (M.s < 0.35 && !big) continue; c.fillStyle = o === M.hl ? "#ff3b30" : "#5a6a80"; c.beginPath(); c.arc(X(o.x), Z(o.z), o === M.hl ? 7 : big ? 4 : 2.5, 0, Math.PI * 2); c.fill();
    if (M.s > 0.6 || big || o === M.hl) { c.fillStyle = "#222"; c.fillText(o.name.split(" (")[0], X(o.x), Z(o.z) - 8); } }
  for (const im of LT_IMMO) if (LTI.own[im.id] && im.map) { const x = X(im.map[0]), z = Z(im.map[1]); c.fillStyle = "#8a5bd6"; c.beginPath(); c.moveTo(x, z - 16); c.lineTo(x + 8, z - 4); c.lineTo(x - 8, z - 4); c.closePath(); c.fill(); c.fillRect(x - 6, z - 5, 12, 9); c.fillStyle = "#4b2a8a"; c.font = "700 11px Segoe UI"; c.fillText(im.name, x, z + 18); c.font = "600 12px Segoe UI, sans-serif"; }
  const mm = [10, 20, 50, 100, 200, 500, 1000, 2000].find(q => q * M.s >= 60) || 2000, bw = mm * M.s; c.fillStyle = "rgba(255,255,255,.85)"; c.fillRect(10, H - 30, bw + 64, 22); c.fillStyle = "#333"; c.fillRect(18, H - 21, bw, 3); c.textAlign = "left"; c.fillText(mm + " m", bw + 24, H - 14);   // Massstab
}
function ltMapResults() { const box = LT.el && LT.el.querySelector(".lt-mapres"); if (!box) return; const q = (LT.mapQ || "").trim().toLowerCase(), orte = ltOrteAlle();
  box.innerHTML = q.length < 2 ? "" : orte.map((o, i) => [o, i]).filter(([o]) => o.name.toLowerCase().includes(q)).slice(0, 12).map(([o, i]) => '<button data-a="mapgo" data-v="' + i + '">' + ltEsc(o.name) + "</button>").join(""); }
