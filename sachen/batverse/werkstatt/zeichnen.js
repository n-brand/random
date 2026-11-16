// Werkstatt – Zeichenmodus wie im Spiel (Nicolas 2026-11-16: "in der Werkstatt auch Zeichenmodus"). Eigenstaendig: legt Knopf, Zeichenflaeche und Farben selbst an.
// 1. Klick auf "Zeichnen" aktiviert (Ansicht steht still), Farben links, 2. Klick loescht die Zeichnung und beendet. Taste Z schaltet ebenfalls.
"use strict";
{
  const css = document.createElement("style"); css.textContent = `
    #w-draw-layer { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 4; pointer-events: none; cursor: crosshair; }
    body.w-drawing #w-draw-layer { pointer-events: auto; }
    #w-draw-colors { display: none; position: fixed; right: 16px; top: 50%; transform: translateY(-50%); flex-direction: column; gap: 10px; z-index: 21; padding: 10px; border-radius: 14px; background: rgba(20,24,30,.85); border: 1px solid rgba(255,255,255,.15); }
    body.w-drawing #w-draw-colors { display: flex; }
    #w-draw-colors button { width: 30px; height: 30px; padding: 0; border-radius: 50%; border: 2px solid rgba(255,255,255,.25); background: var(--c); cursor: pointer; }
    #w-draw-colors button[aria-pressed="true"] { border-color: #fff; box-shadow: 0 0 0 2px rgba(0,0,0,.6); transform: scale(1.15); }
    #w-btn-draw[aria-pressed="true"] { background: var(--pen, #ff2fa8); color: #111; font-weight: 800; }`;
  document.head.appendChild(css);
  const cv = document.createElement("canvas"); cv.id = "w-draw-layer"; document.body.appendChild(cv); const cx = cv.getContext("2d");
  const box = document.createElement("div"); box.id = "w-draw-colors"; document.body.appendChild(box);
  const spin = document.getElementById("m-spin"), btn = document.createElement("button"); btn.id = "w-btn-draw"; btn.type = "button"; btn.setAttribute("aria-pressed", "false"); btn.title = "Farbig einzeichnen (Z), nochmal klicken löscht"; btn.textContent = "Zeichnen";
  if (spin) spin.after(btn); else document.body.appendChild(btn);
  let on = false, last = null, pen = "#ff2fa8";
  for (const [name, c] of [["Pink", "#ff2fa8"], ["Gelb", "#ffe600"], ["Grün", "#39ff14"], ["Cyan", "#00e5ff"], ["Orange", "#ff6a00"], ["Weiss", "#ffffff"]]) {
    const b = document.createElement("button"); b.type = "button"; b.title = name; b.setAttribute("aria-label", name); b.style.setProperty("--c", c); b.setAttribute("aria-pressed", String(c === pen));
    b.addEventListener("click", () => { pen = c; btn.style.setProperty("--pen", c); for (const o of box.children) o.setAttribute("aria-pressed", String(o === b)); }); box.appendChild(b); }
  const fit = () => { const r = devicePixelRatio || 1, w = Math.round(innerWidth * r), h = Math.round(innerHeight * r); if (cv.width === w && cv.height === h) return;
    const old = cv.width && cv.height ? cx.getImageData(0, 0, cv.width, cv.height) : null; cv.width = w; cv.height = h; if (old) cx.putImageData(old, 0, 0); };
  const pt = e => { const r = devicePixelRatio || 1; return [e.clientX * r, e.clientY * r]; };
  const set = v => { on = v; last = null; document.body.classList.toggle("w-drawing", on); btn.setAttribute("aria-pressed", String(on)); btn.textContent = on ? "Zeichnung löschen" : "Zeichnen"; if (!on) cx.clearRect(0, 0, cv.width, cv.height); if (typeof controls !== "undefined") controls.enabled = !on && (typeof modus === "undefined" || (modus !== "drive" && modus !== "person")); };
  btn.addEventListener("click", e => { e.currentTarget.blur(); fit(); set(!on); });
  addEventListener("keydown", e => { if (e.code === "KeyZ" && !e.repeat && !e.ctrlKey && !(e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName))) { fit(); set(!on); } });
  addEventListener("resize", fit);
  cv.addEventListener("pointerdown", e => { if (!on || e.button !== 0) return; cv.setPointerCapture(e.pointerId); last = pt(e); const r = devicePixelRatio || 1; cx.fillStyle = pen; cx.beginPath(); cx.arc(last[0], last[1], 2.5 * r, 0, Math.PI * 2); cx.fill(); });
  cv.addEventListener("pointermove", e => { if (!last) return; const p = pt(e), r = devicePixelRatio || 1; cx.strokeStyle = pen; cx.lineWidth = 5 * r; cx.lineCap = cx.lineJoin = "round"; cx.beginPath(); cx.moveTo(last[0], last[1]); cx.lineTo(p[0], p[1]); cx.stroke(); last = p; });
  const up = () => { last = null; }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("contextmenu", e => e.preventDefault());
}
