// Batverse – S3 Kontostand (PLAN-GOTHAM Phase 9, Nicolas 2026-11-16 "mach weiter naechster Schritt").
// Geld als eigener Zustand in ganzen Dollar mit Verlauf (letzte 50 Buchungen). Gespeichert ueber einen austauschbaren Speicher (`KONTO.backend`):
// jetzt lokal im Browser (localStorage wm-konto); spaeter kann ein Supabase-Speicher mit gleicher Form eingesetzt werden (kontoSetBackend), Anmeldung erst dann.
// Speicher-Form: { name, load() -> Promise<{ stand, log } | null>, save({ stand, log }) -> Promise }. Buchungen laufen immer lokal sofort, gespeichert wird danach.
// Schnittstelle: kontoStand(), kontoKann(n), kontoEin(n, grund), kontoAus(n, grund) -> true/false, kontoFmt(n), kontoOn(fn). Bankautomat: kontoOpen()/kontoClose().
"use strict";
const KONTO_START = 100000, KONTO_BUENDEL = 10000;   // Startguthaben, Wert eines Bargeld-Buendels (OFFENE-FRAGEN 26)
const KONTO_LOCAL = {
  name: "lokal",
  load: async () => { try { const d = JSON.parse(localStorage.getItem("wm-konto") || "null"); return d && Number.isFinite(d.stand) ? d : null; } catch (e) { return null; } },
  save: async d => { try { localStorage.setItem("wm-konto", JSON.stringify(d)); } catch (e) {} },
};
const KONTO = { stand: KONTO_START, log: [], backend: KONTO_LOCAL, ready: false, subs: [] };
const kontoFmt = n => (n < 0 ? "-" : "") + Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
const kontoStand = () => KONTO.stand;
const kontoKann = n => n >= 0 && KONTO.stand >= n;
const kontoOn = fn => KONTO.subs.push(fn);
function kontoBook(n, grund) {
  KONTO.stand += n; KONTO.log.unshift({ t: Date.now(), n, grund: String(grund || "") }); KONTO.log.length = Math.min(KONTO.log.length, 50);
  KONTO.backend.save({ stand: KONTO.stand, log: KONTO.log }).catch(() => {});
  for (const f of KONTO.subs) try { f(n, grund); } catch (e) {}
}
function kontoEin(n, grund) { n = Math.round(n); if (!(n > 0)) return false; kontoBook(n, grund); return true; }
function kontoAus(n, grund) { n = Math.round(n); if (!(n > 0) || !kontoKann(n)) return false; kontoBook(-n, grund); return true; }
async function kontoSetBackend(b) { KONTO.backend = b; const d = await b.load(); if (d) { KONTO.stand = d.stand; KONTO.log = d.log || []; } else await b.save({ stand: KONTO.stand, log: KONTO.log }); KONTO.ready = true; kontoRender(); }
// Anzeige neben der Hotbar, kurz +/- bei Buchungen
function kontoRender() {
  const el = document.getElementById("konto"); if (el) el.querySelector(".k-stand").textContent = kontoFmt(KONTO.stand);
  const p = document.getElementById("bank"); if (!p || p.hidden) return;
  const cash = typeof invCount === "function" ? invCount("bargeld") : 0;
  p.querySelector(".bank-stand").textContent = kontoFmt(KONTO.stand);
  p.querySelector(".bank-cash").textContent = cash + " Bündel Bargeld (je " + kontoFmt(KONTO_BUENDEL) + ")";
  p.querySelector("[data-a=ein]").disabled = !cash; p.querySelector("[data-a=ab]").disabled = !kontoKann(KONTO_BUENDEL);
  p.querySelector(".bank-log").innerHTML = KONTO.log.slice(0, 8).map(b => '<li><span>' + new Date(b.t).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + " · " + b.grund.replace(/[<&]/g, "") + '</span><b class="' + (b.n < 0 ? "neg" : "pos") + '">' + (b.n > 0 ? "+" : "") + kontoFmt(b.n) + "</b></li>").join("") || "<li><span>Noch keine Buchungen</span></li>";
}
kontoOn(n => { kontoRender(); const d = document.querySelector("#konto .k-delta"); if (!d) return; d.textContent = (n > 0 ? "+" : "") + kontoFmt(n); d.className = "k-delta show " + (n < 0 ? "neg" : "pos"); clearTimeout(d._t); d._t = setTimeout(() => d.className = "k-delta", 2200); });
// Bankautomat-Fenster (Maus frei wie beim Inventar)
const kontoIsOpen = () => { const b = document.getElementById("bank"); return b && !b.hidden; };
function kontoOpen() { const b = document.getElementById("bank"); if (!b || !b.hidden) return; if (typeof dragging !== "undefined" && dragging) { dragging = false; document.body.classList.remove("looking"); if (document.pointerLockElement) document.exitPointerLock(); } keys.clear(); b.hidden = false; kontoRender(); }
function kontoClose() { const b = document.getElementById("bank"); if (!b || b.hidden) return; b.hidden = true; if (typeof grabMouse === "function") grabMouse(); }
function kontoAction(a) {
  if (a === "ein") { const n = invCount("bargeld"); if (!n || !invTake("bargeld", n)) return; kontoEin(n * KONTO_BUENDEL, "Einzahlung Bargeld (" + n + ")"); toast(kontoFmt(n * KONTO_BUENDEL) + " eingezahlt"); }
  else if (a === "ab") { if (!kontoKann(KONTO_BUENDEL)) return toast("Nicht genug Guthaben"); if (!invAdd("bargeld", 1)) return toast("Kein Platz im Inventar"); kontoAus(KONTO_BUENDEL, "Bezug Bargeld"); }
  kontoRender();
}
{ document.getElementById("bank")?.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; b.blur(); if (b.classList.contains("bank-close")) return kontoClose(); kontoAction(b.dataset.a); });
  kontoSetBackend(KONTO_LOCAL); }
