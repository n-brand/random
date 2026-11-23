// sw.js erzeugen: ASSETS und CACHE automatisch (Nicolas 2026-11-23, Strukturbewertung Schritt 2, Variante A).
// Aufruf im Projektordner:  node tools/sw-build.js           schreibt sw.js neu (nur den Block zwischen den Markierungen und die CACHE-Zeile)
//                            node tools/sw-build.js --check   zeigt nur, was sich aendern wuerde (nichts schreiben)
// Quellen (nur noch je an einer Stelle pflegen):
//   - index.html: href und img aller Eintraege (ENTRIES, PRUEFUNG, BLOCKBENCH); ausser LAZY und der Batverse-Welt
//   - sw.js ASSETS_EXTRA: Dateien, die sich nicht aus index.html ergeben (Startseite, Icons, Bibliotheken, Zusatzdateien einzelner Eintraege)
//   - sw.js BV_KEEP: Batverse-Pfade, die offline gehen (Werkstatt, Planung, deren Skripte); Ordner werden mit ihrem Inhalt aufgenommen
// CACHE = "random-" + Pruefsumme ueber die Inhalte aller Offline-Dateien und sw.js selbst (ohne den erzeugten Teil):
// aendert sich genau dann, wenn sich etwas aendert, das offline gespeichert wird. Kein Hochzaehlen von Hand mehr.
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.join(__dirname, ".."), SW = path.join(ROOT, "sw.js"), CHECK = process.argv.includes("--check");
const src = fs.readFileSync(SW, "utf8");
const A0 = "// <auto: ASSETS (tools/sw-build.js, nicht von Hand aendern)>", A1 = "// </auto>";
if (!src.includes(A0) || !src.includes(A1)) throw new Error("Markierungen fuer ASSETS fehlen in sw.js");
// sw.js auswerten (Ereignisse ausgeschaltet), um ASSETS_EXTRA, LAZY, BV_KEEP und isWorld zu lesen
const SWO = new Function("self", "caches", "location", src + ";return { ASSETS_EXTRA, LAZY, BV_KEEP, isWorld, ASSETS };")({ addEventListener() {} }, {}, { origin: "http://localhost" });
const extern = u => /^https?:/.test(u), abs = u => "http://localhost/" + u;
// 1) Eintraege der Startseite
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), refs = [...html.matchAll(/\b(?:href|img):\s*"([^"]+)"/g)].map(m => m[1]).filter(u => !extern(u));
const eintraege = refs.filter(u => !SWO.LAZY.includes(u) && !SWO.isWorld(abs(u)));
// 2) Batverse aus BV_KEEP (Ordner rekursiv, index.html als Ordner-Adresse, Welt-Ausnahmen wie gotham/stadt.js weglassen)
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const BV = "sachen/batverse/", bv = [];
for (const k of SWO.BV_KEEP) { const p = path.join(ROOT, BV, k);
  if (k.endsWith("/")) { if (!fs.existsSync(p)) continue; for (const f of walk(p)) { const r = BV + path.relative(path.join(ROOT, BV), f).split(path.sep).join("/"); bv.push(r.endsWith("/index.html") ? r.slice(0, -10) : r); } }
  else if (fs.existsSync(p)) bv.push(BV + k); else console.warn("BV_KEEP: Datei fehlt:", k); }
const batverse = bv.filter(u => !SWO.isWorld(abs(u)));
// 3) zusammen, ohne Doppelte, Reihenfolge: Extra, Eintraege, Batverse
const ASSETS = [...new Set([...SWO.ASSETS_EXTRA, ...eintraege, ...batverse])];
const fehlt = ASSETS.filter(u => !extern(u) && !fs.existsSync(path.join(ROOT, u.endsWith("/") || u === "./" ? path.join(u, "index.html") : u)));
if (fehlt.length) { console.error("Fehlende Dateien:", fehlt.join(" ")); process.exit(1); }
// 4) Pruefsumme
const h = crypto.createHash("sha1");
for (const u of [...ASSETS].sort()) { h.update(u + "\n"); if (!extern(u)) h.update(fs.readFileSync(path.join(ROOT, u.endsWith("/") || u === "./" ? path.join(u, "index.html") : u))); }
for (const u of SWO.LAZY) { h.update("lazy " + u + "\n"); }
const ohneAuto = src.slice(0, src.indexOf(A0)) + src.slice(src.indexOf(A1)); h.update(ohneAuto.replace(/const CACHE = "[^"]*";/, ""));
const CACHE = "random-" + h.digest("hex").slice(0, 10);
// 5) Vergleich mit dem bisherigen Stand
const alt = new Set(SWO.ASSETS), neu = new Set(ASSETS), weg = [...alt].filter(u => !neu.has(u)), dazu = [...neu].filter(u => !alt.has(u));
console.log("ASSETS:", ASSETS.length, "(Extra " + SWO.ASSETS_EXTRA.length + ", Eintraege " + eintraege.length + ", Batverse " + batverse.length + ")");
if (weg.length) console.log("entfaellt:", weg.join(" ")); if (dazu.length) console.log("neu:", dazu.join(" "));
const out = src.replace(/const CACHE = "[^"]*";/, `const CACHE = "${CACHE}";`).replace(src.slice(src.indexOf(A0), src.indexOf(A1) + A1.length),
  A0 + "\nconst ASSETS = [\n" + ASSETS.map(u => "  " + JSON.stringify(u)).join(",\n") + "\n];\n" + A1);
if (out === src) { console.log("sw.js ist aktuell (" + CACHE + ")"); process.exit(0); }
if (CHECK) { console.log("wuerde schreiben: CACHE " + CACHE); process.exit(0); }
fs.writeFileSync(SW, out); console.log("sw.js geschrieben: CACHE " + CACHE);
