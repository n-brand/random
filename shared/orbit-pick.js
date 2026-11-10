// Orbit-Ansicht: Rechtsklick (ohne Ziehen) oder am Handy langer Druck auf einen Ort kopiert die genauen Koordinaten
// und die aktuelle Kameraansicht in die Zwischenablage. Rechts ziehen verschiebt die Ansicht weiterhin.
// Einbinden (in jeder 3D-Seite, nach dem Anlegen von renderer, scene, camera und controls):
//   import { installOrbitPick } from "../../shared/orbit-pick.js";
//   installOrbitPick({ renderer, camera, controls, scene });
// Optional actions: [{ icon: "<svg..>", label: "Text", run: (punkt) => {} }] -> statt sofort zu kopieren erscheint an der Maus ein
// kleines Menue mit Symbol-Knoepfen: "Koordinaten kopieren" plus die eigenen Aktionen (z. B. Wayne Manor: hierhin teleportieren).
import * as THREE from "three";

export const PICK_ICONS = {
  copy: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>',
};

export function installOrbitPick({ renderer, camera, controls, scene, title = document.title, actions = null, mode = null }) {
  const el = renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  // Kontextmenue (nur mit actions)
  const menu = actions && (() => {
    const m = document.createElement("div");
    Object.assign(m.style, { position: "fixed", zIndex: 60, display: "none", gap: "4px", padding: "4px", borderRadius: "10px",
      background: "rgba(15, 18, 24, .92)", border: "1px solid rgba(255,255,255,.2)", boxShadow: "0 6px 20px rgba(0,0,0,.35)" });
    document.body.appendChild(m);
    const hide = () => { m.style.display = "none"; };
    addEventListener("pointerdown", e => { if (!m.contains(e.target)) hide(); }, true);
    addEventListener("keydown", e => { if (e.key === "Escape") hide(); });
    addEventListener("wheel", hide, { passive: true });
    return { m, hide };
  })();

  const note = (() => {
    const n = document.createElement("div");
    Object.assign(n.style, {
      position: "fixed", left: "50%", top: "14px", transform: "translateX(-50%)", zIndex: 50, pointerEvents: "none",
      background: "rgba(15, 18, 24, .88)", color: "#f2f4f8", border: "1px solid rgba(255,255,255,.18)", borderRadius: "10px",
      padding: "8px 14px", font: "600 13px/1.45 system-ui, sans-serif", whiteSpace: "pre", opacity: "0", transition: "opacity .25s"
    });
    document.body.appendChild(n);
    let t = 0;
    return text => { n.textContent = text; n.style.opacity = "1"; clearTimeout(t); t = setTimeout(() => { n.style.opacity = "0"; }, 2600); };
  })();

  const f = v => (Math.round(v * 100) / 100).toFixed(2);
  const vec = v => `x ${f(v.x)} | y ${f(v.y)} | z ${f(v.z)}`;
  const shown = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (err) {} ta.remove(); return ok;
    }
  }

  el.addEventListener("pointerdown", e => { if (e.button === 2) down = [e.clientX, e.clientY]; }, true);
  el.addEventListener("contextmenu", e => { if (controls.enabled) e.preventDefault(); });
  // Handy: langer Druck (0,55 s, ohne Ziehen) wirkt wie der Rechtsklick (Nicolas 2026-11-09)
  let lp = null;
  el.addEventListener("pointerdown", e => {
    if (e.pointerType !== "touch" || !controls.enabled) return;
    clearTimeout(lp?.t); const x = e.clientX, y = e.clientY;
    lp = { id: e.pointerId, x, y, t: setTimeout(() => { lp = null; pickAt(x, y); }, 550) };
  }, true);
  const lpCancel = e => { if (lp && (e.type !== "pointermove" || (e.pointerId === lp.id && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10))) { clearTimeout(lp.t); lp = null; } };
  for (const t of ["pointermove", "pointerup", "pointercancel"]) el.addEventListener(t, lpCancel, true);
  el.addEventListener("pointerup", e => {
    if (e.button !== 2 || !down) return;
    const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
    down = null;
    if (moved > 5 || !controls.enabled) return;                      // gezogen = verschieben, im Laufmodus aus
    pickAt(e.clientX, e.clientY);
  }, true);
  async function pickAt(cx, cy) {
    const e = { clientX: cx, clientY: cy };
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    camera.updateMatrixWorld();
    ray.setFromCamera(ndc, camera); ray.camera = camera;               // camera fuer Sprites (sonst Fehlermeldung in der Konsole)
    const hit = ray.intersectObjects(scene.children, true).find(h => !h.object.isSprite && shown(h.object));
    const tgt = controls.target, cam = camera.position, off = cam.clone().sub(tgt), dist = off.length();
    const azimut = (THREE.MathUtils.radToDeg(Math.atan2(off.x, off.z)) + 360) % 360, neigung = THREE.MathUtils.radToDeg(Math.asin(off.y / (dist || 1)));
    const lines = [
      `${title} - ${mode ? mode() : "Orbit-Ansicht"}`,
      hit ? `Punkt: ${vec(hit.point)}` : "Punkt: (nichts getroffen)",
      hit && hit.object.name ? `Objekt: ${hit.object.name}` : null,
      `Kamera: ${vec(cam)}`,
      `Ziel: ${vec(tgt)}`,
      `Abstand ${f(dist)} | Azimut ${Math.round(azimut)}° | Neigung ${Math.round(neigung)}° | Sichtwinkel ${Math.round(camera.fov)}°`,
      `Seite: ${location.pathname}`
    ].filter(Boolean);
    const text = lines.join("\n");
    const doCopy = async () => { const ok = await copy(text); note((ok ? "In die Zwischenablage kopiert:\n" : "Kopieren nicht möglich:\n") + lines.slice(1, 3).join("\n")); };
    if (!menu) return doCopy();
    // Menue an der Maus: Koordinaten kopieren + eigene Aktionen (brauchen einen getroffenen Punkt)
    const { m, hide } = menu; m.textContent = "";
    const item = (icon, label, fn, enabled = true) => {
      const b = document.createElement("button"); b.type = "button"; b.title = label; b.setAttribute("aria-label", label); b.innerHTML = icon; b.disabled = !enabled;
      Object.assign(b.style, { width: "38px", height: "38px", display: "grid", placeItems: "center", border: "0", borderRadius: "8px", cursor: enabled ? "pointer" : "default",
        background: "rgba(255,255,255,.08)", color: enabled ? "#f2f4f8" : "rgba(242,244,248,.35)" });
      b.addEventListener("pointerenter", () => { if (enabled) b.style.background = "rgba(255,200,60,.85)"; });
      b.addEventListener("pointerleave", () => { b.style.background = "rgba(255,255,255,.08)"; });
      b.addEventListener("click", () => { hide(); fn(); });
      m.appendChild(b);
    };
    item(PICK_ICONS.copy, "Koordinaten kopieren", doCopy);
    for (const a of actions) item(a.icon, a.label, () => a.run(hit.point.clone(), hit), !!hit);
    m.style.display = "flex";
    const w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.min(innerWidth - w - 6, e.clientX + 8) + "px"; m.style.top = Math.min(innerHeight - h - 6, e.clientY + 8) + "px";
  }
  return { pickAt };                                                    // Seiten koennen das Menue selbst oeffnen (z. B. Wayne Manor im Geistmodus)
}
