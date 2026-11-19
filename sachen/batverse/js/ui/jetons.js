// Batverse – Casino-Jetons (Nicolas 2026-11-17: "ich will einen funktionierenden Jeton-Automaten, wo man diese Casino-Coins haben kann, mach dafuer auch 3D- und 2D-Items")
// Jetons sind Gegenstaende im Inventar (inventar.js: jeton-10 / -100 / -1000 / -10000, 2D-Symbole dort). Hier: Wert, Tausch gegen Bargeld (Fenster #jeton, von den
// Jeton-Automaten und der Kasse im Casino), 3D-Jeton (Stapel fuer Tische, Automat, Kasse und die Hand) und das 3D-Modell des Automaten. Roulette setzt mit Jetons.
// Spiel: FILES nach ui/roulette.js; Werkstatt nach ../js/ui/roulette.js (ASSETS, BV_KEEP).
"use strict";
const JET_DEN = [["jeton-10000", 10000, "#6a2bb0", "#f2d36b", "10K"], ["jeton-1000", 1000, "#17181c", "#d4a640", "1K"], ["jeton-100", 100, "#c21d2b", "#ffffff", "100"], ["jeton-10", 10, "#2266cc", "#ffffff", "10"]];
const JTN = { el: null, msg: "", ort: "Jeton-Automat", tex: {}, hand: null };
const jetFmt = n => (typeof kontoFmt === "function" ? kontoFmt(n) : n + " $");
// ---- Wert und Tausch ----
function jetWert() { let v = 0; for (const [id, w] of JET_DEN) v += invCount(id) * w; return v; }
// Wert als Jetons ins Inventar (groesste zuerst); was keinen Platz hat, kommt als Bargeld zurueck. Liefert den Wert in Jetons.
function jetGive(v) { let rest = v; for (const [id, w] of JET_DEN) { const n = Math.floor(rest / w); if (n) rest -= invAdd(id, n) * w; }
  if (rest > 0 && typeof kontoBar === "function") { kontoBar(rest, "Jetons (kein Platz im Inventar)"); if (typeof toast === "function") toast("Kein Platz für alle Jetons – " + jetFmt(rest) + " als Bargeld"); }
  return v - rest; }
// Wert v in Jetons abgeben (passend, sonst einen groesseren Jeton wechseln); false ohne genug Jetons
function jetTake(v) { if (v <= 0) return true; if (jetWert() < v) return false; let rem = v;
  for (const [id, w] of JET_DEN) { const n = Math.min(invCount(id), Math.floor(rem / w)); if (n) { invTake(id, n); rem -= n * w; } }
  if (rem > 0) for (const [id, w] of [...JET_DEN].reverse()) if (w > rem && invCount(id)) { invTake(id, 1); jetGive(w - rem); rem = 0; break; }
  return true; }
function jetKauf(v) { if (typeof KONTO === "undefined" || KONTO.bar < v) { JTN.msg = "Nicht genug Bargeld für " + jetFmt(v) + " – am Bankautomaten abheben"; JTN.cls = "err"; return jetRender2D(); }
  kontoBar(-v, "Jetons gekauft"); const got = jetGive(v); JTN.msg = "Jetons für " + jetFmt(got) + " erhalten"; JTN.cls = "ok"; jetRender2D(); }
function jetEinloesen(v) { const have = jetWert(); if (v === "alle") v = have; if (!have || v > have) { JTN.msg = have ? "Nicht genug Jetons" : "Keine Jetons im Inventar"; JTN.cls = "err"; return jetRender2D(); }
  jetTake(v); kontoBar(v, "Jetons eingelöst"); JTN.msg = jetFmt(v) + " ausgezahlt (Bargeld)"; JTN.cls = "ok"; jetRender2D(); }
// ---- Fenster ----
const JET_CSS = `
#jeton { position: fixed; inset: 0; z-index: 61; display: grid; place-items: center; background: rgba(0,0,0,.55); font: 15px "Segoe UI", Arial, sans-serif; color: #f3ead6; }
#jeton[hidden] { display: none; }
#jeton .jt-box { width: 460px; padding: 18px 22px 16px; border-radius: 16px; background: radial-gradient(120% 90% at 50% 0%, #3a0d14 0%, #1a0a0d 55%, #0d0708 100%); border: 2px solid #c9973a; box-shadow: 0 0 0 4px #1a1206, 0 18px 50px rgba(0,0,0,.6), inset 0 0 40px rgba(201,151,58,.12); }
#jeton .jt-head { display: flex; align-items: center; justify-content: space-between; color: #d4a640; letter-spacing: .25em; font-size: 12px; font-weight: 700; }
#jeton .jt-x { background: none; border: 1px solid #6d5320; color: #d4a640; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; font-size: 16px; }
#jeton .jt-title { margin: 6px 0 12px; font-size: 24px; font-weight: 800; letter-spacing: .04em; color: #fff4dc; }
#jeton .jt-title small { display: block; font-size: 12px; font-weight: 500; color: #b8a27a; letter-spacing: 0; margin-top: 2px; }
#jeton .jt-stand { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
#jeton .jt-stand div { background: rgba(0,0,0,.35); border: 1px solid #4a3418; border-radius: 10px; padding: 8px 12px; font-size: 12px; color: #b8a27a; }
#jeton .jt-stand b { display: block; font-size: 20px; color: #fff; margin-top: 2px; }
#jeton .jt-stand .bar b { color: #7fe08a; } #jeton .jt-stand .jet b { color: #f2d36b; }
#jeton .jt-chips { display: flex; gap: 10px; justify-content: center; margin: 12px 0 4px; }
#jeton .jt-chip { display: grid; justify-items: center; font-size: 12px; color: #d8c8a6; }
#jeton .jt-chip svg { width: 44px; height: 44px; filter: drop-shadow(0 2px 3px rgba(0,0,0,.6)); }
#jeton .jt-sec { margin: 12px 0 6px; font-size: 11px; letter-spacing: .2em; color: #d4a640; text-transform: uppercase; }
#jeton .jt-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
#jeton .jt-row.ein { grid-template-columns: repeat(3, 1fr); }
#jeton .jt-btn { padding: 9px 4px; border-radius: 9px; border: 1px solid #8a6a28; background: linear-gradient(#e6bd5a, #b48728); color: #241806; font: 700 14px "Segoe UI", Arial, sans-serif; cursor: pointer; }
#jeton .jt-btn:hover { filter: brightness(1.12); } #jeton .jt-btn.alt { background: linear-gradient(#3b3f46, #24272c); color: #f3ead6; border-color: #5a5f66; }
#jeton .jt-msg { min-height: 20px; margin-top: 12px; font-size: 13px; text-align: center; color: #d8c8a6; } #jeton .jt-msg.ok { color: #7fe08a; } #jeton .jt-msg.err { color: #ff7a7a; }
#jeton .jt-foot { margin-top: 6px; font-size: 11px; text-align: center; color: #8a7a5a; }`;
function jetEnsure() {
  if (JTN.el) return JTN.el; const st = document.createElement("style"); st.textContent = JET_CSS; document.head.appendChild(st);
  const el = document.createElement("div"); el.id = "jeton"; el.hidden = true; document.body.appendChild(el); JTN.el = el;
  el.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) { if (e.target === el) jetonClose(); return; } b.blur(); const a = b.dataset.a;
    if (a === "zu") jetonClose(); else if (a === "kauf") jetKauf(+b.dataset.v); else if (a === "ein") jetEinloesen(b.dataset.v === "alle" ? "alle" : +b.dataset.v); });
  addEventListener("keydown", e => { if (!jetonIsOpen()) return; if (e.key === "Escape") { e.preventDefault(); jetonClose(); } e.stopImmediatePropagation(); }, true);
  addEventListener("keyup", e => { if (jetonIsOpen()) e.stopImmediatePropagation(); }, true);
  addEventListener("resize", () => { if (jetonIsOpen()) jetFit(); });
  if (typeof kontoOn === "function") kontoOn(() => { if (jetonIsOpen()) jetRender2D(); });
  return el;
}
function jetFit() { const b = JTN.el.querySelector(".jt-box"); if (!b) return; b.style.transform = ""; const k = Math.min(1, (innerWidth - 24) / (b.offsetWidth + 24), (innerHeight - 24) / (b.offsetHeight + 24)); b.style.transform = k < 1 ? "scale(" + k.toFixed(3) + ")" : ""; }
const jetonIsOpen = () => !!(JTN.el && !JTN.el.hidden);
function jetonOpen(ort) { jetEnsure(); if (typeof dragging !== "undefined" && dragging) { dragging = false; document.body.classList.remove("looking"); } if (document.pointerLockElement) document.exitPointerLock(); if (typeof keys !== "undefined" && keys.clear) keys.clear();
  JTN.ort = ort || "Jeton-Automat"; JTN.msg = "Bargeld gegen Jetons tauschen und zurück"; JTN.cls = ""; JTN.el.hidden = false; jetRender2D(); }
function jetonClose() { if (!jetonIsOpen()) return; JTN.el.hidden = true; if (typeof grabMouse === "function") grabMouse(); }
function jetRender2D() { if (!JTN.el) return; const bar = typeof KONTO !== "undefined" ? KONTO.bar : 0, ins = typeof INV_ITEMS !== "undefined";
  const chips = JET_DEN.slice().reverse().map(([id]) => '<div class="jt-chip">' + (ins ? '<svg viewBox="0 0 26 26">' + INV_ITEMS[id].svg + "</svg>" : "") + "<span>× " + invCount(id) + "</span></div>").join("");
  JTN.el.innerHTML = '<div class="jt-box"><div class="jt-head"><span>♠ CASINO GOTHAM ♦</span><button class="jt-x" data-a="zu" title="Schließen (Esc)">×</button></div>' +
    '<div class="jt-title">' + JTN.ort + "<small>1 Jeton-Wert = 1 $ · ohne Gebühr</small></div>" +
    '<div class="jt-stand"><div class="bar">Bargeld<b>' + jetFmt(bar) + '</b></div><div class="jet">Jetons<b>' + jetFmt(jetWert()) + "</b></div></div>" +
    '<div class="jt-chips">' + chips + "</div>" +
    '<div class="jt-sec">Jetons kaufen</div><div class="jt-row">' + [100, 500, 1000, 5000, 10000].map(v => '<button class="jt-btn" data-a="kauf" data-v="' + v + '">' + jetFmt(v) + "</button>").join("") + "</div>" +
    '<div class="jt-sec">Jetons einlösen</div><div class="jt-row ein">' + [100, 1000].map(v => '<button class="jt-btn alt" data-a="ein" data-v="' + v + '">' + jetFmt(v) + "</button>").join("") + '<button class="jt-btn alt" data-a="ein" data-v="alle">Alle</button></div>' +
    '<div class="jt-msg ' + (JTN.cls || "") + '">' + JTN.msg + '</div><div class="jt-foot">Esc schließt · Jetons liegen im Inventar und gelten am Roulette-Tisch</div></div>';
  jetFit(); }
// ---- 3D: Jeton (Flaeche mit Wert, Rand mit Streifen) ----
function jetTex(den) { const T = JTN.tex[den]; if (T) return T; const d = JET_DEN.find(q => q[1] === den), [, , col, edge, txt] = d;
  const face = canvasTex(128, 128, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.save(); c.translate(64, 64); c.fillStyle = edge;
    for (let k = 0; k < 8; k++) { c.rotate(Math.PI / 4); c.fillRect(-8, -63, 16, 17); } c.restore();
    c.beginPath(); c.arc(64, 64, 40, 0, 7); c.fillStyle = col; c.fill(); c.setLineDash([12, 7]); c.lineWidth = 5; c.strokeStyle = edge; c.stroke(); c.setLineDash([]);
    c.fillStyle = den === 1000 ? "#f2d36b" : "#fff"; c.font = "bold " + (txt.length > 2 ? 30 : 36) + "px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, 64, 66); });
  const side = canvasTex(128, 8, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = edge; for (let k = 0; k < 8; k++) c.fillRect(k * 16 + 4, 0, 8, h); });
  side.wrapS = side.wrapT = THREE.RepeatWrapping;
  return JTN.tex[den] = { face, side, col }; }
// Stapel aus n Jetons (Radius 2 cm, 3,6 mm dick), Boden bei y 0; eine Zylinder-Masche, Rand wiederholt sich je Jeton
function jetStack(den, n = 1, s = 1) { const t = jetTex(den), r = 0.02 * s, h = 0.0036 * s * n, side = t.side.clone(); side.repeat.set(1, n); side.needsUpdate = true;
  const fm = new THREE.MeshStandardMaterial({ map: t.face, roughness: 0.45 }), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), [new THREE.MeshStandardMaterial({ map: side, roughness: 0.5 }), fm, fm]);
  m.geometry.translate(0, h / 2, 0); m.castShadow = true; return m; }
// mehrere Stapel als Gruppe: [[den, n, x, z], ...]
function jetStacks(list, s = 1) { const g = new THREE.Group(); for (const [den, n, x, z] of list) { const m = jetStack(den, n, s); m.position.set(x, 0, z); m.rotation.y = (x * 37 + z * 11) % 6; g.add(m); } return g; }
// ---- 3D: Jeton-Automat (Nicolas 2026-11-17: "Screen groesser, Farben gut, Design sonst lieber mehr Richtung Bankautomat"): Gehaeuse des Bankautomaten
// (bankautomat.js, buildBankautomat mit Optionen) in Weinrot, Schwarz und Gold, Schild JETONS, grosser Bildschirm, Jetons im Ausgabeschacht. Front nach -z, Boden y 0.
function jetScreenTex() { return canvasTex(512, 388, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#3a0d22"); gr.addColorStop(1, "#12060c"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.strokeStyle = "#d4a640"; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20); c.textAlign = "center";
  c.fillStyle = "#f2d36b"; c.font = "bold 44px Arial"; c.fillText("CASINO GOTHAM", w / 2, 70); c.fillStyle = "#fff"; c.font = "30px Arial"; c.fillText("Bargeld  ⇄  Jetons", w / 2, 116);
  JET_DEN.slice().reverse().forEach(([, , col, edge, txt], i) => { const x = 86 + i * 113, y = 210; c.beginPath(); c.arc(x, y, 46, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = 9; c.setLineDash([13, 8]); c.strokeStyle = edge; c.stroke(); c.setLineDash([]);
    c.beginPath(); c.arc(x, y, 30, 0, 7); c.lineWidth = 2; c.stroke(); c.fillStyle = col === "#17181c" ? "#f2d36b" : "#fff"; c.font = "bold 26px Arial"; c.fillText(txt, x, y + 9); });
  c.fillStyle = "#2e8b45"; c.fillRect(110, 292, w - 220, 52); c.fillStyle = "#fff"; c.font = "bold 26px Arial"; c.fillText("RECHTSKLICK: TAUSCHEN", w / 2, 327); }); }
function buildJetonAutomat() {
  return buildBankautomat({ name: "Jeton-Automat", farben: { body: 0x6a0e18, trim: 0xd4a640, panel: 0x1d1416, panelH: 0x16110f, front: 0x3a0a10 }, schild: { text: "JETONS", c0: "#2a0a10", c1: "#120507", ink: "#ffd77a" },
    screen: jetScreenTex, extra: (g, D) => { const st = jetStacks([[100, 5, -0.1, 0], [1000, 3, 0.02, 0.01], [10, 6, 0.12, -0.005]], 1.1); st.position.set(0, 0.825, -D / 2 + 0.035); g.add(st); } });
}
// ---- 3D in der Hand: kleiner Stapel des gewaehlten Jetons rechts unten (eigene Szene wie die Schusswaffen) ----
function jetRender() {
  const id = typeof invHeld === "function" ? invHeld() : null, foot = typeof onFoot === "function" ? onFoot() : true;
  const d = id && id.startsWith("jeton-") ? JET_DEN.find(q => q[0] === id) : null;
  if (!d || !foot || (typeof dpAn === "function" && dpAn()) || (typeof invIsOpen === "function" && invIsOpen()) || jetonIsOpen() || (typeof rouletteIsOpen === "function" && rouletteIsOpen())) return;
  let H = JTN.hand; if (!H) { const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x404040, 1.4)); const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(1, 2, 1); sc.add(sun); H = JTN.hand = { sc, g: new THREE.Group(), den: 0 }; sc.add(H.g); }
  if (H.den !== d[1]) { H.den = d[1]; H.g.clear(); const one = jetStack(d[1], 1, 1.8); one.position.set(0, 0, 0); one.rotation.set(1.15, 0.2 + Math.PI / 2, 0.15);   // Zahl waagrecht zum Betrachter (Nicolas 2026-11-17)
    H.g.add(one); }   // ein einzelner Jeton (Nicolas 2026-11-17: "3D-Modell soll nur ein Coin sein")
  H.g.position.copy(camera.position); H.g.quaternion.copy(camera.quaternion); { const zz = 0.45, th = Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV()) / 2); H.g.translateX(0.72 * th * camera.aspect * zz); H.g.translateY(-0.42 * th * zz); H.g.translateZ(-zz); } H.g.scale.setScalar(1.6); H.g.rotateX(0.55); H.g.rotateY(-0.4);
  const ac = renderer.autoClear; renderer.autoClear = false; renderer.clearDepth(); renderer.render(H.sc, camera); renderer.autoClear = ac;
}
