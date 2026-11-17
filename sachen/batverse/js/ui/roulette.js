// Batverse – Roulette im Casino (Nicolas 2026-11-17: "man soll im Casino Roulette spielen koennen"). Spiel und Werkstatt; nach ui/konto.js laden.
// Europaeisches Roulette 0-36 (Kesselreihenfolge echt). Einsaetze mit Jetons aus dem Inventar (jetons.js: jetWert/jetTake/jetGive; Nicolas 2026-11-17: Jeton-Automat), Gewinne als Jetons zurueck.
// Wetten: Zahl 35:1, Kolonne und Dutzend 2:1, 1-18 / 19-36 / Gerade / Ungerade / Rot / Schwarz 1:1. Jetons 10 bis 5 000 $; Linksklick setzt, Rechtsklick nimmt weg.
// Offen: rouletteOpen(), rouletteClose(), rouletteIsOpen(). Solange offen gehen keine Tasten ans Spiel; Esc schliesst (nicht waehrend der Kessel dreht).
"use strict";
const RL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RL_RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const RL_CHIPS = [10, 50, 100, 500, 1000, 5000];
const RL = { el: null, chip: 100, bets: {}, last: {}, hist: [], spin: null, rot: 0, ball: 0, msg: "Jetons setzen, dann DREHEN", win: null };
const rlCol = n => n === 0 ? "#0f8a3c" : RL_RED.has(n) ? "#c41e2a" : "#141414";
// Wetten: Schluessel -> { nums, pay }
function rlBet(k) { if (k.startsWith("n")) return { nums: [+k.slice(1)], pay: 35 };
  const R = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i), all = R(1, 36);
  const T = { rot: [all.filter(n => RL_RED.has(n)), 1], schwarz: [all.filter(n => !RL_RED.has(n)), 1], gerade: [all.filter(n => n % 2 === 0), 1], ungerade: [all.filter(n => n % 2), 1], tief: [R(1, 18), 1], hoch: [R(19, 36), 1],
    d1: [R(1, 12), 2], d2: [R(13, 24), 2], d3: [R(25, 36), 2], k1: [all.filter(n => n % 3 === 1), 2], k2: [all.filter(n => n % 3 === 2), 2], k3: [all.filter(n => n % 3 === 0), 2] }[k];
  return { nums: T[0], pay: T[1] }; }
const rlSum = () => Object.values(RL.bets).reduce((a, b) => a + b, 0);
const rlFmt = n => typeof kontoFmt === "function" ? kontoFmt(n) : n + " $";
const RL_CSS = `
#roulette{position:fixed;inset:0;z-index:43;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);font-family:"Segoe UI",system-ui,sans-serif;color:#f4ecd8}
#roulette[hidden]{display:none}
.rl-box{position:relative;width:1080px;padding:18px 22px;border-radius:22px;background:radial-gradient(ellipse at 50% 30%,#13693a,#0a3d22 70%);box-shadow:0 0 0 10px #4a2a14,0 0 0 13px #c9973a,0 24px 70px rgba(0,0,0,.7);transform-origin:center}
.rl-top{display:flex;gap:22px;align-items:center}
.rl-wheel{width:300px;height:300px;flex:none;border-radius:50%;box-shadow:0 0 0 6px #3a2010,0 10px 30px rgba(0,0,0,.6)}
.rl-side{flex:1;display:flex;flex-direction:column;gap:10px}
.rl-head{display:flex;justify-content:space-between;align-items:center}.rl-head h2{margin:0;font:700 30px Georgia,serif;letter-spacing:.06em;color:#f1d58a}
.rl-x{width:38px;height:38px;border:0;border-radius:50%;background:rgba(0,0,0,.35);color:#fff;font-size:20px;cursor:pointer}
.rl-msg{min-height:44px;font-size:17px;font-weight:600;padding:8px 14px;border-radius:10px;background:rgba(0,0,0,.28)}.rl-msg.win{color:#7dff9a}.rl-msg.lose{color:#ffb3b3}
.rl-info{display:flex;gap:18px;font-size:15px}.rl-info b{color:#7dff9a}
.rl-hist{display:flex;gap:5px;flex-wrap:wrap;min-height:28px}.rl-hist span{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;color:#fff;border:1px solid rgba(255,255,255,.35)}
.rl-chips{display:flex;gap:8px;align-items:center}.rl-chip{width:52px;height:52px;border-radius:50%;border:4px dashed rgba(255,255,255,.85);color:#fff;font:800 13px "Segoe UI",sans-serif;cursor:pointer;box-shadow:0 3px 6px rgba(0,0,0,.5)}.rl-chip.on{outline:3px solid #ffe08a;outline-offset:3px}
.rl-acts{display:flex;gap:10px}.rl-btn{padding:10px 18px;border:0;border-radius:9px;font:800 15px "Segoe UI",sans-serif;cursor:pointer;color:#fff;background:#6b4a1e}.rl-btn.go{background:#c9973a;color:#1b1206;font-size:18px;padding:10px 30px}.rl-btn:disabled{opacity:.45;cursor:default}
.rl-table{display:grid;grid-template-columns:56px repeat(12,1fr) 64px;grid-template-rows:repeat(3,52px) 44px 44px;gap:3px;margin-top:14px;user-select:none}
.rl-c{position:relative;display:grid;place-items:center;border:2px solid rgba(241,213,138,.75);border-radius:4px;font:800 17px "Segoe UI",sans-serif;cursor:pointer;color:#fff}.rl-c:hover{box-shadow:inset 0 0 0 3px #ffe08a}
.rl-c.won{box-shadow:inset 0 0 0 4px #7dff9a,0 0 14px #7dff9a}
.rl-c i{position:absolute;right:2px;bottom:2px;min-width:26px;height:26px;padding:0 3px;border-radius:13px;background:#f1d58a;color:#1b1206;font:800 11px/26px "Segoe UI",sans-serif;font-style:normal;box-shadow:0 2px 4px rgba(0,0,0,.6);border:2px dashed #8a6c2c}
`;
function rlEnsure() {
  if (RL.el) return RL.el; const st = document.createElement("style"); st.textContent = RL_CSS; document.head.appendChild(st);
  const el = document.createElement("div"); el.id = "roulette"; el.hidden = true; document.body.appendChild(el); RL.el = el;
  el.addEventListener("click", rlClick); el.addEventListener("contextmenu", e => { e.preventDefault(); const c = e.target.closest("[data-b]"); if (c) rlPlace(c.dataset.b, -1); });
  addEventListener("keydown", e => { if (!rouletteIsOpen()) return; if (e.key === "Escape" && !RL.spin) { e.preventDefault(); rouletteClose(); } else if (e.code === "Space" && !RL.spin) { e.preventDefault(); rlSpin(); } e.stopImmediatePropagation(); }, true);
  addEventListener("keyup", e => { if (rouletteIsOpen()) e.stopImmediatePropagation(); }, true);
  addEventListener("resize", () => { if (rouletteIsOpen()) rlFit(); });
  return el;
}
function rlFit() { const b = RL.el.querySelector(".rl-box"); if (!b) return; b.style.transform = ""; const k = Math.min(1, (innerWidth - 30) / (b.offsetWidth + 30), (innerHeight - 30) / (b.offsetHeight + 30)); b.style.transform = k < 1 ? "scale(" + k.toFixed(3) + ")" : ""; }
const rouletteIsOpen = () => !!(RL.el && !RL.el.hidden);
function rouletteOpen() { rlEnsure(); if (typeof dragging !== "undefined" && dragging) { dragging = false; document.body.classList.remove("looking"); } if (document.pointerLockElement) document.exitPointerLock(); if (typeof keys !== "undefined" && keys.clear) keys.clear();
  RL.el.hidden = false; RL.win = null; RL.msg = jetWert() > 0 ? "Jetons setzen, dann DREHEN (Leertaste)" : "Keine Jetons – am Jeton-Automaten oder an der Kasse kaufen"; rlRender(); rlDraw(); }
function rouletteClose() { if (!rouletteIsOpen() || RL.spin) return; if (rlSum()) { jetGive(rlSum()); RL.bets = {}; } RL.el.hidden = true; if (typeof grabMouse === "function") grabMouse(); }   // offene Einsaetze zurueck ins Bargeld
// Jeton setzen (dir 1) bzw. wegnehmen (dir -1); Einsatz wird sofort von den Jetons im Inventar genommen
function rlPlace(k, dir) { if (RL.spin) return; if (RL.win) { RL.win = null; }
  if (dir > 0) { const v = RL.chip; if (!jetTake(v)) { RL.msg = "Nicht genug Jetons für " + rlFmt(v) + " (Jeton-Automat oder Kasse)"; return rlRender(); } RL.bets[k] = (RL.bets[k] || 0) + v; }
  else { const have = RL.bets[k] || 0; if (!have) return; const v = Math.min(have, RL.chip); RL.bets[k] = have - v; if (!RL.bets[k]) delete RL.bets[k]; jetGive(v); }
  RL.msg = "Einsatz " + rlFmt(rlSum()); rlRender(); }
function rlClick(e) { const b = e.target.closest("button,[data-b]"); if (!b) return; b.blur?.();
  if (b.dataset.b) return rlPlace(b.dataset.b, 1);
  if (b.dataset.chip) { RL.chip = +b.dataset.chip; return rlRender(); }
  const a = b.dataset.a; if (a === "zu") return rouletteClose(); if (a === "drehen") return rlSpin();
  if (a === "loeschen" && !RL.spin) { if (rlSum()) jetGive(rlSum()); RL.bets = {}; RL.msg = "Einsätze zurückgenommen"; RL.win = null; return rlRender(); }
  if (a === "nochmal" && !RL.spin) { const need = Object.values(RL.last).reduce((x, y) => x + y, 0); if (!need) return; if (jetWert() + rlSum() < need) { RL.msg = "Nicht genug Jetons für den gleichen Einsatz (" + rlFmt(need) + ")"; return rlRender(); }
    if (rlSum()) jetGive(rlSum()); jetTake(need); RL.bets = { ...RL.last }; RL.win = null; RL.msg = "Gleicher Einsatz: " + rlFmt(need); return rlRender(); } }
// Drehen: Kessel 5 s, Kugel laeuft gegen, Ergebnis zufaellig
function rlSpin() { if (RL.spin || !rlSum()) { if (!rlSum()) { RL.msg = "Zuerst Jetons setzen"; rlRender(); } return; }
  const n = Math.floor(Math.random() * 37), idx = RL_ORDER.indexOf(n), seg = Math.PI * 2 / 37;
  // Endlage: Kugelwinkel (Weltwinkel) = Rad-Winkel + Fach-Mitte; Rad dreht 3 Runden weiter, Kugel 7 Runden rueckwaerts
  const r0 = RL.rot, r1 = r0 + Math.PI * 2 * 3 + Math.random() * 1.2, b1 = r1 + (idx + 0.5) * seg - Math.PI / 2, b0 = b1 + Math.PI * 2 * 7;
  RL.spin = { n, r0, r1, b0, b1, t0: performance.now(), dur: 5200 }; RL.win = null; RL.msg = "Nichts geht mehr …"; rlRender(); requestAnimationFrame(rlAnim); }
function rlAnim(t) { const S = RL.spin; if (!S) return; const u = Math.min(1, (t - S.t0) / S.dur), e = 1 - Math.pow(1 - u, 3);
  RL.rot = S.r0 + (S.r1 - S.r0) * e; RL.ball = S.b0 + (S.b1 - S.b0) * (1 - Math.pow(1 - u, 2.2)); RL.ballR = u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25 * 0.22; rlDraw();
  if (u < 1) return requestAnimationFrame(rlAnim);
  const n = S.n, stake = rlSum(); let win = 0, back = 0; for (const [k, v] of Object.entries(RL.bets)) { const B = rlBet(k); if (B.nums.includes(n)) { win += v * B.pay; back += v; } }
  RL.last = { ...RL.bets }; RL.bets = {}; RL.spin = null; RL.hist.unshift(n); RL.hist.length = Math.min(RL.hist.length, 14);
  if (win) jetGive(win + back); RL.win = n;
  RL.msg = (n === 0 ? "0 Grün" : n + (RL_RED.has(n) ? " Rot" : " Schwarz")) + (win ? " – Auszahlung " + rlFmt(win + back) + " (netto " + (win + back - stake >= 0 ? "+" : "") + rlFmt(win + back - stake) + ")" : " – leider verloren");
  RL.msgCls = win + back - stake > 0 ? "win" : "lose"; rlRender(); }
// Kessel zeichnen (Canvas)
function rlDraw() { const cv = RL.el && RL.el.querySelector(".rl-wheel"); if (!cv) return; const c = cv.getContext("2d"), W = cv.width, R = W / 2, seg = Math.PI * 2 / 37;
  c.clearRect(0, 0, W, W); c.save(); c.translate(R, R);
  c.fillStyle = "#3a2010"; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill(); c.fillStyle = "#5a3418"; c.beginPath(); c.arc(0, 0, R * 0.93, 0, 7); c.fill();
  c.save(); c.rotate(RL.rot);
  RL_ORDER.forEach((n, i) => { const a0 = i * seg - Math.PI / 2, a1 = a0 + seg; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R * 0.86, a0, a1); c.closePath(); c.fillStyle = rlCol(n); c.fill(); c.strokeStyle = "#c9973a"; c.lineWidth = 1; c.stroke();
    c.save(); c.rotate(a0 + seg / 2); c.fillStyle = "#fff"; c.font = "bold " + W * 0.04 + "px Arial"; c.textAlign = "center"; c.fillText(n, R * 0.77, W * 0.014); c.restore(); });
  c.fillStyle = "#4a2a14"; c.beginPath(); c.arc(0, 0, R * 0.62, 0, 7); c.fill(); c.strokeStyle = "#c9973a"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, R * 0.62, 0, 7); c.stroke();
  c.fillStyle = "#d4a640"; c.beginPath(); c.arc(0, 0, R * 0.16, 0, 7); c.fill(); for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 4); c.fillRect(-R * 0.36, -3, R * 0.72, 6); }
  c.restore();
  const br = R * 0.7 * (RL.ballR || 1); c.fillStyle = "#fff"; c.shadowColor = "#000"; c.shadowBlur = 6; c.beginPath(); c.arc(Math.cos(RL.ball) * br, Math.sin(RL.ball) * br, W * 0.022, 0, 7); c.fill(); c.shadowBlur = 0;
  c.restore(); }
function rlRender() {
  const el = RL.el; if (!el) return; const cell = (k, txt, bg, st = "") => '<div class="rl-c' + (RL.win !== null && rlBet(k).nums.includes(RL.win) ? " won" : "") + '" data-b="' + k + '" style="background:' + bg + ";" + st + '">' + txt + (RL.bets[k] ? "<i>" + (RL.bets[k] >= 1000 ? RL.bets[k] / 1000 + "k" : RL.bets[k]) + "</i>" : "") + "</div>";
  let t = cell("n0", "0", "#0f8a3c", "grid-row:1 / span 3;grid-column:1"); for (let r = 0; r < 3; r++) { for (let c = 0; c < 12; c++) { const n = c * 3 + 3 - r; t += cell("n" + n, n, rlCol(n), "grid-row:" + (r + 1) + ";grid-column:" + (c + 2)); } t += cell("k" + (3 - r), "2:1", "transparent", "grid-row:" + (r + 1) + ";grid-column:14"); }
  ["1. Dutzend", "2. Dutzend", "3. Dutzend"].forEach((s, i) => { t += cell("d" + (i + 1), s, "transparent", "grid-row:4;grid-column:" + (2 + i * 4) + " / span 4"); });
  [["tief", "1–18"], ["gerade", "GERADE"], ["rot", "ROT", "#c41e2a"], ["schwarz", "SCHWARZ", "#141414"], ["ungerade", "UNGERADE"], ["hoch", "19–36"]].forEach(([k, s, bg], i) => { t += cell(k, s, bg || "transparent", "grid-row:5;grid-column:" + (2 + i * 2) + " / span 2"); });
  const chipCol = { 10: "#2e6fd6", 50: "#c41e2a", 100: "#1b1b1b", 500: "#7b3fb8", 1000: "#d4a640", 5000: "#0f8a3c" }, last = Object.values(RL.last).reduce((a, b) => a + b, 0);
  el.innerHTML = '<div class="rl-box"><div class="rl-top"><canvas class="rl-wheel" width="600" height="600"></canvas><div class="rl-side"><div class="rl-head"><h2>ROULETTE</h2><button class="rl-x" data-a="zu" title="Verlassen (Esc)">&#10005;</button></div>' +
    '<div class="rl-msg ' + (RL.win !== null ? RL.msgCls : "") + '">' + RL.msg + '</div><div class="rl-info"><span>Jetons <b>' + rlFmt(jetWert()) + "</b></span><span>Einsatz <b>" + rlFmt(rlSum()) + '</b></span></div>' +
    '<div class="rl-hist">' + RL.hist.map(n => '<span style="background:' + rlCol(n) + '">' + n + "</span>").join("") + '</div>' +
    '<div class="rl-chips">' + RL_CHIPS.map(v => '<button class="rl-chip' + (RL.chip === v ? " on" : "") + '" data-chip="' + v + '" style="background:' + chipCol[v] + '">' + (v >= 1000 ? v / 1000 + "k" : v) + "</button>").join("") + "</div>" +
    '<div class="rl-acts"><button class="rl-btn go" data-a="drehen"' + (RL.spin ? " disabled" : "") + '>DREHEN</button><button class="rl-btn" data-a="loeschen"' + (RL.spin ? " disabled" : "") + '>Einsätze löschen</button><button class="rl-btn" data-a="nochmal"' + (RL.spin || !last ? " disabled" : "") + ">Gleicher Einsatz</button></div></div></div>" +
    '<div class="rl-table">' + t + "</div></div>";
  rlFit(); rlDraw(); }
