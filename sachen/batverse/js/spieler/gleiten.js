// Gleitumhang (Nicolas 2026-11-18, N48: "Gleitumhang: Batman gleitet nach einem Sprung in die Tiefe in einem bestimmten Winkel"). Spiel und Werkstatt.
// Im Fall (mehr als 3 m ueber dem Boden, schon fallend) Leertaste druecken = Umhang auf: sinkt mit ca. 3 m/s und gleitet mit ca. 10,5 m/s in Blickrichtung (Gleitwinkel ca. 1:3,3);
// Blick nach unten = Sturzflug (schneller vorwaerts und nach unten), Lenken mit der Maus. Nochmal Leertaste oder Landen = Umhang zu. Gegen eine Wand: bremst.
// Aufruf je Bild nach der Schwerkraft: gleitUpdate(dt, P, amBoden, bodenY, push) – laufen.js (Spiel) und werkstatt/person.js; push(p) schiebt aus Hindernissen.
const GLEIT = { on: false, press: false, v: 0, vy: 0, el: null, t: 0 };   // vy: eigene Sinkrate (ersetzt beim Gleiten die Schwerkraft)
addEventListener("keydown", e => { if (e.code === "Space" && !e.repeat) GLEIT.press = true; }, true);
function gleitEl() { if (GLEIT.el) return GLEIT.el; const st = document.createElement("style"); st.textContent = `
#umhang{position:fixed;inset:0;pointer-events:none;z-index:3}#umhang i{position:absolute;top:-4vh;width:46vw;height:30vh;background:linear-gradient(180deg,#05060a 0%,#0c0e14 60%,rgba(12,14,20,0) 100%);transition:transform .2s}
#umhang .l{left:-6vw;clip-path:polygon(0 0,100% 0,82% 38%,64% 30%,46% 52%,28% 42%,0 70%);transform-origin:0 0}#umhang .r{right:-6vw;clip-path:polygon(0 0,100% 0,100% 70%,72% 42%,54% 52%,36% 30%,18% 38%);transform-origin:100% 0}
#umhang b{position:absolute;left:50%;top:22vh;transform:translateX(-50%);font:600 13px system-ui;color:#e8eef6;background:rgba(0,0,0,.45);padding:4px 10px;border-radius:10px}`; document.head.appendChild(st);
  const el = document.createElement("div"); el.id = "umhang"; el.hidden = true; el.innerHTML = '<i class="l"></i><i class="r"></i><b></b>'; document.body.appendChild(el); return GLEIT.el = el; }
function gleitAn(P) { GLEIT.on = true; GLEIT.v = 6; GLEIT.vy = P.vy; gleitEl().hidden = false; }
function gleitAus() { GLEIT.on = false; if (GLEIT.el) GLEIT.el.hidden = true; }
function gleitUpdate(dt, P, amBoden, bodenY, push) {
  const press = GLEIT.press; GLEIT.press = false;
  if (amBoden || (typeof walking !== "undefined" && !walking)) { if (GLEIT.on) gleitAus(); return false; }
  if (press && GLEIT.on) { gleitAus(); return false; }
  if (press && !GLEIT.on && P.vy < -1 && P.pos.y - bodenY > 3) gleitAn(P);
  if (!GLEIT.on) return false;
  const dive = Math.max(0, -(P.pitch || 0) - 0.3), sink = 3.2 + dive * 9, fwd = 10.5 + dive * 14;   // Blick nach unten = Sturzflug
  GLEIT.vy += (-sink - GLEIT.vy) * Math.min(1, dt * 2.5); P.vy = GLEIT.vy; GLEIT.v += (fwd - GLEIT.v) * Math.min(1, dt * 1.5);
  const n = P.pos.clone(); n.x += -Math.sin(P.yaw) * GLEIT.v * dt; n.z += -Math.cos(P.yaw) * GLEIT.v * dt; push(n);
  const moved = Math.hypot(n.x - P.pos.x, n.z - P.pos.z); if (moved < GLEIT.v * dt * 0.5) GLEIT.v *= 0.5;   // gegen eine Wand
  P.pos.x = n.x; P.pos.z = n.z;
  GLEIT.t += dt; const fl = Math.sin(GLEIT.t * 9) * 3 * Math.min(1, GLEIT.v / 20), el = GLEIT.el;   // Umhang flattert am Bildrand
  el.children[0].style.transform = "rotate(" + (-4 + fl) + "deg)"; el.children[1].style.transform = "rotate(" + (4 - fl) + "deg)";
  el.children[2].textContent = "Gleiten · " + Math.round(GLEIT.v * 3.6) + " km/h · " + Math.max(0, Math.round(P.pos.y - bodenY)) + " m · Leertaste: Umhang zu";
  return true; }
