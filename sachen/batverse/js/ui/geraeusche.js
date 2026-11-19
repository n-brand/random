// Batverse – Geraeusche in Gebaeuden (N43, Nicolas 2026-11-17 Idee "eigene Geraeusche in Gebaeuden, z. B. im Casino Spielgeraeusche und Klingeln"; gebaut 2026-11-19 "Ja, weiter").
// Alles mit Web Audio erzeugt (keine Dateien), ueber die Lautstaerke der Fahrzeugtoene (motorton.js: ENGINE.ctx, engineOut, ENGINE.muted, Taste N).
// Orte: gerOrt({ name, art, drin() }). Ist man (zu Fuss) in einem Ort, blendet ein Grundgeraeusch ein (Casino: Stimmengemurmel aus gefiltertem Rauschen) und es kommen
// zufaellige Einzelklaenge (Casino: Spielautomaten-Melodie, Jetons klackern, Roulette-Kugel, selten Jackpot-Glocke). Geprueft wird alle 0,1 s (setInterval, auch Werkstatt).
"use strict";
const GER = { orte: [], cur: null, amb: null, ambG: null, next: 0, t: 0 };
function gerOrt(o) { GER.orte.push(o); return o; }
function gerCtx() { if (typeof ENGINE === "undefined" || ENGINE.muted) return null; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  const c = ENGINE.ctx || (ENGINE.ctx = new AC()); if (c.state === "suspended") c.resume().catch(() => {}); return c.state === "running" ? c : null; }
function gerOut(c) { return typeof engineOut === "function" ? engineOut(c) : c.destination; }
function gerRausch(c, sek) { const n = Math.floor(c.sampleRate * sek), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
// Einzelklaenge
function gerTon(c, f, t0, dauer, vol, typ = "sine") { const o = c.createOscillator(), g = c.createGain(); o.type = typ; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
  o.connect(g); g.connect(gerOut(c)); o.start(t0); o.stop(t0 + dauer + 0.05); }
function gerKlick(c, t0, vol, hp = 2500) { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = GER.klickBuf || (GER.klickBuf = gerRausch(c, 0.03)); f.type = "highpass"; f.frequency.value = hp; g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
  s.connect(f); f.connect(g); g.connect(gerOut(c)); s.start(t0); }
const GER_CASINO = {
  automat(c, t, v) { const L = [[523, 659, 784, 1047], [784, 988, 1175], [659, 784, 659, 988, 1319], [440, 554, 659, 880]][Math.floor(Math.random() * 4)], k = 0.075 + Math.random() * 0.04; L.forEach((f, i) => gerTon(c, f, t + i * k, 0.16, 0.05 * v, "square")); },
  jetons(c, t, v) { const n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) gerKlick(c, t + i * (0.04 + Math.random() * 0.05), 0.18 * v, 3000 + Math.random() * 2000); },
  roulette(c, t, v) { let dt = 0.05; for (let i = 0, tt = t; i < 22; i++) { gerKlick(c, tt, 0.09 * v * (1 - i / 30), 1800); tt += dt; dt *= 1.12; } },
  jackpot(c, t, v) { for (let i = 0; i < 8; i++) { gerTon(c, 1568, t + i * 0.18, 0.5, 0.05 * v, "triangle"); gerTon(c, 2093, t + i * 0.18 + 0.09, 0.4, 0.035 * v, "triangle"); } },
};
// Grundgeraeusch: Rauschen durch zwei Bandpaesse (Stimmen), Lautstaerke langsam schwankend
function gerAmb(c) { if (GER.amb) return; const s = c.createBufferSource(); s.buffer = gerRausch(c, 3); s.loop = true; const b1 = c.createBiquadFilter(), b2 = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
  b1.type = "bandpass"; b1.frequency.value = 450; b1.Q.value = 0.8; b2.type = "bandpass"; b2.frequency.value = 1100; b2.Q.value = 1.2; g.gain.value = 0; lfo.frequency.value = 0.23; lg.gain.value = 0.012;
  s.connect(b1); s.connect(b2); b1.connect(g); b2.connect(g); lfo.connect(lg); lg.connect(g.gain); g.connect(gerOut(c)); s.start(); lfo.start(); GER.amb = s; GER.ambG = g; GER.ambL = lfo; }
function gerStep() { const now = performance.now() / 1000, dt = Math.min(0.3, now - (GER.t || now)); GER.t = now;
  const zuFuss = typeof walking !== "undefined" && walking && typeof player !== "undefined", ort = zuFuss ? GER.orte.find(o => { try { return o.drin(player.pos); } catch (e) { return false; } }) : null;
  const c = ort || GER.amb ? gerCtx() : null; if (!c) { if (GER.ambG && (typeof ENGINE === "undefined" || ENGINE.muted)) GER.ambG.gain.value = 0; return; }
  if (ort) gerAmb(c); if (GER.ambG) { const soll = ort ? 0.035 : 0; GER.ambG.gain.setTargetAtTime(soll, c.currentTime, 0.6); }
  if (!ort) { if (GER.amb && GER.cur && now - GER.leave > 4) { GER.amb.stop(); GER.ambL.stop(); GER.amb = GER.ambG = null; GER.cur = null; } else if (GER.cur && !GER.leave) GER.leave = now; return; }
  GER.cur = ort; GER.leave = 0;
  if (now < GER.next) return; GER.next = now + 0.5 + Math.random() * 1.8; const r = Math.random(), t = c.currentTime + 0.02, v = 0.7 + Math.random() * 0.6;
  if (ort.art === "casino") { if (r < 0.5) GER_CASINO.automat(c, t, v); else if (r < 0.82) GER_CASINO.jetons(c, t, v); else if (r < 0.97) GER_CASINO.roulette(c, t, v); else GER_CASINO.jackpot(c, t, v); } }
setInterval(gerStep, 100);
// Orte: Casino in Gotham (Register GO-CASINO), realistisches Casino der Werkstatt (CASINO2)
gerOrt({ name: "Gotham Casino", art: "casino", drin(p) { if (typeof bautAt !== "function") return false; const b = bautAt(p.x, p.y + 1, p.z); return !!b && b.id === "GO-CASINO"; } });
gerOrt({ name: "Casino (realistisch)", art: "casino", drin(p) { if (typeof CASINO2 === "undefined" || !CASINO2.g) return false; const C = CASINO2; return Math.abs(p.x - C.x) < C.W && Math.abs(p.z - C.z) < C.D && p.y < (C.H || 6) + 0.5; } });
