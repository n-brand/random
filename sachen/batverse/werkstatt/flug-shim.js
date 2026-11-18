// Batverse – Werkstatt: flache Welt fuer die Flug-Dateien des Spiels (Nicolas 2026-11-12: Jets und Fluggeraete auch auf der Teststrecke)
// Klassisches Skript nach basis.js/modelle.js und vor motorton.js, the-bat.js, jet.js. Stellt nur die Namen bereit, die diese Dateien aus der
// Spielwelt brauchen; Flugphysik, Kamera und Ton kommen unveraendert aus dem Spiel (eine Aenderung dort gilt automatisch hier).
"use strict";

// Boden ueberall y 0, kein Wasser, keine Hoehlen
const terrainH = () => 0, waterAt = () => null, supportAt = () => 0, caveAt = () => 0, polySD = () => 99, camBlocked = (x, y) => y < 0;   // ueber dem Boden ist frei (auch knapp darueber, dort sitzt der Bauch von The Bat)
const LY = -28, LH = 10, UY = -16, SEA_Y = -34, LAKE_W = [], LIMIT = 1400;
let nearS = [], nearC = [];
// gedrehte Quader (Gotham-Gebaeude der Werkstatt, gotham-shim.js WG_DK_ALL): the-bat.js batAir fragt dkIn (fehlte hier, dadurch flog The Bat in der Werkstatt nicht; Nicolas 2026-11-18 beim Polizei-Helikopter gefunden)
function dkIn(x, y, z, m = 0) { if (typeof WG_DK_ALL === "undefined") return false; for (const o of WG_DK_ALL) { if (!o.on || y < o.y0 - m || y > o.y1 + m) continue; const dx = x - o.cx, dz = z - o.cz, A = dx * o.ux + dz * o.uz, Bq = -dx * o.uz + dz * o.ux; if (Math.abs(A) < o.hl + m && Math.abs(Bq) < o.hw + m) return true; } return false; }
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
// Spieler (nur Blick und Position; die Werkstatt zeigt keine Figur)
const player = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, vy: 0, jump: false };
let walking = true, belowView = false;
const jumpHeld = false, downHeld = false, moveStick = { x: 0, y: 0 }, lookStick = { x: 0, y: 0 };
const look = (dx, dy) => { player.yaw -= dx; player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch - dy)); };
const BOAT = { on: false, v: 0 };
world.userData.car = { leave: () => {} };
const startWalk = () => {}, updatePlayer = () => {};
// Startbahn fuer den Kampfjet (jet.js steht am 12. Punkt von MAIN, Nase zum 17.): Gerade am Nordrand der Flaeche nach Osten
const RUNWAY = { z: -300, x0: -570, x1: 570, w: 30 };
const MAIN = { samples: Array.from({ length: 40 }, (_, i) => [RUNWAY.x0 + 6 + i * 4, RUNWAY.z, i]), y: () => 0 };
// Meldungen (im Spiel: toast)
function toast(t) { const el = document.getElementById("toast"); if (!el) return; el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 2600); }
