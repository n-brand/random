// Batverse – Personenaufzug: Kabine, Tueren, Halte, Anzeige, Meldungen (toast)
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Aufzug (Halte: EG, 1. OG, Dach/2. OG; die Hoehle kommt in Schritt 8 dazu) =====================
const STOPS = [{ name: "Erdgeschoss", y: FL0 + HILL }, { name: "1. Obergeschoss", y: FL1 + HILL }, { name: "Dach / 2. Obergeschoss", y: TF + HILL }, { name: "Höhle oben (Upper Level)", y: UY }, { name: "Höhle unten (Lower Level)", y: LY }];
const LIFT = { y: STOPS[0].y, at: 0, target: 0, state: "idle", t: 0, from: STOPS[0].y, to: STOPS[0].y, open: STOPS.map((_, i) => i === 0 ? 1 : 0) };
NOLIFT = true;                                                           // Kabine, Tueren und ihre Kollision sind schon in Endhoehe
const car = new THREE.Group();
car.position.set(SHAFT.cx, LIFT.y, SHAFT.cz);
car.userData.dynamic = true; car.userData.noLift = true;
world.add(car);
const carFloor = S(SHAFT.x0 + 0.05, SHAFT.x1 - 0.05, LIFT.y - 0.15, LIFT.y, SHAFT.z0 + 0.05, SHAFT.z1 - 0.05);
{
  const h = (SHAFT.x1 - SHAFT.x0) / 2 - 0.05;
  B(-h, h, -0.15, 0, -h, h, mat.steel, false, car);
  B(-h, -h + 0.08, 0, 2.9, -h, h, mat.glass, false, car, false); B(-h, h, 0, 2.9, -h, -h + 0.08, mat.glass, false, car, false); B(-h, h, 0, 2.9, h - 0.08, h, mat.glass, false, car, false);
  for (const x of [-h, h - 0.1]) for (const z of [-h, h - 0.1]) B(x, x + 0.1, 0, 2.95, z, z + 0.1, mat.gold, false, car);
  B(-h, h, 2.9, 3.05, -h, h, mat.dark, false, car); B(-0.9, 0.9, 2.86, 2.9, -0.9, 0.9, mat.glow, false, car, false);
  B(-h + 0.08, -h + 0.16, 1.0, 1.1, -1.1, 1.1, mat.gold, false, car);
}
const doorG = new THREE.Group(); doorG.userData.dynamic = true; doorG.userData.noLift = true; world.add(doorG);
const doorPanels = [], doorSolid = [];
STOPS.forEach((st, i) => {
  doorPanels[i] = [-1, 1].map(s => {
    const zc = SHAFT.cz + s * 0.5, m = B(SHAFT.x1 + 0.02, SHAFT.x1 + 0.16, st.y, st.y + 3, zc - 0.5, zc + 0.5, mat.steel, false, doorG);
    m.userData.base = zc; m.userData.s = s;
    return m;
  });
  doorSolid[i] = S(SHAFT.x1, SHAFT.x1 + 0.2, st.y, st.y + 3, SHAFT.cz - 1, SHAFT.cz + 1, i !== 0);
});
NOLIFT = false;
function applyLift() {
  car.position.y = LIFT.y;
  Object.assign(carFloor, { y0: LIFT.y - 0.15, y1: LIFT.y });
  STOPS.forEach((_, i) => {
    const o = LIFT.open[i];
    for (const m of doorPanels[i]) m.position.z = m.userData.base + m.userData.s * o * 0.95;
    doorSolid[i].on = o < 0.7;
  });
}
function updateLift(dt) {
  const L = LIFT;
  if (L.state === "idle" && L.target !== L.at) L.state = "closing";
  if (L.state === "closing") {
    L.open[L.at] = Math.max(0, L.open[L.at] - dt / 0.9);
    if (L.open[L.at] <= 0) { L.state = "moving"; L.t = 0; L.from = L.y; L.to = STOPS[L.target].y; }
  } else if (L.state === "moving") {
    L.t = Math.min(1, L.t + dt / Math.max(2.5, Math.abs(L.to - L.from) / 7));   // ca. 7 m/s (A2: Haus -> Hoehle unten ca. 8 s)
    L.y = lerp(L.from, L.to, sst(0, 1, L.t));
    if (L.t >= 1) { L.at = L.target; L.state = "opening"; }
  } else if (L.state === "opening") {
    L.open[L.at] = Math.min(1, L.open[L.at] + dt / 0.9);
    if (L.open[L.at] >= 1) L.state = "idle";
  }
  applyLift();
}
applyLift();
const inCar = p => p.x > SHAFT.x0 && p.x < SHAFT.x1 && p.z > SHAFT.z0 && p.z < SHAFT.z1 && Math.abs(p.y - LIFT.y) < 1.5;
let toastTimer = 0;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800); }
// Bedienung: im Fahrstuhl = naechster Halt, davor = herrufen
function useLift() {
  const L = LIFT;
  if (L.state !== "idle") return toast("Aufzug ist unterwegs");
  const p = player.pos;
  if (!walking || inCar(p)) { L.target = (L.at + 1) % STOPS.length; return toast("Fahrt: " + STOPS[L.target].name + " (Pfeil hoch/runter oder 1-5)"); }
  const here = STOPS.findIndex(st => Math.abs(p.y - st.y) < 2.5);
  if (here < 0 || Math.hypot(p.x - (SHAFT.x1 + 2), p.z - SHAFT.cz) > 7) return toast("Zu weit vom Aufzug entfernt");
  if (L.at === here) return toast("Der Aufzug ist schon da");
  L.target = here; toast("Der Aufzug kommt");
}
// Im Fahrstuhl: Pfeil hoch/runter = naechster Halt, Tasten 1-5 = Halt von unten nach oben, oder Knopf in der Anzeige rechts
const STOP_ORDER = STOPS.map((s, i) => i).sort((a, b) => STOPS[a].y - STOPS[b].y);   // von unten nach oben
function pickStop(i) {
  if (!walking || !inCar(player.pos) || LIFT.state !== "idle" || i === LIFT.at || !STOPS[i]) return;
  LIFT.target = i; toast("Fahrt: " + STOPS[i].name);
}
function stepStop(dir) {
  const k = STOP_ORDER.indexOf(LIFT.at) + dir;
  if (k < 0 || k >= STOP_ORDER.length) return toast(dir > 0 ? "Ganz oben" : "Ganz unten");
  pickStop(STOP_ORDER[k]);
}
const liftPanel = $("lift-panel");
liftPanel.innerHTML = '<div class="lp-title">Aufzug</div>' + [...STOP_ORDER].reverse().map(i => `<button type="button" data-stop="${i}">${STOP_ORDER.indexOf(i) + 1}&nbsp; ${STOPS[i].name}</button>`).join("");
// Zwei Aufzuege (A3): Personenaufzug "P" und Autoaufzug "C" (CAR_LIFT, wird spaeter gebaut). Die Anzeige zeigt den, in dem man steht.
let CAR_LIFT = null, liftPanelKey = "", liftPanelFor = "P";
function buildLiftPanel(which) {
  const U = which === "C" ? { title: "Autoaufzug", stops: CAR_LIFT.stops, order: CAR_LIFT.order } : { title: "Aufzug", stops: STOPS, order: STOP_ORDER };
  liftPanel.innerHTML = `<div class="lp-title">${U.title}</div>` + [...U.order].reverse().map(i => `<button type="button" data-stop="${i}">${U.order.indexOf(i) + 1}&nbsp; ${U.stops[i].name}</button>`).join("");
  liftPanelFor = which; liftPanelKey = "";
}
liftPanel.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; if (liftPanelFor === "C") CAR_LIFT.pick(+b.dataset.stop); else pickStop(+b.dataset.stop); });
function updateLiftPanel() {
  const which = !walking || ghost ? "" : inCar(player.pos) ? "P" : CAR_LIFT && CAR_LIFT.inCar(player.pos) ? "C" : "";
  if (which && which !== liftPanelFor) buildLiftPanel(which);
  const show = !!which;
  if (liftPanel.hidden === show) { liftPanel.hidden = !show; if (show) toast(which === "C" ? "Autoaufzug: Pfeil hoch/runter oder Tasten 1-3" : "Aufzug: Pfeil hoch/runter oder Tasten 1-5"); }
  if (!show) return;
  const L = which === "C" ? CAR_LIFT.L : LIFT, key = which + L.at + "/" + L.target + "/" + L.state;
  if (key === liftPanelKey) return;
  liftPanelKey = key;
  for (const b of liftPanel.querySelectorAll("button")) {
    const i = +b.dataset.stop;
    b.classList.toggle("here", i === L.at && L.state === "idle");
    b.classList.toggle("target", i === L.target && L.state !== "idle");
  }
}
