// Batverse – Handy-App "Börse" (Nicolas 2026-11-19 "Ja, weiter": an der Boerse handeln; Laptop-Boerse gibt es nur in der Werkstatt). Nur im Spiel geladen.
// Gleiche Daten wie die Laptop-Boerse (laptop.js): localStorage wm-boerse { p: Kurse, h: Verlauf (48), d: Depot, t: Zeit }; 8 Aktien, Kurse laufen je 4 s einen Schritt
// (Zufall mit Zug zum Startkurs), verpasste Zeit beim Laden bis 60 Schritte. Liste mit Kurs, Veraenderung, Kurve und Depot; Detail mit grosser Kurve, Kaufen 1/10/100,
// Verkaufen 1/10/alle ueber das Konto (kontoAus/kontoEin). Oeffnet ueber die App "Börse" im Handy oder per Rechtsklick an einem Handelsposten der Boerse (gotham-boerse.js).
"use strict";
const AKX_LISTE = [["WYNE", "Wayne Enterprises", 412], ["PMG", "Prestige Motors Group", 88], ["BGC", "Budget Cars", 14.5], ["ACE", "Ace Chemicals", 37], ["KANE", "Kane Textiles", 22], ["GARM", "Gotham Arms", 64], ["GCB", "Gotham City Bank", 129], ["GTRN", "Gotham Transit", 9.8]];
const AKX = { sel: null, B: (() => { let b = null; try { b = JSON.parse(localStorage.getItem("wm-boerse") || "null"); } catch (e) {} return b || { p: {}, h: {}, d: {}, t: Date.now() }; })() };
for (const [s, , p0] of AKX_LISTE) { if (!AKX.B.p[s]) AKX.B.p[s] = p0; if (!AKX.B.h[s]) AKX.B.h[s] = [p0]; }
AKX.B.d = AKX.B.d || {};
function akxSave() { try { localStorage.setItem("wm-boerse", JSON.stringify(AKX.B)); } catch (e) {} }
function akxStep(n) { const B = AKX.B; for (let k = 0; k < n; k++) for (const [s, , p0] of AKX_LISTE) { const p = B.p[s], q = Math.max(0.5, p * (1 + (p0 - p) / p0 * 0.01 + (Math.random() - 0.5) * 0.03)); B.p[s] = Math.round(q * 100) / 100; const h = B.h[s]; h.push(B.p[s]); if (h.length > 48) h.shift(); }
  B.t = Date.now(); akxSave(); }
akxStep(Math.min(60, Math.max(0, Math.floor((Date.now() - (AKX.B.t || Date.now())) / 4000))));
setInterval(() => { if (document.hidden) return; akxStep(1); const b = document.getElementById("handy"); if (b && !b.hidden && typeof HANDY !== "undefined" && HANDY.page === "aktien" && typeof handyRender === "function") handyRender(); }, 4000);
const akxFmt = v => { const [g, d] = Math.abs(v).toFixed(2).split("."); return (v < 0 ? "-" : "") + g.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "," + d + " $"; };
function akxKurve(h, w, ht, farbe) { const lo = Math.min(...h), hi = Math.max(...h), r = hi - lo || 1; return '<svg viewBox="0 0 ' + w + " " + ht + '" width="' + w + '" height="' + ht + '"><polyline fill="none" stroke="' + farbe + '" stroke-width="2" points="' +
  h.map((v, i) => (i / Math.max(1, h.length - 1) * w).toFixed(1) + "," + (ht - 2 - (v - lo) / r * (ht - 4)).toFixed(1)).join(" ") + '"/></svg>'; }
function akxRender() { const B = AKX.B, chg = s => { const h = B.h[s], a = h[Math.max(0, h.length - 13)]; return (B.p[s] - a) / a * 100; };
  const wert = AKX_LISTE.reduce((t, [s]) => t + (B.d[s] || 0) * B.p[s], 0);
  if (!AKX.sel) return '<div class="h-page akx"><h2>Gotham Stock Exchange</h2><p class="h-sub">Depotwert ' + akxFmt(wert) + ' · Konto ' + (typeof kontoFmt === "function" ? kontoFmt(kontoStand()) : "") + "</p>" +
    AKX_LISTE.map(([s, n]) => { const c = chg(s), up = c >= 0; return '<button type="button" class="akx-row" data-x="aktien:sel:' + s + '"><span class="akx-s"><b>' + s + "</b><small>" + n + '</small></span>' + akxKurve(B.h[s], 70, 26, up ? "#4cd27a" : "#ff5a5a") +
      '<span class="akx-p"><b>' + akxFmt(B.p[s]) + '</b><small style="color:' + (up ? "#4cd27a" : "#ff5a5a") + '">' + (up ? "+" : "") + c.toFixed(2).replace(".", ",") + " %" + (B.d[s] ? " · " + B.d[s] + " Stk." : "") + "</small></span></button>"; }).join("") + "</div>";
  const s = AKX.sel, n = (AKX_LISTE.find(q => q[0] === s) || [])[1], c = chg(s), up = c >= 0, st = B.d[s] || 0;
  return '<div class="h-page akx"><button type="button" class="akx-back" data-x="aktien:liste">‹ Alle Kurse</button><h2>' + s + ' <small>' + n + '</small></h2><p class="akx-big" style="color:' + (up ? "#4cd27a" : "#ff5a5a") + '">' + akxFmt(B.p[s]) + " (" + (up ? "+" : "") + c.toFixed(2).replace(".", ",") + " %)</p>" +
    '<div class="akx-chart">' + akxKurve(B.h[s], 300, 110, up ? "#4cd27a" : "#ff5a5a") + '</div><p class="h-sub">Im Depot: ' + st + " Stück · Wert " + akxFmt(st * B.p[s]) + "</p>" +
    '<div class="akx-btns">' + [1, 10, 100].map(k => '<button type="button" class="akx-k" data-x="aktien:trade:' + s + ":" + k + '">Kaufen ' + k + "<small>" + akxFmt(B.p[s] * k) + "</small></button>").join("") + "</div>" +
    '<div class="akx-btns">' + [[1, "1"], [10, "10"], [st, "alle"]].map(([k, t]) => '<button type="button" class="akx-v" data-x="aktien:trade:' + s + ":-" + k + '"' + (st ? "" : " disabled") + ">Verkaufen " + t + "</button>").join("") + "</div></div>"; }
function akxClick(x) { const [a, s, n] = x.split(":"), B = AKX.B;
  if (a === "sel") AKX.sel = s; else if (a === "liste") AKX.sel = null;
  else if (a === "trade") { const k = +n, p = B.p[s]; if (!p) return;
    if (k > 0) { const sum = Math.round(p * k); if (!kontoKann(sum)) { toast("Nicht genug Guthaben"); return handyRender(); } kontoAus(sum, "GSE: " + k + " × " + s); B.d[s] = (B.d[s] || 0) + k; toast(k + " × " + s + " gekauft für " + akxFmt(p * k)); }
    else { const q = Math.min(-k, B.d[s] || 0); if (!q) { toast("Keine " + s + "-Aktien im Depot"); return handyRender(); } kontoEin(Math.round(p * q), "GSE: Verkauf " + q + " × " + s); B.d[s] -= q; toast(q + " × " + s + " verkauft für " + akxFmt(p * q)); }
    akxSave(); }
  handyRender(); }
if (typeof HANDY_APPS !== "undefined") { HANDY_APPS.push(["aktien", "Börse", '<path d="M4 19V5M4 19h16"/><path d="M7 15l4-4 3 3 5-6"/>']); for (const m in HANDY_MODELLE) HANDY_MODELLE[m].apps.push("aktien"); }
(window.HANDY_EXTRA = window.HANDY_EXTRA || {}).aktien = { url: "gse.gotham", render: akxRender, click: akxClick };
// an der Boerse: Handelsposten oeffnen die App direkt (auch ohne eigenes Handy, Geraet der Boerse)
function akxOeffne() { AKX.sel = null; if (typeof handyOpen === "function") { handyOpen("aktien", typeof handyEigen === "function" && handyEigen() || "handy-wayne"); if (typeof handyGo === "function") handyGo("aktien"); } }
{ const st = document.createElement("style"); st.textContent = ".akx h2 small{font-size:13px;color:#9aa8b4;font-weight:500}.akx-row{display:flex;align-items:center;gap:10px;width:100%;padding:8px 6px;margin:0 0 4px;background:rgba(255,255,255,.05);border:0;border-radius:10px;color:inherit;text-align:left;cursor:pointer}" +
  ".akx-row:hover{background:rgba(255,255,255,.1)}.akx-s{flex:1;display:flex;flex-direction:column}.akx-s small,.akx-p small{font-size:11px;color:#9aa8b4}.akx-p{display:flex;flex-direction:column;align-items:flex-end;min-width:110px}" +
  ".akx-back{background:none;border:0;color:#7cb4ff;cursor:pointer;padding:0;margin-bottom:6px;font:inherit}.akx-big{font:700 22px system-ui;margin:2px 0 8px}.akx-chart{background:rgba(0,0,0,.25);border-radius:10px;padding:6px}.akx-chart svg{width:100%;height:auto}" +
  ".akx-btns{display:flex;gap:6px;margin-top:8px}.akx-btns button{flex:1;padding:9px 4px;border:0;border-radius:9px;font:600 13px system-ui;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px}.akx-k{background:#2a8a4a;color:#fff}.akx-v{background:#8a2a2a;color:#fff}" +
  ".akx-btns button small{font-size:10px;opacity:.8;font-weight:500}.akx-btns button:disabled{opacity:.35;cursor:default}"; document.head.appendChild(st); }
