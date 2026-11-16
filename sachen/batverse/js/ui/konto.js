// Batverse – S3 Kontostand (PLAN-GOTHAM Phase 9, Nicolas 2026-11-16 "mach weiter naechster Schritt").
// Geld als eigener Zustand in ganzen Dollar mit Verlauf (letzte 50 Buchungen). Gespeichert ueber einen austauschbaren Speicher (`KONTO.backend`):
// jetzt lokal im Browser (localStorage wm-konto); spaeter kann ein Supabase-Speicher mit gleicher Form eingesetzt werden (kontoSetBackend), Anmeldung erst dann.
// Speicher-Form: { name, load() -> Promise<{ stand, log } | null>, save({ stand, log }) -> Promise }. Buchungen laufen immer lokal sofort, gespeichert wird danach.
// Schnittstelle: kontoStand(), kontoKann(n), kontoEin(n, grund), kontoAus(n, grund) -> true/false, kontoFmt(n), kontoOn(fn). Bankautomat: kontoOpen()/kontoClose().
"use strict";
const KONTO_START = 100000;   // Startguthaben (OFFENE-FRAGEN 26)
const KONTO_LOCAL = {
  name: "lokal",
  load: async () => { try { const d = JSON.parse(localStorage.getItem("wm-konto") || "null"); return d && Number.isFinite(d.stand) ? d : null; } catch (e) { return null; } },
  save: async d => { try { localStorage.setItem("wm-konto", JSON.stringify(d)); } catch (e) {} },
};
const KONTO_LIMIT = 10000, KONTO_WOCHE_MS = 140 * 60000;   // Einzahl-Limit je Spielwoche (7 Tage x 20 min Tag-Nacht; PLAN-BANKAUTOMAT Frage 2)
const KONTO = { stand: KONTO_START, log: [], bar: 0, woche: { id: 0, ein: 0 }, backend: KONTO_LOCAL, ready: false, subs: [] };
const kontoFmt = n => (n < 0 ? "-" : "") + Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
const kontoStand = () => KONTO.stand;
const kontoKann = n => n >= 0 && KONTO.stand >= n;
const kontoOn = fn => KONTO.subs.push(fn);
const kontoSave = () => KONTO.backend.save({ stand: KONTO.stand, log: KONTO.log, bar: KONTO.bar, woche: KONTO.woche }).catch(() => {});
const kontoWocheId = () => Math.floor(Date.now() / KONTO_WOCHE_MS);
const kontoLimitRest = () => { const w = kontoWocheId(); if (KONTO.woche.id !== w) KONTO.woche = { id: w, ein: 0 }; return Math.max(0, KONTO_LIMIT - KONTO.woche.ein); };
function kontoBook(n, grund) {
  KONTO.stand += n; KONTO.log.unshift({ t: Date.now(), n, grund: String(grund || "") }); KONTO.log.length = Math.min(KONTO.log.length, 50);
  kontoSave();
  for (const f of KONTO.subs) try { f(n, grund); } catch (e) {}
}
function kontoEin(n, grund) { n = Math.round(n); if (!(n > 0)) return false; kontoBook(n, grund); return true; }
function kontoAus(n, grund) { n = Math.round(n); if (!(n > 0) || !kontoKann(n)) return false; kontoBook(-n, grund); return true; }
async function kontoSetBackend(b) { KONTO.backend = b; const d = await b.load(); if (d) { KONTO.stand = d.stand; KONTO.log = d.log || []; KONTO.bar = d.bar || 0; KONTO.woche = d.woche || { id: 0, ein: 0 }; } else await b.save({ stand: KONTO.stand, log: KONTO.log }); KONTO.ready = true; kontoRender(); }
// Anzeige neben der Hotbar, kurz +/- bei Buchungen
// Bankautomat (Nicolas 2026-11-16, Vorbild-Bilder PLAN-BANKAUTOMAT.md): Seiten Start (Einzahlen/Abheben), Betrag (-100..+100, Schnellbetraege), Erfolg.
// Bargeld ist ein Betrag in Dollar (KONTO.bar, Nicolas 2026-11-16: keine Buendel, "normal einfach Zahlen"); dazu kontoBar(n, grund). Einzahlen hoechstens KONTO_LIMIT je Spielwoche.
const ATM = { page: "start", mode: "ein", amt: 20, msg: "" };
const atmMax = () => ATM.mode === "ein" ? Math.min(KONTO.bar, kontoLimitRest()) : KONTO.stand;
function kontoRender() {
  const el = document.getElementById("konto"); if (el) el.querySelector(".k-stand").textContent = kontoFmt(KONTO.stand);
  if (typeof atmScreensUpdate === "function") atmScreensUpdate();   // 3D-Bildschirme der Automaten (bankautomat.js) zeigen dieselben Werte
  const p = document.getElementById("bank"); if (!p || p.hidden) return;
  const rest = kontoLimitRest(), used = KONTO_LIMIT - rest, lim = p.querySelector(".atm-lim");
  lim.textContent = kontoFmt(used).replace(" $", "") + " / " + kontoFmt(KONTO_LIMIT); lim.classList.toggle("voll", rest <= 0);
  p.querySelector(".bank-stand").textContent = kontoFmt(KONTO.stand); p.querySelector(".bank-cash").textContent = kontoFmt(KONTO.bar);
  for (const pg of p.querySelectorAll(".atm-pg")) pg.hidden = pg.dataset.p !== ATM.page;
  p.querySelector('[data-a="ein"]').disabled = KONTO.bar <= 0 || rest <= 0; p.querySelector('[data-a="ab"]').disabled = KONTO.stand <= 0;
  if (ATM.page === "betrag") { const mx = atmMax(), ok = ATM.amt > 0 && ATM.amt <= mx, v = ATM.mode === "ein" ? "EINZAHLEN" : "ABHEBEN";
    p.querySelector(".atm-t").textContent = ATM.mode === "ein" ? "Betrag zum Einzahlen wählen" : "Betrag zum Abheben wählen";
    p.querySelector(".atm-amt").textContent = kontoFmt(ATM.amt); p.querySelector(".atm-go").textContent = v + " " + kontoFmt(ATM.amt); p.querySelector(".atm-go").disabled = !ok;
    for (const q of p.querySelectorAll(".atm-q")) q.classList.toggle("sel", +q.dataset.q === ATM.amt);
    p.querySelector(".atm-err").textContent = ok ? "" : ATM.amt <= 0 ? "Betrag wählen" : ATM.mode === "ein" ? (ATM.amt > KONTO.bar ? "So viel Bargeld hast du nicht" : "Über dem Einzahl-Limit dieser Woche (noch " + kontoFmt(rest) + ")") : "Nicht genug Guthaben"; }
  if (ATM.page === "ok") p.querySelector(".atm-msg").textContent = ATM.msg;
  const log = p.querySelector(".bank-log"); if (log) log.innerHTML = KONTO.log.slice(0, 8).map(b => "<li><span>" + b.grund.replace(/[<&]/g, "") + "</span><b>" + kontoFmt(b.n) + "</b></li>").join("");
}
kontoOn(n => { kontoRender(); const d = document.querySelector("#konto .k-delta"); if (!d) return; d.textContent = (n > 0 ? "+" : "") + kontoFmt(n); d.className = "k-delta show " + (n < 0 ? "neg" : "pos"); clearTimeout(d._t); d._t = setTimeout(() => d.className = "k-delta", 2200); });
// Bankautomat-Fenster (Maus frei wie beim Inventar)
const kontoIsOpen = () => { const b = document.getElementById("bank"); return b && !b.hidden; };
function kontoOpen() { const b = document.getElementById("bank"); if (!b || !b.hidden) return; if (typeof dragging !== "undefined" && dragging) { dragging = false; document.body.classList.remove("looking"); if (document.pointerLockElement) document.exitPointerLock(); } keys.clear();
  ATM.page = "start"; b.hidden = false; kontoRender(); }
// Bargeld dazu (z. B. Tresor der Geheimbasis) bzw. abziehen; Anzeige und Speicher nachfuehren
function kontoBar(n, grund) { KONTO.bar = Math.max(0, KONTO.bar + Math.round(n)); kontoSave(); kontoRender(); if (grund) toast(grund + ": " + (n > 0 ? "+" : "") + kontoFmt(n) + " Bargeld"); }
function kontoClose() { const b = document.getElementById("bank"); if (!b || b.hidden) return; b.hidden = true; if (typeof grabMouse === "function") grabMouse(); }
function kontoAction(a, el) {
  if (a === "ein" || a === "ab") { ATM.mode = a; ATM.page = "betrag"; ATM.amt = Math.min(20, Math.max(0, Math.floor(atmMax()))); }
  else if (a === "menu") ATM.page = "start";
  else if (a === "fertig") return kontoClose();
  else if (a === "go") { const n = ATM.amt; if (!(n > 0 && n <= atmMax())) return kontoRender();
    if (ATM.mode === "ein") { KONTO.bar -= n; kontoLimitRest(); KONTO.woche.ein += n; kontoEin(n, "Einzahlung Bargeld"); ATM.msg = "Du hast " + kontoFmt(n) + " eingezahlt"; }
    else { kontoAus(n, "Bezug Bargeld"); KONTO.bar += n; ATM.msg = "Du hast " + kontoFmt(n) + " abgehoben"; }
    kontoSave(); ATM.page = "ok"; }
  else if (el && el.dataset.d) ATM.amt = Math.max(0, ATM.amt + +el.dataset.d);
  else if (el && el.dataset.q) ATM.amt = +el.dataset.q;
  kontoRender();
}
{ document.getElementById("bank")?.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; b.blur(); if (b.classList.contains("bank-close")) return kontoClose();
    if (b.dataset.s !== undefined) { const pg = document.querySelector('#bank .atm-pg:not([hidden])'), bs = pg ? [...pg.querySelectorAll(".atm-b")] : [], t = bs[(+b.dataset.s) - (4 - bs.length)];   // Seitentasten: unterste gehoeren zu den Knoepfen der Seite (von unten)
      if (t && !t.disabled) t.click(); return; }
    kontoAction(b.dataset.a, b); });
  kontoSetBackend(KONTO_LOCAL); }
