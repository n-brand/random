// Batverse – S1 Inventar mit Hotbar (PLAN-GOTHAM Phase 9, Nicolas 2026-11-16 "Ja, S1").
// Hotbar unten (9 Plaetze, Tasten 1-9 oder Klick/Tippen), Inventar mit Taste E/I (27 weitere Plaetze). Verschieben wie in Minecraft (Nicolas 2026-11-16): Gegenstand haengt an der Maus
// (INV.cursor), ziehen und loslassen oder klicken-klicken, Rechtsklick halber Stapel bzw. einzeln ablegen, Shift+Klick Hotbar <-> Inventar; beim Schliessen kommt er auf freie Plaetze.
// Gegenstaende in INV_ITEMS (Name, Art, Stapelgroesse, Symbol als SVG). Stand im Browser (localStorage wm-inv). Schnittstelle fuer andere Teile:
// invAdd(id, n) -> wie viele passten, invHas(id, n), invTake(id, n), invHeld() -> id im gewaehlten Hotbar-Platz.
"use strict";
const INV_ITEMS = {
  gullihaken: { name: "Gullihaken", art: "Werkzeug", stack: 1, svg: '<rect x="4.5" y="1.6" width="17" height="4.2" rx="2.1" fill="#e3262d" stroke="#8f1015" stroke-width="0.5"/><rect x="6" y="2.2" width="14" height="1.1" rx=".55" fill="#ff7a7f"/><path d="M11.9 5.6 H14.1 V22.4 Q14.1 24.6 11.9 24.6 H8.3 Q7.1 24.6 7.1 23.5 Q7.1 22.7 8.1 22.7 H11.2 Q11.9 22.7 11.9 22 Z" fill="#d81f26" stroke="#8f1015" stroke-width="0.5" stroke-linejoin="round"/><path d="M12.5 8 V20" stroke="#ff7a7f" stroke-width="0.5" stroke-dasharray="1 1.4"/>' },
  batarang: { name: "Batarang", art: "Waffe", stack: 16, svg: '<path d="M13 6 L14.2 3 L15 6.4 L17 6.6 L21 5 L25 7.6 L23.6 11 L23 14.8 L21.2 13 L19.6 16 L18 13.6 L16.2 16.4 L14.6 13.4 L13 17 L11.4 13.4 L9.8 16.4 L8 13.6 L6.4 16 L4.8 13 L3 14.8 L2.4 11 L1 7.6 L5 5 L9 6.6 L11 6.4 L11.8 3 Z" fill="#1d2025" stroke="#9aa0a6" stroke-width="0.9" stroke-linejoin="round"/>' },   // neu 2026-11-16
  greifhaken: { name: "Greifhaken", art: "Waffe", stack: 1, svg: '<rect x="4" y="11" width="13" height="6" rx="2" fill="#3a3d42"/><rect x="6" y="16" width="4" height="6" rx="1" fill="#2b2e33"/><path d="M17 14h4l2-3m-2 3l2 3" stroke="#c9ccd1" stroke-width="2" fill="none"/>' },
  rauchbombe: { name: "Rauchbombe", art: "Waffe", stack: 8, svg: '<circle cx="13" cy="15" r="7" fill="#4a4e55"/><rect x="11" y="5" width="4" height="4" fill="#9aa0a6"/><path d="M15 5c3-3 6 0 8-2" stroke="#ccc" stroke-width="1.5" fill="none"/>' },
  munition: { name: "9-mm-Munition", art: "Munition", stack: 64, svg: '<g fill="#c99a3a" stroke="#7a5a1a"><rect x="5" y="9" width="4" height="12" rx="1"/><rect x="11" y="7" width="4" height="14" rx="1"/><rect x="17" y="9" width="4" height="12" rx="1"/></g><g fill="#a0a4aa"><rect x="5" y="6" width="4" height="4" rx="2"/><rect x="11" y="4" width="4" height="4" rx="2"/><rect x="17" y="6" width="4" height="4" rx="2"/></g>' },
  goldbarren: { name: "Goldbarren", art: "Wert", stack: 16, svg: '<path d="M3 19 L7 9 H19 L23 19 Z" fill="#e0b03a" stroke="#8a6a1a"/><path d="M7 9 L9 12 H17 L19 9" fill="none" stroke="#f6d77a"/>' },
  batsuit: { name: "Batsuit", art: "Kleidung", stack: 1, svg: '<path d="M9 4 L10 7 H16 L17 4 L18 8 L21 10 L20 22 H6 L5 10 L8 8 Z" fill="#1a1b1e" stroke="#555"/><path d="M10 13 L13 11 L16 13 L13 14 Z" fill="#e8c547"/>' },
  mantel: { name: "Mantel", art: "Kleidung", stack: 1, svg: '<path d="M8 4 H18 L22 9 L20 23 H6 L4 9 Z" fill="#5a4636" stroke="#2e231a"/><path d="M13 4 V23" stroke="#2e231a"/>' },
};
// Beschreibungen fuer den Tooltip (Nicolas 2026-11-16: Name beim Darueberfahren, lange Texte kuerzen, Shift halten zeigt alles)
const INV_DESC = {
  gullihaken: "Öffnet Gullideckel auf den Strassen von Gotham. Rechtsklick auf einen Deckel, dann geht es über die Leiter hinunter in die Kanalisation.",
  batarang: "Wurfwaffe in Fledermausform. Linksklick wirft ihn im Bogen hinaus, er kehrt in die Hand zurück. Rechte Maustaste halten zum Zielen: dann fliegt er gerade bis zum Ziel. Trifft er etwas, fällt er zu Boden; darüber laufen hebt ihn wieder auf.",
  greifhaken: "Seilwerfer. Mit Linksklick auf eine Wand oder Kante bis 70 m zielen, das Seil zieht dich hin und auf die Kante hinauf. Ideal für Dächer.",
  rauchbombe: "Im Bogen werfen (Linksklick). Beim Aufprall entsteht eine dichte Rauchwolke, die etwa 12 Sekunden hält.",
  munition: "9-mm-Patronen. Noch ohne passende Waffe.",
  goldbarren: "Feingold aus dem Tresor der Geheimbasis. Wertanlage.",
  batsuit: "Der gepanzerte Anzug aus der Geheimbasis im Container. Leicht, kugelsicher, mit Umhang.",
  mantel: "Ein langer Wollmantel für unauffällige Auftritte in der Stadt.",
};
// Gullihaken (Nicolas 2026-11-16, Foto): roter T-Griff, langer Schaft, kleiner Haken unten; ganz im 26er-Feld (vorher unten abgeschnitten)
// Batarang-Symbol aus der Batsignal-Form (BAT_SIGNAL_PTS)
// erst beim Zeichnen (Werkstatt laedt gotham-polizei.js nach inventar.js, Nicolas 2026-11-16: Redesign fehlte dort)
function invBatIcon() { if (INV_ITEMS.batarang.sig || typeof BAT_SIGNAL_PTS === "undefined") return; INV_ITEMS.batarang.sig = true; const P = BAT_SIGNAL_PTS, q = ([x, y]) => (13 + x * 12).toFixed(1) + " " + (13 + y * 12).toFixed(1), d = "M" + P.map(q).join(" L") + " L" + P.slice(1, -1).reverse().map(([x, y]) => q([-x, y])).join(" L") + " Z";
  INV_ITEMS.batarang.svg = '<path d="' + d + '" fill="#1d2025" stroke="#9aa0a6" stroke-width="0.9" stroke-linejoin="round"/>'; }
invBatIcon(); addEventListener("load", () => { if (!INV_ITEMS.batarang.sig) invRender(); });   // Werkstatt: nach allen Skripten neu zeichnen
const INV_TEST_ALLE = true;   // TEST: alle Gegenstaende besitzen (siehe Aufbau unten)
const INV = { slots: new Array(36).fill(null), sel: 0, pick: -1, cursor: null, drag: null };   // 0-8 Hotbar, 9-35 Inventar; Platz = { id, n }
function invSave() { try { localStorage.setItem("wm-inv", JSON.stringify({ s: INV.slots, sel: INV.sel, c: INV.cursor })); } catch (e) {} }
function invLoad() { try { const d = JSON.parse(localStorage.getItem("wm-inv") || "null"); if (d && Array.isArray(d.s) && d.s.length === 36) { INV.slots = d.s.map(q => q && INV_ITEMS[q.id] ? q : null); INV.sel = Math.min(INV_SEL_N - 1, d.sel | 0); INV.cursor = d.c && INV_ITEMS[d.c.id] && d.c.n > 0 ? d.c : null; return true; } } catch (e) {} return false; }
// Gegenstand hinzufuegen: zuerst auf vorhandene Stapel, dann in freie Plaetze (Hotbar zuerst). Rueckgabe: Anzahl, die Platz hatte
function invAdd(id, n = 1) { const it = INV_ITEMS[id]; if (!it) return 0; let left = n;
  for (const s of INV.slots) if (left && s && s.id === id && s.n < it.stack) { const k = Math.min(left, it.stack - s.n); s.n += k; left -= k; }
  for (let i = 0; i < 36 && left; i++) if (!INV.slots[i]) { const k = Math.min(left, it.stack); INV.slots[i] = { id, n: k }; left -= k; }
  invSave(); invRender(); return n - left; }
function invCount(id) { let c = 0; for (const s of INV.slots) if (s && s.id === id) c += s.n; return c; }
const invHas = (id, n = 1) => invCount(id) >= n;
function invTake(id, n = 1) { if (!invHas(id, n)) return false; let left = n; for (let i = 35; i >= 0 && left; i--) { const s = INV.slots[i]; if (s && s.id === id) { const k = Math.min(left, s.n); s.n -= k; left -= k; if (!s.n) INV.slots[i] = null; } } invSave(); invRender(); return true; }
// Auswahl 0-8 = Hotbar, 9 = Bargeld, 10 = Karte (Felder neben der Hotbar, konto.js; Mausrad geht ueber alle 11, Nicolas 2026-11-16)
const INV_SEL_BAR = 9, INV_SEL_KARTE = 10, INV_SEL_N = 11;
const invHeld = () => INV.sel < 9 && INV.slots[INV.sel] ? INV.slots[INV.sel].id : null;
function invSelect(i) { INV.sel = i; invSave(); invRender(); const s = i < 9 ? INV.slots[i] : null, K = typeof KONTO !== "undefined" ? KONTO : null;
  toast(i === INV_SEL_BAR ? "Bargeld" + (K ? ": " + kontoFmt(K.bar) : "") : i === INV_SEL_KARTE ? "Karte" + (K ? ": " + kontoFmt(K.stand) : "") : s ? INV_ITEMS[s.id].name + (s.n > 1 ? " (" + s.n + ")" : "") : "Leere Hand"); }
// Gehaltener Gegenstand rechts unten im Bild (wie die Hand in Minecraft; Nicolas 2026-11-16 "wenn ich etwas in der Hand habe, soll es das rechts im Bildschirm zeigen")
const INV_HAND = { el: null, key: "" };
function invHandRender() {
  const el = INV_HAND.el || (INV_HAND.el = Object.assign(document.createElement("div"), { id: "hand" })); if (!el.parentNode) document.body.appendChild(el);
  const G = typeof KONTO_GELD_SVG !== "undefined" ? KONTO_GELD_SVG : null, id = INV.sel === INV_SEL_BAR ? "geld-bar" : INV.sel === INV_SEL_KARTE ? "geld-karte" : invHeld();
  const svg = !id ? "" : id === "geld-bar" ? G && G.bar : id === "geld-karte" ? G && G.karte : INV_ITEMS[id].svg;
  el.hidden = !svg; if (!svg || INV_HAND.key === id + svg.length) return; INV_HAND.key = id + svg.length;
  el.innerHTML = '<svg viewBox="0 0 26 26" aria-hidden="true">' + svg + '</svg>'; el.classList.remove("neu"); void el.offsetWidth; el.classList.add("neu"); }
// ---- Verschieben wie in Minecraft (INV.cursor = Stapel an der Maus) ----
const invRoom = (S, id) => !S ? INV_ITEMS[id].stack : S.id === id ? INV_ITEMS[id].stack - S.n : 0;
// Linksklick mit Stapel an der Maus: ablegen, auffuellen oder tauschen
function invPlace(j) { const S = INV.slots[j], C = INV.cursor; if (!C) return;
  if (!S) { INV.slots[j] = C; INV.cursor = null; }
  else if (S.id === C.id) { const k = Math.min(C.n, invRoom(S, C.id)); S.n += k; C.n -= k; if (!C.n) INV.cursor = null; }
  else { INV.slots[j] = C; INV.cursor = S; } }
// Rechtsklick mit Stapel an der Maus: einen ablegen
function invPlaceOne(j) { const S = INV.slots[j], C = INV.cursor; if (!C || invRoom(S, C.id) < 1) return false;
  if (S) S.n++; else INV.slots[j] = { id: C.id, n: 1 }; if (!--C.n) INV.cursor = null; return true; }
// Shift+Klick: Hotbar -> Inventar bzw. umgekehrt (erst auf gleiche Stapel, dann freie Plaetze)
function invQuick(i) { const S = INV.slots[i]; if (!S) return; const [a, b] = i < 9 ? [9, 36] : [0, 9];
  for (let pass = 0; pass < 2 && S.n; pass++) for (let j = a; j < b && S.n; j++) { const T = INV.slots[j]; if (pass === 0 ? !(T && T.id === S.id) : T) continue;
    const k = Math.min(S.n, invRoom(T, S.id)); if (!k) continue; if (T) T.n += k; else INV.slots[j] = { id: S.id, n: k }; S.n -= k; }
  if (!S.n) INV.slots[i] = null; }
// Stapel an der Maus zurueck ins Inventar (beim Schliessen, beim Laden); ohne Platz bleibt der Rest an der Maus gespeichert
function invReturnCursor() { const C = INV.cursor; if (!C) return; INV.cursor = null; const put = invAdd(C.id, C.n);
  if (put < C.n) { INV.cursor = { id: C.id, n: C.n - put }; invSave(); toast("Kein Platz im Inventar für " + INV_ITEMS[C.id].name); } }
// Ziehen ueber mehrere Plaetze mit Stapel an der Maus: links gleichmaessig verteilen (Vorschau live), rechts je einen
function invSpread(D) { INV.slots = D.snap.map(q => q && { ...q }); INV.cursor = { ...D.snapC }; const C = INV.cursor, L = D.list.filter(j => invRoom(INV.slots[j], C.id) > 0), per = Math.floor(C.n / L.length);
  if (per < 1) return; for (const j of L) { const S = INV.slots[j], k = Math.min(per, invRoom(S, C.id)); if (S) S.n += k; else INV.slots[j] = { id: C.id, n: k }; C.n -= k; } if (!C.n) INV.cursor = null; }
const invSlotAt = (x, y) => { const el = document.elementFromPoint(x, y)?.closest?.("#inventar .inv-slot"); return el ? +el.dataset.i : -1; };
function invDown(e) { const b = e.target.closest(".inv-slot"); if (!b || (e.button !== 0 && e.button !== 2)) return; e.preventDefault(); const i = +b.dataset.i, S = INV.slots[i], C = INV.cursor;
  if (e.button === 0 && e.shiftKey && !C) { invQuick(i); invSave(); return invRender(); }
  if (e.button === 0) { if (!C) { if (!S) return; INV.cursor = S; INV.slots[i] = null; INV.drag = { mode: "carry", from: i }; }
    else INV.drag = { mode: "spread", list: [i], snap: INV.slots.map(q => q && { ...q }), snapC: { ...C } }; }
  else { if (!C) { if (!S) return; const k = Math.ceil(S.n / 2); INV.cursor = { id: S.id, n: k }; S.n -= k; if (!S.n) INV.slots[i] = null; INV.drag = null; }
    else { invPlaceOne(i); INV.drag = { mode: "one", list: [i] }; } }
  INV_TIP.i = -1; invTip(); invRender(); invCursorMove(e); }
function invMove(e) { invCursorMove(e); const D = INV.drag; if (!D || D.mode === "carry") return; const j = invSlotAt(e.clientX, e.clientY); if (j < 0 || D.list.includes(j)) return;
  if (D.mode === "one") { if (invPlaceOne(j)) { D.list.push(j); invRender(); } return; }
  const id = D.snapC.id; if (invRoom(D.snap[j], id) < 1 || D.list.length >= D.snapC.n) return; D.list.push(j); invSpread(D); invRender(); }
function invUp(e) { const D = INV.drag; if (!D) return; INV.drag = null; const j = invSlotAt(e.clientX, e.clientY);
  if (D.mode === "carry") { if (j >= 0 && j !== D.from) invPlace(j); }                    // ziehen und loslassen; auf demselben Platz: bleibt an der Maus (klicken-klicken)
  else if (D.mode === "spread" && D.list.length === 1) invPlace(D.list[0]);
  invSave(); invRender(); }
// Stapel an der Maus anzeigen
const INV_CUR = { el: null };
function invCursorMove(e) { const el = INV_CUR.el; if (el && e) { el.style.left = e.clientX + "px"; el.style.top = e.clientY + "px"; } }
function invCursorRender() { const el = INV_CUR.el || (INV_CUR.el = Object.assign(document.createElement("div"), { id: "inv-cursor" })); if (!el.parentNode) document.body.appendChild(el);
  const C = INV.cursor; el.hidden = !C || !invIsOpen(); if (!el.hidden) el.innerHTML = '<svg viewBox="0 0 26 26" aria-hidden="true">' + INV_ITEMS[C.id].svg + '</svg>' + (C.n > 1 ? '<span class="inv-n">' + C.n + '</span>' : ""); }
const invSlotHTML = (s, i) => '<button type="button" class="inv-slot' + (i === INV.sel && i < 9 ? " sel" : "") + (i === INV.pick ? " pick" : "") + '" data-i="' + i + '">' +
  (i < 9 ? '<span class="inv-k">' + (i + 1) + '</span>' : "") + (s ? '<svg viewBox="0 0 26 26" aria-hidden="true">' + INV_ITEMS[s.id].svg + '</svg>' + (s.n > 1 ? '<span class="inv-n">' + s.n + '</span>' : "") : "") + '</button>';
function invRender() {
  invBatIcon();
  const hb = document.getElementById("hotbar"), box = document.getElementById("inventar"); if (!hb) return;
  const sw = box.querySelector('[data-sw="batsignal"]'); if (sw) { const on = typeof GCPD !== "undefined" && !!GCPD.on; sw.setAttribute("aria-pressed", String(on)); sw.title = on ? "Batsignal ist an (leuchtet nachts) – Klick schaltet aus" : "Batsignal ist aus – Klick schaltet an"; }
  hb.innerHTML = INV.slots.slice(0, 9).map(invSlotHTML).join("");
  if (!box.hidden) { box.querySelector(".inv-grid").innerHTML = INV.slots.slice(9).map((s, k) => invSlotHTML(s, k + 9)).join(""); box.querySelector(".inv-bar").innerHTML = INV.slots.slice(0, 9).map(invSlotHTML).join("");
    const s = INV.cursor || (INV.sel < 9 ? INV.slots[INV.sel] : null); box.querySelector(".inv-info").textContent = s ? (INV.cursor ? "An der Maus: " : "") + INV_ITEMS[s.id].name + " · " + INV_ITEMS[s.id].art + (s.n > 1 ? " · " + s.n + " Stück" : "") : "";
    const h = box.querySelector(".inv-hint"); if (h) h.textContent = "Ziehen oder klicken: verschieben · Rechtsklick: halber Stapel bzw. einzeln ablegen · Shift+Klick: Hotbar ↔ Inventar · E, I oder Esc schliesst"; }
  invCursorRender(); invHandRender(); if (typeof kontoGeldRender === "function" && typeof KONTO !== "undefined") kontoGeldRender();
}
const invIsOpen = () => { const b = document.getElementById("inventar"); return b && !b.hidden; };
function invOpen() { const b = document.getElementById("inventar"); if (!b || !b.hidden) return; if (typeof dragging !== "undefined" && dragging) { dragging = false; document.body.classList.remove("looking"); if (document.pointerLockElement) document.exitPointerLock(); } keys.clear(); b.hidden = false; INV.pick = -1; invRender(); }
function invClose() { const b = document.getElementById("inventar"); if (!b || b.hidden) return; b.hidden = true; INV_TIP.i = -1; invTip(); INV.pick = -1; INV.drag = null; invReturnCursor(); invRender(); if (typeof grabMouse === "function") grabMouse(); }
// Tooltip: beim Darueberfahren Name, Art, Anzahl und Beschreibung; ueber 110 Zeichen gekuerzt mit "Shift halten für mehr"
const INV_TIP = { el: null, i: -1, shift: false, x: 0, y: 0 };
function invTip() {
  const el = INV_TIP.el || (INV_TIP.el = Object.assign(document.createElement("div"), { id: "inv-tip" })); if (!el.parentNode) document.body.appendChild(el);
  const s = INV_TIP.i >= 0 && !INV.cursor ? INV.slots[INV_TIP.i] : null; if (!s) { el.hidden = true; return; }
  const it = INV_ITEMS[s.id], d = INV_DESC[s.id] || "", long = d.length > 110, txt = long && !INV_TIP.shift ? d.slice(0, d.lastIndexOf(" ", 100)) + " …" : d;
  el.innerHTML = "<b>" + it.name + "</b><span class=\"tip-art\">" + it.art + (s.n > 1 ? " · " + s.n + " Stück" : "") + "</span>" + (d ? "<p>" + txt + "</p>" : "") + (long && !INV_TIP.shift ? "<i>Shift halten für mehr</i>" : "");
  el.hidden = false; const W = el.offsetWidth, H = el.offsetHeight; el.style.left = Math.min(innerWidth - W - 8, INV_TIP.x + 14) + "px"; el.style.top = Math.max(8, Math.min(innerHeight - H - 8, INV_TIP.y + 16)) + "px";
}
for (const id of ["inventar", "hotbar"]) { const box = document.getElementById(id); if (!box) continue;
  box.addEventListener("mousemove", e => { if (INV.drag) return; const b = e.target.closest(".inv-slot"), i = b ? +b.dataset.i : -1; INV_TIP.x = e.clientX; INV_TIP.y = e.clientY; INV_TIP.shift = e.shiftKey; INV_TIP.i = i; invTip(); });
  box.addEventListener("mouseleave", () => { INV_TIP.i = -1; invTip(); }); }
addEventListener("keydown", e => { if (e.key === "Shift" && INV_TIP.i >= 0 && !INV_TIP.shift) { INV_TIP.shift = true; invTip(); } });
addEventListener("keyup", e => { if (e.key === "Shift" && INV_TIP.shift) { INV_TIP.shift = false; invTip(); } });
// Aufbau: Startausstattung beim ersten Mal, Klicks
{ if (!invLoad()) { INV.slots[0] = { id: "gullihaken", n: 1 }; INV.slots[1] = { id: "batarang", n: 6 }; invSave(); }
  // TEST (Nicolas 2026-11-16: "jedes Item zum Testen besitzen"): fehlende Gegenstaende beim Start auffuellen (je ein voller Stapel). Spaeter auf false.
  invReturnCursor();                                                         // beim letzten Mal an der Maus geblieben
  if (INV_TEST_ALLE) { for (const id in INV_ITEMS) if (!invHas(id) && !(INV.cursor && INV.cursor.id === id)) invAdd(id, INV_ITEMS[id].stack); }
  document.getElementById("hotbar").addEventListener("click", e => { const b = e.target.closest(".inv-slot"); if (!b) return; e.currentTarget.blur?.(); invSelect(+b.dataset.i); });
  const ib = document.getElementById("inventar");
  ib.addEventListener("pointerdown", invDown); ib.addEventListener("contextmenu", e => e.preventDefault());
  addEventListener("pointermove", e => { if (invIsOpen()) invMove(e); }); addEventListener("pointerup", e => { if (invIsOpen()) invUp(e); });
  ib.addEventListener("click", e => { if (e.target.closest(".inv-slot")) return; if (e.target.closest(".inv-close")) invClose();
    if (e.target.closest('[data-sw="batsignal"]') && typeof GCPD !== "undefined") { GCPD.on = !GCPD.on; toast(GCPD.on ? "Batsignal an (leuchtet nachts über Gotham)" : "Batsignal aus"); invRender(); } });   // Schalter im Inventar (Nicolas 2026-11-16)
  document.getElementById("btn-inv")?.addEventListener("click", e => { e.currentTarget.blur(); invIsOpen() ? invClose() : invOpen(); });
  // Mausrad zu Fuss: naechster/voriger Hotbar-Platz (Nicolas 2026-11-16); im Fahrzeug, auf Karte und Menues nicht
  let wAcc = 0; addEventListener("wheel", e => { if (!walking || ghost || document.body.classList.contains("drive") || invIsOpen() || e.target.closest?.("#stadtkarte, #handy, #bank, #tp-menu, #settings")) return;
    wAcc += e.deltaY; if (Math.abs(wAcc) < 40) return; const d = Math.sign(wAcc); wAcc = 0; invSelect((INV.sel + d + INV_SEL_N) % INV_SEL_N); }, { passive: true });
  invRender(); }
