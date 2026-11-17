// Batverse – Spielfenster des Spielautomaten "einarmiger Bandit" (Nicolas 2026-11-17; Plan PLAN-SPIELAUTOMAT.md). Klassisches Skript, Spiel (FILES nach ui/jetons.js)
// und Werkstatt. Drei Walzen mit je 20 Feldern (fest gemischt), eine Gewinnlinie in der Mitte, Einsatz in Jetons (jetons.js: jetTake/jetGive/jetWert), Hebel ziehen
// (Maus nach unten ziehen oder klicken), DREHEN-Knopf oder Leertaste. Walzen halten nacheinander. Gewinnplan siehe SLOT_PAY (im Schnitt ca. 92 % zurueck).
// slotOpen(automat) – automat = 3D-Gruppe (Werkstatt-Projekt: Hebel bewegt sich mit, Bildschirm zeigt das Ergebnis) oder null (Casino, Instanzen).
"use strict";
const SLOT_STRIP_N = { "7": 1, D: 1, B: 2, G: 3, S: 3, L: 4, C: 6 };   // Felder je Symbol auf jeder Walze (20)
const SLOT_PAY3 = { "7": 200, D: 80, B: 40, G: 20, S: 12, L: 10, C: 8 }, SLOT_PAY2 = { "7": 10, D: 5, B: 3 }, SLOT_CHERRY2 = 2;
const SLOT_NAMES = { "7": "Sieben", D: "Diamant", B: "BAR", G: "Glocke", S: "Stern", L: "Zitrone", C: "Kirschen" };
const SLOT_BETS = [10, 50, 100, 500, 1000];
const SLOT = { el: null, bet: 100, spin: null, msg: "", cls: "", win: 0, hist: [], machine: null, pos: [0, 0, 0], strips: null, pull: 0 };
function slotStrips() { if (SLOT.strips) return SLOT.strips; const base = []; for (const [id, n] of Object.entries(SLOT_STRIP_N)) for (let i = 0; i < n; i++) base.push(SLOT_SYM.findIndex(s => s.id === id));
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return SLOT.strips = [0, 1, 2].map(() => { const a = base.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }); }
// Gewinn (Faktor) fuer die Symbole auf der Linie
function slotEval(ids) { const [a, b, c] = ids; if (a === b && b === c) return { k: SLOT_PAY3[a], t: "3 × " + SLOT_NAMES[a] };
  const ch = ids.filter(x => x === "C").length; if (ch === 2) return { k: SLOT_CHERRY2, t: "2 × Kirschen" };
  if (a === b && SLOT_PAY2[a]) return { k: SLOT_PAY2[a], t: "2 × " + SLOT_NAMES[a] }; return { k: 0, t: "" }; }
const SLOT_CSS = `
#slot { position: fixed; inset: 0; z-index: 61; display: grid; place-items: center; background: rgba(0,0,0,.6); font: 14px "Segoe UI", Arial, sans-serif; color: #fff; user-select: none; }
#slot[hidden] { display: none; }
#slot .sl-wrap { position: absolute; left: 50%; top: 50%; display: flex; align-items: center; gap: 0; transform: translate(-50%, -50%); }
#slot .sl-box { width: 520px; padding: 16px 20px 18px; border-radius: 26px 26px 14px 14px; background: linear-gradient(160deg, #5a1690 0%, #2a0a4a 55%, #160628 100%); border: 3px solid #d4a640; box-shadow: 0 0 0 5px #1a0a24, 0 20px 60px rgba(0,0,0,.7), inset 0 0 60px rgba(255,180,60,.12); }
#slot .sl-top { position: relative; margin: -4px -6px 12px; padding: 10px 0 8px; border-radius: 16px; background: #12030c; text-align: center; overflow: hidden; }
#slot .sl-top b { font: 900 30px "Arial Black", Arial, sans-serif; letter-spacing: .06em; color: #ffd23a; text-shadow: 0 0 12px #ff2a55, 0 2px 0 #7a1020; }
#slot .sl-top small { display: block; font-size: 11px; letter-spacing: .3em; color: #ff9cc5; }
#slot .sl-bulbs { position: absolute; left: 6px; right: 6px; height: 6px; background: radial-gradient(circle, #ffe9a0 2.5px, transparent 3px) 0 0 / 14px 6px repeat-x; animation: sl-run .6s steps(2) infinite; }
#slot .sl-bulbs.a { top: 3px; } #slot .sl-bulbs.b { bottom: 3px; animation-direction: reverse; }
@keyframes sl-run { to { background-position: 14px 0; } }
#slot .sl-reels { position: relative; padding: 10px; border-radius: 12px; background: linear-gradient(#c9ccd1, #8a8f96); box-shadow: inset 0 2px 8px rgba(0,0,0,.5); }
#slot canvas { display: block; width: 456px; height: 228px; border-radius: 6px; }
/* Gewinnreihe (Nicolas 2026-11-17: "die rote Linie verdeckt die Symbole"): Rahmen ueber und unter der mittleren Reihe plus Pfeile links/rechts ausserhalb der Walzen, nichts liegt auf den Symbolen */
#slot .sl-line { position: absolute; left: 10px; right: 10px; top: calc(10px + (100% - 20px) / 3); height: calc((100% - 20px) / 3); border-top: 3px solid #e0102a; border-bottom: 3px solid #e0102a; box-sizing: border-box; pointer-events: none; box-shadow: 0 -4px 8px -4px #ff2a55, 0 4px 8px -4px #ff2a55; }
#slot .sl-line::before, #slot .sl-line::after { content: ""; position: absolute; top: 50%; margin-top: -9px; border: 9px solid transparent; }
#slot .sl-line::before { left: -18px; border-left-color: #e0102a; } #slot .sl-line::after { right: -18px; border-right-color: #e0102a; }
#slot .sl-line.win { animation: sl-blink .25s steps(2) 8; border-color: #3aff7a; background: rgba(58,255,122,.14); box-shadow: 0 0 16px #3aff7a; }
#slot .sl-line.win::before { border-left-color: #3aff7a; } #slot .sl-line.win::after { border-right-color: #3aff7a; }
@keyframes sl-blink { 50% { opacity: .35; } }
#slot .sl-msg { min-height: 26px; margin: 10px 0 6px; text-align: center; font-size: 17px; font-weight: 800; color: #ffd23a; text-shadow: 0 1px 0 #000; }
#slot .sl-msg.win { color: #3aff7a; } #slot .sl-msg.err { color: #ff8a8a; font-size: 14px; }
#slot .sl-info { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
#slot .sl-info div { background: #0c0414; border: 1px solid #6a3a9a; border-radius: 9px; padding: 6px 10px; font-size: 11px; color: #c9a8f0; text-transform: uppercase; letter-spacing: .08em; }
#slot .sl-info b { display: block; font: 800 18px "Consolas", "Segoe UI", monospace; color: #ff5a6a; letter-spacing: 0; text-transform: none; text-shadow: 0 0 6px rgba(255,60,80,.6); }
#slot .sl-info .w b { color: #3aff7a; text-shadow: 0 0 6px rgba(60,255,120,.5); } #slot .sl-info .j b { color: #ffd23a; text-shadow: 0 0 6px rgba(255,210,60,.5); }
#slot .sl-bets { display: flex; gap: 6px; margin-top: 10px; }
#slot .sl-bets button { flex: 1; padding: 8px 0; border-radius: 9px; border: 2px solid #3a1a5a; background: linear-gradient(#f2f3f5, #b9bec6); color: #1a0a24; font: 800 13px "Segoe UI", Arial; cursor: pointer; }
#slot .sl-bets button.on { border-color: #ffd23a; background: linear-gradient(#ffe680, #f0b81a); box-shadow: 0 0 10px #ffd23a; }   /* ohne weissen Punkt (Nicolas 2026-11-17: "was sind das fuer Kreise auf den Knoepfen") */
#slot .sl-acts { display: flex; gap: 8px; margin-top: 10px; }
#slot .sl-spin { flex: 2; padding: 12px 0; border-radius: 12px; border: 0; background: radial-gradient(circle at 50% 30%, #ff6a7a, #c8101e 60%, #7a0010); color: #fff; font: 900 20px "Arial Black", Arial; letter-spacing: .08em; cursor: pointer; box-shadow: 0 4px 0 #4a0008, 0 0 16px rgba(255,40,60,.5); }
#slot .sl-spin:active { transform: translateY(3px); box-shadow: 0 1px 0 #4a0008; } #slot .sl-spin:disabled { filter: grayscale(.7) brightness(.7); cursor: default; }
#slot .sl-btn { flex: 1; padding: 10px 0; border-radius: 12px; border: 1px solid #6a3a9a; background: #1a0a2a; color: #e8d8ff; font: 700 13px "Segoe UI", Arial; cursor: pointer; }
/* Gewinnplan als feste Tafel links neben dem Automaten (Nicolas 2026-11-17: "links neben dem Automaten, ohne Ein- und Ausklappen") */
#slot .sl-pay { align-self: center; width: 230px; margin-right: 14px; padding: 12px 14px 14px; border-radius: 16px; background: linear-gradient(160deg, #2a0a4a, #12051f); border: 3px solid #d4a640; box-shadow: 0 0 0 4px #1a0a24, 0 14px 40px rgba(0,0,0,.6); font-size: 13px; }
#slot .sl-pay h3 { margin: 0 0 8px; text-align: center; font: 900 18px "Arial Black", Arial, sans-serif; letter-spacing: .08em; color: #ffd23a; text-shadow: 0 0 10px #ff2a55; }
#slot .sl-pay div { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 3px 4px; border-bottom: 1px solid rgba(212,166,64,.18); } #slot .sl-pay div:last-of-type { border-bottom: 0; }
#slot .sl-pay canvas { width: 84px; height: 28px; } #slot .sl-pay b { color: #ffd23a; font-size: 15px; white-space: nowrap; }
#slot .sl-pay small { display: block; margin-top: 8px; font-size: 11px; color: #a88ad0; text-align: center; }
#slot .sl-hist { margin-top: 8px; font-size: 11px; color: #a88ad0; text-align: center; min-height: 14px; }
#slot .sl-arm { position: relative; width: 54px; height: 300px; margin-left: -6px; }
#slot .sl-arm .hub { position: absolute; left: 0; top: 150px; width: 26px; height: 46px; border-radius: 0 12px 12px 0; background: linear-gradient(90deg, #8a8f96, #e8ecf0, #8a8f96); }
#slot .sl-arm .rod { position: absolute; z-index: 1; left: 8px; bottom: 148px; width: 10px; height: 132px; margin-left: 0; border-radius: 5px; background: linear-gradient(90deg, #9aa0a6, #f4f6f8, #9aa0a6); transform-origin: 50% 100%; cursor: grab; }
#slot .sl-arm .rod::before { content: ""; position: absolute; left: 50%; top: -30px; width: 40px; height: 40px; margin-left: -20px; transform: scale(var(--k, 1)); transform-origin: 50% 75%; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ff9aa4, #d0102a 55%, #6a0010); box-shadow: 0 3px 8px rgba(0,0,0,.6); }
#slot .sl-foot { margin-top: 6px; font-size: 11px; text-align: center; color: #8a6ab0; }`;
function slotEnsure() {
  if (SLOT.el) return SLOT.el; const st = document.createElement("style"); st.textContent = SLOT_CSS; document.head.appendChild(st);
  const el = document.createElement("div"); el.id = "slot"; el.hidden = true; document.body.appendChild(el); SLOT.el = el;
  el.innerHTML = '<div class="sl-wrap"><div class="sl-pay"><h3>GEWINNPLAN</h3></div><div class="sl-box"><div class="sl-top"><div class="sl-bulbs a"></div><b>GOTHAM FORTUNE</b><small>EINARMIGER BANDIT</small><div class="sl-bulbs b"></div></div>' +
    '<div class="sl-reels"><canvas width="912" height="456"></canvas><div class="sl-line"></div></div><div class="sl-msg"></div>' +
    '<div class="sl-info"><div class="j">Jetons<b data-v="jet"></b></div><div>Einsatz<b data-v="bet"></b></div><div class="w">Gewinn<b data-v="win"></b></div></div>' +
    '<div class="sl-bets">' + SLOT_BETS.map(v => '<button data-bet="' + v + '">' + (v >= 1000 ? v / 1000 + "K" : v) + "</button>").join("") + "</div>" +
    '<div class="sl-acts"><button class="sl-spin" data-a="spin">DREHEN</button><button class="sl-btn" data-a="zu">Verlassen</button></div>' +
    '<div class="sl-hist"></div><div class="sl-foot">Hebel ziehen, DREHEN oder Leertaste · Esc schließt · Jetons am Jeton-Automaten oder an der Kasse</div></div>' +
    '<div class="sl-arm"><div class="hub"></div><div class="rod" title="Hebel ziehen"></div></div></div>';
  // Gewinnplan mit gezeichneten Symbolen
  const pay = el.querySelector(".sl-pay"), row = (ids, k) => { const d = document.createElement("div"), cv = document.createElement("canvas"); cv.width = 132; cv.height = 44; const c = cv.getContext("2d"); ids.forEach((id, i) => id && slotSymDraw(c, id, 22 + i * 44, 22, 38)); d.append(cv); d.insertAdjacentHTML("beforeend", "<b>× " + k + "</b>"); pay.append(d); };
  for (const id of ["7", "D", "B", "G", "S", "L", "C"]) row([id, id, id], SLOT_PAY3[id]);
  for (const id of ["7", "D", "B"]) row([id, id, ""], SLOT_PAY2[id]); row(["C", "C", ""], SLOT_CHERRY2); pay.insertAdjacentHTML("beforeend", "<small>Gewinn = Einsatz × Faktor, nur die rote Linie zählt. Zwei Kirschen zählen überall auf der Linie, die anderen Paare nur auf den ersten zwei Walzen.</small>");
  el.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) { if (e.target === el && !SLOT.spin) slotClose(); return; } b.blur();
    if (b.dataset.bet && !SLOT.spin) { SLOT.bet = +b.dataset.bet; slotRender(); } else if (b.dataset.a === "spin") slotSpin(); else if (b.dataset.a === "zu") slotClose();  });
  // Hebel: nach unten ziehen (oder klicken) loest aus
  const rod = el.querySelector(".rod"); let drag = null;
  rod.addEventListener("pointerdown", e => { if (SLOT.spin) return; drag = { y: e.clientY }; try { rod.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); });
  rod.addEventListener("pointermove", e => { if (!drag) return; SLOT.pull = Math.max(0, Math.min(1, (e.clientY - drag.y) / 120)); slotArm(); });
  rod.addEventListener("pointerup", () => { if (!drag) return; drag = null; const p = SLOT.pull; if (p > 0.6 || p < 0.05) slotSpin(); else slotArmBack(); });
  addEventListener("keydown", e => { if (!slotIsOpen()) return; if (e.key === "Escape" && !SLOT.spin) { e.preventDefault(); slotClose(); } else if (e.code === "Space") { e.preventDefault(); if (!e.repeat) slotSpin(); } e.stopImmediatePropagation(); }, true);
  addEventListener("keyup", e => { if (slotIsOpen()) e.stopImmediatePropagation(); }, true);
  addEventListener("resize", () => { if (slotIsOpen()) slotFit(); });
  return el;
}
function slotFit() { const b = SLOT.el.querySelector(".sl-wrap"); const k = Math.min(1, (innerWidth - 20) / (b.offsetWidth + 20), (innerHeight - 20) / (b.offsetHeight + 20)); b.style.transform = "translate(-50%, -50%) scale(" + k.toFixed(3) + ")"; }   // Mitte des Fensters, passend verkleinert
const slotIsOpen = () => !!(SLOT.el && !SLOT.el.hidden);
function slotOpen(machine) { slotEnsure(); if (typeof dragging !== "undefined" && dragging) { dragging = false; document.body.classList.remove("looking"); } if (document.pointerLockElement) document.exitPointerLock(); if (typeof keys !== "undefined" && keys.clear) keys.clear();
  SLOT.machine = machine || null; SLOT.el.hidden = false; SLOT.win = 0; const j = typeof jetWert === "function" ? jetWert() : 0;
  SLOT.msg = j ? "Einsatz wählen, Hebel ziehen" : "Keine Jetons – am Jeton-Automaten oder an der Kasse kaufen"; SLOT.cls = j ? "" : "err"; slotRender(); slotDraw(); slotFit(); }
function slotClose() { if (!slotIsOpen() || SLOT.spin) return; SLOT.el.hidden = true; if (typeof grabMouse === "function") grabMouse(); }
function slotRender() { const el = SLOT.el; if (!el) return; const f = n => (typeof kontoFmt === "function" ? kontoFmt(n) : n + " $");
  el.querySelector('[data-v="jet"]').textContent = f(typeof jetWert === "function" ? jetWert() : 0); el.querySelector('[data-v="bet"]').textContent = f(SLOT.bet); el.querySelector('[data-v="win"]').textContent = f(SLOT.win);
  el.querySelectorAll("[data-bet]").forEach(b => b.classList.toggle("on", +b.dataset.bet === SLOT.bet)); el.querySelector(".sl-spin").disabled = !!SLOT.spin;
  const m = el.querySelector(".sl-msg"); m.textContent = SLOT.msg; m.className = "sl-msg " + SLOT.cls;
  el.querySelector(".sl-hist").textContent = SLOT.hist.length ? "Letzte: " + SLOT.hist.join(" · ") : ""; }
// Walzen zeichnen: je Walze 3 sichtbare Felder um die Position (Bruchteil = Verschiebung)
function slotDraw() { const cv = SLOT.el && SLOT.el.querySelector(".sl-reels canvas"); if (!cv) return; const c = cv.getContext("2d"), W = cv.width, H = cv.height, S = slotStrips(), rw = W / 3, fh = H / 3;
  c.clearRect(0, 0, W, H);
  for (let r = 0; r < 3; r++) { const x0 = r * rw; c.save(); c.beginPath(); c.rect(x0 + 6, 0, rw - 12, H); c.clip();
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#8a8a8a"); g.addColorStop(0.18, "#f4f4f4"); g.addColorStop(0.5, "#ffffff"); g.addColorStop(0.82, "#f4f4f4"); g.addColorStop(1, "#8a8a8a"); c.fillStyle = g; c.fillRect(x0 + 6, 0, rw - 12, H);
    const p = SLOT.pos[r], base = Math.floor(p), fr = p - base, blur = SLOT.spin && !SLOT.spin.done[r];
    for (let k = -2; k <= 2; k++) { const idx = ((base + k) % 20 + 20) % 20, y = H / 2 + (k - fr) * fh; if (y < -fh || y > H + fh) continue;
      if (blur) { c.globalAlpha = 0.55; slotSymDraw(c, SLOT_SYM[S[r][idx]].id, x0 + rw / 2, y - 14, fh * 0.78); c.globalAlpha = 0.3; slotSymDraw(c, SLOT_SYM[S[r][idx]].id, x0 + rw / 2, y + 14, fh * 0.78); c.globalAlpha = 1; }
      else slotSymDraw(c, SLOT_SYM[S[r][idx]].id, x0 + rw / 2, y, fh * 0.78); }
    const sh = c.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, "rgba(0,0,0,.45)"); sh.addColorStop(0.22, "rgba(0,0,0,0)"); sh.addColorStop(0.78, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.45)"); c.fillStyle = sh; c.fillRect(x0, 0, rw, H);
    c.restore(); c.fillStyle = "#2a2e34"; c.fillRect(x0 + rw - 6, 0, 12, H); }
  c.fillStyle = "#2a2e34"; c.fillRect(0, 0, 6, H); c.fillRect(W - 6, 0, 6, H); }
// Hebel ziehen: die Stange wird kuerzer (kippt zum Betrachter, Nicolas 2026-11-17: "halb heruntergezogen sieht das sehr komisch aus" – vorher wurde mit scaleY auch die Kugel platt),
// die Kugel bleibt rund, kommt naeher (etwas groesser) und sitzt immer oben auf der Stange
function slotArm() { const r = SLOT.el && SLOT.el.querySelector(".rod"); if (r) { r.style.transform = ""; r.style.height = Math.round(132 * (1 - 0.92 * SLOT.pull)) + "px"; r.style.setProperty("--k", (1 + 0.35 * SLOT.pull).toFixed(3)); } const h = SLOT.machine && SLOT.machine.userData.hebel; if (h) h.rotation.x = -SLOT.pull * 1.1; }
function slotArmBack() { const t0 = performance.now(), p0 = SLOT.pull, step = t => { const u = Math.min(1, (t - t0) / 350); SLOT.pull = p0 * (1 - u) * (1 - u); slotArm(); if (u < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function slotSpin() { if (SLOT.spin || !slotIsOpen()) return;
  if (typeof jetTake !== "function" || !jetTake(SLOT.bet)) { SLOT.msg = "Nicht genug Jetons für " + SLOT.bet + " – Jeton-Automat oder Kasse"; SLOT.cls = "err"; slotArmBack(); return slotRender(); }
  const t0 = performance.now(), stops = [0, 1, 2].map(() => Math.floor(Math.random() * 20));
  SLOT.spin = { t0, from: SLOT.pos.slice(), to: stops.map((s, r) => { const cur = SLOT.pos[r] % 20; return SLOT.pos[r] - cur + 20 * (3 + r) + s + (s < cur ? 20 : 0); }), dur: [1100, 1550, 2000], done: [false, false, false], stops };
  SLOT.win = 0; SLOT.msg = "Viel Glück …"; SLOT.cls = ""; SLOT.el.querySelector(".sl-line").classList.remove("win");
  // Hebel: schnell ganz hinunter, dann zurueck
  { const p0 = SLOT.pull, st = t => { const u = Math.min(1, (t - t0) / 160); SLOT.pull = p0 + (1 - p0) * u; slotArm(); if (u < 1) requestAnimationFrame(st); else slotArmBack(); }; requestAnimationFrame(st); }
  slotRender(); requestAnimationFrame(slotAnim); }
function slotAnim(t) { const S = SLOT.spin; if (!S) return; let all = true;
  for (let r = 0; r < 3; r++) { const u = Math.min(1, (t - S.t0) / S.dur[r]), e = u < 1 ? 1 - Math.pow(1 - u, 3) + Math.sin(u * Math.PI) * 0.004 : 1; SLOT.pos[r] = S.from[r] + (S.to[r] - S.from[r]) * e; if (u >= 1) S.done[r] = true; else all = false; }
  slotDraw(); if (!all) return requestAnimationFrame(slotAnim);
  SLOT.pos = S.to.map(p => p % 20); const St = slotStrips(), ids = S.stops.map((s, r) => SLOT_SYM[St[r][s]].id), res = slotEval(ids); SLOT.spin = null;
  if (res.k) { SLOT.win = SLOT.bet * res.k; jetGive(SLOT.win); SLOT.msg = res.t + " – Gewinn " + (typeof kontoFmt === "function" ? kontoFmt(SLOT.win) : SLOT.win) + (res.k >= 80 ? " · JACKPOT!" : ""); SLOT.cls = "win"; SLOT.el.querySelector(".sl-line").classList.add("win"); }
  else { SLOT.msg = "Leider nichts – nochmal?"; SLOT.cls = ""; }
  SLOT.hist.unshift(res.k ? "+" + SLOT.win : "–"); SLOT.hist.length = Math.min(SLOT.hist.length, 8);
  // 3D-Bildschirm des gespielten Automaten (Werkstatt) zeigt das Ergebnis
  const scr = SLOT.machine && SLOT.machine.userData.screen; if (scr && typeof slotScreenTex === "function") { const rows = S.stops.map((s, r) => [St[r][(s + 19) % 20], St[r][s], St[r][(s + 1) % 20]]); const old = scr.material.map; scr.material.map = slotScreenTex(rows); scr.material.needsUpdate = true; if (old && old !== SLOT.machine.userData.screen0) old.dispose(); }
  slotDraw(); slotRender(); }
