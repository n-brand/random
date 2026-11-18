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
  nachtsicht: { name: "Nachtsichtbrille", art: "Ausrüstung", stack: 1, kopf: true, svg: '<path d="M3 13 Q3 9.6 6.4 9.6 H19.6 Q23 9.6 23 13 V14.6 Q23 17 20.6 17 H5.4 Q3 17 3 14.6 Z" fill="#2b2f2a" stroke="#121412" stroke-width=".6"/><circle cx="8.4" cy="13.4" r="3.4" fill="#1e5a2a" stroke="#0d0f0d" stroke-width="1"/><circle cx="17.6" cy="13.4" r="3.4" fill="#1e5a2a" stroke="#0d0f0d" stroke-width="1"/><circle cx="7.6" cy="12.6" r="1" fill="#8dff9d" opacity=".7"/><circle cx="16.8" cy="12.6" r="1" fill="#8dff9d" opacity=".7"/><rect x="11.6" y="7.4" width="2.8" height="2.4" fill="#3a3f39"/>' },   // Nachtsichtbrille (nachtsicht.js), Platz Kopf
  "handy-wayne": { name: "Wayne Phone X", art: "Gerät", stack: 1, svg: '<rect x="7.5" y="2.5" width="11" height="21" rx="2.6" fill="#0b0c0e" stroke="#c9a640" stroke-width=".8"/><rect x="8.8" y="4.6" width="8.4" height="15.4" rx="1" fill="#1a1408"/><path d="M10.2 9.4 L11.4 14 L13 10.6 L14.6 14 L15.8 9.4" fill="none" stroke="#f2c94c" stroke-width="1.1" stroke-linejoin="round"/><rect x="11.6" y="3.2" width="2.8" height=".7" rx=".35" fill="#333"/><path d="M8.8 18 H17.2" stroke="#c9302c" stroke-width=".7"/>' },   // Handy Wayne Enterprises (Gaming), handy.js
  "handy-office": { name: "Ardent Office 12", art: "Gerät", stack: 1, svg: '<rect x="7.5" y="2.5" width="11" height="21" rx="2.6" fill="#b9c0c8" stroke="#6b7480" stroke-width=".8"/><rect x="8.6" y="4.4" width="8.8" height="16" rx=".8" fill="#1d3550"/><rect x="9.8" y="6" width="2.4" height="2.4" rx=".6" fill="#5aa0e0"/><rect x="13.8" y="6" width="2.4" height="2.4" rx=".6" fill="#7bc47f"/><rect x="9.8" y="10" width="2.4" height="2.4" rx=".6" fill="#e0b45a"/><rect x="13.8" y="10" width="2.4" height="2.4" rx=".6" fill="#d07070"/><circle cx="13" cy="21.8" r=".8" fill="#6b7480"/>' },   // Buero-Handy einer anderen Firma
  koffer: { name: "Koffer", art: "Behälter", stack: 1, svg: '<path d="M10 9 V6.6 Q10 5.4 11.2 5.4 H14.8 Q16 5.4 16 6.6 V9" fill="none" stroke="#5a5d63" stroke-width="1.6"/><rect x="2.5" y="9" width="21" height="13.5" rx="2" fill="#16171a" stroke="#4a4d52" stroke-width=".8"/><path d="M2.5 15 H23.5" stroke="#2e3035" stroke-width=".8"/><rect x="6" y="12.6" width="2.8" height="1.8" rx=".4" fill="#cfd2d6"/><rect x="17.2" y="12.6" width="2.8" height="1.8" rx=".4" fill="#cfd2d6"/><path d="M3.6 10.2 H6" stroke="#9aa0a6" stroke-width=".6"/>' },   // Koffer (koffer.js), Inhalt je Koffer, im Tooltip nicht sichtbar
  // Werkzeuge zum Aufbrechen und Aufsprengen von Tresoren (Nicolas 2026-11-18, N23; 3D in der Hand: gotham/tresor.js HAND3D)
  brechstange: { name: "Brechstange", art: "Werkzeug", stack: 1, svg: '<path d="M6.5 21.5 L19 6.2 Q21 3.8 23.2 5.4" fill="none" stroke="#7a1418" stroke-width="3.4" stroke-linecap="round"/><path d="M6.5 21.5 L19 6.2 Q21 3.8 23.2 5.4" fill="none" stroke="#c62f35" stroke-width="2.2" stroke-linecap="round"/><path d="M6.5 21.5 L3.6 20.2" stroke="#c62f35" stroke-width="2.2" stroke-linecap="round"/><path d="M10 16 L17 7.6" stroke="#ff8a8e" stroke-width=".6"/>' },
  sprenggas: { name: "Sprenggas", art: "Werkzeug", stack: 8, svg: '<rect x="11" y="3.4" width="4" height="3.6" fill="#9aa0a6"/><path d="M15 4.4 h3.4" stroke="#9aa0a6" stroke-width="1.4"/><rect x="7.5" y="6.8" width="11" height="16" rx="3" fill="#c8331f" stroke="#5a1408" stroke-width=".6"/><path d="M9 8.5 V20" stroke="#ff7a5c" stroke-width=".8"/><path d="M13 11.4 L16.4 17.4 H9.6 Z" fill="#ffd23a" stroke="#1a1a1a" stroke-width=".5"/><path d="M13 13.6 V15.4" stroke="#1a1a1a" stroke-width=".8"/>' },
  feuerzeug: { name: "Feuerzeug", art: "Werkzeug", stack: 1, svg: '<path d="M12.2 7.6 Q10.8 4.4 13 2 Q13.2 4.4 14.8 5.2 Q13.6 5.8 13.6 7.6Z" fill="#ff9d1c"/><rect x="9" y="7.4" width="8" height="3.6" fill="#b9bec4" stroke="#6b7178" stroke-width=".4"/><circle cx="15" cy="9.2" r="1.1" fill="#6b7178"/><rect x="9" y="11" width="8" height="12" rx="1.5" fill="#2f6fd0" stroke="#173a6e" stroke-width=".6"/><path d="M10.4 12.6 V21.4" stroke="#6aa0ff" stroke-width=".8"/>' },
  batsuit: { name: "Batsuit", art: "Kleidung", stack: 1, svg: '<path d="M9 4 L10 7 H16 L17 4 L18 8 L21 10 L20 22 H6 L5 10 L8 8 Z" fill="#1a1b1e" stroke="#555"/><path d="M10 13 L13 11 L16 13 L13 14 Z" fill="#e8c547"/>' },
  batknopf: { name: "Bat-Knopf", art: "Gadget", stack: 1, svg: '<circle cx="13" cy="13" r="11" fill="#1d2025" stroke="#e8c547" stroke-width="1.6"/><circle cx="13" cy="13" r="7.5" fill="#e8c547"/>' },
  "jeton-10": { name: "Jeton 10", art: "Casino", stack: 100, svg: '<circle cx="13" cy="13" r="11.6" fill="#2266cc" stroke="#000" stroke-opacity=".45" stroke-width=".6"/><g fill="#ffffff"><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(0 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(45 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(90 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(135 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(180 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(225 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(270 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(315 13 13)"/></g><circle cx="13" cy="13" r="7.4" fill="#2266cc" stroke="#ffffff" stroke-width="1" stroke-dasharray="2.2 1.3"/><text x="13" y="15.3" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="6.6" fill="#fff">10</text>' },
  "jeton-100": { name: "Jeton 100", art: "Casino", stack: 100, svg: '<circle cx="13" cy="13" r="11.6" fill="#c21d2b" stroke="#000" stroke-opacity=".45" stroke-width=".6"/><g fill="#ffffff"><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(0 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(45 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(90 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(135 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(180 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(225 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(270 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(315 13 13)"/></g><circle cx="13" cy="13" r="7.4" fill="#c21d2b" stroke="#ffffff" stroke-width="1" stroke-dasharray="2.2 1.3"/><text x="13" y="15.3" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="5.6" fill="#fff">100</text>' },
  "jeton-1000": { name: "Jeton 1 000", art: "Casino", stack: 100, svg: '<circle cx="13" cy="13" r="11.6" fill="#17181c" stroke="#000" stroke-opacity=".45" stroke-width=".6"/><g fill="#d4a640"><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(0 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(45 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(90 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(135 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(180 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(225 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(270 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(315 13 13)"/></g><circle cx="13" cy="13" r="7.4" fill="#17181c" stroke="#d4a640" stroke-width="1" stroke-dasharray="2.2 1.3"/><text x="13" y="15.3" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="6.6" fill="#f2d36b">1K</text>' },
  "jeton-10000": { name: "Jeton 10 000", art: "Casino", stack: 100, svg: '<circle cx="13" cy="13" r="11.6" fill="#6a2bb0" stroke="#000" stroke-opacity=".45" stroke-width=".6"/><g fill="#f2d36b"><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(0 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(45 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(90 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(135 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(180 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(225 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(270 13 13)"/><rect x="11.5" y="1.5" width="3" height="3.3" rx=".5" transform="rotate(315 13 13)"/></g><circle cx="13" cy="13" r="7.4" fill="#6a2bb0" stroke="#f2d36b" stroke-width="1" stroke-dasharray="2.2 1.3"/><text x="13" y="15.3" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="5.6" fill="#fff">10K</text>' },
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
  nachtsicht: "Militärische Nachtsichtbrille. Im Inventar auf den Platz \"Kopf\" ziehen (oder Shift+Klick), oder in der Hand mit Linksklick aufsetzen. Taste B schaltet sie an und aus: im Dunkeln sieht man grün und hell.",
  "handy-wayne": "Gaming-Handy von Wayne Enterprises: schnell, schwarz mit Gold. In der Hand Rechtsklick (oder Taste P): unten rechts öffnen. Apps: Internet, Bank, Garage, Kontakte. Pfeiltasten und Enter wählen.",
  "handy-office": "Büro-Handy von Ardent: silbern, solide, ohne Extras. In der Hand Rechtsklick (oder Taste P). Apps: Internet, Bank, Kontakte (keine Garage).",
  koffer: "Schwarzer Aktenkoffer mit zwei Schlössern. In der Hand: Rechtsklick öffnet ihn.",
  brechstange: "Zum Aufbrechen einfacher Tresore (Geldkassette, Wandtresor): in die Hand nehmen, vor dem Tresor Rechtsklick und stehen bleiben, bis der Kreis voll ist.",
  sprenggas: "Explosives Gas für stabile Tresore: in der Hand vor dem Tresor Rechtsklick bringt eine Ladung an (Stahlschrank 1, Banktresor 2). Danach mit dem Feuerzeug zünden und Abstand halten.",
  feuerzeug: "Zündet angebrachte Gasladungen an einem Tresor (Rechtsklick vor dem Tresor). Nach 4 Sekunden knallt es.",
  batsuit: "Der gepanzerte Anzug aus der Geheimbasis im Container. Leicht, kugelsicher, mit Umhang.",
  batknopf: "Funkknopf für das Batsignal auf dem Polizeipräsidium. In der Hand: Linksklick schaltet das Signal an oder aus (leuchtet nachts über Gotham).",
  "jeton-10": "Casino-Jeton im Wert von 10 $. Am Jeton-Automaten oder an der Kasse im Casino gegen Bargeld tauschen, am Roulette-Tisch setzen.",
  "jeton-100": "Casino-Jeton im Wert von 100 $. Am Jeton-Automaten oder an der Kasse im Casino gegen Bargeld tauschen, am Roulette-Tisch setzen.",
  "jeton-1000": "Casino-Jeton im Wert von 1 000 $. Am Jeton-Automaten oder an der Kasse im Casino gegen Bargeld tauschen, am Roulette-Tisch setzen.",
  "jeton-10000": "Casino-Jeton im Wert von 10 000 $. Am Jeton-Automaten oder an der Kasse im Casino gegen Bargeld tauschen, am Roulette-Tisch setzen.",
  mantel: "Ein langer Wollmantel für unauffällige Auftritte in der Stadt.",
};
// Gullihaken (Nicolas 2026-11-16, Foto): roter T-Griff, langer Schaft, kleiner Haken unten; ganz im 26er-Feld (vorher unten abgeschnitten)
// Batarang-Form wie die Metall-Batarangs im Film (Nicolas 2026-11-17, Bild: "genau die Farbe und Form"): breite Fluegel mit fast gerader Oberkante, kleine Ohren mit schmaler Kerbe,
// unten je ein grosser Bogen zur Spitze in der Mitte. Halbe Kontur rechts von oben Mitte im Uhrzeigersinn bis unten Mitte, y nach unten, Spannweite 2. Auch fuer das 3D-Modell (waffen.js).
const BATARANG_PTS = [[0, 0.12], [0.064, 0.12], [0.078, 0.045], [0.092, 0.12], [0.105, 0.155], [0.136, 0.168], [0.342, 0.158], [0.372, 0.14], [0.39, 0.095], [0.4, 0.04], [0.67, 0.04], [1, 0.04], [0.9, 0.065], [0.83, 0.1], [0.77, 0.14], [0.72, 0.19], [0.695, 0.25], [0.69, 0.31], [0.695, 0.355], [0.62, 0.355], [0.5, 0.345], [0.38, 0.345], [0.27, 0.36], [0.18, 0.39], [0.1, 0.43], [0.05, 0.475], [0, 0.515]];   // nach Nicolas' Nachzeichnung (2026-11-17; danach: Oberkante der Fluegel gerade von Spitze zu Spitze, Schultern und Kopf tiefer): schmale Ohrspitzen, rechteckige Kerben, gerade Oberkante zur Spitze, tiefer runder Ausschnitt unter der Spitze bis zur unteren Ecke, flache Unterkante, Spitze unten
// Batarang-Symbol aus BATARANG_PTS (champagnerfarbenes Metall), Bat-Knopf weiter mit der Batsignal-Form (BAT_SIGNAL_PTS)
// erst beim Zeichnen (Werkstatt laedt gotham-polizei.js nach inventar.js, Nicolas 2026-11-16: Redesign fehlte dort)
function invBatIcon() { const q = ([x, y]) => (13 + x * 12).toFixed(1) + " " + (13 + y * 12).toFixed(1), path = P => "M" + P.map(q).join(" L") + " L" + P.slice(1, -1).reverse().map(([x, y]) => q([-x, y])).join(" L") + " Z";
  if (!INV_ITEMS.batarang.bt) { INV_ITEMS.batarang.bt = true; INV_ITEMS.batarang.svg = '<path d="' + path(BATARANG_PTS) + '" fill="#cbc2b1" stroke="#ece6da" stroke-width="0.8" stroke-linejoin="round"/>'; }   // innen heller (Fase)
  if (INV_ITEMS.batarang.sig || typeof BAT_SIGNAL_PTS === "undefined") return; INV_ITEMS.batarang.sig = true; const d = path(BAT_SIGNAL_PTS);
  INV_ITEMS.batknopf.svg = '<circle cx="13" cy="13" r="11" fill="#1d2025" stroke="#e8c547" stroke-width="1.6"/><circle cx="13" cy="13" r="7.6" fill="#e8c547"/><path transform="translate(13 13.6) scale(.5) translate(-13 -13)" d="' + d + '" fill="#1d2025"/>'; }   // Bat-Knopf: Fledermaus auf gelbem Knopf
invBatIcon(); addEventListener("load", () => { if (!INV_ITEMS.batarang.sig) invRender(); });   // Werkstatt: nach allen Skripten neu zeichnen
const INV_TEST_ALLE = true;   // TEST: alle Gegenstaende besitzen (siehe Aufbau unten)
const INV = { slots: new Array(36).fill(null), sel: 0, pick: -1, cursor: null, drag: null, box: null };   // box = offener Behaelter (Plaetze ab Index 100)
INV.equip = { kopf: null };   // Ausruestung (Nachtsichtbrille, N28); Platz-Index 90 = Kopf
const INV_BOX0 = 100, INV_KOPF = 90, invGet = i => i === INV_KOPF ? INV.equip.kopf : i >= INV_BOX0 ? (INV.box ? INV.box.slots[i - INV_BOX0] : null) : INV.slots[i], invSet = (i, v) => { if (i === INV_KOPF) INV.equip.kopf = v; else if (i >= INV_BOX0) { if (INV.box) INV.box.slots[i - INV_BOX0] = v; } else INV.slots[i] = v; };   // 0-8 Hotbar, 9-35 Inventar; Platz = { id, n }
function invSave() { try { localStorage.setItem("wm-inv", JSON.stringify({ s: INV.slots, sel: INV.sel, c: INV.cursor, e: INV.equip })); } catch (e) {} }
function invLoad() { try { const d = JSON.parse(localStorage.getItem("wm-inv") || "null"); if (d && Array.isArray(d.s) && d.s.length === 36) { INV.slots = d.s.map(q => q && INV_ITEMS[q.id] ? q : null); INV.sel = Math.min(INV_SEL_N - 1, d.sel | 0); INV.cursor = d.c && INV_ITEMS[d.c.id] && d.c.n > 0 ? d.c : null; if (d.e && d.e.kopf && INV_ITEMS[d.e.kopf.id]) INV.equip.kopf = d.e.kopf; return true; } } catch (e) {} return false; }
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
// Name des gewaehlten Platzes kurz ueber der Hotbar (wie Minecraft; Nicolas 2026-11-17: "die Anzeige oben soll unten ueber der Hotbar sein")
function invName(t) { let el = document.getElementById("hb-name"); if (!el) { el = document.createElement("div"); el.id = "hb-name"; document.body.appendChild(el); }
  el.textContent = t; el.classList.remove("aus"); el.classList.add("an"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add("aus"), 1600); }
function invSelect(i) { INV.sel = i; invSave(); invRender(); const s = i < 9 ? INV.slots[i] : null, K = typeof KONTO !== "undefined" ? KONTO : null;
  invName(i === INV_SEL_BAR ? "Bargeld" + (K ? ": " + kontoFmt(K.bar) : "") : i === INV_SEL_KARTE ? "Karte" + (K ? ": " + kontoFmt(K.stand) : "") : s ? INV_ITEMS[s.id].name + (s.n > 1 ? " (" + s.n + ")" : "") : "Leere Hand"); }
// Gehaltener Gegenstand rechts unten im Bild (wie die Hand in Minecraft; Nicolas 2026-11-16 "wenn ich etwas in der Hand habe, soll es das rechts im Bildschirm zeigen")
const INV_HAND = { el: null, key: "" };
function invHandRender() {
  const el = INV_HAND.el || (INV_HAND.el = Object.assign(document.createElement("div"), { id: "hand" })); if (!el.parentNode) document.body.appendChild(el);
  const G = typeof KONTO_GELD_SVG !== "undefined" ? KONTO_GELD_SVG : null, id = INV.sel === INV_SEL_BAR ? "geld-bar" : INV.sel === INV_SEL_KARTE ? "geld-karte" : invHeld();
  const svg = !id ? "" : id === "geld-bar" ? G && G.bar : id === "geld-karte" ? G && G.karte : INV_ITEMS[id].svg;
  if ((typeof GUN_SPEC !== "undefined" && GUN_SPEC[id]) || (id && id.startsWith("jeton-") && typeof jetRender === "function") || (id === "batarang" && typeof batHandRender === "function") || (typeof HAND3D !== "undefined" && HAND3D[id])) { el.hidden = true; return; }   // Werkzeuge 3D (tresor.js)   // Batarang 3D (waffen.js)   // Schusswaffen und Jetons als 3D-Modell (schusswaffen.js, jetons.js)   // Schusswaffen zeigt schusswaffen.js als 3D-Modell
  el.hidden = !svg; if (!svg || INV_HAND.key === id + svg.length) return; INV_HAND.key = id + svg.length;
  el.innerHTML = '<svg viewBox="0 0 26 26" aria-hidden="true">' + svg + '</svg>'; el.classList.remove("neu"); void el.offsetWidth; el.classList.add("neu"); }
// ---- Verschieben wie in Minecraft (INV.cursor = Stapel an der Maus) ----
const invRoom = (S, id) => !S ? INV_ITEMS[id].stack : S.id === id ? INV_ITEMS[id].stack - S.n : 0;
// Linksklick mit Stapel an der Maus: ablegen, auffuellen oder tauschen
const invSelf = (j, C) => (j === INV_KOPF && C && !INV_ITEMS[C.id].kopf && (toast(INV_ITEMS[C.id].name + " kann man nicht aufsetzen"), true)) || (j === INV_KOPF && C && C.n > 1) || j >= INV_BOX0 && INV.box && C && ((INV.box.self && C.k === INV.box.self && (toast("Der Koffer passt nicht in sich selbst"), true)) || (INV.box.accept && !INV.box.accept(C.id) && (toast(INV_ITEMS[C.id].name + " passt nicht in den " + INV.box.name), true)));   // Koffer (koffer.js), Papierkorb nur kleine Dinge (muell.js)   // Koffer (koffer.js)
function invPlace(j) { const S = invGet(j), C = INV.cursor; if (!C || invSelf(j, C)) return;
  if (!S) { invSet(j, C); INV.cursor = null; }
  else if (S.id === C.id) { const k = Math.min(C.n, invRoom(S, C.id)); S.n += k; C.n -= k; if (!C.n) INV.cursor = null; }
  else { invSet(j, C); INV.cursor = S; } }
// Rechtsklick mit Stapel an der Maus: einen ablegen
function invPlaceOne(j) { const S = invGet(j), C = INV.cursor; if (!C || invRoom(S, C.id) < 1 || invSelf(j, C)) return false;
  if (!S && C.n === 1) { invSet(j, C); INV.cursor = null; return true; } if (S) S.n++; else invSet(j, { id: C.id, n: 1 }); if (!--C.n) INV.cursor = null; return true; }   // einzelnes Stueck: Objekt behalten (Zusatzfelder wie k)
// Shift+Klick: Hotbar -> Inventar bzw. umgekehrt (erst auf gleiche Stapel, dann freie Plaetze); bei offenem Behaelter zwischen Behaelter und Spieler
function invQuick(i) { const S = invGet(i); if (!S) return; const nb = INV.box ? INV.box.slots.length : 0;
  if (i === INV_KOPF) { for (const [a, b] of [[9, 36], [0, 9]]) for (let j = a; j < b; j++) if (!INV.slots[j]) { INV.slots[j] = S; INV.equip.kopf = null; return; } return; }   // absetzen
  if (!INV.box && INV_ITEMS[S.id].kopf && !INV.equip.kopf) { INV.equip.kopf = S; invSet(i, null); return; }   // aufsetzen
  const ranges = i >= INV_BOX0 ? [[9, 36], [0, 9]] : INV.box ? [[INV_BOX0, INV_BOX0 + nb]] : [i < 9 ? [9, 36] : [0, 9]];
  for (let pass = 0; pass < 2 && S.n; pass++) for (const [a, b] of ranges) for (let j = a; j < b && S.n; j++) { const T = invGet(j); if (pass === 0 ? !(T && T.id === S.id) : T) continue; if (invSelf(j, S)) return;
    const k = Math.min(S.n, invRoom(T, S.id)); if (!k) continue; if (!T && k === S.n) { invSet(j, S); invSet(i, null); return; } if (T) T.n += k; else invSet(j, { id: S.id, n: k }); S.n -= k; }   // ganzer Stapel: Objekt umziehen
  if (!S.n) invSet(i, null); }
// Stapel an der Maus zurueck ins Inventar (beim Schliessen, beim Laden); ohne Platz bleibt der Rest an der Maus gespeichert
function invReturnCursor() { const C = INV.cursor; if (!C) return; INV.cursor = null; const put = invAdd(C.id, C.n);
  if (put < C.n) { INV.cursor = { id: C.id, n: C.n - put }; invSave(); toast("Kein Platz im Inventar für " + INV_ITEMS[C.id].name); } }
// Ziehen ueber mehrere Plaetze mit Stapel an der Maus: links gleichmaessig verteilen (Vorschau live), rechts je einen
const invSnap = () => ({ a: INV.slots.map(q => q && { ...q }), b: INV.box ? INV.box.slots.map(q => q && { ...q }) : null }), invSnapGet = (sn, j) => j === INV_KOPF ? INV.equip.kopf : j >= INV_BOX0 ? sn.b && sn.b[j - INV_BOX0] : sn.a[j];
function invSpread(D) { INV.slots = D.snap.a.map(q => q && { ...q }); if (INV.box && D.snap.b) INV.box.slots = D.snap.b.map(q => q && { ...q }); INV.cursor = { ...D.snapC }; const C = INV.cursor, L = D.list.filter(j => invRoom(invGet(j), C.id) > 0 && j !== INV_KOPF && !(j >= INV_BOX0 && INV.box && INV.box.accept && !INV.box.accept(C.id))), per = Math.floor(C.n / L.length);
  if (per < 1) return; for (const j of L) { const S = invGet(j), k = Math.min(per, invRoom(S, C.id)); if (S) S.n += k; else invSet(j, { id: C.id, n: k }); C.n -= k; } if (!C.n) INV.cursor = null; }
const invSlotAt = (x, y) => { const el = document.elementFromPoint(x, y)?.closest?.("#inventar .inv-slot"); return el ? +el.dataset.i : -1; };
function invDown(e) { const b = e.target.closest(".inv-slot"); if (!b || (e.button !== 0 && e.button !== 2)) return; e.preventDefault(); const i = +b.dataset.i, S = invGet(i), C = INV.cursor;
  if (e.button === 0 && e.shiftKey && !C) { invQuick(i); invSave(); if (INV.box) INV.box.save(); return invRender(); }
  if (e.button === 0) { if (!C) { if (!S) return; INV.cursor = S; invSet(i, null); INV.drag = { mode: "carry", from: i }; }
    else INV.drag = { mode: "spread", list: [i], snap: invSnap(), snapC: { ...C } }; }
  else { if (!C) { if (!S) return; const k = Math.ceil(S.n / 2); if (k === S.n) { INV.cursor = S; invSet(i, null); } else { INV.cursor = { id: S.id, n: k }; S.n -= k; } INV.drag = null; }
    else { invPlaceOne(i); INV.drag = { mode: "one", list: [i] }; } }
  INV_TIP.i = -1; invTip(); invRender(); invCursorMove(e); }
function invMove(e) { invCursorMove(e); const D = INV.drag; if (!D || D.mode === "carry") return; const j = invSlotAt(e.clientX, e.clientY); if (j < 0 || D.list.includes(j)) return;
  if (D.mode === "one") { if (invPlaceOne(j)) { D.list.push(j); invRender(); } return; }
  const id = D.snapC.id; if (invRoom(invSnapGet(D.snap, j), id) < 1 || D.list.length >= D.snapC.n) return; D.list.push(j); invSpread(D); invRender(); }
function invUp(e) { const D = INV.drag; if (!D) return; INV.drag = null; const j = invSlotAt(e.clientX, e.clientY);
  if (D.mode === "carry") { if (j >= 0 && j !== D.from) invPlace(j); }                    // ziehen und loslassen; auf demselben Platz: bleibt an der Maus (klicken-klicken)
  else if (D.mode === "spread" && D.list.length === 1) invPlace(D.list[0]);
  invSave(); if (INV.box) INV.box.save(); invRender(); }
// ---- Behaelter (Nicolas 2026-11-18, N22: Tresore, Koffer, Waffenwand, Muelleimer): Rechtsklick oeffnet oben den Behaelter, unten das eigene Inventar; verschieben wie im Inventar ----
// invBox(id, name, n, init, cols): Behaelter mit n Plaetzen, gespeichert in localStorage "wm-box-<id>" (in der Werkstatt automatisch "wm-werkstatt-box-…"), beim ersten Mal mit init = [[id, n], …] gefuellt.
// invBoxOpen(box): oeffnen. box.onChange(box) wird nach jeder Aenderung gerufen (z. B. 3D-Waffen an der Wand ein-/ausblenden). invBoxCount(box, id): Anzahl im Behaelter.
// invBoxFront(obj, d, near): steht der Spieler vor der Front des Objekts (lokal -z, wie bei allen Modellen) und hoechstens near m entfernt? Sonst Meldung, false.
const INV_BOXES = {};
function invBox(id, name, n, init = [], cols = 9) { if (INV_BOXES[id]) return INV_BOXES[id]; const B = INV_BOXES[id] = { id, name, cols, slots: new Array(n).fill(null), onChange: null,
    save() { try { localStorage.setItem("wm-box-" + id, JSON.stringify(B.cash !== undefined ? { s: B.slots, c: B.cash } : B.slots)); } catch (e) {} if (B.onChange) B.onChange(B); } };   // mit Bargeld (Koffer) als { s, c }
  let d = null; try { d = JSON.parse(localStorage.getItem("wm-box-" + id) || "null"); } catch (e) {}
  if (d && Array.isArray(d.s)) { B.cash = d.c || 0; d = d.s; }
  if (Array.isArray(d)) d.slice(0, n).forEach((q, k) => { if (q && INV_ITEMS[q.id] && q.n > 0) B.slots[k] = q; });
  else { let k = 0; for (const [iid, c] of init) { let left = c; while (left > 0 && k < n && INV_ITEMS[iid]) { const m = Math.min(left, INV_ITEMS[iid].stack); B.slots[k++] = { id: iid, n: m }; left -= m; } } }
  return B; }
const invBoxCount = (B, id) => B.slots.reduce((c, q) => c + (q && q.id === id ? q.n : 0), 0);
function invBoxOpen(B) { if (invIsOpen()) invClose(); INV.box = B; invOpen(); }
function invBoxFront(obj, near = 2.6) { const p = obj.getWorldPosition(new THREE.Vector3()), q = obj.getWorldQuaternion(new THREE.Quaternion()), f = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
  const pl = typeof player !== "undefined" ? player.pos : camera.position, dx = pl.x - p.x, dz = pl.z - p.z;
  if (dx * f.x + dz * f.z < 0.2) { toast("Von hier kommst du nicht heran – nur von vorne"); return false; } if (Math.hypot(dx, dz) > near) { toast("Zu weit weg"); return false; } return true; }
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
  if (!box.hidden) { const B = INV.box, ct = box.querySelector(".inv-cont") || (() => { const d = document.createElement("div"); d.className = "inv-cont"; box.querySelector(".inv-head").after(d); return d; })();
    ct.hidden = !B; box.classList.toggle("with-box", !!B); if (B) ct.innerHTML = '<div class="inv-cont-name">' + B.name + (B.actions ? B.actions.map((a, k) => ' <button type="button" class="inv-act" data-a="' + k + '"' + (a.fn ? '' : ' disabled') + '>' + a.label + '</button>').join('') : '') + '</div><div class="inv-cont-grid" style="grid-template-columns: repeat(' + B.cols + ', var(--slot))">' + B.slots.map((s, k) => invSlotHTML(s, INV_BOX0 + k)).join("") + '</div><div class="inv-sep">Inventar</div>';
    const eq = box.querySelector(".inv-equip") || (() => { const d = document.createElement("div"); d.className = "inv-equip"; box.querySelector(".inv-grid").before(d); return d; })();
    eq.innerHTML = '<span>Ausrüstung</span>' + invSlotHTML(INV.equip.kopf, INV_KOPF).replace('class="inv-slot', 'title="Kopf" class="inv-slot kopf') + '<span class="inv-eq-k">Kopf' + (INV.equip.kopf ? " · B an/aus" : "") + '</span>';
    box.querySelector(".inv-grid").innerHTML = INV.slots.slice(9).map((s, k) => invSlotHTML(s, k + 9)).join(""); box.querySelector(".inv-bar").innerHTML = INV.slots.slice(0, 9).map(invSlotHTML).join("");
    const s = INV.cursor || (INV.sel < 9 ? INV.slots[INV.sel] : null); box.querySelector(".inv-info").textContent = s ? (INV.cursor ? "An der Maus: " : "") + INV_ITEMS[s.id].name + " · " + INV_ITEMS[s.id].art + (s.n > 1 ? " · " + s.n + " Stück" : "") : "";
    const h = box.querySelector(".inv-hint"); if (h) h.textContent = "Ziehen oder klicken: verschieben · Rechtsklick: halber Stapel bzw. einzeln ablegen · Shift+Klick: " + (B ? B.name + " ↔ Inventar" : "Hotbar ↔ Inventar") + " · E, I oder Esc schliesst"; }
  invCursorRender(); invHandRender(); if (typeof kontoGeldRender === "function" && typeof KONTO !== "undefined") kontoGeldRender();
}
const invIsOpen = () => { const b = document.getElementById("inventar"); return b && !b.hidden; };
function invOpen() { const b = document.getElementById("inventar"); if (!b || !b.hidden) return; if (typeof dragging !== "undefined" && dragging) { dragging = false; document.body.classList.remove("looking"); if (document.pointerLockElement) document.exitPointerLock(); } keys.clear(); b.hidden = false; INV.pick = -1; invRender(); }
function invClose() { const b = document.getElementById("inventar"); if (!b || b.hidden) return; b.hidden = true; INV_TIP.i = -1; invTip(); INV.pick = -1; INV.drag = null; invReturnCursor(); if (INV.box) { INV.box.save(); INV.box = null; } invRender(); if (typeof grabMouse === "function") grabMouse(); }
// Tooltip: beim Darueberfahren Name, Art, Anzahl und Beschreibung; ueber 110 Zeichen gekuerzt mit "Shift halten für mehr"
const INV_TIP = { el: null, i: -1, shift: false, x: 0, y: 0 };
function invTip() {
  const el = INV_TIP.el || (INV_TIP.el = Object.assign(document.createElement("div"), { id: "inv-tip" })); if (!el.parentNode) document.body.appendChild(el);
  const s = INV_TIP.i >= 0 && !INV.cursor ? invGet(INV_TIP.i) : null; if (!s) { el.hidden = true; return; }
  const it = INV_ITEMS[s.id], d = INV_DESC[s.id] || "", long = d.length > 110, txt = long && !INV_TIP.shift ? d.slice(0, d.lastIndexOf(" ", 100)) + " …" : d;
  el.innerHTML = "<b>" + it.name + "</b><span class=\"tip-art\">" + it.art + (s.n > 1 ? " · " + s.n + " Stück" : "") + "</span>" + (d ? "<p>" + txt + "</p>" : "") + (long && !INV_TIP.shift ? "<i>Shift halten für mehr</i>" : "");
  el.hidden = false; const W = el.offsetWidth, H = el.offsetHeight; el.style.left = Math.min(innerWidth - W - 8, INV_TIP.x + 14) + "px"; el.style.top = Math.max(8, Math.min(innerHeight - H - 8, INV_TIP.y + 16)) + "px";
}
for (const id of ["inventar", "hotbar"]) { const box = document.getElementById(id); if (!box) continue;
  box.addEventListener("mousemove", e => { if (INV.drag) return; const b = e.target.closest(".inv-slot"), i = b ? +b.dataset.i : -1; INV_TIP.x = e.clientX; INV_TIP.y = e.clientY; INV_TIP.shift = e.shiftKey; INV_TIP.i = i; invTip(); });
  box.addEventListener("mouseleave", () => { INV_TIP.i = -1; invTip(); }); }
addEventListener("keydown", e => { if (e.key === "Shift" && INV_TIP.i >= 0 && !INV_TIP.shift) { INV_TIP.shift = true; invTip(); } });
addEventListener("keyup", e => { if (e.key === "Shift" && INV_TIP.shift) { INV_TIP.shift = false; invTip(); } });
{ const st = document.createElement("style"); st.textContent = ".inv-cont[hidden]{display:none}.inv-equip{display:flex;align-items:center;gap:10px;margin:2px 0 8px;font-size:12px;color:#aab}.inv-equip .inv-slot.kopf{outline:1px dashed #556}.inv-eq-k{opacity:.8}.inv-cont-name{font-weight:700;margin:2px 0 6px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.inv-act{font:600 12px system-ui;padding:4px 10px;border-radius:6px;border:1px solid #555;background:#2a2d33;color:#fff;cursor:pointer}.inv-act:disabled{opacity:.55;cursor:default}.inv-cont-grid{display:grid;gap:4px;margin-bottom:6px}#inventar.with-box .inv-sws{display:none}#inventar.with-box .inv-box{max-height:96vh;overflow:auto}"; document.head.appendChild(st); }   // Behaelter-Teil (Spiel und Werkstatt)
// Aufbau: Startausstattung beim ersten Mal, Klicks
{ if (!invLoad()) { INV.slots[0] = { id: "gullihaken", n: 1 }; INV.slots[1] = { id: "batarang", n: 6 }; invSave(); }
  // TEST (Nicolas 2026-11-16: "jedes Item zum Testen besitzen"): fehlende Gegenstaende beim Start auffuellen (je ein voller Stapel). Spaeter auf false.
  invReturnCursor();                                                         // beim letzten Mal an der Maus geblieben
  if (INV_TEST_ALLE) { for (const id in INV_ITEMS) if (id !== "koffer" && !invHas(id) && !(INV.equip.kopf && INV.equip.kopf.id === id) && !(INV.cursor && INV.cursor.id === id)) invAdd(id, INV_ITEMS[id].stack); }   // Koffer nur echt (mit Kennung, koffer.js)
  document.getElementById("hotbar").addEventListener("click", e => { const b = e.target.closest(".inv-slot"); if (!b) return; e.currentTarget.blur?.(); invSelect(+b.dataset.i); });
  const ib = document.getElementById("inventar");
  ib.addEventListener("pointerdown", invDown); ib.addEventListener("contextmenu", e => e.preventDefault());
  addEventListener("pointermove", e => { if (invIsOpen()) invMove(e); }); addEventListener("pointerup", e => { if (invIsOpen()) invUp(e); });
  ib.addEventListener("click", e => { if (e.target.closest(".inv-slot")) return; if (e.target.closest(".inv-close")) invClose(); const ac = e.target.closest(".inv-act"); if (ac && INV.box && INV.box.actions) { const a = INV.box.actions[+ac.dataset.a]; if (a && a.fn) a.fn(); return; }
    if (e.target.closest('[data-sw="batsignal"]') && typeof GCPD !== "undefined") { GCPD.on = !GCPD.on; toast(GCPD.on ? "Batsignal an (leuchtet nachts über Gotham)" : "Batsignal aus"); invRender(); } });   // Schalter im Inventar (Nicolas 2026-11-16)
  document.getElementById("btn-inv")?.addEventListener("click", e => { e.currentTarget.blur(); invIsOpen() ? invClose() : invOpen(); });
  // Mausrad zu Fuss: naechster/voriger Hotbar-Platz (Nicolas 2026-11-16); im Fahrzeug, auf Karte und Menues nicht
  let wAcc = 0; addEventListener("wheel", e => { if (!walking || ghost || document.body.classList.contains("drive") || invIsOpen() || e.target.closest?.("#stadtkarte, #handy, #bank, #laptop, #tp-menu, #settings")) return;
    wAcc += e.deltaY; if (Math.abs(wAcc) < 40) return; const d = Math.sign(wAcc); wAcc = 0; invSelect((INV.sel + d + INV_SEL_N) % INV_SEL_N); }, { passive: true });
  invRender(); }
