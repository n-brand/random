// Wayne Manor 3D – Motorgeraeusch (Web Audio)
// Teil der Seite sachen/wayne-manor/ (klassisches Skript, Reihenfolge in index.html; gemeinsame Namen ueber den globalen Bereich)
"use strict";

// ===================== Motorgeraeusch (Web Audio, ohne Dateien; Nicolas 2026-11-08) =====================
// Zwei Oszillatoren (Grundton + Unterton) mit Zuendtakt-Modulation durch einen Tiefpass, dazu Rollgeraeusch (gefiltertes Rauschen).
// Drehzahl aus Tempo und Gang (steigt im Gang, faellt beim Hochschalten), Gas macht lauter und heller. Anlassen beim Einsteigen,
// Schubstoss beim Sprung. Je Fahrzeug eigener Klang (ENG_PROFILES nach spec.name). Taste M = Ton an/aus. Tab versteckt = Pause.
const ENGINE = { ctx: null, nodes: null, muted: false, noiseBuf: null, master: null, vol: (() => { try { const v = parseFloat(localStorage.getItem("wm-vol")); return isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.7; } catch (e) { return 0.7; } })() };
// Alle Motorgeraeusche laufen ueber einen Gesamtregler (Lautstaerke im T-Menue, im Browser gemerkt)
function engineOut(ctx) { if (!ENGINE.master) { ENGINE.master = ctx.createGain(); ENGINE.master.gain.value = ENGINE.vol; ENGINE.master.connect(ctx.destination); } return ENGINE.master; }
function setEngineVol(v) {
  ENGINE.vol = Math.min(1, Math.max(0, v));
  if (ENGINE.master) { ENGINE.master.gain.cancelScheduledValues(ENGINE.ctx.currentTime); ENGINE.master.gain.value = ENGINE.vol; }
  try { localStorage.setItem("wm-vol", String(ENGINE.vol)); } catch (e) {}
  $("tp-vol-v").textContent = Math.round(ENGINE.vol * 100) + " %";
}
{ const inp = $("tp-vol"); inp.value = String(Math.round(ENGINE.vol * 100)); $("tp-vol-v").textContent = inp.value + " %"; inp.addEventListener("input", () => setEngineVol(inp.value / 100)); }
const ENG_PROFILES = {
  "Tumbler": { idle: 36, max: 118, gears: [0, 9, 18, 28, 40], wave: "sawtooth", sub: 0.5, cut0: 240, cut1: 1150, vol: 0.2, noise: 0.09 },
  "Rolls-Royce": { idle: 30, max: 92, gears: [0, 12, 24, 37, 52], wave: "triangle", sub: 0.5, cut0: 200, cut1: 650, vol: 0.13, noise: 0.045 },
  "Motorrad": { idle: 52, max: 235, gears: [0, 7, 14, 22, 32, 44, 60], wave: "sawtooth", sub: 2, cut0: 520, cut1: 2700, vol: 0.14, noise: 0.05 },
  // am = Tiefe des Zuendtakts (Standard 0,35); 0 = gleichmaessig wie ein Elektromotor, kein Anlassen-Bruellen bei start: "soft"
  "The Bat": { idle: 70, max: 160, gears: [0, 90], wave: "sine", sub: 0.5, cut0: 260, cut1: 520, vol: 0.025, noise: 0.03, am: 0, soft: true },   // Nicolas: praktisch lautlos, nur leises Summen
  // Batpod wie ein Tesla (Nicolas 2026-11-09): Motor-/Wechselrichter-Surren, Tonhoehe direkt am Tempo (einige 100 Hz bis ca. 1 kHz),
  // dazu ein feiner hoher Oberton (Wechselrichter, ca. 2-3 kHz), beim Gasgeben lauter, im Stand fast still (ev), leises Rollgeraeusch
  "Batpod": { idle: 120, max: 1050, gears: [0, 45], wave: "sine", wave2: "sine", g2: 0.16, sub: 2.67, cut0: 2600, cut1: 7000, vol: 0.045, noise: 0.025, am: 0, soft: true, ev: true },   // Nicolas: leiser,
};
function engineNoise(ctx) {
  if (ENGINE.noiseBuf) return ENGINE.noiseBuf;
  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  return ENGINE.noiseBuf = b;
}
function engineStart(kind) {
  if (ENGINE.muted) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const ctx = ENGINE.ctx ??= new AC(); if (ctx.state === "suspended") ctx.resume();
  engineStop(true);
  const P = ENG_PROFILES[kind] || ENG_PROFILES.Tumbler, t = ctx.currentTime;
  const out = ctx.createGain(); out.gain.value = 0; out.connect(engineOut(ctx));
  const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = P.cut0; filt.Q.value = 2.2; filt.connect(out);
  const am = ctx.createGain(); am.gain.value = 0.65; am.connect(filt);
  const o1 = ctx.createOscillator(); o1.type = P.wave; o1.frequency.value = P.idle; o1.connect(am);
  const o2 = ctx.createOscillator(); o2.type = P.wave2 || "square"; o2.frequency.value = P.idle * P.sub; const g2 = ctx.createGain(); g2.gain.value = P.g2 ?? 0.3; o2.connect(g2); g2.connect(am);
  const lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = P.idle / 2; const lg = ctx.createGain(); lg.gain.value = P.am ?? 0.35; lfo.connect(lg); lg.connect(am.gain);   // Zuendtakt
  const ns = ctx.createBufferSource(); ns.buffer = engineNoise(ctx); ns.loop = true;
  const nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 350; nf.Q.value = 0.7; const ng = ctx.createGain(); ng.gain.value = 0;
  ns.connect(nf); nf.connect(ng); ng.connect(engineOut(ctx));
  for (const o of [o1, o2, lfo, ns]) o.start();
  if (P.soft) { out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(P.vol, t + 0.9); o1.frequency.setValueAtTime(P.idle * 0.6, t); o1.frequency.linearRampToValueAtTime(P.idle, t + 0.9); }   // elektrisch/leise: weich hochfahren
  else { out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(P.vol * 1.3, t + 0.25); out.gain.linearRampToValueAtTime(P.vol, t + 0.9);   // Anlassen
    o1.frequency.setValueAtTime(P.idle * 0.5, t); o1.frequency.linearRampToValueAtTime(P.idle * 1.7, t + 0.35); o1.frequency.linearRampToValueAtTime(P.idle, t + 0.9); }
  ENGINE.nodes = { out, filt, o1, o2, lfo, ns, ng, nf, P, started: performance.now() };
}
function engineStop(now) {
  const n = ENGINE.nodes; if (!n) return;
  ENGINE.nodes = null;
  const t = ENGINE.ctx.currentTime;
  n.out.gain.cancelScheduledValues(t); n.out.gain.setTargetAtTime(0, t, now ? 0.02 : 0.25); n.ng.gain.setTargetAtTime(0, t, 0.08);
  setTimeout(() => { for (const o of [n.o1, n.o2, n.lfo, n.ns]) { try { o.stop(); } catch (e) {} } n.out.disconnect(); n.ng.disconnect(); }, now ? 120 : 1500);
}
function engineUpdate(C) {
  const n = ENGINE.nodes; if (!n) return;
  const P = n.P, v = Math.abs(C.v), t = ENGINE.ctx.currentTime, thr = C.throttle || 0;
  if (performance.now() - n.started < 900) return;                         // Anlassen laeuft noch
  let gi = 0; while (gi < P.gears.length - 2 && v > P.gears[gi + 1]) gi++;
  const frac = clamp01((v - P.gears[gi]) / (P.gears[gi + 1] - P.gears[gi]));
  const rpm = C.air ? 1 : clamp01(0.06 + (gi > 0 ? 0.32 + frac * 0.6 : frac * 0.9));
  const f = P.idle + (P.max - P.idle) * rpm * (0.78 + 0.22 * thr);
  n.f = f; n.rpm = rpm; n.gear = gi + 1;                                     // fuer ?debug
  n.o1.frequency.setTargetAtTime(f, t, 0.06); n.o2.frequency.setTargetAtTime(f * P.sub, t, 0.06); n.lfo.frequency.setTargetAtTime(f / 2, t, 0.06);
  n.filt.frequency.setTargetAtTime(P.cut0 + (P.cut1 - P.cut0) * rpm * (0.35 + 0.65 * thr), t, 0.08);
  n.out.gain.setTargetAtTime(P.ev ? P.vol * (0.08 + 0.92 * Math.min(1, v / 14)) * (0.55 + 0.65 * thr) : P.vol * (0.7 + 0.5 * thr), t, 0.1);   // ev: im Stand fast still
  n.ng.gain.setTargetAtTime(C.air || C.wet ? 0 : P.noise * Math.min(1, v / 18), t, 0.15); n.nf.frequency.setTargetAtTime(280 + v * 22, t, 0.2);
}
function engineJet() {                                                       // Schubstoss beim Sprung (Tumbler)
  const ctx = ENGINE.ctx; if (!ctx || ENGINE.muted) return;
  const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = engineNoise(ctx);
  const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(3000, t); f.frequency.exponentialRampToValueAtTime(300, t + 1.0);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
  s.connect(f); f.connect(g); g.connect(engineOut(ctx)); s.start(t); s.stop(t + 1.2);
}
function engineMute() {
  ENGINE.muted = !ENGINE.muted;
  if (ENGINE.muted) engineStop(true); else if (CAR && CAR.on) engineStart(CAR.spec.name);
  toast(ENGINE.muted ? "Ton aus (M)" : "Ton an (M)");
}
document.addEventListener("visibilitychange", () => { const c = ENGINE.ctx; if (c) document.hidden ? c.suspend() : c.resume(); });
