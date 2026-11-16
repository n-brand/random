// Batverse – S1 Inventar mit Hotbar (PLAN-GOTHAM Phase 9, Nicolas 2026-11-16 "Ja, S1").
// Hotbar unten (9 Plaetze, Tasten 1-9 oder Klick/Tippen), Inventar mit Taste I (27 weitere Plaetze, Klick auf einen Platz und dann auf einen zweiten tauscht/legt zusammen).
// Gegenstaende in INV_ITEMS (Name, Art, Stapelgroesse, Symbol als SVG). Stand im Browser (localStorage wm-inv). Schnittstelle fuer andere Teile:
// invAdd(id, n) -> wie viele passten, invHas(id, n), invTake(id, n), invHeld() -> id im gewaehlten Hotbar-Platz.
"use strict";
const INV_ITEMS = {
  gullihaken: { name: "Gullihaken", art: "Werkzeug", stack: 1, svg: '<path d="M14 4v18a6 6 0 0 1-12 0" fill="none" stroke="#c9ccd1" stroke-width="3" stroke-linecap="round"/><rect x="11" y="2" width="6" height="5" rx="1" fill="#e8c547"/>' },
  batarang: { name: "Batarang", art: "Waffe", stack: 16, svg: '<path d="M13 6 L14.2 3 L15 6.4 L17 6.6 L21 5 L25 7.6 L23.6 11 L23 14.8 L21.2 13 L19.6 16 L18 13.6 L16.2 16.4 L14.6 13.4 L13 17 L11.4 13.4 L9.8 16.4 L8 13.6 L6.4 16 L4.8 13 L3 14.8 L2.4 11 L1 7.6 L5 5 L9 6.6 L11 6.4 L11.8 3 Z" fill="#1d2025" stroke="#9aa0a6" stroke-width="0.9" stroke-linejoin="round"/>' },   // neu 2026-11-16
  greifhaken: { name: "Greifhaken", art: "Waffe", stack: 1, svg: '<rect x="4" y="11" width="13" height="6" rx="2" fill="#3a3d42"/><rect x="6" y="16" width="4" height="6" rx="1" fill="#2b2e33"/><path d="M17 14h4l2-3m-2 3l2 3" stroke="#c9ccd1" stroke-width="2" fill="none"/>' },
  rauchbombe: { name: "Rauchbombe", art: "Waffe", stack: 8, svg: '<circle cx="13" cy="15" r="7" fill="#4a4e55"/><rect x="11" y="5" width="4" height="4" fill="#9aa0a6"/><path d="M15 5c3-3 6 0 8-2" stroke="#ccc" stroke-width="1.5" fill="none"/>' },
  munition: { name: "9-mm-Munition", art: "Munition", stack: 64, svg: '<g fill="#c99a3a" stroke="#7a5a1a"><rect x="5" y="9" width="4" height="12" rx="1"/><rect x="11" y="7" width="4" height="14" rx="1"/><rect x="17" y="9" width="4" height="12" rx="1"/></g><g fill="#a0a4aa"><rect x="5" y="6" width="4" height="4" rx="2"/><rect x="11" y="4" width="4" height="4" rx="2"/><rect x="17" y="6" width="4" height="4" rx="2"/></g>' },
  goldbarren: { name: "Goldbarren", art: "Wert", stack: 16, svg: '<path d="M3 19 L7 9 H19 L23 19 Z" fill="#e0b03a" stroke="#8a6a1a"/><path d="M7 9 L9 12 H17 L19 9" fill="none" stroke="#f6d77a"/>' },
  bargeld: { name: "Bargeld (Bündel)", art: "Wert", stack: 32, svg: '<rect x="3" y="8" width="20" height="11" rx="1" fill="#7a9a6a" stroke="#3d5a33"/><circle cx="13" cy="13.5" r="3" fill="none" stroke="#3d5a33"/><rect x="11" y="7" width="4" height="13" fill="#e8e2d0" opacity=".8"/>' },
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
  bargeld: "Ein Bündel Banknoten im Wert von 10 000 $. An jedem Bankautomaten in Gotham aufs Konto einzahlen.",
  batsuit: "Der gepanzerte Anzug aus der Geheimbasis im Container. Leicht, kugelsicher, mit Umhang.",
  mantel: "Ein langer Wollmantel für unauffällige Auftritte in der Stadt.",
};
// Batarang-Symbol aus der Batsignal-Form (BAT_SIGNAL_PTS)
if (typeof BAT_SIGNAL_PTS !== "undefined") { const P = BAT_SIGNAL_PTS, q = ([x, y]) => (13 + x * 12).toFixed(1) + " " + (13 + y * 12).toFixed(1), d = "M" + P.map(q).join(" L") + " L" + P.slice(1, -1).reverse().map(([x, y]) => q([-x, y])).join(" L") + " Z";
  INV_ITEMS.batarang.svg = '<path d="' + d + '" fill="#1d2025" stroke="#9aa0a6" stroke-width="0.9" stroke-linejoin="round"/>'; }
const INV = { slots: new Array(36).fill(null), sel: 0, pick: -1 };   // 0-8 Hotbar, 9-35 Inventar; Platz = { id, n }
function invSave() { try { localStorage.setItem("wm-inv", JSON.stringify({ s: INV.slots, sel: INV.sel })); } catch (e) {} }
function invLoad() { try { const d = JSON.parse(localStorage.getItem("wm-inv") || "null"); if (d && Array.isArray(d.s) && d.s.length === 36) { INV.slots = d.s.map(q => q && INV_ITEMS[q.id] ? q : null); INV.sel = d.sel | 0; return true; } } catch (e) {} return false; }
// Gegenstand hinzufuegen: zuerst auf vorhandene Stapel, dann in freie Plaetze (Hotbar zuerst). Rueckgabe: Anzahl, die Platz hatte
function invAdd(id, n = 1) { const it = INV_ITEMS[id]; if (!it) return 0; let left = n;
  for (const s of INV.slots) if (left && s && s.id === id && s.n < it.stack) { const k = Math.min(left, it.stack - s.n); s.n += k; left -= k; }
  for (let i = 0; i < 36 && left; i++) if (!INV.slots[i]) { const k = Math.min(left, it.stack); INV.slots[i] = { id, n: k }; left -= k; }
  invSave(); invRender(); return n - left; }
function invCount(id) { let c = 0; for (const s of INV.slots) if (s && s.id === id) c += s.n; return c; }
const invHas = (id, n = 1) => invCount(id) >= n;
function invTake(id, n = 1) { if (!invHas(id, n)) return false; let left = n; for (let i = 35; i >= 0 && left; i--) { const s = INV.slots[i]; if (s && s.id === id) { const k = Math.min(left, s.n); s.n -= k; left -= k; if (!s.n) INV.slots[i] = null; } } invSave(); invRender(); return true; }
const invHeld = () => INV.slots[INV.sel] ? INV.slots[INV.sel].id : null;
function invSelect(i) { INV.sel = i; invSave(); invRender(); const s = INV.slots[i]; toast(s ? INV_ITEMS[s.id].name + (s.n > 1 ? " (" + s.n + ")" : "") : "Leere Hand"); }
// Klick im Inventar: ersten Platz merken, beim zweiten tauschen bzw. gleiche Gegenstaende zusammenlegen
function invClick(i) {
  if (INV.pick < 0) { if (INV.slots[i]) INV.pick = i; invRender(); return; }
  const a = INV.pick, A = INV.slots[a], Bs = INV.slots[i]; INV.pick = -1;
  if (a !== i) { if (A && Bs && A.id === Bs.id) { const st = INV_ITEMS[A.id].stack, k = Math.min(A.n, st - Bs.n); Bs.n += k; A.n -= k; if (!A.n) INV.slots[a] = null; } else { INV.slots[a] = Bs; INV.slots[i] = A; } }
  invSave(); invRender();
}
const invSlotHTML = (s, i) => '<button type="button" class="inv-slot' + (i === INV.sel && i < 9 ? " sel" : "") + (i === INV.pick ? " pick" : "") + '" data-i="' + i + '">' +
  (i < 9 ? '<span class="inv-k">' + (i + 1) + '</span>' : "") + (s ? '<svg viewBox="0 0 26 26" aria-hidden="true">' + INV_ITEMS[s.id].svg + '</svg>' + (s.n > 1 ? '<span class="inv-n">' + s.n + '</span>' : "") : "") + '</button>';
function invRender() {
  const hb = document.getElementById("hotbar"), box = document.getElementById("inventar"); if (!hb) return;
  const sw = box.querySelector('[data-sw="batsignal"]'); if (sw) { const on = typeof GCPD !== "undefined" && !!GCPD.on; sw.setAttribute("aria-pressed", String(on)); sw.title = on ? "Batsignal ist an (leuchtet nachts) – Klick schaltet aus" : "Batsignal ist aus – Klick schaltet an"; }
  hb.innerHTML = INV.slots.slice(0, 9).map(invSlotHTML).join("");
  if (!box.hidden) { box.querySelector(".inv-grid").innerHTML = INV.slots.slice(9).map((s, k) => invSlotHTML(s, k + 9)).join(""); box.querySelector(".inv-bar").innerHTML = INV.slots.slice(0, 9).map(invSlotHTML).join("");
    const s = INV.slots[INV.pick >= 0 ? INV.pick : INV.sel]; box.querySelector(".inv-info").textContent = s ? INV_ITEMS[s.id].name + " · " + INV_ITEMS[s.id].art + (s.n > 1 ? " · " + s.n + " Stück" : "") : "Klick auf einen Platz und dann auf einen zweiten: tauschen bzw. zusammenlegen"; }
}
const invIsOpen = () => { const b = document.getElementById("inventar"); return b && !b.hidden; };
function invOpen() { const b = document.getElementById("inventar"); if (!b || !b.hidden) return; if (typeof dragging !== "undefined" && dragging) { dragging = false; document.body.classList.remove("looking"); if (document.pointerLockElement) document.exitPointerLock(); } keys.clear(); b.hidden = false; INV.pick = -1; invRender(); }
function invClose() { const b = document.getElementById("inventar"); if (!b || b.hidden) return; b.hidden = true; INV_TIP.i = -1; invTip(); INV.pick = -1; invRender(); if (typeof grabMouse === "function") grabMouse(); }
// Tooltip: beim Darueberfahren Name, Art, Anzahl und Beschreibung; ueber 110 Zeichen gekuerzt mit "Shift halten für mehr"
const INV_TIP = { el: null, i: -1, shift: false, x: 0, y: 0 };
function invTip() {
  const el = INV_TIP.el || (INV_TIP.el = Object.assign(document.createElement("div"), { id: "inv-tip" })); if (!el.parentNode) document.body.appendChild(el);
  const s = INV_TIP.i >= 0 ? INV.slots[INV_TIP.i] : null; if (!s) { el.hidden = true; return; }
  const it = INV_ITEMS[s.id], d = INV_DESC[s.id] || "", long = d.length > 110, txt = long && !INV_TIP.shift ? d.slice(0, d.lastIndexOf(" ", 100)) + " …" : d;
  el.innerHTML = "<b>" + it.name + "</b><span class=\"tip-art\">" + it.art + (s.n > 1 ? " · " + s.n + " Stück" : "") + "</span>" + (d ? "<p>" + txt + "</p>" : "") + (long && !INV_TIP.shift ? "<i>Shift halten für mehr</i>" : "");
  el.hidden = false; const W = el.offsetWidth, H = el.offsetHeight; el.style.left = Math.min(innerWidth - W - 8, INV_TIP.x + 14) + "px"; el.style.top = Math.max(8, Math.min(innerHeight - H - 8, INV_TIP.y + 16)) + "px";
}
for (const id of ["inventar", "hotbar"]) { const box = document.getElementById(id); if (!box) continue;
  box.addEventListener("mousemove", e => { const b = e.target.closest(".inv-slot"), i = b ? +b.dataset.i : -1; INV_TIP.x = e.clientX; INV_TIP.y = e.clientY; INV_TIP.shift = e.shiftKey; INV_TIP.i = i; invTip(); });
  box.addEventListener("mouseleave", () => { INV_TIP.i = -1; invTip(); }); }
addEventListener("keydown", e => { if (e.key === "Shift" && INV_TIP.i >= 0 && !INV_TIP.shift) { INV_TIP.shift = true; invTip(); } });
addEventListener("keyup", e => { if (e.key === "Shift" && INV_TIP.shift) { INV_TIP.shift = false; invTip(); } });
// Aufbau: Startausstattung beim ersten Mal, Klicks
{ if (!invLoad()) { INV.slots[0] = { id: "gullihaken", n: 1 }; INV.slots[1] = { id: "batarang", n: 6 }; invSave(); }
  document.getElementById("hotbar").addEventListener("click", e => { const b = e.target.closest(".inv-slot"); if (!b) return; e.currentTarget.blur?.(); invSelect(+b.dataset.i); });
  document.getElementById("inventar").addEventListener("click", e => { const b = e.target.closest(".inv-slot"); if (b) return invClick(+b.dataset.i); if (e.target.closest(".inv-close")) invClose();
    if (e.target.closest('[data-sw="batsignal"]') && typeof GCPD !== "undefined") { GCPD.on = !GCPD.on; toast(GCPD.on ? "Batsignal an (leuchtet nachts über Gotham)" : "Batsignal aus"); invRender(); } });   // Schalter im Inventar (Nicolas 2026-11-16)
  document.getElementById("btn-inv")?.addEventListener("click", e => { e.currentTarget.blur(); invIsOpen() ? invClose() : invOpen(); });
  // Mausrad zu Fuss: naechster/voriger Hotbar-Platz (Nicolas 2026-11-16); im Fahrzeug, auf Karte und Menues nicht
  let wAcc = 0; addEventListener("wheel", e => { if (!walking || ghost || document.body.classList.contains("drive") || invIsOpen() || e.target.closest?.("#stadtkarte, #handy, #bank, #tp-menu, #settings")) return;
    wAcc += e.deltaY; if (Math.abs(wAcc) < 40) return; const d = Math.sign(wAcc); wAcc = 0; invSelect((INV.sel + d + 9) % 9); }, { passive: true });
  invRender(); }
