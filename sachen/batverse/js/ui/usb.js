// USB-Sticks (Nicolas 2026-11-18, N39: "USB-Sticks, zuerst 3 verschieden aussehende, mit eigener Software/Daten; in Computer, Laptop oder Server einstecken").
// Spiel und Werkstatt, nach ui/inventar.js und gotham/tresor.js (HAND3D); im Laptop (ui/laptop.js) ueber usbTaskbar, usbLock, usbBody, usbClick eingebunden.
// Drei Sticks (Gegenstaende, Stapel 1): usb-wayne (silbern, WayneTech: Projektdateien), usb-hack (schwarz mit roter LED: "GateBreaker" entsperrt Laptops ohne Passwort),
// usb-daten (blau mit Band: Daten aus einer Ermittlung). Einstecken: im Laptop in der Taskleiste das USB-Symbol (nur Sticks im Inventar), dann erscheint die App "USB-Laufwerk".
// Auf dem Sperrbildschirm: "USB-Stick einstecken" mit dem schwarzen Stick umgeht das Passwort. Computer und Server (Bunker) kommen spaeter (OFFENE-FRAGEN 49).
const USB_DEF = {
  "usb-wayne": { name: "WayneTech-Stick", farbe: 0xc9cdd3, kappe: 0x1d2a44, laufwerk: "WAYNETECH (E:)", dateien: [
    ["Projekte/Tumbler_Panzerung.pdf", "PROJEKT TUMBLER – Panzerung\n\nKeramik-Verbundplatten, Stufe IV. Gewicht je Platte 38 kg.\nBrückensprung: Hydraulik hinten, 10 s Abklingzeit nach jedem Sprung.\nStatus: einsatzbereit (Bunker, Drehscheibe)."],
    ["Projekte/Batpod_Notizen.txt", "Batpod: Vorderrad 508 mm, Kanonen links und rechts.\nWenden: Räder drehen um 180 Grad, Fahrer bleibt sitzen.\nNicht für Regen geeignet. – L.F."],
    ["Projekte/Cape_Gleitstoff.docx", "Gleitstoff (Memory-Gewebe): mit Strom starr, ohne Strom weich.\nGleitwinkel ca. 1:3. Test vom Wayne Tower: 260 m weit.\n(Siehe Notiz N48 Gleitumhang.)"],
    ["Notiz_Lucius.txt", "Bruce,\n\ndie Prototypen stehen alle in der Halle unter dem Container.\nBitte bring den Batpod diesmal heil zurück.\n\n– Lucius"],
  ] },
  "usb-hack": { name: "Schwarzer Stick", farbe: 0x111216, kappe: 0x111216, led: 0xff2a2a, laufwerk: "GATEBREAKER (F:)", hack: true, dateien: [
    ["GateBreaker.exe", "GATEBREAKER 2.1\n\nUmgeht die Anmeldung von WayneOS-Laptops.\nAuf dem Sperrbildschirm einstecken: \"USB-Stick einstecken\".\n\nSpäter: Tresore, Türen, Fahrzeuge (Generalschlüssel, Notiz N9)."],
    ["liesmich.txt", "Nicht verlieren. Nicht in fremde Hände.\nJeder Zugriff hinterlässt Spuren im Protokoll."],
  ] },
  "usb-daten": { name: "Daten-Stick", farbe: 0x1e6fd0, kappe: 0x0f3f80, band: 0xf2c21b, laufwerk: "BEWEISE (G:)", dateien: [
    ["Kontobewegungen.csv", "Datum;Von;An;Betrag\n02.11.;Iceberg Lounge;Konto 7741 (Narrows);48 000 $\n05.11.;Konto 7741;Hafen-Spedition;46 500 $\n09.11.;Hafen-Spedition;Casino-Kasse;45 000 $\n12.11.;Casino-Kasse;Konto 7741;44 100 $\n\nVermerk: immer knapp unter 50 000 $ – Kreislauf (Geldwäsche, Notiz N2)."],
    ["Fotos/Hafen_Container.jpg", "[Bild] Container GTHU 418 2203 am Kai, nachts.\nZwei Männer, ein Lieferwagen ohne Kennzeichen."],
    ["Protokoll_GCPD.txt", "Gotham City Police Department – Beweismittel 2211-B\nUSB-Stick, blau, sichergestellt im Hafen.\nZugriff nur für Commissioner Gordon."],
  ] },
};
const USB = { menu: false, datei: null, hack: null };
const usbOwned = () => Object.keys(USB_DEF).filter(id => typeof invHas === "function" && invHas(id));
const usbIc = '<path d="M9 2h6v6H9z"/><path d="M7 8h10v9a5 5 0 0 1-10 0z"/><path d="M10.5 4.5h.01M13.5 4.5h.01"/>';
if (typeof LT_APPS !== "undefined") LT_APPS.usb = ["USB-Laufwerk", "#8a5bd6", usbIc];
// Taskleiste: USB-Symbol mit Menue (einstecken / auswerfen)
function usbTaskbar() { const own = usbOwned(); if (!own.length && !LT.usb) return "";
  return '<button class="lt-tb' + (USB.menu || LT.usb ? " on" : "") + '" data-a="usbmenu" title="USB-Stick" style="color:#b48cff">' + ltSvg(usbIc, 18) + "</button>" + (USB.menu ? '<div class="lt-pmenu lt-usbmenu">' +
    (LT.usb ? '<button data-a="usbaus">' + ltSvg(usbIc, 20) + USB_DEF[LT.usb].name + " auswerfen</button>" : own.map(id => '<button data-a="usbein" data-v="' + id + '">' + ltSvg(usbIc, 20) + USB_DEF[id].name + " einstecken</button>").join("")) + "</div>" : ""); }
// Sperrbildschirm: mit dem schwarzen Stick die Anmeldung umgehen
function usbLock() { if (!(typeof invHas === "function" && invHas("usb-hack"))) return ""; if (USB.hack === LT.cur) return '<div class="lt-hint" style="color:#ff6a6a">GateBreaker läuft … Anmeldung wird umgangen</div>';
  return '<button class="lt-btn" data-a="usbhack" style="margin-top:14px;background:#2a0d10;color:#ff8a8a">USB-Stick einstecken</button>'; }
// App "USB-Laufwerk": Dateiliste links, Inhalt rechts
function usbBody() { const D = USB_DEF[LT.usb]; if (!D) return '<div class="lt-page"><h2>Kein Laufwerk</h2></div>'; const sel = USB.datei ?? 0, f = D.dateien[sel];
  return '<div class="lt-page" style="display:flex;gap:18px;height:100%;box-sizing:border-box"><div style="flex:0 0 250px"><h2 style="font-size:18px">' + ltEsc(D.laufwerk) + '</h2><p class="lt-sub">' + D.dateien.length + " Dateien</p>" +
    D.dateien.map(([n], i) => '<div class="lt-row" data-a="usbdatei" data-v="' + i + '" style="cursor:pointer;' + (i === sel ? "font-weight:700;color:#8a5bd6" : "") + '">' + ltSvg(n.endsWith(".exe") ? '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8M12 8v8"/>' : '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>', 16) + ltEsc(n) + "</div>").join("") +
    '</div><pre style="flex:1;margin:0;padding:14px;border-radius:8px;background:rgba(127,127,127,.12);white-space:pre-wrap;font:13px/1.5 Consolas,monospace;overflow:auto">' + ltEsc(f ? f[1] : "") + "</pre></div>"; }
function usbClick(a, v) {
  if (a === "usbmenu") { USB.menu = !USB.menu; return true; }
  if (a === "usbein") { LT.usb = v; USB.menu = false; USB.datei = 0; LT.app = "usb"; toast(USB_DEF[v].name + " eingesteckt"); return true; }
  if (a === "usbaus") { toast(USB_DEF[LT.usb].name + " ausgeworfen"); LT.usb = null; USB.menu = false; if (LT.app === "usb") LT.app = null; return true; }
  if (a === "usbdatei") { USB.datei = +v; return true; }
  if (a === "usbhack") { const id = LT.cur; USB.hack = id; setTimeout(() => { if (USB.hack !== id) return; USB.hack = null; LT.locked[id] = false; LT.usb = "usb-hack"; LT.app = "usb"; USB.datei = 0; if (typeof laptopIsOpen === "function" && laptopIsOpen() && LT.cur === id) { ltRender(); ltScreenDraw(id); } toast("GateBreaker: Anmeldung umgangen"); }, 2200); return true; }
  return false; }
// 3D-Modell: Gehaeuse, USB-A-Stecker (Metall mit zwei Loechern), je Stick Kappe, LED oder Band
function buildUsbStick(id) { const D = USB_DEF[id] || USB_DEF["usb-wayne"], g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.2, ...o });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.008, 0.05), M(D.farbe, id === "usb-wayne" ? { metalness: 0.5, roughness: 0.3 } : {})); body.position.z = 0.012; g.add(body);
  const st = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.0045, 0.013), M(0xc8ccd2, { metalness: 0.6, roughness: 0.25 })); st.position.z = -0.0195; g.add(st);
  for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.0006, 0.002), M(0x111111)); h.position.set(sx * 0.003, 0.0023, -0.021); g.add(h); }
  if (id === "usb-wayne") { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.006), new THREE.MeshBasicMaterial({ map: canvasTex(64, 40, (c, w, h) => { c.fillStyle = "#1d2a44"; c.fillRect(0, 0, w, h); c.fillStyle = "#e9ecef"; c.font = "bold 30px Georgia"; c.textAlign = "center"; c.fillText("W", w / 2, 31); }) })); w.rotation.x = -Math.PI / 2; w.position.set(0, 0.0041, 0.018); g.add(w); }
  if (D.led) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.001, 0.003), new THREE.MeshBasicMaterial({ color: D.led })); l.position.set(0, 0.0042, 0.03); g.add(l); }
  if (D.band) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.0012, 6, 14), M(0xb8bcc2, { metalness: 0.7 })); ring.position.z = 0.04; ring.rotation.x = Math.PI / 2; g.add(ring);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.0008, 0.028), M(D.band)); band.position.set(0, -0.002, 0.056); band.rotation.x = 0.25; g.add(band); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
// 2D-Symbole und Beschreibungen
if (typeof INV_ITEMS !== "undefined") for (const id in USB_DEF) { const D = USB_DEF[id], hex = c => "#" + c.toString(16).padStart(6, "0");
  INV_ITEMS[id] = { name: D.name, art: "Daten", stack: 1, svg: '<g transform="rotate(-35 13 13)"><rect x="10.2" y="2.6" width="5.6" height="5.4" rx=".5" fill="#c8ccd2" stroke="#7a8088" stroke-width=".4"/><rect x="11.4" y="4" width="1.2" height="1.2" fill="#333"/><rect x="13.4" y="4" width="1.2" height="1.2" fill="#333"/>' +
    '<rect x="8.6" y="7.8" width="8.8" height="13.4" rx="1.6" fill="' + hex(D.farbe) + '" stroke="' + (id === "usb-hack" ? "#444" : "#2a3446") + '" stroke-width=".6"/>' + (id === "usb-wayne" ? '<text x="13" y="16.6" font-size="5.5" font-family="Georgia" font-weight="bold" text-anchor="middle" fill="#1d2a44">W</text>' : "") +
    (D.led ? '<circle cx="13" cy="18.6" r="1" fill="#ff2a2a"/>' : "") + (D.band ? '<circle cx="13" cy="22.4" r="1.2" fill="none" stroke="#b8bcc2" stroke-width=".7"/><path d="M13 23.6 Q15.5 25 16.5 25.6" stroke="#f2c21b" stroke-width="1.4" fill="none"/>' : "") + "</g>" };
  if (typeof INV_DESC !== "undefined") INV_DESC[id] = D.name + ": USB-Stick mit Laufwerk " + D.laufwerk + ". Am Laptop in der Taskleiste über das USB-Symbol einstecken." + (D.hack ? " Auf dem Sperrbildschirm umgeht er die Anmeldung (GateBreaker)." : ""); }
if (typeof HAND3D !== "undefined") for (const id in USB_DEF) HAND3D[id] = () => { const g = new THREE.Group(), s = buildUsbStick(id); s.scale.setScalar(3.2); s.rotation.set(0.9, 0.6, 0.2); g.add(s); return g; };
