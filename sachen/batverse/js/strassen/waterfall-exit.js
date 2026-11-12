// Batverse – Waterfall Exit: Verlauf (Tunnel und draussen), Naehe, Angleichung
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Waterfall Exit (A8) =====================
// Vom Nordende des Hoehlentunnels (LY) in einem weiten Bogen fast gerade (Nicolas 2026-11-08: "keine Kurven, direkter, steiler") bis hinter den
// Wasserfall (Portal WF_PORTAL am Fuss der Felswand, Hoehe WFX_Y), ca. 185 m, ca. 15 %. Roehre WF_HW breit (Halbbreite), Fahrbahn Kies.
const WFX_Y = 0.15, WF_HW = 4.3, WF_PORTAL = { x0: -110.6, x1: -103.5, z0: -191.2, z1: -180.8 };
const TUN_PX = [[2, 453], [330, 453], [445, 456], [490, 482], [738.4, 482]];   // Hoehlentunnel Gotham Exit -> Nordende (Kartenpixel der Hoehlenkarte)
const WFT = (() => {
  const tun = [[-25.8, -35.2], [-25.8, -45], [-30, -80], [-45, -120], [-66, -152], [-86, -174], [-99, -183], [-104, -185.5], [-107.8, -186]];
  // Draussen geradeaus nach Westen; ueber dem Teich eine Luecke (Sprung ohne Rampe, D1), am Westufer geht die Strasse weiter
  const out = [[-111, -186], [-120, -186], [-129.5, -186.2], [-140, -186.8], [-155, -187.8], [-170, -189]];
  const curve = new THREE.CatmullRomCurve3([...tun, ...out].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal");
  const len = curve.getLength(), n = Math.ceil(len), samples = [];
  for (let i = 0; i <= n; i++) { const p = curve.getPointAt(i / n); samples.push([p.x, p.z, i / n * len]); }
  let sP = 0, best = 1e9; for (const [x, z, s] of samples) { const q = Math.hypot(x + 107.8, z + 186); if (q < best) { best = q; sP = s; } }   // Portal
  let sG0 = 0, sG1 = 0; for (const [x, , s] of samples) { if (s > sP && !sG0 && x < -110.4) sG0 = s; if (s > sP && !sG1 && x < -129.2) sG1 = s; }   // Luecke ueber dem Teich
  let yEnd = null;                                                          // erst bei Bedarf (das Gelaende-Raster gibt es hier noch nicht)
  const y = s => s <= sP ? lerp(LY, WFX_Y, s / sP) : s <= sG1 + 4 ? WFX_Y : lerp(WFX_Y, yEnd ??= genH0(-170, -189), sst(sG1 + 4, len, s));
  const box = samples.reduce((a, [x, z]) => [Math.min(a[0], x), Math.max(a[1], x), Math.min(a[2], z), Math.max(a[3], z)], [1e9, -1e9, 1e9, -1e9]);
  return { curve, len, samples, sP, sG0, sG1, y, box, inGap: s => s > sG0 && s < sG1, end: samples[samples.length - 1] };
})();
function wfNear(x, z, max) {
  const b = WFT.box;
  if (x < b[0] - max || x > b[1] + max || z < b[2] - max || z > b[3] + max) return null;
  let bq = max * max, bs = -1;
  for (const [sx, sz, s] of WFT.samples) { const q = (x - sx) ** 2 + (z - sz) ** 2; if (q < bq) { bq = q; bs = s; } }
  return bs < 0 ? null : { d: Math.sqrt(bq), s: bs, y: WFT.y(bs) };
}
const wfInTunnel = (x, z) => { const w = wfNear(x, z, WF_HW); return w && w.s < WFT.sP + 0.5 ? w : null; };
// Gelaende draussen an die Fahrbahn angleichen (Damm durch den Teich, Rampe aufs Ufer)
function wfBlend(x, z) {
  const e = WFT.end, de = Math.hypot(x - e[0], z - e[1]);
  if (de < 10) return { y: WFT.y(WFT.len) - 0.08, w: 1 - sst(7.2, 10, de) };   // Wendeplatte der Sackgasse (Westufer)
  const w = wfNear(x, z, 9.5);
  if (!w || w.s < WFT.sP - 1 || (w.s > WFT.sG0 + 0.5 && w.s < WFT.sG1 - 0.5)) return null;   // ueber dem Teich keine Strasse
  return { y: w.y - 0.1, w: 1 - sst(w.s > WFT.sG1 ? 5 : 3.6, 9.5, w.d) };   // Westufer breiter flach (grobes Gelaende-Raster)
}
