// Tresore mit Sicherheitsstufen (Nicolas 2026-11-18, N23: "verschliessen, verschiedene Sicherheitsstufen und Varianten, aufbrechen oder aufsprengen; Werkzeuge Brechstange,
// explosives Gas, Feuerzeug"; Stufen nach OFFENE-FRAGEN 34). Inhalt ueber das Behaelter-Fenster (inventar.js invBox), nur von vorne, nur offen.
// tresorAdd(parent, stufe, id, pos, rotY) baut einen Tresor, legt Zustand, Behaelter und Rechtsklick-Ziel (gates) an. Front -z, Boden y 0.
// Bedienung (Rechtsklick vor dem Tresor): offen -> Inhalt (mit "Schliessen und verriegeln", "Code ändern"); zu -> Tastenfeld (Standard-Code 0000);
// mit Brechstange in der Hand (Stufe 1-2) Fortschrittskreis halten, mit Gas (Stufe 3-4) Ladung anbringen, mit Feuerzeug zuenden (4 s), Stufe 5 nur mit Code (spaeter Hacktool, N9).
// Ausserdem HAND3D: 3D-Modelle fuer Gegenstaende in der Hand (Werkzeuge), hand3dRender() aus der Bildschleife.
const TRESOR_STUFEN = {
  1: { name: "Geldkassette", w: 0.36, h: 0.14, d: 0.26, t: 0.012, col: 0x6e1c1c, slots: 4, stand: 0.75, brech: 2, gas: 0 },
  2: { name: "Wandtresor", w: 0.5, h: 0.5, d: 0.4, t: 0.04, col: 0x3a3d42, slots: 9, wall: 1.0, brech: 6, gas: 0 },
  3: { name: "Stahlschrank", w: 0.95, h: 1.85, d: 0.85, t: 0.08, col: 0x2a2c30, slots: 18, brech: 0, gas: 1 },
  4: { name: "Banktresor", w: 1.35, h: 2.1, d: 1.1, t: 0.16, col: 0x5a5f66, slots: 27, brech: 0, gas: 2, rund: true },
  5: { name: "Batman-Tresor", w: 1.0, h: 1.6, d: 0.9, t: 0.12, col: 0x121316, slots: 18, brech: 0, gas: 0, bat: true },
};
const TRESOR = { list: [], pad: null, hold: null, last: 0 };
const TRESOR_M = (() => { const m = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.45, metalness: 0.55 }, o));
  return { inner: m(0x15161a, { metalness: 0.1, roughness: 0.9 }), chrom: m(0xc9ccd1, { metalness: 0.9, roughness: 0.2 }), gold: m(0xe0b13a, { metalness: 0.9, roughness: 0.25 }), gelb: m(0xf2c21b, { emissive: 0x3a2a00 }),
    beton: m(0x8d8b86, { metalness: 0, roughness: 0.95 }), holz: m(0x5a3a22, { metalness: 0, roughness: 0.8 }), gas: m(0xc8331f, { metalness: 0.3 }), led: m(0x2aff6a, { emissive: 0x18c050 }), ledR: m(0xff3a2a, { emissive: 0xc01810 }), russ: m(0x1a1714, { metalness: 0, roughness: 1 }) }; })();
function buildTresor(stufe) {
  const S = TRESOR_STUFEN[stufe], M = TRESOR_M, g = new THREE.Group(), body = new THREE.MeshStandardMaterial({ color: S.col, roughness: 0.4, metalness: 0.6 }), y0 = S.stand || S.wall || 0;
  const box = (m, w, h, d, x, y, z, p = g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o; };
  if (S.stand) { box(M.holz, 0.6, 0.04, 0.45, 0, S.stand - 0.02, 0.02); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(M.chrom, 0.03, S.stand - 0.04, 0.03, sx * 0.27, (S.stand - 0.04) / 2, 0.02 + sz * 0.19); }   // Beistelltisch
  if (S.wall) { const W = 1.0, H = 1.7, D = S.d + 0.1, z = 0.05, w2 = S.w / 2, y1 = S.wall + S.h;   // Wandstueck mit Oeffnung um den Tresor, vorne buendig (Nicolas 2026-11-18: "Wandtresor von innen anschauen": die Wand ging mitten durch den Innenraum)
    box(M.beton, W / 2 - w2, H, D, -(W / 2 + w2) / 2, H / 2, z); box(M.beton, W / 2 - w2, H, D, (W / 2 + w2) / 2, H / 2, z); box(M.beton, S.w, S.wall, D, 0, S.wall / 2, z); box(M.beton, S.w, H - y1, D, 0, (H + y1) / 2, z); }
  const { w, h, d, t } = S, cy = y0 + h / 2;
  box(body, w, h, t, 0, cy, d / 2 - t / 2); box(body, t, h, d, -w / 2 + t / 2, cy, 0); box(body, t, h, d, w / 2 - t / 2, cy, 0); box(body, w, t, d, 0, y0 + t / 2, 0); box(body, w, t, d, 0, y0 + h - t / 2, 0);   // Korpus offen vorne
  box(M.inner, w - 2 * t, h - 2 * t, 0.01, 0, cy, d / 2 - t - 0.006); if (h > 0.8) for (const k of [1, 2]) box(M.inner, w - 2 * t, 0.02, d - t - 0.04, 0, y0 + t + (h - 2 * t) * k / 3, 0.01);   // Innenwand, Boeden
  const inside = new THREE.Group(); g.add(inside);   // Inhalt (tresorFill)
  const hinge = new THREE.Group(); hinge.position.set(-w / 2, cy, -d / 2); g.add(hinge); const door = new THREE.Group(); hinge.add(door);   // Scharnier links vorne
  const dt = Math.max(0.03, t * 1.1);
  if (S.rund) { const r = Math.min(w, h) * 0.46; box(body, w, h, dt, w / 2, 0, -dt / 2, door).material = body; const rd = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dt * 1.6, 40), M.chrom); rd.rotation.x = Math.PI / 2; rd.position.set(w / 2, 0, -dt * 1.1); door.add(rd);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, b = box(M.gold, 0.05, 0.05, 0.05, w / 2 + Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, -dt * 2, door); b.rotation.z = a; } }   // runde Tuer mit Bolzen
  else box(body, w, h, dt, w / 2, 0, -dt / 2, door);
  const fz = -dt - (S.rund ? dt * 1.2 : 0.005);
  if (stufe >= 3) { const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), M.chrom); hub.rotation.x = Math.PI / 2; hub.position.set(w * 0.62, 0, fz - 0.03); door.add(hub);
    for (let k = 0; k < (S.rund ? 4 : 3); k++) { const sp = box(M.chrom, 0.022, S.rund ? 0.5 : 0.32, 0.022, w * 0.62, 0, fz - 0.05, door); sp.rotation.z = k * Math.PI / (S.rund ? 4 : 3); }   // Drehgriff
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 32), M.chrom); dial.rotation.x = Math.PI / 2; dial.position.set(w * 0.62, S.rund ? 0.42 : 0.3, fz - 0.015); door.add(dial); }
  else { box(M.chrom, Math.min(0.12, w * 0.3), 0.025, 0.03, w * 0.75, -h * 0.15, fz - 0.015, door); }   // Griff
  if (stufe === 2 || stufe === 5) { const pad = box(new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.6 }), 0.14, 0.18, 0.02, w * (stufe === 5 ? 0.62 : 0.5), stufe === 5 ? -0.3 : 0.08, fz - 0.01, door);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) box(M.chrom, 0.028, 0.022, 0.01, pad.position.x + (c - 1) * 0.038, pad.position.y + 0.05 - r * 0.034, fz - 0.025, door); }   // Tastenfeld
  const led = box(M.ledR, 0.02, 0.02, 0.01, w * 0.9, h * 0.4, fz - 0.01, door);
  if (S.bat) { const ln = box(M.gelb, w * 0.9, 0.025, 0.01, w / 2, h * 0.44, fz - 0.01, door), ln2 = ln.clone(); ln2.position.y = -h * 0.44; door.add(ln2);
    if (typeof BAT_SIGNAL_PTS !== "undefined") { const P = BAT_SIGNAL_PTS, sh = new THREE.Shape(); P.forEach(([x, y], i) => sh[i ? "lineTo" : "moveTo"](x * 0.16, -y * 0.16)); for (let i = P.length - 2; i > 0; i--) sh.lineTo(-P[i][0] * 0.16, -P[i][1] * 0.16);
      const bm = new THREE.Mesh(new THREE.ShapeGeometry(sh), M.gelb); bm.position.set(w / 2, h * 0.2, fz - 0.012); bm.rotation.y = Math.PI; door.add(bm); } }   // Batman-Zeichen
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { stufe, hinge, door, inside, led, y0, cy }; g.name = S.name; return g;
}
// Inhalt sichtbar machen: Goldbarren, Jetons, sonst kleine Schachteln
function tresorFill(T) { const S = TRESOR_STUFEN[T.stufe], I = T.g.userData.inside, M = TRESOR_M; I.clear(); const B = T.box, y = T.g.userData.y0 + S.t + 0.002, iw = S.w - 2 * S.t - 0.04;
  const gold = Math.min(invBoxCount(B, "goldbarren"), S.h > 0.8 ? 8 : 3), bw = Math.min(0.1, iw / 4); for (let k = 0; k < gold; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.035, 0.05), M.gold); b.position.set(-iw / 2 + bw / 2 + (k % 4) * bw * 1.05, y + 0.018 + Math.floor(k / 4) * 0.037, -S.d * 0.1); I.add(b); }
  let x = -iw / 2 + 0.05; for (const q of B.slots) { if (!q || !q.id.startsWith("jeton-") || typeof jetStack !== "function" || x > iw / 2 - 0.05) continue; const st = jetStack(+q.id.slice(6), Math.min(8, q.n), 1); st.position.set(x, y + (gold ? 0.08 : 0), S.d * 0.15); I.add(st); x += 0.07; }
  const other = B.slots.filter(q => q && q.id !== "goldbarren" && !q.id.startsWith("jeton-")).length; for (let k = 0; k < Math.min(other, 4); k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.06), M.inner); b.position.set(iw / 2 - 0.05 - k * 0.09, y + 0.025, 0); I.add(b); } }
function tresorSave(T) { try { localStorage.setItem("wm-tresor-" + T.id, JSON.stringify({ locked: T.locked, open: T.open, broken: T.broken, how: T.how, code: T.code })); } catch (e) {} }
function tresorAdd(parent, stufe, id, pos, rotY = 0, init = [], noGate = false) {   // noGate: Rechtsklick-Ziel legt der Aufrufer selbst an (z. B. Casino ueber CAS.gates)
  const S = TRESOR_STUFEN[stufe], g = buildTresor(stufe); g.position.copy(pos); g.rotation.y = rotY; g.userData.kind = "tresor"; parent.add(g);
  const T = { id, stufe, g, box: invBox("tresor-" + id, S.name, S.slots, init), locked: true, open: false, broken: false, code: "0000", charges: [], fuse: 0, ang: 0, wrong: 0, lockT: 0 };
  try { const d = JSON.parse(localStorage.getItem("wm-tresor-" + id) || "null"); if (d) Object.assign(T, { locked: !!d.locked, open: !!d.open, broken: !!d.broken, how: d.how || "brech", code: d.code || "0000" }); } catch (e) {}
  if (T.broken) tresorBreakLook(T, T.how || "brech"); T.ang = T.broken ? 1.95 : T.open ? 1.75 : 0; g.userData.hinge.rotation.y = T.ang;
  T.box.onChange = () => tresorFill(T); tresorFill(T); TRESOR.list.push(T);
  g.updateMatrixWorld(true); const p = g.getWorldPosition(new THREE.Vector3());
  if (!noGate && typeof gates !== "undefined") gates.push({ name: S.name, g, call: () => tresorUse(T), verbs: ["benutzen", "benutzen"], a: [p.x, p.z], b: [p.x, p.z], near: 3.5 });
  return T;
}
const tresorNear = S => Math.max(2.2, S.w / 2 + 1.8);
function tresorActions(T) { return T.broken ? [{ label: "Tür ist kaputt – nicht mehr verschliessbar", fn: null }] : [{ label: "Schliessen und verriegeln", fn: () => { invClose(); tresorClose(T); } }, { label: "Code ändern", fn: () => { invClose(); tresorPadOpen(T, "set"); } }]; }
function tresorUse(T) {
  const S = TRESOR_STUFEN[T.stufe]; if (!invBoxFront(T.g, tresorNear(S))) return;
  if (T.open) { T.box.actions = tresorActions(T); return invBoxOpen(T.box); }
  if (T.fuse > 0) return toast("Zündung läuft – weg da!");
  const held = typeof invHeld === "function" ? invHeld() : null;
  if (held === "brechstange") { if (!S.brech) return toast(S.name + ": zu stabil für die Brechstange" + (S.gas ? " – aufsprengen (Gas + Feuerzeug)" : " – nur mit Code")); return tresorHold(T, S.brech, "Aufbrechen", () => tresorBreak(T, "brech")); }
  if (held === "sprenggas") { if (!S.gas) return toast(S.brech ? S.name + ": dafür reicht die Brechstange" : S.name + ": Gas wirkt hier nicht – nur mit Code"); if (T.charges.length >= S.gas) return toast("Genug Ladungen – mit dem Feuerzeug zünden");
    if (!invTake("sprenggas", 1)) return; tresorCharge(T); return toast("Gasladung angebracht (" + T.charges.length + " / " + S.gas + ")" + (T.charges.length >= S.gas ? " – jetzt mit dem Feuerzeug zünden" : "")); }
  if (held === "feuerzeug") { if (!S.gas || T.charges.length < S.gas) return toast(S.gas ? "Erst " + (S.gas - T.charges.length) + " Gasladung(en) anbringen" : "Hier gibt es nichts anzuzünden"); T.fuse = 4; return toast("Zündung! 4 Sekunden – Abstand halten"); }
  if (T.lockT > performance.now()) return toast("Tastenfeld gesperrt – noch " + Math.ceil((T.lockT - performance.now()) / 1000) + " s");
  tresorPadOpen(T, "open");
}
function tresorOpen(T) { T.locked = false; T.open = true; tresorSave(T); toast(TRESOR_STUFEN[T.stufe].name + " geöffnet"); }
function tresorClose(T) { if (T.broken) return toast("Die Tür ist kaputt"); T.open = false; T.locked = true; tresorSave(T); toast(TRESOR_STUFEN[T.stufe].name + " verriegelt (Code " + "•".repeat(T.code.length) + ")"); }
function tresorCharge(T) { const S = TRESOR_STUFEN[T.stufe], c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 14), TRESOR_M.gas), v = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.05, 8), TRESOR_M.chrom);
  v.position.y = 0.12; c.add(v); c.position.set(S.w * (0.3 + 0.25 * T.charges.length), -S.h * 0.1, -S.t * 1.1 - 0.1); T.g.userData.door.add(c); T.charges.push(c); }
function tresorBreakLook(T, how) { const U = T.g.userData, S = TRESOR_STUFEN[T.stufe];
  if (how === "spreng") { U.hinge.remove(U.door); const d = U.door; d.rotation.set(-Math.PI / 2, 0, 0.35); d.position.set(-S.w / 2, 0.06, -S.d / 2 - S.h / 2 - 0.15); T.g.add(d);   // Tuer liegt vor dem Tresor
    const soot = new THREE.Mesh((() => { const o = new THREE.Shape(), W = S.w * 0.65, Hh = S.h * 0.55, iw = S.w / 2 - S.t, ih = S.h / 2 - S.t; o.moveTo(-W, -Hh); o.lineTo(W, -Hh); o.lineTo(W, Hh); o.lineTo(-W, Hh); o.lineTo(-W, -Hh); const hl = new THREE.Path(); hl.moveTo(-iw, -ih); hl.lineTo(-iw, ih); hl.lineTo(iw, ih); hl.lineTo(iw, -ih); hl.lineTo(-iw, -ih); o.holes.push(hl); return new THREE.ShapeGeometry(o); })(), new THREE.MeshBasicMaterial({ color: 0x0a0806, transparent: true, opacity: 0.55, depthWrite: false })); soot.position.set(0, U.cy, -S.d / 2 - 0.005); soot.rotation.y = Math.PI; T.g.add(soot); }   // Tuer liegt vor dem Tresor, Russ
  else { U.door.rotation.z = 0.06; U.door.position.y = -0.02; }   // verbogen
  U.led.material = TRESOR_M.russ; }
function tresorBreak(T, how) { T.broken = true; T.how = how; T.open = true; T.locked = false; T.charges.forEach(c => c.parent && c.parent.remove(c)); T.charges = []; tresorBreakLook(T, how); tresorSave(T);
  toast(TRESOR_STUFEN[T.stufe].name + (how === "spreng" ? " aufgesprengt" : " aufgebrochen")); }
function tresorExplode(T) { const p = T.g.localToWorld(new THREE.Vector3(TRESOR_STUFEN[T.stufe].w * 0.3, T.g.userData.cy, -TRESOR_STUFEN[T.stufe].d / 2 - 0.2));
  const L = new THREE.PointLight(0xffb060, 60, 18, 1.6); L.position.copy(p); scene.add(L); TRESOR.flash = { L, t: 0.35 };
  if (typeof aimSmoke === "function") aimSmoke(p); if (typeof shotSound === "function") shotSound(1, 0.9);
  tresorBreak(T, "spreng"); const pl = typeof player !== "undefined" ? player.pos : camera.position; if (Math.hypot(pl.x - p.x, pl.z - p.z) < 3) toast("Aufgesprengt – viel zu nah an der Explosion!"); }
// Fortschrittskreis (N21-Grundlage): laeuft, solange man in der Naehe bleibt und sich kaum bewegt; Rechtsklick nochmal oder Weggehen bricht ab
function holdRingEl() { let el = document.getElementById("hold-ring"); if (!el) { el = document.createElement("div"); el.id = "hold-ring"; el.hidden = true; el.innerHTML = '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" class="hr-bg"/><circle cx="30" cy="30" r="24" class="hr-fg" pathLength="100"/></svg><span></span>'; document.body.appendChild(el); } return el; }   // auch fuer Koffer (koffer.js)
function tresorHold(T, sec, label, done) { const pl = typeof player !== "undefined" ? player.pos : camera.position, el = holdRingEl();
  TRESOR.hold = { T, sec, t: 0, done, x: pl.x, z: pl.z, el }; el.querySelector("span").textContent = label + " …"; el.hidden = false; }
function tresorHoldStep(dt) { const H = TRESOR.hold; if (!H) return; const pl = typeof player !== "undefined" ? player.pos : camera.position;
  if (Math.hypot(pl.x - H.x, pl.z - H.z) > 0.6 || (typeof invHeld === "function" && invHeld() !== "brechstange")) { H.el.hidden = true; TRESOR.hold = null; return toast("Abgebrochen"); }
  H.t += dt; H.el.querySelector(".hr-fg").style.strokeDashoffset = String(100 - Math.min(100, H.t / H.sec * 100)); if (H.t >= H.sec) { H.el.hidden = true; TRESOR.hold = null; H.done(); } }
// Tastenfeld
const tresorPadIsOpen = () => !!(TRESOR.pad && !TRESOR.pad.el.hidden);
function tresorPadOpen(T, mode) {
  if (!TRESOR.pad) { const el = document.createElement("div"); el.id = "tresor-pad"; el.hidden = true; el.innerHTML = '<div class="tp-box"><div class="tp-head"><b></b><button type="button" data-k="x" aria-label="Schliessen">&times;</button></div><div class="tp-disp"></div><div class="tp-msg"></div><div class="tp-keys">' +
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map(k => '<button type="button" data-k="' + k + '">' + k + '</button>').join("") + '</div></div>'; document.body.appendChild(el);
    el.addEventListener("click", e => { const k = e.target.closest("[data-k]")?.dataset.k; if (k) tresorPadKey(k); });
    el.addEventListener("contextmenu", e => e.preventDefault()); el.addEventListener("mousedown", e => { if (e.button === 2) e.preventDefault(); });   // kein Browser-Kontextmenue (Nicolas 2026-11-18: "beim Rechtsklicken geht jedes Mal das auf")
    TRESOR.pad = { el, T: null, mode: "open", v: "" }; }
  const P = TRESOR.pad; P.T = T; P.mode = mode; P.v = ""; P.el.hidden = false; if (document.pointerLockElement) document.exitPointerLock(); if (typeof keys !== "undefined") keys.clear?.();
  P.el.querySelector(".tp-head b").textContent = TRESOR_STUFEN[T.stufe].name + (mode === "set" ? " – neuer Code" : " – Code eingeben");
  P.el.querySelector(".tp-msg").textContent = mode === "set" ? "4 Ziffern, dann OK" : T.stufe === 5 ? "Nur mit Code (Hacktool folgt)" : "Standard-Code 0000"; tresorPadDraw(); }
function tresorPadDraw() { const P = TRESOR.pad; P.el.querySelector(".tp-disp").textContent = (P.v.replace(/./g, "•") + "____").slice(0, 4); }
function tresorPadClose() { const P = TRESOR.pad; if (!P || P.el.hidden) return; P.el.hidden = true; if (typeof grabMouse === "function") grabMouse(); }
function tresorPadKey(k) { const P = TRESOR.pad, T = P.T, box = P.el.querySelector(".tp-box"), msg = P.el.querySelector(".tp-msg");
  if (k === "x") return tresorPadClose(); if (k === "C") { P.v = P.v.slice(0, -1); return tresorPadDraw(); }
  if (/^\d$/.test(k)) { if (P.v.length < 4) P.v += k; tresorPadDraw(); if (P.v.length < 4) return; if (P.mode === "set") return; k = "OK"; }
  if (k !== "OK") return;
  if (P.mode === "set") { if (P.v.length !== 4) { msg.textContent = "Genau 4 Ziffern"; return; } T.code = P.v; tresorSave(T); tresorPadClose(); return toast("Neuer Code gespeichert"); }
  if (P.v === T.code) { T.wrong = 0; tresorPadClose(); return tresorOpen(T); }
  T.wrong++; P.v = ""; tresorPadDraw(); box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
  if (T.wrong >= 3) { T.wrong = 0; T.lockT = performance.now() + 10000; tresorPadClose(); return toast("3 x falsch – Tastenfeld 10 s gesperrt"); } msg.textContent = "Falscher Code (" + T.wrong + " / 3)"; }
addEventListener("keydown", e => { if (!tresorPadIsOpen()) return; e.stopImmediatePropagation(); if (e.key === "Escape") { e.preventDefault(); tresorPadClose(); } else if (/^\d$/.test(e.key)) tresorPadKey(e.key); else if (e.key === "Backspace") tresorPadKey("C"); else if (e.key === "Enter") tresorPadKey("OK"); }, true);
// je Bild: Tueren bewegen, Zuendung, Blitz, Fortschrittskreis (eigene Zeitmessung, Spiel und Werkstatt)
function tresorStep() { const now = performance.now(), dt = Math.min(0.1, (now - (TRESOR.last || now)) / 1000); TRESOR.last = now;
  for (const T of TRESOR.list) { const U = T.g.userData, want = T.open && !T.broken ? 1.75 : T.broken ? 1.95 : 0; if (U.door.parent === U.hinge && Math.abs(T.ang - want) > 0.001) { T.ang += Math.sign(want - T.ang) * Math.min(Math.abs(want - T.ang), dt * 1.6); U.hinge.rotation.y = T.ang; }   // nach vorne (-z) auf (Nicolas 2026-11-18: "die Türen öffnen in die falsche Richtung")
    U.led.material = T.broken ? TRESOR_M.russ : T.open ? TRESOR_M.led : TRESOR_M.ledR;
    if (T.fuse > 0) { T.fuse -= dt; for (const c of T.charges) c.material = (Math.floor(T.fuse * 6) % 2) ? TRESOR_M.gas : TRESOR_M.gelb; if (T.fuse <= 0) tresorExplode(T); } }
  const F = TRESOR.flash; if (F) { F.t -= dt; F.L.intensity = Math.max(0, F.t / 0.35) * 60; if (F.t <= 0) { scene.remove(F.L); TRESOR.flash = null; } }
  tresorHoldStep(dt); if (typeof kofferStep === "function") kofferStep(dt); if (typeof muellStep === "function") muellStep(dt); if (typeof nvStep === "function") nvStep(dt); if (typeof cgStep === "function") cgStep(dt); if (typeof skateStep === "function") skateStep(dt); if (typeof fidgetStep === "function") fidgetStep(dt); }
{ const st = document.createElement("style"); st.textContent = "#tresor-pad{position:fixed;inset:0;z-index:45;display:grid;place-items:center;background:rgba(0,0,0,.45);user-select:none;-webkit-user-select:none}#tresor-pad[hidden]{display:none}" +
    ".tp-box{background:#16181c;border:1px solid #3a3d42;border-radius:12px;padding:14px;width:230px;color:#e8e8e8;font:14px system-ui,sans-serif}.tp-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.tp-head button{background:none;border:0;color:#aaa;font-size:20px;cursor:pointer}" +
    ".tp-disp{background:#0b1a10;color:#4dff8a;font:700 28px ui-monospace,monospace;letter-spacing:10px;text-align:center;padding:8px;border-radius:6px}.tp-msg{min-height:18px;font-size:12px;color:#aab;margin:6px 0}" +
    ".tp-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.tp-keys button{padding:12px 0;font:600 16px system-ui;background:#2a2d33;color:#fff;border:1px solid #444;border-radius:8px;cursor:pointer}.tp-keys button:hover{background:#353941}" +
    ".tp-box.shake{animation:tpsh .35s}@keyframes tpsh{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}" +
    "#hold-ring{position:fixed;left:50%;top:50%;width:64px;height:64px;transform:translate(-50%,-50%);z-index:30;pointer-events:none}#hold-ring[hidden]{display:none}#hold-ring svg{width:64px;height:64px;transform:rotate(-90deg)}" +
    "#hold-ring circle{fill:none;stroke-width:5}.hr-bg{stroke:rgba(255,255,255,.25)}.hr-fg{stroke:#fff;stroke-dasharray:100;stroke-dashoffset:100}#hold-ring span{position:absolute;top:70px;left:50%;transform:translateX(-50%);white-space:nowrap;color:#fff;font:600 13px system-ui;text-shadow:0 1px 3px #000}";
  document.head.appendChild(st); }
// ---- 3D in der Hand fuer Gegenstaende ohne eigenes Handmodell (N8): Builder je id, gezeigt rechts unten wie Batarang und Jetons ----
const HAND3D = {
  greifhaken: () => { const g = new THREE.Group(), m = typeof buildGreifhaken === "function" ? buildGreifhaken() : new THREE.Group(); m.scale.setScalar(1.05); m.rotation.set(0.04, 0.12, 0); g.add(m); g.position.set(0.02, -0.1, 0.04); return g; },   // Lauf nach vorne, leicht nach aussen (2026-11-18: vorher zu gross, zeigte zur Mitte)   // Lauf nach vorne (waffen.js)
  brechstange: () => { const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0xb3262b, metalness: 0.5, roughness: 0.35 }), c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.32, 0), new THREE.Vector3(0, 0.22, 0), new THREE.Vector3(0.02, 0.29, 0), new THREE.Vector3(0.07, 0.31, 0)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 24, 0.012, 8), m)); const k = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.02), m); k.position.set(-0.015, -0.33, 0); k.rotation.z = 0.5; g.add(k); g.scale.setScalar(0.62); g.rotation.set(0.35, 0.3, -0.25); g.position.y = -0.04; return g; },   // kleiner und steiler (2026-11-18: lag quer durchs Bild)
  sprenggas: () => { const g = new THREE.Group(), c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 18), TRESOR_M.gas), v = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.05, 8), TRESOR_M.chrom), l = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.06, 18), TRESOR_M.gelb);
    v.position.y = 0.12; g.add(c, v, l); g.scale.setScalar(0.75); g.rotation.set(0.2, 0, -0.25); g.position.y = -0.02; return g; },
  feuerzeug: () => { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.012), new THREE.MeshStandardMaterial({ color: 0x2f6fd0, roughness: 0.4 })), t = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.012), TRESOR_M.chrom);
    t.position.y = 0.038; g.add(b, t); g.scale.setScalar(2); g.rotation.set(0.1, -0.3, -0.15); return g; },
};
if (typeof HAND3D_VOR !== "undefined") Object.assign(HAND3D, HAND3D_VOR);   // vorher geladene Hand-Modelle (Handys, handy.js)
const HAND3D_S = { id: null, sc: null, g: null };
function hand3dRender() { const id = typeof invHeld === "function" ? invHeld() : null, foot = typeof onFoot === "function" ? onFoot() : true;
  if (!id || !HAND3D[id] || !foot || (typeof invIsOpen === "function" && invIsOpen()) || tresorPadIsOpen() || (typeof SKATE !== "undefined" && SKATE.on)) return;   // auf dem Skateboard nichts in der Hand
  const H = HAND3D_S; if (!H.sc) { H.sc = new THREE.Scene(); H.sc.add(new THREE.HemisphereLight(0xffffff, 0x404040, 1.3)); H.g = new THREE.Group(); const pl = new THREE.PointLight(0xffffff, 3, 0, 0); pl.position.set(-0.15, 0.25, 0.35); H.g.add(pl); H.sc.add(H.g); }
  if (H.id !== id) { H.id = id; for (const c of [...H.g.children]) if (!c.isLight) H.g.remove(c); H.g.add(HAND3D[id]()); }
  H.g.position.copy(camera.position); H.g.quaternion.copy(camera.quaternion); { const zz = 0.45, th = Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV()) / 2); H.g.translateX(0.66 * th * camera.aspect * zz); H.g.translateY(-0.4 * th * zz); H.g.translateZ(-zz); }
  const ac = renderer.autoClear; renderer.autoClear = false; renderer.clearDepth(); renderer.render(H.sc, camera); renderer.autoClear = ac; }
