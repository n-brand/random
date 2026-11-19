// Spielfiguren, Schritt F1 (Nicolas 2026-11-18, N35: "Spielfiguren anfangen, einfach gebaut wie in Schedule I"; Plan PLAN-FIGUREN.md). Spiel und Werkstatt.
// buildFigur(o) -> Gruppe (Fuesse bei y 0, Blick nach -z, 1,78 m gross, Augen auf 1,62 m) mit Gelenken in userData: kopf, rumpf, armL/armR (Schulter), unterarmL/R (Ellbogen),
// beinL/beinR (Huefte), knieL/R. o: { haut, haar, oberteil, hose, schuhe, frisur 0-3, bart } (Farben als Zahl). Eigener Entwurf: runder Kopf, gezeichnetes Gesicht, Kapseln, flache Farben.
// Kopf 1,18-fach (verspielter Stil). figurPose(F, t, tempo, sprung): Stehen (Atmen), Gehen/Rennen (Arme und Beine schwingen gegenlaeufig, Knie beugen, Kopf wippt) aus tempo in m/s, sprung = in der Luft.
const FIGUR_STD = { haut: 0xe0b48c, haar: 0x2a1a10, oberteil: 0x22324a, hose: 0x2a2c30, schuhe: 0x15161a, frisur: 0, bart: false };
function figurGesicht(o) { return canvasTex(128, 128, (c, w, h) => { const hx = "#" + o.haut.toString(16).padStart(6, "0"); c.fillStyle = hx; c.fillRect(0, 0, w, h);
  c.fillStyle = "#ffffff"; for (const x of [44, 84]) { c.beginPath(); c.ellipse(x, 58, 10, 12, 0, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#2a1e16"; for (const x of [46, 82]) { c.beginPath(); c.arc(x, 60, 6, 0, Math.PI * 2); c.fill(); } c.fillStyle = "#fff"; for (const x of [48, 84]) { c.beginPath(); c.arc(x, 57, 2, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = "#" + o.haar.toString(16).padStart(6, "0"); c.lineWidth = 5; c.lineCap = "round"; for (const [x0, x1] of [[34, 54], [74, 94]]) { c.beginPath(); c.moveTo(x0, 42); c.lineTo(x1, 40); c.stroke(); }   // Brauen
  c.strokeStyle = "#7a3a2a"; c.lineWidth = 4; c.beginPath(); c.moveTo(52, 90); c.quadraticCurveTo(64, 98, 76, 90); c.stroke();   // Mund
  c.fillStyle = "rgba(200,90,70,.18)"; for (const x of [36, 92]) { c.beginPath(); c.arc(x, 78, 8, 0, Math.PI * 2); c.fill(); }   // Wangen
  if (o.bart) { c.fillStyle = "rgba(40,26,16,.55)"; c.beginPath(); c.ellipse(64, 100, 34, 22, 0, 0, Math.PI); c.fill(); } }); }
function buildFigur(o = {}) { o = { ...FIGUR_STD, ...o }; const g = new THREE.Group(), M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 }), haut = M(o.haut), haar = M(o.haar), ober = M(o.oberteil), hose = M(o.hose), schuh = M(o.schuhe);
  const cap = (m, r, l, par, y = -l / 2 - r) => { const k = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), m); k.position.y = y; k.castShadow = true; par.add(k); return k; };
  const gelenk = (par, x, y, z) => { const j = new THREE.Group(); j.position.set(x, y, z); par.add(j); return j; };
  const rumpf = gelenk(g, 0, 0.95, 0); { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.36, 4, 12), ober); b.scale.set(1, 1, 0.72); b.position.y = 0.3; b.castShadow = true; rumpf.add(b);
    const bk = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.08, 4, 12), hose); bk.scale.set(1.05, 1, 0.75); bk.position.y = 0.0; rumpf.add(bk); }   // Oberkoerper, Becken
  const hals = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 10), haut); hals.position.y = 0.64; rumpf.add(hals);
  const kopf = gelenk(rumpf, 0, 0.7, 0); kopf.scale.setScalar(1.18); { const k = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 16), [haut]); k.scale.set(1, 1.12, 1); k.position.y = 0.14; k.castShadow = true; kopf.add(k);
    const ges = new THREE.Mesh(new THREE.SphereGeometry(0.151, 20, 16, Math.PI * 1.12, Math.PI * 0.76, Math.PI * 0.2, Math.PI * 0.55), new THREE.MeshStandardMaterial({ map: figurGesicht(o), roughness: 0.8 })); ges.scale.set(1, 1.12, 1); ges.position.y = 0.14; ges.rotation.y = 0; kopf.add(ges);   // Gesicht vorne (-z)
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), haut); e.scale.set(0.6, 1, 1); e.position.set(sx * 0.148, 0.14, 0.01); kopf.add(e); }   // Ohren
    const fr = o.frisur, hm = haar; if (fr === 0) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.158, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), hm); h.scale.set(1, 1.12, 1); h.position.y = 0.15; h.rotation.x = 0.3; kopf.add(h); }   // kurz (nach hinten gekippt, Stirn frei)
    else if (fr === 1) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.162, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), hm); h.scale.set(1.02, 1.14, 1.05); h.position.y = 0.15; h.rotation.x = 0.55; kopf.add(h); const z = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.18, 4, 8), hm); z.position.set(0, 0.0, 0.14); kopf.add(z); }   // lang mit Zopf
    else if (fr === 2) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), hm); h.scale.set(1.1, 0.9, 1.1); h.position.y = 0.26; kopf.add(h); }   // Locken
    // fr 3: Glatze
  }
  const arm = (sx) => { const s = gelenk(rumpf, sx * 0.25, 0.5, 0); cap(ober, 0.065, 0.2, s); const e = gelenk(s, 0, -0.33, 0); cap(haut, 0.055, 0.2, e); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), haut); hd.position.y = -0.36; e.add(hd); return [s, e]; };
  const bein = (sx) => { const h = gelenk(rumpf, sx * 0.1, -0.06, 0); cap(hose, 0.08, 0.3, h); const k = gelenk(h, 0, -0.44, 0); cap(hose, 0.07, 0.3, k); const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), schuh); f.position.set(0, -0.45, -0.04); f.castShadow = true; k.add(f); return [h, k]; };
  const [armL, uaL] = arm(-1), [armR, uaR] = arm(1), [beinL, knieL] = bein(-1), [beinR, knieR] = bein(1);
  g.userData = { kopf, rumpf, armL, armR, unterarmL: uaL, unterarmR: uaR, beinL, beinR, knieL, knieR, phase: 0 }; g.name = "Spielfigur"; return g; }
// Figuren, die sich bewegen (Werkstatt-Vorfuehrung, Skateboard): FIGUREN.push({ g, tempo }) – figurStep aus tresorStep
const FIGUREN = [];
function figurStep(dt) { for (const f of FIGUREN) if (f.g.visible && f.g.parent) { figurPose(f.g, dt, f.tempo || 0, f.sprung && !f.gleit); if (f.g.userData.cape && typeof batUmhang === "function") batUmhang(f.g, dt, f.tempo || 0, !!f.gleit, !!f.sprung); } }   // Batman: Umhang (F3)
function figurPose(F, dt, tempo = 0, sprung = false) { const U = F.userData; U.phase += dt * (2.2 + tempo * 1.25); U.t = (U.t || 0) + dt; const p = U.phase, k = Math.min(1, tempo / 4), run = Math.max(0, Math.min(1, (tempo - 5) / 3));
  const sw = Math.sin(p) * (0.5 * k + 0.35 * run), atm = Math.sin(U.t * 2) * 0.012;
  U.beinL.rotation.x = sw; U.beinR.rotation.x = -sw; U.knieL.rotation.x = -Math.max(0, -Math.sin(p - 0.6)) * (0.7 * k + 0.4 * run); U.knieR.rotation.x = -Math.max(0, Math.sin(p - 0.6)) * (0.7 * k + 0.4 * run);   // Knie knicken nach hinten, Ellbogen nach vorne (2026-11-19, Nicolas: "Figuren falsch herum gebaut")
  U.armL.rotation.x = -sw * 0.9; U.armR.rotation.x = sw * 0.9; U.armL.rotation.z = -0.08; U.armR.rotation.z = 0.08; U.unterarmL.rotation.x = U.unterarmR.rotation.x = 0.2 + 0.9 * run;
  U.rumpf.position.y = 0.95 + Math.abs(Math.sin(p)) * 0.035 * k + atm; U.rumpf.rotation.x = -0.12 * run; U.kopf.rotation.x = 0.1 * run;
  if (sprung) {   // Sprung als Ablauf alle 1,6 s (Nicolas 2026-11-19: "die Springen-Animation geht nicht"): in die Knie, abspringen (0,55 m hoch, Beine angezogen, Arme hoch), landen, abfedern, stehen
    if (U.y0 === undefined) U.y0 = F.position.y; const c = (U.t % 1.6) / 1.6, ein = c < 0.2 ? Math.sin(c / 0.2 * Math.PI / 2) : c < 0.28 ? 1 - (c - 0.2) / 0.08 : c > 0.72 && c < 0.9 ? Math.sin((c - 0.72) / 0.18 * Math.PI) : 0, flug = c >= 0.25 && c <= 0.72 ? (c - 0.25) / 0.47 : -1;
    const hoch = flug >= 0 ? 4 * 0.55 * flug * (1 - flug) : 0, zieh = flug >= 0 ? Math.sin(flug * Math.PI) : 0, b = 0.75 * ein + 0.9 * zieh;
    F.position.y = U.y0 + hoch; U.rumpf.position.y = 0.95 - 0.2 * ein; U.rumpf.rotation.x = -0.25 * ein; U.beinL.rotation.x = U.beinR.rotation.x = b; U.knieL.rotation.x = U.knieR.rotation.x = -1.6 * b;
    const arm = flug >= 0 ? 2.4 * zieh : -0.5 * ein; U.armL.rotation.x = U.armR.rotation.x = arm; U.armL.rotation.z = -0.15; U.armR.rotation.z = 0.15; } }

// ---- Schritt F2: dritte Person zu Fuss (Nicolas 2026-11-19 "Ja, weiter"; Taste V nach OFFENE-FRAGEN 53). Spiel und Werkstatt.
// V schaltet Ich-Sicht / Kamera hinter der Figur (ueber die rechte Schulter, 3,2 m, Maus dreht wie bisher, Kamera stoesst nicht durch Waende: shotSeg).
// Die Figur steht an der Spielerposition, dreht sich weich in Laufrichtung (mit Waffe in der Hand oder beim Zielen in Blickrichtung), Animation aus dem Tempo (figurPose),
// in der Luft Sprunghaltung. Gehaltener Gegenstand sitzt in der rechten Hand (Schusswaffen ueber gunBuild, Werkzeuge ueber HAND3D); beim Zielen hebt sie den Arm in
// Blickrichtung. Die Hand-Anzeigen der Ich-Sicht (2D-Bild, 3D-Waffe, Batarang, Jeton, Werkzeug) sind dann aus (dpAn()). Stand in localStorage wm-dritte.
const DP = { on: false, F: null, w: null, h: 0, last: null, item: null, itemId: null, cam: new THREE.Vector3(), D: 3.2, side: 0.45 };
const dpAn = () => DP.on && typeof walking !== "undefined" && walking && !(typeof ghost !== "undefined" && ghost) && !(typeof SKATE !== "undefined" && SKATE.on) && !document.body.classList.contains("drive");
try { DP.on = localStorage.getItem("wm-dritte") === "1"; } catch (e) {}
// ---- Schritt F3: Batman-Figur (Nicolas 2026-11-19 "Ja, weiter"). Gleiche Gelenke wie buildFigur. Anzug dunkelgrau mit schwarzen Panzerplatten (Brust, Bauch in Segmenten,
// Schultern, Schienbeine), schwarzes Fledermaus-Emblem auf der Brust, Gurt mit Taschen und Schnalle, Handschuhe mit Finnen an den Unterarmen, Stiefel; Maske (Kopf bis unter die
// Augen, Ohren, weisse Augenschlitze, Kinn frei), Umhang als biegsame Flaeche an den Schultern (batUmhang: flattert, weht mit dem Tempo nach hinten, beim Gleiten ausgebreitet).
// Angezogen wird der Batsuit im Inventar auf dem Platz "Koerper"; dann zeigt die dritte Person (V) Batman statt Bruce.
function buildBatman() {
  const F = buildFigur({ haut: 0xd8ad86, oberteil: 0x2a2c31, hose: 0x2a2c31, schuhe: 0x0b0b0d, haar: 0x0b0b0d, frisur: 3 }), U = F.userData, m = (c, r = 0.55, mt = 0.25) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: mt });
  const schwarz = m(0x111214, 0.45, 0.35), matt = m(0x18191c, 0.8, 0.1), gold = m(0x6a5a2a, 0.5, 0.5);
  const add = (par, geo, mt, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, mt); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; par.add(o); return o; };
  // Brustpanzer, Bauchsegmente, Emblem
  { const b = add(U.rumpf, new THREE.SphereGeometry(0.2, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), schwarz, 0, 0.37, -0.02); b.scale.set(1.12, 0.9, 0.78); b.rotation.x = -0.25; }
  for (let k = 0; k < 3; k++) add(U.rumpf, new THREE.BoxGeometry(0.15, 0.055, 0.04), schwarz, 0, 0.27 - k * 0.07, -0.135);
  { const s = new THREE.Shape(), P = typeof BAT_SIGNAL_PTS !== "undefined" ? BAT_SIGNAL_PTS : null;
    if (P && P.length > 4) { const A = [...P, ...P.slice(0, -1).reverse().map(([x, y]) => [-x, y])]; A.forEach(([x, y], i) => i ? s.lineTo(x * 0.11, -y * 0.11) : s.moveTo(x * 0.11, -y * 0.11)); }   // halbe Kontur gespiegelt wie batShape
    else { s.moveTo(-0.11, 0.02); s.lineTo(-0.03, 0.0); s.lineTo(-0.02, 0.04); s.lineTo(0, 0.02); s.lineTo(0.02, 0.04); s.lineTo(0.03, 0.0); s.lineTo(0.11, 0.02); s.lineTo(0.06, -0.03); s.lineTo(0, -0.05); s.lineTo(-0.06, -0.03); }
    const e = add(U.rumpf, new THREE.ShapeGeometry(s), m(0x050506, 0.4, 0.2), 0, 0.42, -0.168, 0, Math.PI, 0); e.material.side = THREE.DoubleSide; }
  // Gurt mit Taschen und Schnalle
  { const r = add(U.rumpf, new THREE.CylinderGeometry(0.205, 0.205, 0.07, 20, 1, true), gold, 0, 0.08, 0); r.scale.set(1.04, 1, 0.78); r.material.side = THREE.DoubleSide;
    for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.48; if (Math.abs(k - 2.5) < 0.6) continue; add(U.rumpf, new THREE.BoxGeometry(0.05, 0.07, 0.04), gold, Math.cos(a) * 0.21, 0.07, Math.sin(a) * 0.165, 0, -a - Math.PI / 2, 0); }
    add(U.rumpf, new THREE.BoxGeometry(0.07, 0.06, 0.02), m(0x9a8a4a, 0.3, 0.8), 0, 0.08, -0.165); }
  // Schulterplatten, Handschuhe mit Finnen, Schienbeinplatten, Stiefelschaft
  for (const [arm, ua, sd] of [[U.armL, U.unterarmL, -1], [U.armR, U.unterarmR, 1]]) { const s = add(arm, new THREE.SphereGeometry(0.09, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), schwarz, 0, 0.0, 0); s.scale.set(1.1, 0.8, 1.1);
    add(ua, new THREE.CylinderGeometry(0.06, 0.07, 0.2, 10), matt, 0, -0.24, 0); for (let k = 0; k < 3; k++) add(ua, new THREE.BoxGeometry(0.012, 0.05, 0.04), matt, sd * 0.065, -0.17 - k * 0.05, 0.02, 0, 0, sd * 0.3);
    for (const c of ua.children) if (c.isMesh && c.material && c.material.color && c.material.color.getHex() === 0xd8ad86) c.material = matt; }   // Unterarm und Hand: Handschuh
  for (const [bn, kn] of [[U.beinL, U.knieL], [U.beinR, U.knieR]]) { add(kn, new THREE.BoxGeometry(0.1, 0.22, 0.03), schwarz, 0, -0.18, -0.07); add(kn, new THREE.CylinderGeometry(0.08, 0.075, 0.18, 10), matt, 0, -0.36, 0); }
  // Maske: Haube bis unter die Augen, Ohren, Augenschlitze; die Menschen-Ohren der Grundfigur weg (Nicolas 2026-11-19: "Batman hat keine Loecher fuer Ohren")
  for (const o of [...U.kopf.children]) if (o.isMesh && o.geometry.parameters && o.geometry.parameters.radius === 0.035) U.kopf.remove(o);
  { const k = U.kopf, c = add(k, new THREE.SphereGeometry(0.158, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), schwarz, 0, 0.14, 0); c.scale.set(1.02, 1.14, 1.04);
    const nase = add(k, new THREE.SphereGeometry(0.16, 16, 10, Math.PI * 1.25, Math.PI * 0.5, Math.PI * 0.45, Math.PI * 0.12), schwarz, 0, 0.14, -0.003); nase.scale.set(1, 1.14, 1.02);
    for (const sx of [-1, 1]) { add(k, new THREE.ConeGeometry(0.03, 0.12, 8), schwarz, sx * 0.075, 0.33, 0.0, 0, 0, -sx * 0.12); const a = add(k, new THREE.BoxGeometry(0.05, 0.014, 0.01), new THREE.MeshBasicMaterial({ color: 0xf2f2f2 }), sx * 0.05, 0.165, -0.158, 0, 0, sx * 0.18); }
    add(k, new THREE.CylinderGeometry(0.1, 0.11, 0.12, 14), schwarz, 0, 0.0, 0.01); }
  // Umhang: Flaeche 8 x 14 Felder, oben schmal (Schultern), unten breit mit Zacken; Vertices werden je Bild verschoben (batUmhang)
  { const geo = new THREE.PlaneGeometry(1, 1.32, 8, 14), pos = geo.attributes.position, base = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i) - 0.66, t = -y / 1.32, zz = (i % 9) / 8; let yy = y; if (t > 0.97) yy -= (Math.abs(Math.sin(zz * Math.PI * 4)) * 0.08);
      base[i * 3] = x * (0.42 + 0.5 * t); base[i * 3 + 1] = yy; base[i * 3 + 2] = 0; }
    for (let i = 0; i < pos.count; i++) pos.setXYZ(i, base[i * 3], base[i * 3 + 1], base[i * 3 + 2]); geo.computeVertexNormals();
    const um = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.7, metalness: 0.1, side: THREE.DoubleSide })); um.castShadow = true;
    const halt = new THREE.Group(); halt.position.set(0, 0.6, 0.15); U.rumpf.add(halt); halt.add(um); U.cape = { mesh: um, base, halt, t: 0, spread: 0 }; }
  F.name = "Batman"; return F; }
// Umhang bewegen: tempo m/s, gleiten = Gleitumhang offen (gleiten.js), dt Sekunden
function batUmhang(F, dt, tempo, gleiten, luft) { const C = F.userData.cape; if (!C) return; C.t += dt; C.spread += ((gleiten ? 1 : 0) - C.spread) * Math.min(1, dt * 4);
  const pos = C.mesh.geometry.attributes.position, b = C.base, s = C.spread, wind = Math.min(1, tempo / 7) * (1 - s), flat = luft && !gleiten ? 0.3 : 0;
  for (let i = 0; i < pos.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], t = -y / 1.32, xs = x * (1 + s * (3.5 - 2.75 * t));   // ausgebreitet: oben bis zu den Haenden, unten etwas schmaler
    const welle = Math.sin(t * 5 - C.t * (5 + tempo)) * (0.025 + 0.05 * wind + 0.02 * s) * t, zz = welle + t * t * (0.06 + 0.5 * wind + flat) + s * (t * 0.05 - 0.3 * (xs / 1.4) ** 2);   // ausgebreitet: Raender haengen wie ein Fluegel nach unten
    pos.setXYZ(i, xs, y * (1 - s * 0.25), zz); }
  pos.needsUpdate = true; C.mesh.geometry.computeVertexNormals(); C.halt.rotation.x = -s * 0.15; F.rotation.x = -1.2 * s;   // beim Gleiten liegt die Figur fast waagrecht, Umhang auf dem Ruecken
  if (s > 0.05) { const U = F.userData; U.armL.rotation.set(-0.3 * s, 0, -1.35 * s); U.armR.rotation.set(-0.3 * s, 0, 1.35 * s); U.unterarmL.rotation.x = U.unterarmR.rotation.x = 0; U.rumpf.rotation.x = -0.35 * s;
    U.beinL.rotation.x = U.beinR.rotation.x = 0.15 * s; U.knieL.rotation.x = U.knieR.rotation.x = -0.1 * s; } }
const batAnzug = () => typeof INV !== "undefined" && INV.equip && INV.equip.koerper && INV.equip.koerper.id === "batsuit";
function dpEnsure() { if (!DP.w) { DP.w = new THREE.Group(); DP.w.visible = false; DP.w.userData.dynamic = true; scene.add(DP.w); DP.hand = new THREE.Group(); DP.hand.position.y = -0.37; }
  const bat = batAnzug(); if (DP.F && DP.bat === bat) return; DP.bat = bat; if (DP.F) DP.w.remove(DP.F);
  DP.F = bat ? (DP.Fb || (DP.Fb = buildBatman())) : (DP.Fn || (DP.Fn = buildFigur({ oberteil: 0x1c1f26, hose: 0x23262c, schuhe: 0x0e0f12, haar: 0x1a120c, frisur: 0 })));
  DP.w.add(DP.F); DP.F.userData.unterarmR.add(DP.hand); }
function dpToggle() { DP.on = !DP.on; try { localStorage.setItem("wm-dritte", DP.on ? "1" : "0"); } catch (e) {} DP.last = null; if (typeof toast === "function") toast(DP.on ? "Dritte Person (V: zurück zur Ich-Sicht)" : "Ich-Sicht"); document.body.classList.toggle("dritte", DP.on); }
document.body.classList.toggle("dritte", DP.on);
addEventListener("keydown", e => { if (e.code !== "KeyV" || e.repeat || e.ctrlKey || e.metaKey) return; const t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  if (typeof walking === "undefined" || !walking || (typeof ghost !== "undefined" && ghost) || document.body.classList.contains("drive") || (typeof SKATE !== "undefined" && SKATE.on)) return;
  if (typeof modus !== "undefined" && modus !== "person") return; dpToggle(); });
// Gegenstand in der rechten Hand der Figur (nur bei Wechsel neu gebaut)
function dpItem() { const id = typeof invHeld === "function" ? invHeld() : null; if (id === DP.itemId) return DP.item; DP.itemId = id; if (DP.item) DP.hand.remove(DP.item); DP.item = null;
  let m = null; try { if (id && typeof GUN_SPEC !== "undefined" && GUN_SPEC[id] && typeof gunBuild === "function") m = gunBuild(id); else if (id && typeof HAND3D !== "undefined" && HAND3D[id]) { m = HAND3D[id](); m.position.set(0, 0, 0); } } catch (e) { m = null; }
  if (m) { m.traverse(o => { if (o.isMesh) o.castShadow = true; }); const g = new THREE.Group(); g.add(m); DP.hand.add(g); DP.item = g; } return DP.item; }
// je Bild nach der Bewegung zu Fuss: P = Spieler (pos, yaw, pitch), boden = steht auf dem Boden
function dpStep(dt, P, boden) { const an = dpAn(); if (!an) { if (DP.w) DP.w.visible = false; return false; } dpEnsure();
  const p = P.pos, F = DP.F, U = F.userData; let tempo = 0, mx = 0, mz = 0;
  if (DP.last) { mx = p.x - DP.last.x; mz = p.z - DP.last.z; tempo = Math.hypot(mx, mz) / Math.max(dt, 1e-3); if (tempo > 30) tempo = 0; } DP.last = { x: p.x, z: p.z };
  const id = typeof invHeld === "function" ? invHeld() : null, waffe = !!(id && typeof GUN_SPEC !== "undefined" && GUN_SPEC[id]), ziel = typeof AIM !== "undefined" && !!AIM.on;
  const soll = waffe || ziel ? P.yaw : tempo > 0.4 ? Math.atan2(-mx, -mz) : DP.h, d = Math.atan2(Math.sin(soll - DP.h), Math.cos(soll - DP.h)); DP.h += d * Math.min(1, dt * 10);
  DP.w.visible = true; DP.w.position.set(p.x, p.y, p.z); DP.w.rotation.set(0, DP.h, 0); const gl = typeof GLEIT !== "undefined" && GLEIT.on; figurPose(F, dt, Math.min(tempo, 9), !boden && !gl);
  if (U.cape) batUmhang(F, dt, tempo, gl, !boden);
  const it = dpItem(), hebt = (waffe || ziel) && boden !== null;
  if (hebt) { U.armR.rotation.set(Math.PI / 2 + P.pitch, 0, 0.05); U.unterarmR.rotation.x = 0; if (waffe) { U.armL.rotation.set(Math.PI / 2 + P.pitch - 0.1, 0, -0.45); U.unterarmL.rotation.x = 0.3; } }
  if (it) it.rotation.set((hebt ? P.pitch : 0) - (U.armR.rotation.x + U.unterarmR.rotation.x), 0, 0);
  // Kamera ueber der rechten Schulter, hinter der Figur; nicht durch Waende
  const cy = Math.cos(P.yaw), sy = Math.sin(P.yaw), cp = Math.cos(P.pitch), sp = Math.sin(P.pitch), ziel3 = new THREE.Vector3(p.x + cy * DP.side, p.y + 1.62, p.z - sy * DP.side);
  const cam = ziel3.clone().add(new THREE.Vector3(sy * cp, -sp, cy * cp).multiplyScalar(DP.D));
  if (typeof shotSeg === "function") { const h = shotSeg(ziel3, cam, null, 0.25); if (h) cam.copy(h.p).lerp(ziel3, 0.12); }
  camera.position.copy(cam); camera.rotation.set(P.pitch, P.yaw, 0, "YXZ"); return true; }
