// Nachtsichtbrille (Nicolas 2026-11-18, N28: "Nachtsicht-Militaerbrille als Item 3D und 2D; wenn man sie anzieht, vielleicht wie bei Minecraft im Inventar, soll die Sicht gruen sein";
// OFFENE-FRAGEN 41: Ausruestungsplatz "Kopf"). Spiel und Werkstatt, nach inventar.js und gotham/tresor.js.
// Aufsetzen: im Inventar auf den Platz "Kopf" ziehen oder Shift+Klick, oder mit der Brille in der Hand Linksklick. Taste B schaltet sie an und aus (nur aufgesetzt).
// Wirkung: zusaetzliches helles Licht nur fuer die Brille, Bild gruen (CSS-Filter auf der Zeichenflaeche), Rauschen, Rand wie ein Doppelrohr, Anzeige "NV".
const NV = { on: true, active: false, light: null, el: null, noise: null, t: 0 };
const nvWorn = () => typeof INV !== "undefined" && INV.equip && INV.equip.kopf && INV.equip.kopf.id === "nachtsicht";
function nvInit() { if (NV.el) return;
  const el = document.createElement("div"); el.id = "nv"; el.hidden = true; el.innerHTML = '<canvas class="nv-noise" width="320" height="180"></canvas><canvas class="nv-rand" width="320" height="180"></canvas><div class="nv-tag">NV · B aus</div>'; document.body.appendChild(el); NV.el = el; NV.noise = el.querySelector("canvas");
  const st = document.createElement("style"); st.textContent = "#nv{position:fixed;inset:0;pointer-events:none;z-index:3}#nv[hidden]{display:none}#nv .nv-noise{position:absolute;inset:0;width:100%;height:100%;opacity:.13;mix-blend-mode:screen}" +
    "#nv .nv-rand{position:absolute;inset:0;width:100%;height:100%}" +
    "#nv .nv-tag{position:absolute;left:50%;top:12px;transform:translateX(-50%);font:700 12px ui-monospace,monospace;color:#9dff9d;letter-spacing:2px;text-shadow:0 0 6px #3f3}";
  document.head.appendChild(st);
  { const c = el.querySelector(".nv-rand").getContext("2d"); c.fillStyle = "#000"; c.fillRect(0, 0, 320, 180); c.globalCompositeOperation = "destination-out";   // Rand wie ein Doppelrohr: zwei weiche Kreise frei
    for (const x of [118, 202]) { const gr = c.createRadialGradient(x, 90, 40, x, 90, 98); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.8, "rgba(0,0,0,0.9)"); gr.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gr; c.beginPath(); c.arc(x, 90, 98, 0, 7); c.fill(); } }
  NV.light = new THREE.HemisphereLight(0xe8ffe8, 0x6a7a6a, 0); scene.add(NV.light); }
function nvSet(on) { NV.on = on; nvApply(); }
function nvApply() { nvInit(); const a = nvWorn() && NV.on; NV.active = a; NV.el.hidden = !a; NV.light.intensity = a ? 2.6 : 0;
  renderer.domElement.style.filter = a ? "grayscale(1) brightness(1.35) contrast(1.15) sepia(1) hue-rotate(58deg) saturate(3.2)" : ""; }
function nvStep(dt) { if (nvWorn() !== !!NV.wasWorn) { NV.wasWorn = nvWorn(); nvApply(); } if (!NV.active) return; NV.t += dt; if (NV.t < 0.05) return; NV.t = 0;   // Rauschen ca. 20 x je Sekunde
  const c = NV.noise.getContext("2d"), im = c.createImageData(320, 180); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = v * 0.6; im.data[i + 1] = v; im.data[i + 2] = v * 0.6; im.data[i + 3] = 255; } c.putImageData(im, 0, 0); }
addEventListener("keydown", e => { if (e.code !== "KeyB" || e.repeat || e.target.closest?.("input, textarea")) return; if (typeof invIsOpen === "function" && invIsOpen()) return;
  if (!nvWorn()) return toast("Keine Nachtsichtbrille aufgesetzt (Inventar: Platz \"Kopf\")"); nvSet(!NV.on); toast(NV.on ? "Nachtsicht an" : "Nachtsicht aus"); });
// mit der Brille in der Hand: Linksklick setzt sie auf
addEventListener("mousedown", e => { if (e.button !== 0 || !document.pointerLockElement || typeof invHeld !== "function" || invHeld() !== "nachtsicht") return; const S = INV.slots[INV.sel]; if (!S) return;
  if (INV.equip.kopf) { const old = INV.equip.kopf; INV.equip.kopf = S; INV.slots[INV.sel] = old; } else { INV.equip.kopf = S; INV.slots[INV.sel] = null; } NV.on = true; invSave(); invRender(); nvApply(); toast("Nachtsichtbrille aufgesetzt – B schaltet an/aus"); }, true);
// 3D in der Hand: Doppelrohr mit Gehaeuse und Kopfband
if (typeof HAND3D !== "undefined") HAND3D.nachtsicht = () => { const g = new THREE.Group(), sw = new THREE.MeshStandardMaterial({ color: 0x2b2f2a, roughness: 0.6, metalness: 0.3 }), gl = new THREE.MeshStandardMaterial({ color: 0x1c5a2a, emissive: 0x0c3a14, metalness: 0.5, roughness: 0.15 }), band = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.045, 0.06), sw); g.add(body);
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.09, 18), sw); t.rotation.x = Math.PI / 2; t.position.set(sx * 0.033, 0, -0.06); g.add(t); const l = new THREE.Mesh(new THREE.CircleGeometry(0.019, 18), gl); l.position.set(sx * 0.033, 0, -0.106); l.rotation.y = Math.PI; g.add(l); }
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.02, 10), sw); knob.position.set(0, 0.03, -0.01); g.add(knob);
  const b = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.008, 6, 24, Math.PI), band); b.rotation.set(0, Math.PI / 2, 0); b.position.set(0, 0, 0.03); b.rotation.x = Math.PI / 2; g.add(b);
  g.scale.setScalar(1.6); g.rotation.set(0.25, -0.5, 0.1); return g; };
addEventListener("load", () => nvApply());
