// Zigaretten (Nicolas 2026-11-18, N33: "Zigaretten als Gegenstand"). Spiel und Werkstatt, nach gotham/tresor.js (HAND3D) und spieler/fidget.js.
// Gegenstand "zigarette" (Stapel 20 = eine Schachtel), erfundene Marke "Gotham Lights". In der Hand: die Schachtel in 3D (Deckel offen, Filter schauen heraus).
// Linksklick (gefangene Maus): eine anzuenden - braucht ein Feuerzeug im Inventar; dann haelt man die Zigarette (Glut, alle 5 s ein Zug mit hellerer Glut und Rauchwoelkchen),
// sie brennt in 40 s ab und ist verbraucht (eine weniger im Stapel). Nochmal Linksklick waehrend des Rauchens: ausdruecken (verbraucht). Anderer Platz gewaehlt = ausgedrueckt.
const ZIG = { an: false, t: 0, dauer: 40, zug: 0, puffs: [] };
function zigTex() { return ZIG.tex || (ZIG.tex = canvasTex(128, 192, (c, w, h) => { c.fillStyle = "#f4f1ea"; c.fillRect(0, 0, w, h); c.fillStyle = "#1c3f78"; c.fillRect(0, 0, w, h * 0.34);
  c.fillStyle = "#c9a640"; c.fillRect(0, h * 0.34, w, 6); c.fillStyle = "#1c3f78"; c.font = "bold 20px Georgia, serif"; c.textAlign = "center"; c.fillText("GOTHAM", w / 2, h * 0.52); c.font = "italic 16px Georgia, serif"; c.fillText("Lights", w / 2, h * 0.62);
  c.fillStyle = "#fff"; c.font = "bold 13px Arial"; c.fillText("20", w / 2, h * 0.22); c.fillStyle = "#222"; c.fillRect(8, h * 0.72, w - 16, h * 0.22); c.fillStyle = "#fff"; c.font = "bold 11px Arial"; c.fillText("Rauchen schadet", w / 2, h * 0.81); c.fillText("der Gesundheit", w / 2, h * 0.89); })); }
function buildZigSchachtel() { const g = new THREE.Group(), W = 0.056, H = 0.088, D = 0.022, tex = zigTex(), weiss = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.7 }), front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), blau = new THREE.MeshStandardMaterial({ color: 0x1c3f78, roughness: 0.6 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(W, H * 0.8, D), [weiss, weiss, weiss, weiss, front, front]); box.position.y = H * 0.4; g.add(box);   // Unterteil, vorne und hinten bedruckt
  const filM = new THREE.MeshStandardMaterial({ color: 0xd99a4a, roughness: 0.8 }); for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.0039, 0.0039, 0.018, 10), filM); f.position.set(-0.018 + i * 0.012, H * 0.8 + 0.006 - (i % 2) * 0.003, 0); g.add(f); }   // Filter schauen heraus
  const deckel = new THREE.Group(); deckel.position.set(0, H * 0.8, -D / 2); g.add(deckel); const dk = new THREE.Mesh(new THREE.BoxGeometry(W, H * 0.2, D), blau); dk.position.set(0, H * 0.1, D / 2); deckel.add(dk); deckel.rotation.x = -1.9;   // Klappdeckel offen nach hinten
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
function buildZigarette() { const g = new THREE.Group(), L = 0.084, papier = new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.8 }), filter = new THREE.MeshStandardMaterial({ color: 0xd99a4a, roughness: 0.8 });
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.0039, 0.0039, L * 0.75, 12), papier); p.rotation.z = Math.PI / 2; p.position.x = L * 0.375; g.add(p);
  const f = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, L * 0.25, 12), filter); f.rotation.z = Math.PI / 2; f.position.x = -L * 0.125; g.add(f);
  const glut = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0034, 0.004, 12), new THREE.MeshBasicMaterial({ color: 0xff5a1a })); glut.rotation.z = Math.PI / 2; glut.position.x = L * 0.75 + 0.002; g.add(glut);
  g.userData.papier = p; g.userData.glut = glut; g.userData.L = L; return g; }
const ZIG_PUFF = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, "rgba(220,220,225,.55)"); gr.addColorStop(1, "rgba(220,220,225,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; })();
function zigAn() { if (!invHas("zigarette")) return; if (typeof invHas === "function" && !invHas("feuerzeug")) return toast("Kein Feuerzeug – ohne Feuer keine Zigarette"); ZIG.an = true; ZIG.t = 0; ZIG.zug = 2; toast("Zigarette angezündet (Linksklick: ausdrücken)"); }
function zigAus(abgebrannt) { if (!ZIG.an) return; ZIG.an = false; invTake("zigarette", 1); if (typeof invRender === "function") invRender(); toast(abgebrannt ? "Zigarette abgebrannt" : "Zigarette ausgedrückt"); }
function zigStep(dt) { const held = typeof invHeld === "function" && invHeld() === "zigarette";
  if (ZIG.an && !held) zigAus(false);
  if (ZIG.an) { ZIG.t += dt; ZIG.zug -= dt; if (ZIG.t >= ZIG.dauer) zigAus(true); }
  const H = typeof HAND3D_S !== "undefined" ? HAND3D_S : null; if (!H || !H.g || H.id !== "zigarette") return;
  let sch = null, zig = null; H.g.traverse(o => { if (o.userData.zigSch) sch = o; if (o.userData.zig) zig = o; }); if (!sch || !zig) return;
  sch.visible = !ZIG.an; zig.visible = ZIG.an; if (!ZIG.an) return;
  const z = zig.userData.zig, k = Math.max(0.15, 1 - ZIG.t / ZIG.dauer), L = z.userData.L;   // abbrennen: Papier wird kuerzer, Glut wandert mit
  z.userData.papier.scale.y = k; z.userData.papier.position.x = L * 0.375 * k; z.userData.glut.position.x = L * 0.75 * k + 0.002;
  const zieht = ZIG.zug > -0.8 && ZIG.zug < 0; z.userData.glut.material.color.setHex(zieht ? 0xffc04a : 0xff4a10);   // beim Zug heller
  if (ZIG.zug < -0.8) { ZIG.zug = 5; for (let i = 0; i < 3; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ZIG_PUFF, transparent: true, depthWrite: false })); s.position.copy(z.userData.glut.getWorldPosition(new THREE.Vector3())); s.scale.setScalar(0.03); s.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.03, 0.05 + Math.random() * 0.03, -0.02); s.userData.a = 0; H.sc.add(s); ZIG.puffs.push(s); } }
  if (Math.random() < dt * 3) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ZIG_PUFF, transparent: true, depthWrite: false, opacity: 0.5 })); s.position.copy(z.userData.glut.getWorldPosition(new THREE.Vector3())); s.scale.setScalar(0.012); s.userData.v = new THREE.Vector3(0, 0.03, 0); s.userData.a = 0; H.sc.add(s); ZIG.puffs.push(s); }   // feiner Rauch von der Glut
  for (let i = ZIG.puffs.length - 1; i >= 0; i--) { const s = ZIG.puffs[i]; s.userData.a += dt; s.position.addScaledVector(s.userData.v, dt); s.scale.multiplyScalar(1 + dt * 1.2); s.material.opacity = Math.max(0, (s.material.opacity || 1) - dt * 0.35); if (s.userData.a > 3 || s.material.opacity <= 0) { H.sc.remove(s); s.material.dispose(); ZIG.puffs.splice(i, 1); } } }
addEventListener("mousedown", e => { if (e.button !== 0 || !document.pointerLockElement || typeof invHeld !== "function" || invHeld() !== "zigarette") return; e.preventDefault(); e.stopImmediatePropagation(); ZIG.an ? zigAus(false) : zigAn(); }, true);
if (typeof HAND3D !== "undefined") HAND3D.zigarette = () => { const g = new THREE.Group(), s = buildZigSchachtel(), z = buildZigarette(); s.scale.setScalar(1.4); s.rotation.set(0.25, -0.5, 0.05); s.position.y = -0.05; s.userData.zigSch = true;
  const zh = new THREE.Group(); zh.add(z); zh.userData.zig = z; zh.rotation.set(0.1, 0.5, 0.35); zh.scale.setScalar(1.6); zh.position.set(-0.04, 0.0, 0); zh.visible = false; g.add(s, zh); return g; };
