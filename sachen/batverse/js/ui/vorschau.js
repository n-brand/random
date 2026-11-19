// Vorschaubilder der 3D-Modelle fuer die Web-Seiten (Nicolas 2026-11-19: "im Web bei den einzelnen Shops Bilder der 3D-Versionen – Waffen, Fahrzeuge, Gebaeude").
// Spiel und Werkstatt. Ein eigener kleiner Renderer (320 x 200, durchsichtig) baut jedes Modell einmal, rendert es und merkt sich das Bild (dataURL, nur im Speicher der Seite).
// vsBild(key, bau, ansicht, cls) liefert ein <img> mit data-vs; ist das Bild noch nicht da, kommt es in die Warteschlange (ein Modell je 30 ms, damit nichts ruckelt)
// und alle <img data-vs="key"> bekommen es, sobald es fertig ist. Ansichten: "schraeg" (Fahrzeuge, vorne links oben), "seite" (Waffen), "haus" (Gebaeude von schraeg unten).
// Gebaeude fuer Immobilien: vsHaus(id) aus den Gebaeude-Vorlagen der Stadt (gebaeude-vorlagen.js), Art je Angebot.
const VS = { R: null, sc: null, cam: null, cache: new Map(), queue: [], jobs: new Set(), W: 320, H: 200, leer: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" };
function vsInit() { if (VS.R) return; VS.R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); VS.R.setPixelRatio(1); VS.R.setSize(VS.W, VS.H, false);
  if (typeof renderer !== "undefined") { VS.R.toneMapping = renderer.toneMapping; VS.R.toneMappingExposure = renderer.toneMappingExposure; VS.R.outputColorSpace = renderer.outputColorSpace; }
  VS.sc = new THREE.Scene(); VS.sc.add(new THREE.HemisphereLight(0xffffff, 0x4a4f58, 1.5)); const d = new THREE.DirectionalLight(0xffffff, 2.4); d.position.set(-3, 5, -4); VS.sc.add(d); const f = new THREE.DirectionalLight(0xbfd4ff, 0.9); f.position.set(4, 2, 3); VS.sc.add(f);
  VS.cam = new THREE.PerspectiveCamera(30, VS.W / VS.H, 0.01, 5000); }
const VS_DIR = { schraeg: [-0.8, 0.42, -1], seite: [1, 0.08, -0.12], haus: [-0.9, 0.45, -1] };
function vsBild(key, bau, ansicht = "schraeg", cls = "") { const u = VS.cache.get(key);
  if (!u && !VS.jobs.has(key)) { VS.jobs.add(key); VS.queue.push({ key, bau, ansicht }); if (VS.queue.length === 1) setTimeout(vsPump, 30); }
  return '<img class="vs-img ' + cls + (u && u !== "x" ? "" : " vs-laedt") + '" data-vs="' + key + '" alt="" src="' + (u && u !== "x" ? u : VS.leer) + '">'; }
function vsPump() { const J = VS.queue.shift(); if (!J) return; let url = "x";
  try { vsInit(); let o = J.bau(); if (o && o.g) o = o.g; if (o) { o.visible = true; o.updateMatrixWorld(true); VS.sc.add(o);
      const box = vsBox(o), c = box.getCenter(new THREE.Vector3()), s = box.getBoundingSphere(new THREE.Sphere()), r = s.radius || 1;
      const dir = new THREE.Vector3(...(VS_DIR[J.ansicht] || VS_DIR.schraeg)).normalize(), fh = VS.cam.fov * Math.PI / 360, fw = Math.atan(Math.tan(fh) * VS.cam.aspect), dist = r / Math.sin(Math.min(fh, fw)) * 0.92;
      VS.cam.position.copy(c).addScaledVector(dir, dist); VS.cam.near = Math.max(0.01, dist - r * 2); VS.cam.far = dist + r * 3; VS.cam.updateProjectionMatrix(); VS.cam.lookAt(c);
      VS.R.setClearColor(0x000000, 0); VS.R.render(VS.sc, VS.cam); url = VS.R.domElement.toDataURL("image/png");
      VS.sc.remove(o); o.traverse(q => { if (q.geometry) q.geometry.dispose(); }); } }
  catch (e) { console.warn("Vorschau", J.key, e); }
  VS.cache.set(J.key, url); VS.jobs.delete(J.key);
  for (const im of document.querySelectorAll('img[data-vs="' + J.key + '"]')) { if (url !== "x") im.src = url; im.classList.remove("vs-laedt"); if (url === "x") im.classList.add("vs-fehlt"); }
  if (VS.queue.length) setTimeout(vsPump, 30); }
// Begrenzung nur aus sichtbaren Netzen (Muendungsfeuer, Klickkaesten u. a. sind oft unsichtbar und machten die Bilder zu klein)
function vsBox(o) { const b = new THREE.Box3(), t = new THREE.Box3(), sicht = q => { for (let x = q; x; x = x.parent) if (!x.visible) return false; return true; };
  o.traverse(q => { if (!q.isMesh || !q.geometry || !sicht(q) || (q.material && q.material.visible === false) || (q.material && q.material.opacity === 0)) return; if (!q.geometry.boundingBox) q.geometry.computeBoundingBox(); t.copy(q.geometry.boundingBox).applyMatrix4(q.matrixWorld); b.union(t); });
  return b.isEmpty() ? new THREE.Box3().setFromObject(o) : b; }
// Gebaeude zu einer Immobilie (Art, Grundriss, Hoehe)
const VS_HAUS = { manor: ["miet", 30, 22, 14], tower: ["kratzer", 34, 32, 120], penthouse: ["kratzer", 30, 28, 90], loft: ["fabrik", 34, 24, 10], diner: ["laden", 14, 12, 9.4], halle: ["lager", 40, 30, 9], garage: ["buero", 26, 20, 18.8], wohnung: ["miet", 22, 16, 23.5] };
function vsHaus(id) { if (typeof gbvShell !== "function" || typeof GBV === "undefined") return null; const [t, L1, L2, h] = VS_HAUS[id] || ["buero", 24, 18, 28.2], hall = t === "fabrik" || t === "lager";
  const o = { P0: [0, 0], e1: [0, 1], e2: [1, 0], L1, L2, front: 0, type: t, N: hall ? 1 : Math.round(h / GBV.GH), H: hall ? h : Math.round(h / GBV.GH) * GBV.GH, glas: true, seed: [...id].reduce((a, ch) => a + ch.charCodeAt(0), 7), fire: [false, false, false, false], y: 0 };
  const out = new Map(); gbvShell(o, out); if (typeof gbvDetails === "function") gbvDetails(o, out); const g = new THREE.Group(); g.add(gbvMesh(out));
  const pl = new THREE.Mesh(new THREE.BoxGeometry(L2 + 8, 0.3, L1 + 8), new THREE.MeshStandardMaterial({ color: 0x6f747a, roughness: 0.9 })); pl.position.set(L2 / 2, -0.15, L1 / 2); g.add(pl); return g; }
// Schusswaffen: Modell aus schusswaffen.js; andere Waren behalten ihr Symbol
const vsWare = (id, cls) => typeof GUN_SPEC !== "undefined" && GUN_SPEC[id] && typeof gunBuild === "function" ? vsBild("ware:" + id, () => gunBuild(id), "seite", "hell " + cls) : null;
{ const st = document.createElement("style"); st.textContent = `
.vs-img{display:block;object-fit:contain;background:radial-gradient(ellipse at 50% 60%,#2c3442,#10141b 75%);border-radius:10px}.vs-img.vs-laedt{background:linear-gradient(100deg,#151a22 30%,#232b38 50%,#151a22 70%) 0 0/300% 100%;animation:vsL 1.2s linear infinite}
.vs-img.hell{background:radial-gradient(ellipse at 50% 55%,#eef1f4,#aeb6bf 85%)}
.h-phone.quer .h-shop{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;align-items:start}.h-phone.quer .h-shop .h-hero{grid-column:1/-1}.h-phone.quer .h-shop .h-item{margin:0}
@keyframes vsL{to{background-position:-300% 0}}.h-pic{width:100%;aspect-ratio:16/10;margin:0 0 8px}.h-pic.klein{width:120px;height:75px;aspect-ratio:auto;margin:0;flex:none}
.lt-pic{width:150px;height:94px;flex:none;margin-right:6px}.lt-pic.haus{width:120px;height:110px}`; document.head.appendChild(st); }
