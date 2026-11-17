// Werkstatt – eigener Speicher (Nicolas 2026-11-17: Cookies loeschen "nur pro Game, also Werkstatt oder Gotham einzeln").
// Laedt als ERSTES Skript der Werkstatt. Alle Schluessel "wm-…" (Inventar, Konto, Waffen, Laptops, Einstellungen …) werden in der Werkstatt
// unter "wm-werkstatt-…" gespeichert, das Spiel (Gotham/Manor) behaelt "wm-…". So setzt "Cookies loeschen" auf einem Laptop nur das Spiel zurueck,
// in dem man gerade ist. Vorher teilten Werkstatt und Spiel Konto und Inventar.
"use strict";
const BV_NS = "werkstatt";
(() => { const P = Storage.prototype, map = k => typeof k === "string" && k.startsWith("wm-") && !k.startsWith("wm-werkstatt-") ? "wm-werkstatt-" + k.slice(3) : k;
  for (const m of ["getItem", "setItem", "removeItem"]) { const o = P[m]; P[m] = function (k, ...a) { return o.call(this, map(k), ...a); }; } })();
