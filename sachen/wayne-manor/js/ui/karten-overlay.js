// Wayne Manor 3D – Karten-Overlay der Hoehlen (Knopf Karte)
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Hoehlenkarten als Overlay (Knopf "Karte" schaltet durch) =====================
// Beide Hoehlenkarten haben denselben Rahmen. Bezug: Aufzug (Karte 352.5 / 276) = Aufzugschacht im Haus,
// Massstab ca. 0,27 m pro Pixel (aus dem kleinen Hausumriss-Overlay der Karte "Upper Level" geschaetzt).
const CAVE_SC = 0.27 * SC / 0.4, CAVE_W = 736, CAVE_H = 1042, CAVE_LIFT = [352.5, 276];
const caveMp = (px, py) => [SHAFT.cx + (py - CAVE_LIFT[1]) * CAVE_SC, SHAFT.cz - (px - CAVE_LIFT[0]) * CAVE_SC];
function caveOverlay(src, masks) {
  const c = document.createElement("canvas"), tex = new THREE.CanvasTexture(c), img = new Image();
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  img.onload = () => {
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    for (const [x0, y0, x1, y1] of masks) g.clearRect(x0, y0, x1 - x0, y1 - y0);
    const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
    for (let i = 0; i < a.length; i += 4) a[i + 3] = Math.min(a[i + 3], clamp01((Math.max(a[i], a[i + 1], a[i + 2]) - 75) / 110) * 255);   // dunkler Grund wird durchsichtig
    g.putImageData(d, 0, 0);
    tex.needsUpdate = true;
  };
  img.src = src;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(CAVE_W * CAVE_SC, CAVE_H * CAVE_SC).rotateX(-Math.PI / 2).rotateY(Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false }));
  const [cx, cz] = caveMp(CAVE_W / 2, CAVE_H / 2);
  m.position.set(cx, 0.3, cz); m.renderOrder = 10; m.visible = false; m.userData.keep = true;
  scene.add(m);
  return m;
}
const MAPS = [
  { name: "Außenanlage", mesh: mapMesh },
  { name: "Höhle oben", mesh: caveOverlay("karten/hoehle-oberes-level.webp", [[0, 0, 736, 215], [425, 228, 705, 298], [452, 603, 695, 718], [372, 718, 736, 1000], [8, 862, 178, 1018]]) },
  { name: "Höhle unten", mesh: caveOverlay("karten/hoehle-unteres-level.webp", [[0, 0, 736, 215], [18, 242, 218, 418], [438, 228, 708, 298], [488, 752, 668, 922]]) }
];
let mapIdx = 0;
function showMap(i) {
  mapIdx = i;
  MAPS.forEach((m, k) => { m.mesh.visible = k === i; });
  const b = $("btn-walk-top");
  b.textContent = i < MAPS.length ? "Karte: " + MAPS[i].name : "Karte: aus";
  b.setAttribute("aria-pressed", String(i < MAPS.length));
}
