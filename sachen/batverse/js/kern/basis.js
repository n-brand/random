// Batverse – Grundgeruest: Hilfsfunktionen, Renderer, Szene, Kamera, Licht, Texturen, Materialien, Bauhelfer (B, wall, Daecher)
// Teil der Seite sachen/batverse/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// Einheiten: 1 = 1 Meter. Welt nach dem Kompass der Karten: Norden = -z, Osten = +x (Hausfront und Hauptzufahrt zeigen nach Osten).
// Karte -> Welt: Karte oben = Westen, rechts = Norden, unten = Osten, links = Sueden; 1 Kartenpixel = 0,4 m, Nullpunkt = Mitte des Rondells.
const $ = id => document.getElementById(id);
const clamp01 = v => Math.max(0, Math.min(1, v));
const sst = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// --- Renderer, Szene, Kamera ---
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });   // genaue Tiefe auch von weit weg (kein Flackern)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, matchMedia("(pointer: coarse)").matches ? 1.25 : 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const SKY_DAY = new THREE.Color(0x8fc4e8), SKY_NIGHT = new THREE.Color(0x070b18);
const scene = new THREE.Scene();
scene.background = SKY_DAY.clone();
scene.fog = new THREE.Fog(SKY_DAY.clone(), 350, 1500);
// A2 (2026-11-07): Anwesen auf einem Plateau, HILL Meter ueber der Umgebung. Gebaut wird alles wie bisher mit Boden y 0,
// danach hebt liftPlateau() (vor dem Zusammenfassen) alles auf dem Plateau samt Kollision an. Hoehlen bleiben, wo sie sind.
const HILL = 25;
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.6, 3000);
camera.position.set(95, 75 + HILL, 60);
const controls = new OrbitControls(camera, renderer.domElement);
const orbitPick = installOrbitPick({ renderer, camera, controls, scene, mode: () => ghost ? "Geist" : "Orbit-Ansicht", actions: [{ icon: PICK_ICONS.pin, label: "Hierhin teleportieren", run: p => teleportToPoint(p) }] });   // Rechtsklick in der Orbit-Ansicht: Menue (Koordinaten kopieren, hierhin teleportieren)
controls.target.set(-25, HILL, 10);
controls.enableDamping = true;
controls.minDistance = 4;
controls.maxDistance = 900;
controls.maxPolarAngle = Math.PI * 0.495;

const hemi = new THREE.HemisphereLight(0xdff1ff, 0x5a7a3a, 1.0);
scene.add(hemi);
const cave = new THREE.AmbientLight(0xdfe3ea, 0);
scene.add(cave);
const sun = new THREE.DirectionalLight(0xfff2d6, 2.4);
const SUN_DIR = new THREE.Vector3(-0.4, 0.8, 0.5).normalize();
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 190 });
sun.shadow.bias = -0.0004;
scene.add(sun, sun.target);
// Sonne folgt einem Punkt, aber nur in ganzen Schatten-Texeln (Nicolas 2026-11-12: beim schnellen Fahren zitterte alles; stufenloses Mitwandern
// verschiebt das Schattenraster jedes Bild ein wenig, die Schattenkanten flimmern). Rasterweite = Schattenausschnitt / Aufloesung.
const sunSnap = { r: new THREE.Vector3(), u: new THREE.Vector3(), p: new THREE.Vector3() };
function sunFollow(p, dist = 90) {
  const S = sunSnap, cam = sun.shadow.camera, tex = (cam.right - cam.left) / sun.shadow.mapSize.x;
  S.r.set(0, 1, 0).cross(SUN_DIR).normalize(); S.u.copy(SUN_DIR).cross(S.r).normalize();
  const a = Math.round(p.dot(S.r) / tex) * tex, b = Math.round(p.dot(S.u) / tex) * tex, c = p.dot(SUN_DIR);
  S.p.copy(S.r).multiplyScalar(a).addScaledVector(S.u, b).addScaledVector(SUN_DIR, c);
  sun.position.copy(S.p).addScaledVector(SUN_DIR, dist); sun.target.position.copy(S.p); sun.target.updateMatrixWorld();
}
const world = new THREE.Group();
scene.add(world);

// --- Texturen und Materialien ---
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.repeat.set(rx, ry);
  return t;
}
const texClone = (t, rx, ry) => { const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; };
const r1 = rng(11);
const rockTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#8c8e94"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { const v = 90 + r1() * 90; g.fillStyle = `rgba(${v},${v},${v + 6},${0.1 + r1() * 0.25})`; g.beginPath(); g.arc(r1() * w, r1() * h, 3 + r1() * 16, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(30,30,36,.35)"; g.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) { g.beginPath(); let x = r1() * w, y = r1() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r1() - .5) * 40; y += (r1() - .3) * 30; g.lineTo(x, y); } g.stroke(); }
}, 1 / 8, 1 / 8);
const brickTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#5b574f"; g.fillRect(0, 0, w, h);
  for (let row = 0; row < 16; row++) for (let i = -1; i < 8; i++) {
    const v = 128 + r1() * 40, x = i * 32 + (row % 2 ? 16 : 0);
    g.fillStyle = `rgb(${v},${v - 6},${v - 18})`; g.fillRect(x + 1, row * 16 + 1, 30, 14);
  }
}, 1 / 4, 1 / 4);
const woodTex = canvasTex(256, 256, (g, w, h) => {
  for (let i = 0; i < 8; i++) { const v = 90 + r1() * 40; g.fillStyle = `rgb(${v + 40},${v},${v - 30})`; g.fillRect(0, i * 32, w, 32); g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(0, i * 32, w, 2); }
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(40,20,5,${r1() * .15})`; g.fillRect(r1() * w, r1() * h, 30 + r1() * 60, 1); }
}, 1 / 3, 1 / 3);
const marbleTex = canvasTex(256, 256, (g, w, h) => {
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? "#2b2b30" : "#d9d6cf"; g.fillRect(x * 128, y * 128, 128, 128); }
  g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 2; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, h); g.moveTo(0, 128); g.lineTo(w, 128); g.stroke();
}, 1 / 2, 1 / 2);
const mat = {
  rock: M(0xffffff, { map: rockTex, roughness: 1 }),
  rockDark: M(0x7d8088, { map: texClone(rockTex, 1 / 6, 1 / 6), roughness: 1, flatShading: true, side: THREE.BackSide }),
  brick: M(0xffffff, { map: brickTex, roughness: 0.95 }),
  slate: M(0x2c323d, { roughness: 0.55 }),
  floorWood: M(0xffffff, { map: woodTex }), marble: M(0xffffff, { map: marbleTex, roughness: 0.3 }),
  trim: M(0x3a2616), carpet: M(0x7a1f2b), gold: M(0xc9a24a, { metalness: 0.7, roughness: 0.35 }),
  steel: M(0x8b929c, { metalness: 0.6, roughness: 0.35 }), dark: M(0x1b1e24, { metalness: 0.3, roughness: 0.5 }),
  black: M(0x0e0f12, { roughness: 0.4 }), bat: M(0x14161b, { metalness: 0.55, roughness: 0.3 }),
  floorStone: M(0x32353d, { roughness: 0.9 }), concrete: M(0x6c6e72, { roughness: 0.95 }),
  white: M(0xf0efe9), cloth: M(0x4a5a78), red: M(0xb32d2d), green: M(0x3e7a45), wood: M(0x6a4526),
  glass: M(0x9fd0e6, { transparent: true, opacity: 0.38, roughness: 0.1, emissive: 0xffd27a, emissiveIntensity: 0 }),
  water: M(0x2e8fbf, { transparent: true, opacity: 0.82, roughness: 0.3, metalness: 0, emissive: 0x0b3550, emissiveIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),   // B7: rauer, nicht metallisch (Normalmap folgt unten)
  glow: new THREE.MeshBasicMaterial({ color: 0xbfe6ff }), glowOrange: new THREE.MeshBasicMaterial({ color: 0xffa040 }),
  glowRed: new THREE.MeshBasicMaterial({ color: 0xff3b30 }),
  gravel: M(0xb2a891, { roughness: 1 }), leaves: M(0x2f6b3a, { roughness: 1, flatShading: true }), bark: M(0x5a3d22)
};

// Quader mit Texturkoordinaten in Metern; solid = Kollisionsquader (nur Welt-Gruppe)
const solids = [];
const circles = [];
let NOLIFT = false;                                                       // true: Teil wird schon in Endhoehe gebaut (liftPlateau laesst es aus)
const S = (x0, x1, y0, y1, z0, z1, on = true) => { const s = { x0, x1, y0, y1, z0, z1, on, noLift: NOLIFT }; solids.push(s); return s; };
// Kollisions-Raster (Plan K2, 2026-11-11): Quader und Kreise in 16-m-Zellen, Abfragen pruefen nur die Zellen im gesuchten Rechteck statt aller.
// Wird beim ersten Abfragen und immer wenn solids/circles laenger werden neu aufgebaut. Lage (x/z) eines Eintrags darf sich danach nicht aendern,
// Hoehe (y0/y1, top) und on schon. Bewegte Kreise (Fahrzeuge, c.dyn = true) stehen in einer eigenen Liste und gelten immer. Riesige Quader (> 256 Zellen) ebenso.
const COLL = { cs: 16, cells: new Map(), bigS: [], dynC: [], nS: -1, nC: -1, q: 0 };
const collKey = (i, k) => (i + 32768) * 65536 + (k + 32768);
function collBuild() {
  const { cs, cells } = COLL; cells.clear(); COLL.bigS = []; COLL.dynC = [];
  const put = (o, x0, x1, z0, z1, t) => { const i0 = Math.floor(x0 / cs), i1 = Math.floor(x1 / cs), k0 = Math.floor(z0 / cs), k1 = Math.floor(z1 / cs);
    if ((i1 - i0 + 1) * (k1 - k0 + 1) > 256) return false;
    for (let i = i0; i <= i1; i++) for (let k = k0; k <= k1; k++) { const key = collKey(i, k); let c = cells.get(key); if (!c) cells.set(key, c = [[], []]); c[t].push(o); } return true; };
  for (const s of solids) if (!put(s, s.x0, s.x1, s.z0, s.z1, 0)) COLL.bigS.push(s);
  for (const c of circles) if (c.dyn) COLL.dynC.push(c); else put(c, c[0] - c[2], c[0] + c[2], c[1] - c[2], c[1] + c[2], 1);
  COLL.nS = solids.length; COLL.nC = circles.length;
}
// Alle Quader [0] und Kreise [1], die das Rechteck x0..x1 / z0..z1 beruehren koennten (neue Listen, ohne Doppelte)
function collNear(x0, x1, z0, z1) {
  if (COLL.nS !== solids.length || COLL.nC !== circles.length) collBuild();
  const { cs, cells } = COLL, q = ++COLL.q, S1 = COLL.bigS.slice(), C1 = COLL.dynC.slice();
  for (let i = Math.floor(x0 / cs), i1 = Math.floor(x1 / cs); i <= i1; i++) for (let k = Math.floor(z0 / cs), k1 = Math.floor(z1 / cs); k <= k1; k++) {
    const c = cells.get(collKey(i, k)); if (!c) continue;
    for (const s of c[0]) if (s._q !== q) { s._q = q; S1.push(s); }
    for (const o of c[1]) if (o._q !== q) { o._q = q; C1.push(o); }
  }
  return [S1, C1];
}
function boxUV(g, w, h, d) {
  const uv = g.attributes.uv, sc = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * sc[f][0], uv.getY(k) * sc[f][1]); }
}
function B(x0, x1, y0, y1, z0, z1, m, solid = true, parent = world, shadow = true) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0, g = new THREE.BoxGeometry(w, h, d);
  boxUV(g, w, h, d);
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  mesh.castShadow = shadow; mesh.receiveShadow = true;
  if (NOLIFT) mesh.userData.noLift = true;
  parent.add(mesh);
  if (solid && parent === world) S(x0, x1, y0, y1, z0, z1);
  return mesh;
}
function cyl(r0, r1, h, m, x, y, z, parent = world, seg = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m);
  mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
// Wand mit Oeffnungen [a0, a1, y0, y1, 'g' = Glasscheibe]
function wall(axis, a0, a1, line, y0, y1, open, m, t = 0.8) {
  const seg = (a, b, ya, yb) => {
    if (yb - ya < 1e-3 || b - a < 1e-3) return;
    if (axis === "x") B(a, b, ya, yb, line - t / 2, line + t / 2, m); else B(line - t / 2, line + t / 2, ya, yb, a, b, m);
  };
  const cuts = [...new Set([a0, a1, ...open.flatMap(o => [o[0], o[1]])])].sort((p, q) => p - q);
  for (let k = 0; k < cuts.length - 1; k++) {
    const a = cuts[k], b = cuts[k + 1], mid = (a + b) / 2;
    const holes = open.filter(o => o[0] < mid && o[1] > mid).sort((p, q) => p[2] - q[2]);
    let y = y0;
    for (const h of holes) { seg(a, b, y, h[2]); y = h[3]; }
    seg(a, b, y, y1);
  }
  for (const o of open) if (o[4]) {
    if (axis === "x") B(o[0] + 0.05, o[1] - 0.05, o[2], o[3], line - 0.03, line + 0.03, mat.glass, false);
    else B(line - 0.03, line + 0.03, o[2], o[3], o[0] + 0.05, o[1] - 0.05, mat.glass, false);
  }
}
function gableRoof(x0, x1, z0, z1, y, rise, over, m) {
  const s = new THREE.Shape();
  s.moveTo(z0 - over, 0); s.lineTo(z1 + over, 0); s.lineTo((z0 + z1) / 2, rise); s.closePath();
  const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: x1 - x0 + 2 * over, bevelEnabled: false }), m);
  mesh.rotation.y = -Math.PI / 2;
  mesh.position.set(x1 + over, y, 0);
  mesh.castShadow = mesh.receiveShadow = true;
  world.add(mesh);
  return mesh;
}

const lights = [];
const pLight = (color, I, dist, x, y, z) => { const l = { color: new THREE.Color(color), I, dist, pos: new THREE.Vector3(x, y, z) }; lights.push(l); return l; };
