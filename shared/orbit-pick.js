// Orbit-Ansicht: Rechtsklick (ohne Ziehen) auf einen Ort kopiert die genauen Koordinaten
// und die aktuelle Kameraansicht in die Zwischenablage. Rechts ziehen verschiebt die Ansicht weiterhin.
// Einbinden (in jeder 3D-Seite, nach dem Anlegen von renderer, scene, camera und controls):
//   import { installOrbitPick } from "../../shared/orbit-pick.js";
//   installOrbitPick({ renderer, camera, controls, scene });
import * as THREE from "three";

export function installOrbitPick({ renderer, camera, controls, scene, title = document.title }) {
  const el = renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;

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
  el.addEventListener("pointerup", async e => {
    if (e.button !== 2 || !down) return;
    const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
    down = null;
    if (moved > 5 || !controls.enabled) return;                      // gezogen = verschieben, im Laufmodus aus
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    camera.updateMatrixWorld();
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(scene.children, true).find(h => !h.object.isSprite && shown(h.object));
    const tgt = controls.target, cam = camera.position, off = cam.clone().sub(tgt), dist = off.length();
    const azimut = (THREE.MathUtils.radToDeg(Math.atan2(off.x, off.z)) + 360) % 360, neigung = THREE.MathUtils.radToDeg(Math.asin(off.y / (dist || 1)));
    const lines = [
      `${title} - Orbit-Ansicht`,
      hit ? `Punkt: ${vec(hit.point)}` : "Punkt: (nichts getroffen)",
      hit && hit.object.name ? `Objekt: ${hit.object.name}` : null,
      `Kamera: ${vec(cam)}`,
      `Ziel: ${vec(tgt)}`,
      `Abstand ${f(dist)} | Azimut ${Math.round(azimut)}° | Neigung ${Math.round(neigung)}° | Sichtwinkel ${Math.round(camera.fov)}°`,
      `Seite: ${location.pathname}`
    ].filter(Boolean);
    const text = lines.join("\n");
    const ok = await copy(text);
    note((ok ? "In die Zwischenablage kopiert:\n" : "Kopieren nicht möglich:\n") + lines.slice(1, 3).join("\n"));
  }, true);
}
