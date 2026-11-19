// Batverse – Geraeusche in Gebaeuden (N43, Nicolas 2026-11-17 Idee "eigene Geraeusche in Gebaeuden, z. B. im Casino Spielgeraeusche und Klingeln"; gebaut 2026-11-19 "Ja, weiter").
// Alles mit Web Audio erzeugt (keine Dateien), ueber die Lautstaerke der Fahrzeugtoene (motorton.js: ENGINE.ctx, engineOut, ENGINE.muted, Taste N).
// Orte: gerOrt({ name, art, drin(p) }); Arten in GER_ART: { amb: [Bandpass 1, Bandpass 2, Lautstaerke, Tiefpass?], pause: [min, max] s, ev(c, t, v), dyn(p)? zusaetzliche Grundlautstaerke }.
// Ist man zu Fuss in einem Ort, blendet das Grundgeraeusch ein und es kommen zufaellige Einzelklaenge. Geprueft wird alle 0,1 s (setInterval, auch Werkstatt).
"use strict";
const GER = { orte: [], cur: null, amb: null, ambG: null, ambArt: null, next: 0, t: 0, leave: 0 };
function gerOrt(o) { GER.orte.push(o); return o; }
function gerCtx() { if (typeof ENGINE === "undefined" || ENGINE.muted) return null; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  const c = ENGINE.ctx || (ENGINE.ctx = new AC()); if (c.state === "suspended") c.resume().catch(() => {}); return c.state === "running" ? c : null; }
function gerOut(c) { return typeof engineOut === "function" ? engineOut(c) : c.destination; }
function gerRausch(c, sek) { const n = Math.floor(c.sampleRate * sek), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
// Bausteine
function gerTon(c, f, t0, dauer, vol, typ = "sine") { const o = c.createOscillator(), g = c.createGain(); o.type = typ; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
  o.connect(g); g.connect(gerOut(c)); o.start(t0); o.stop(t0 + dauer + 0.05); }
function gerKlick(c, t0, vol, hp = 2500, len = 0.03) { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = GER.klickBuf || (GER.klickBuf = gerRausch(c, 0.5)); f.type = "highpass"; f.frequency.value = hp; g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
  s.connect(f); f.connect(g); g.connect(gerOut(c)); s.start(t0, Math.random() * 0.4); s.stop(t0 + len + 0.02); }
function gerRausch1(c, t0, vol, typ, f0, f1, len, q = 1) { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = GER.klickBuf || (GER.klickBuf = gerRausch(c, 0.5)); s.loop = true; f.type = typ; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + len); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
  s.connect(f); f.connect(g); g.connect(gerOut(c)); s.start(t0); s.stop(t0 + len + 0.05); }
const gerWahl = (r, L) => { let a = 0; for (const [w, f] of L) { a += w; if (r < a) return f; } return L[L.length - 1][1]; };
const GER_ART = {
  // Casino: Murmeln; Spielautomaten-Melodie, Jetons, Roulette-Kugel, selten Jackpot
  casino: { amb: [450, 1100, 0.035], pause: [0.5, 2.3], ev(c, t, v) { gerWahl(Math.random(), [
    [0.5, () => { const L = [[523, 659, 784, 1047], [784, 988, 1175], [659, 784, 659, 988, 1319], [440, 554, 659, 880]][Math.floor(Math.random() * 4)], k = 0.075 + Math.random() * 0.04; L.forEach((f, i) => gerTon(c, f, t + i * k, 0.16, 0.05 * v, "square")); }],
    [0.32, () => { const n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) gerKlick(c, t + i * (0.04 + Math.random() * 0.05), 0.18 * v, 3000 + Math.random() * 2000); }],
    [0.15, () => { let dt = 0.05; for (let i = 0, tt = t; i < 22; i++) { gerKlick(c, tt, 0.09 * v * (1 - i / 30), 1800); tt += dt; dt *= 1.12; } }],
    [0.03, () => { for (let i = 0; i < 8; i++) { gerTon(c, 1568, t + i * 0.18, 0.5, 0.05 * v, "triangle"); gerTon(c, 2093, t + i * 0.18 + 0.09, 0.4, 0.035 * v, "triangle"); } }]])(); } },
  // Boerse: lautes Stimmengewirr; Telefone, Rufe, Ticker-Piepsen, Glocke selten
  boerse: { amb: [600, 1400, 0.06], pause: [0.3, 1.4], ev(c, t, v) { gerWahl(Math.random(), [
    [0.35, () => { for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const tt = t + r * 0.55 + i * 0.05; gerTon(c, 440, tt, 0.04, 0.03 * v); gerTon(c, 480, tt, 0.04, 0.03 * v); } }],
    [0.4, () => { const f = 500 + Math.random() * 500; gerRausch1(c, t, 0.09 * v, "bandpass", f, f * (0.7 + Math.random() * 0.6), 0.25 + Math.random() * 0.3, 4); }],
    [0.22, () => { for (let i = 0; i < 3; i++) gerTon(c, 1250, t + i * 0.09, 0.05, 0.025 * v, "square"); }],
    [0.03, () => { for (let i = 0; i < 4; i++) gerTon(c, 880, t + i * 0.35, 1.2, 0.06 * v, "triangle"); }]])(); } },
  // Schiessstand: leise Halle, gedaempfte Schuesse (einzeln oder Doppelschuss)
  schiessstand: { amb: [300, 700, 0.008], pause: [0.8, 3.2], ev(c, t, v) { const n = Math.random() < 0.3 ? 2 : 1; for (let i = 0; i < n; i++) { const tt = t + i * 0.22; gerRausch1(c, tt, 0.35 * v, "lowpass", 1400, 120, 0.28); gerTon(c, 70, tt, 0.25, 0.12 * v); } } },
  // U-Bahn-Bahnsteig: Tunnelrauschen, lauter wenn ein Zug nah ist (dyn); selten Durchsage-Gong, Bremsquietschen
  ubahn: { amb: [140, 320, 0.02], pause: [6, 16], dyn: p => gerZugNah(p), ev(c, t, v) { if (Math.random() < 0.5) { gerTon(c, 659, t, 1.2, 0.05, "triangle"); gerTon(c, 523, t + 0.5, 1.4, 0.05, "triangle"); gerTon(c, 392, t + 1.0, 1.8, 0.05, "triangle"); }
    else if (gerZugNah(player.pos) > 0.02) gerRausch1(c, t, 0.05, "bandpass", 3200, 2600, 1.2, 12); } },
};
// naechster U-Bahn-Zug: 0 (fern) bis ca. 0,08 (nah und schnell)
function gerZugNah(p) { if (typeof UB === "undefined" || !UB.trains) return 0; let best = 0; for (const t of UB.trains) { const P = t.r.P, n = P.length, q = P[Math.floor(((t.s / t.r.ds) % n + n) % n)]; if (!q) continue;
    const d = Math.hypot(q[0] - p.x, q[1] - p.z); if (d < 160) best = Math.max(best, (1 - d / 160) * (0.3 + 0.7 * Math.min(1, (t.v || 0) / 12))); } return best * 0.08; }
// Grundgeraeusch: Rauschen durch zwei Bandpaesse, Lautstaerke langsam schwankend; bei anderer Art neu
function gerAmbStop() { if (!GER.amb) return; try { GER.amb.stop(); GER.ambL.stop(); } catch (e) {} GER.amb = GER.ambG = null; GER.ambArt = null; }
function gerAmb(c, art) { if (GER.amb && GER.ambArt === art) return; gerAmbStop(); const A = GER_ART[art].amb, s = c.createBufferSource(); s.buffer = gerRausch(c, 3); s.loop = true; const b1 = c.createBiquadFilter(), b2 = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
  b1.type = "bandpass"; b1.frequency.value = A[0]; b1.Q.value = 0.8; b2.type = "bandpass"; b2.frequency.value = A[1]; b2.Q.value = 1.2; g.gain.value = 0; lfo.frequency.value = 0.23; lg.gain.value = A[2] * 0.35;
  s.connect(b1); s.connect(b2); b1.connect(g); b2.connect(g); lfo.connect(lg); lg.connect(g.gain); g.connect(gerOut(c)); s.start(); lfo.start(); GER.amb = s; GER.ambG = g; GER.ambL = lfo; GER.ambArt = art; }
function gerStep() { const now = performance.now() / 1000; GER.t = now;
  const zuFuss = typeof walking !== "undefined" && walking && typeof player !== "undefined", ort = zuFuss ? GER.orte.find(o => { try { return o.drin(player.pos); } catch (e) { return false; } }) : null;
  const c = ort || GER.amb ? gerCtx() : null; if (!c) { if (GER.ambG && (typeof ENGINE === "undefined" || ENGINE.muted)) GER.ambG.gain.value = 0; return; }
  if (!ort) { if (GER.ambG) GER.ambG.gain.setTargetAtTime(0, c.currentTime, 0.6); if (GER.cur && !GER.leave) GER.leave = now; if (GER.leave && now - GER.leave > 4) { gerAmbStop(); GER.cur = null; GER.leave = 0; } return; }
  const A = GER_ART[ort.art]; gerAmb(c, ort.art); GER.ambG.gain.setTargetAtTime(A.amb[2] + (A.dyn ? A.dyn(player.pos) : 0), c.currentTime, 0.6);
  if (GER.cur !== ort) GER.next = now + 0.4; GER.cur = ort; GER.leave = 0;
  if (now < GER.next) return; GER.next = now + A.pause[0] + Math.random() * (A.pause[1] - A.pause[0]); A.ev(c, c.currentTime + 0.02, 0.7 + Math.random() * 0.6); }
setInterval(gerStep, 100);
// Orte (der erste passende zaehlt): Schiessstand vor dem Waffenladen, damit der hintere Raum eigene Geraeusche hat
const gerBaut = (p, id) => { if (typeof bautAt !== "function") return false; const b = bautAt(p.x, p.y + 1, p.z); return !!b && b.id === id; };
gerOrt({ name: "Schiessstand Gotham Arms", art: "schiessstand", drin(p) { const g = typeof scene !== "undefined" && scene.getObjectByName("Waffenladen waffen-2"); if (!g) return false; const l = g.worldToLocal(new THREE.Vector3(p.x, p.y, p.z)); const D = window.GORT_RANGE_D || 18.5; return l.z < -D && l.z > -D - 13 && Math.abs(l.x) < 27 && l.y > -1 && l.y < 5; } });
gerOrt({ name: "Gotham Casino", art: "casino", drin: p => gerBaut(p, "GO-CASINO") });
gerOrt({ name: "Börse", art: "boerse", drin: p => gerBaut(p, "GO-BOERSE") });
gerOrt({ name: "U-Bahn", art: "ubahn", drin: p => typeof UB !== "undefined" && UB.done && p.y > UB.BED - 1 && p.y < UB.Y + 4 && typeof dkInRoom === "function" && dkInRoom(p.x, p.y + 0.5, p.z) });
gerOrt({ name: "Casino (realistisch)", art: "casino", drin(p) { if (typeof CASINO2 === "undefined" || !CASINO2.g) return false; const C = CASINO2; return Math.abs(p.x - C.x) < C.W && Math.abs(p.z - C.z) < C.D && p.y < (C.H || 6) + 0.5; } });
