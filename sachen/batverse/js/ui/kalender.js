// Kalender-App fuers Handy (Nicolas 2026-11-19: "mach eine Kalender-App, die mit der Hearts-App verbunden ist"). Spiel und Werkstatt, nach ui/dating.js.
// Echtes Datum (wie das Gluecksrad). Monatsansicht (blaettern, Tag waehlen, heute umrandet, Punkte je Termin-Art), Liste des gewaehlten Tages und "Demnaechst".
// Termine: Verabredungen aus Gotham Hearts (M.termin in wm-dating: Zeitpunkt, Ort; Knopf "Chat oeffnen" springt in den Chat, "Absagen" sagt im Chat ab und
// setzt das Gespraech auf "Treffen vorschlagen" zurueck), feste Wayne-Termine (Vorstandssitzung Montag 9 Uhr, Gala am 15. um 19 Uhr, Patrouille Donnerstag 22 Uhr)
// und eigene Termine aus Vorlagen (ohne Tippen, damit die Lauftasten im Hochformat nicht stoeren). Erinnerung 30 min vorher als Meldung. Eigene Termine in wm-kalender.
const KAL_WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"], KAL_WTL = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const KAL_MON = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const KAL_VORLAGEN = [["Training in der Bathöhle", 18, 0, "Batcave"], ["Abendessen mit Alfred", 19, 30, "Wayne Manor"], ["Tumbler warten", 10, 0, "Werkstatt"], ["Treffen mit Gordon", 23, 0, "Dach des GCPD"]];
const KAL = (() => { const d = new Date(); let s = null; try { s = JSON.parse(localStorage.getItem("wm-kalender") || "null"); } catch (e) {} return { y: d.getFullYear(), m: d.getMonth(), sel: kalKey(d), eigene: (s && s.eigene) || [], erinnert: (s && s.erinnert) || {}, neu: false }; })();
function kalKey(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
const kalSave = () => { try { localStorage.setItem("wm-kalender", JSON.stringify({ eigene: KAL.eigene, erinnert: KAL.erinnert })); } catch (e) {} };
const kalEsc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const kalZeit = ts => { const d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const kalTag = ts => { const d = new Date(ts); return KAL_WT[d.getDay()] + " " + d.getDate() + "." + (d.getMonth() + 1) + "."; };
// Verabredung aus Gotham Hearts -> Zeitpunkt und Ort (i = gewaehlter Vorschlag der letzten Stufe: 0 Bar Noir Freitag 20 Uhr, 1 Hafen Samstag 15 Uhr, 2 Kaffee morgen 8 Uhr)
function kalTerminAusDate(i, P, ab = Date.now()) { const d = new Date(ab), naechster = wt => { const x = new Date(d); x.setDate(x.getDate() + ((wt - x.getDay() + 7) % 7 || 7)); return x; };
  const [t, h, ort] = i === 0 ? [naechster(5), 20, "Bar Noir"] : i === 1 ? [naechster(6), 15, "Hafenpromenade"] : [(() => { const x = new Date(d); x.setDate(x.getDate() + 1); return x; })(), 8, "Café am Wayne Tower"];
  t.setHours(h, 0, 0, 0); return { ts: t.getTime(), ort, wer: P ? P.id : null }; }
// alte Verabredungen (nur Text) einmal einordnen
function kalAltDates() { if (typeof DG === "undefined") return; let ch = false; for (const id in DG.matches) { const M = DG.matches[id]; if (!M.date || M.termin) continue; const t = M.date.toLowerCase(), i = t.includes("freitag") ? 0 : t.includes("samstag") ? 1 : 2;
    M.termin = kalTerminAusDate(i, { id }); ch = true; } if (ch && typeof dgSave === "function") dgSave(); }
// alle Termine zwischen a und b (ms)
function kalTermine(a, b) { const L = []; kalAltDates();
  if (typeof DG !== "undefined") for (const id in DG.matches) { const T = DG.matches[id].termin, p = typeof DG_PROFILE !== "undefined" && DG_PROFILE.find(q => q.id === id); if (T && T.ts >= a && T.ts < b) L.push({ ts: T.ts, titel: "♥ Date mit " + (p ? p.n : id), ort: T.ort, art: "date", id }); }
  for (let d = new Date(a); d.getTime() < b; d.setDate(d.getDate() + 1)) { const at = (h, m) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x.getTime(); };
    if (d.getDay() === 1) L.push({ ts: at(9, 0), titel: "Vorstandssitzung Wayne Enterprises", ort: "Wayne Tower, 60. Stock", art: "wayne" });
    if (d.getDate() === 15) L.push({ ts: at(19, 0), titel: "Wohltätigkeitsgala", ort: "Gotham Royal Casino", art: "wayne" });
    if (d.getDay() === 4) L.push({ ts: at(22, 0), titel: "Patrouille", ort: "The Narrows", art: "bat" }); }
  KAL.eigene.forEach((e, k) => { if (e.ts >= a && e.ts < b) L.push({ ...e, art: "eigen", k }); });
  return L.sort((x, y) => x.ts - y.ts); }
const KAL_FARBE = { date: "#ff4f7e", wayne: "#4a8cff", bat: "#e8c547", eigen: "#9aa4b0" };
function kalRender() { const erst = new Date(KAL.y, KAL.m, 1), tage = new Date(KAL.y, KAL.m + 1, 0).getDate(), heute = kalKey(new Date()), off = (erst.getDay() + 6) % 7;
  const mon = kalTermine(erst.getTime(), new Date(KAL.y, KAL.m + 1, 1).getTime()), proTag = {}; for (const t of mon) (proTag[kalKey(new Date(t.ts))] = proTag[kalKey(new Date(t.ts))] || []).push(t);
  let z = '<div class="kal-kopf"><button type="button" data-x="kalender:mon:-1">‹</button><b>' + KAL_MON[KAL.m] + " " + KAL.y + '</b><button type="button" data-x="kalender:mon:1">›</button></div><div class="kal-grid">' +
    ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(t => '<span class="kal-wt">' + t + "</span>").join("") + "<span></span>".repeat(off);
  for (let d = 1; d <= tage; d++) { const k = kalKey(new Date(KAL.y, KAL.m, d)), T = proTag[k] || [];
    z += '<button type="button" data-x="kalender:tag:' + k + '" class="kal-d' + (k === heute ? " heute" : "") + (k === KAL.sel ? " sel" : "") + '">' + d + '<i>' + [...new Set(T.map(t => t.art))].map(a => '<em style="background:' + KAL_FARBE[a] + '"></em>').join("") + "</i></button>"; }
  z += "</div>"; const links = z; z = "";   // links Monat, rechts Termine (quer zweispaltig)
  const [sy, sm, sd] = KAL.sel.split("-").map(Number), s0 = new Date(sy, sm - 1, sd).getTime(), heuteT = kalTermine(s0, s0 + 864e5);
  const zeile = (t, mitTag) => '<div class="kal-t" style="border-left-color:' + KAL_FARBE[t.art] + '"><b>' + (mitTag ? kalTag(t.ts) + " · " : "") + kalZeit(t.ts) + " " + kalEsc(t.titel) + "</b><span>" + kalEsc(t.ort || "") + "</span>" +
    (t.art === "date" ? '<div class="kal-k"><button type="button" data-x="kalender:chat:' + t.id + '">Chat öffnen</button><button type="button" class="weg" data-x="kalender:absagen:' + t.id + '">Absagen</button></div>' : "") +
    (t.art === "eigen" ? '<div class="kal-k"><button type="button" class="weg" data-x="kalender:weg:' + t.k + '">Löschen</button></div>' : "") + "</div>";
  z += '<div class="kal-lab">' + KAL_WTL[new Date(s0).getDay()] + ", " + sd + ". " + KAL_MON[sm - 1] + "</div>" + (heuteT.length ? heuteT.map(t => zeile(t, false)).join("") : '<div class="kal-leer">Keine Termine</div>');
  z += KAL.neu ? '<div class="kal-neu">' + KAL_VORLAGEN.map(([n, h, m], i) => '<button type="button" data-x="kalender:add:' + i + '">' + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + " " + kalEsc(n) + "</button>").join("") + '<button type="button" class="weg" data-x="kalender:neu:0">Abbrechen</button></div>'
    : '<button type="button" class="kal-plus" data-x="kalender:neu:1">+ Termin an diesem Tag</button>';
  const jetzt = Date.now(), bald = kalTermine(jetzt, jetzt + 30 * 864e5).slice(0, 5);
  z += '<div class="kal-lab">Demnächst</div>' + (bald.length ? bald.map(t => zeile(t, true)).join("") : '<div class="kal-leer">Nichts geplant</div>');
  return '<div class="kal"><div class="kal-l">' + links + '</div><div class="kal-r">' + z + "</div></div>"; }
function kalClick(v) { const [a, x] = v.split(":");
  if (a === "mon") { KAL.m += +x; if (KAL.m < 0) { KAL.m = 11; KAL.y--; } if (KAL.m > 11) { KAL.m = 0; KAL.y++; } }
  else if (a === "tag") { KAL.sel = x; KAL.neu = false; }
  else if (a === "zeige") return kalZeige(x);
  else if (a === "neu") KAL.neu = x === "1";
  else if (a === "add") { const [n, h, m, ort] = KAL_VORLAGEN[+x], [y, mo, d] = KAL.sel.split("-").map(Number); KAL.eigene.push({ ts: new Date(y, mo - 1, d, h, m).getTime(), titel: n, ort }); KAL.neu = false; kalSave(); }
  else if (a === "weg") { KAL.eigene.splice(+x, 1); kalSave(); }
  else if (a === "chat" && typeof DG !== "undefined") { DG.chat = x; DG.match = null; DG.tab = "matches"; return kalOeffne("dating"); }
  else if (a === "absagen" && typeof DG !== "undefined" && DG.matches[x]) { const M = DG.matches[x]; M.termin = null; M.date = null; M.step = Math.max(0, (typeof DG_ANTWORT !== "undefined" ? DG_ANTWORT.length : 3) - 1);
    M.msgs.push(["ich", "Ich muss unser Treffen leider absagen 😕"], ["sie", "Schade! Dann ein andermal?"]); if (typeof dgSave === "function") dgSave(); if (typeof toast === "function") toast("Verabredung abgesagt"); }
  if (typeof handyRender === "function") handyRender(); }
// aus Gotham Hearts in den Kalender springen (Tag des Termins)
function kalZeige(ts) { const d = new Date(+ts); KAL.y = d.getFullYear(); KAL.m = d.getMonth(); KAL.sel = kalKey(d); KAL.neu = false; kalOeffne("kalender"); }
// Erinnerung 30 min vorher (alle 20 s geprueft, je Termin einmal)
setInterval(() => { const j = Date.now(); for (const t of kalTermine(j, j + 30 * 60e3)) { const k = t.ts + t.titel; if (KAL.erinnert[k]) continue; KAL.erinnert[k] = 1; kalSave();
  if (typeof toast === "function") toast("Erinnerung: " + t.titel + " um " + kalZeit(t.ts) + (t.ort ? " · " + t.ort : "")); } }, 20000);
// auch auf den Laptops (laptop.js zeigt HANDY_EXTRA-Apps im Fenster), dazu Gotham Hearts
if (typeof LT_APPS !== "undefined" && typeof LAPTOP_DEF !== "undefined") { LT_APPS.kalender = ["Kalender", "#4a8cff", '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10h16M8 4v4M16 4v4"/>']; LT_APPS.dating = ["Gotham Hearts", "#ff4f7e", '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'];
  for (const id in LAPTOP_DEF) LAPTOP_DEF[id].apps.push("kalender", "dating"); }
// andere App oeffnen: auf dem Laptop im Laptop-Fenster, sonst auf dem Handy
function kalOeffne(app) { if (typeof laptopIsOpen === "function" && laptopIsOpen() && typeof LT !== "undefined") { LT.app = app; ltRender(); if (typeof ltScreenDraw === "function") ltScreenDraw(LT.cur); return; } if (typeof handyGo === "function") handyGo(app); }
if (typeof HANDY_APPS !== "undefined") { HANDY_APPS.push(["kalender", "Kalender", '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10h16M8 4v4M16 4v4"/><circle cx="12" cy="15" r="1.6" fill="currentColor"/>']); for (const m in HANDY_MODELLE) HANDY_MODELLE[m].apps.push("kalender"); }
(window.HANDY_EXTRA = window.HANDY_EXTRA || {}).kalender = { url: "kalender.wayne", render: kalRender, click: kalClick };
{ const st = document.createElement("style"); st.textContent = `
.h-phone.quer .kal,.lt-hx .kal{display:flex;gap:22px;align-items:flex-start;max-width:820px;margin:0 auto}.h-phone.quer .kal-l,.lt-hx .kal-l{flex:1.1;position:sticky;top:0}.h-phone.quer .kal-r,.lt-hx .kal-r{flex:1}.h-phone.quer .kal-r>.kal-lab:first-child,.lt-hx .kal-r>.kal-lab:first-child{margin-top:2px}
.kal{padding:4px 12px 14px;color:#e8ecf2;font-family:system-ui,sans-serif}.kal-kopf{display:flex;align-items:center;justify-content:space-between;margin:2px 0 8px}.kal-kopf b{font:700 16px system-ui}
.kal-kopf button{border:0;background:#1a2230;color:#9fc4ff;font-size:20px;width:34px;height:30px;border-radius:8px;cursor:pointer}
.kal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.kal-wt{text-align:center;font-size:10px;opacity:.55;padding:2px 0}
.kal-d{position:relative;aspect-ratio:1;border:0;border-radius:8px;background:#141a24;color:#dde3ec;font:600 12px system-ui;cursor:pointer;padding:0}.kal-d.heute{box-shadow:inset 0 0 0 2px #4a8cff}.kal-d.sel{background:#4a8cff;color:#fff}
.kal-d i{position:absolute;left:0;right:0;bottom:3px;display:flex;justify-content:center;gap:2px}.kal-d em{width:5px;height:5px;border-radius:50%}
.kal-lab{margin:12px 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:.6}.kal-leer{font-size:12px;opacity:.55;padding:4px 0}
.kal-t{background:#141a24;border-left:4px solid;border-radius:8px;padding:7px 9px;margin:5px 0}.kal-t b{display:block;font-size:13px}.kal-t span{font-size:11px;opacity:.7}
.kal-k{display:flex;gap:6px;margin-top:6px}.kal-k button,.kal-neu button,.kal-plus{border:0;border-radius:14px;padding:6px 10px;background:#24324a;color:#cfe0ff;font:600 11px system-ui;cursor:pointer}.kal-k button.weg,.kal-neu button.weg{background:#3a1c22;color:#ffc0c8}
.kal-plus{display:block;width:100%;margin-top:8px;padding:8px}.kal-neu{display:flex;flex-direction:column;gap:5px;margin-top:8px}.kal-neu button{text-align:left}
.dg-kal{display:block;margin:6px auto 0;border:0;border-radius:12px;padding:5px 12px;background:#1d2c4a;color:#bcd4ff;font:600 12px system-ui;cursor:pointer}`; document.head.appendChild(st); }
