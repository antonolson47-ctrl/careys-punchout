/* ===================== AUDIO: 100% procedural WebAudio (no samples) ===================== */
let AC = null, BUS = {}, NZ = null;
const AUD = { counts: {}, log: [], voices: 0, cd: {} };
function aNow() { return AC ? AC.currentTime : 0; }
function hitA(n) { AUD.counts[n] = (AUD.counts[n] || 0) + 1; AUD.log.push(n); if (AUD.log.length > 300) AUD.log.shift(); }
function sfxOK(name, cd) { hitA(name); if (!AC || AC.state === 'closed' || S.mute || S.sfxVol < 0.001) return false; if (cd) { const t = aNow(); if (AUD.cd[name] != null && t - AUD.cd[name] < cd) return false; AUD.cd[name] = t; } return AUD.voices < 56; }
function mkNoise(c) {
  const len = c.sampleRate * 2, mk = () => c.createBuffer(1, len, c.sampleRate), w = mk(), p = mk(), b = mk();
  const W = w.getChannelData(0), Pn = p.getChannelData(0), B = b.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, br = 0;
  for (let i = 0; i < len; i++) { const x = Math.random() * 2 - 1; W[i] = x; b0 = .99765 * b0 + x * .099046; b1 = .963 * b1 + x * .2965164; b2 = .57 * b2 + x * 1.0526913; Pn[i] = (b0 + b1 + b2 + x * .1848) * .2; br = (br + .02 * x) / 1.02; B[i] = br * 3.5; }
  return { w, p, b };
}
function mkImpulse(c, secs) { const n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.8) * (i < 60 ? i / 60 : 1); } return b; }
function curve(k) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; }
function buildGraph() {
  const c = AC, B = {};
  B.master = c.createGain(); B.master.gain.value = S.mute ? 0 : 0.9;
  B.lim = c.createDynamicsCompressor(); B.lim.threshold.value = -8; B.lim.knee.value = 3; B.lim.ratio.value = 12; B.lim.attack.value = 0.002; B.lim.release.value = 0.15;
  B.master.connect(B.lim); B.lim.connect(c.destination);
  B.rev = c.createConvolver(); B.rev.buffer = mkImpulse(c, 1.6); B.revOut = c.createGain(); B.revOut.gain.value = 0.5; B.rev.connect(B.revOut); B.revOut.connect(B.master);
  B.sfx = c.createGain(); B.sfx.gain.value = S.sfxVol; B.sfx.connect(B.master);
  B.sfxRev = c.createGain(); B.sfxRev.gain.value = 0.22; B.sfx.connect(B.sfxRev); B.sfxRev.connect(B.rev);
  B.music = c.createGain(); B.music.gain.value = S.musicVol * 0.55; B.music.connect(B.master);
  B.musRev = c.createGain(); B.musRev.gain.value = 0.12; B.music.connect(B.musRev); B.musRev.connect(B.rev);
  B.drive = curve(5); B.crunch = curve(40);
  BUS = B; NZ = mkNoise(c);
  Crowd.start();
}
function audioInit() {
  if (!AC) { try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; AC = new C(); buildGraph(); hitA('audioInit'); } catch (e) { AC = null; return; } }
  if (AC.state === 'suspended' || AC.state === 'interrupted') { try { const p = AC.resume(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
}
function applyVol() { if (!AC) return; const t = AC.currentTime; BUS.master.gain.setTargetAtTime(S.mute ? 0 : 0.9, t, 0.03); BUS.sfx.gain.setTargetAtTime(S.sfxVol, t, 0.03); BUS.music.gain.setTargetAtTime(S.musicVol * 0.55, t, 0.03); if (S.mute && window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { } }

/* ---- building blocks ---- */
function vEnd(node, t) { AUD.voices++; node.onended = () => { AUD.voices--; }; }
function env(gn, t, a, peak, d, sus = 0) { const p = gn.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + a); p.exponentialRampToValueAtTime(Math.max(0.0001, sus || 0.0001), t + a + d); }
// sine/tri thump with pitch drop
function thump(t, f0, f1, dur, gain, out, type = 'sine', drive = false) {
  const o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur * 0.8);
  env(gn, t, 0.003, gain, dur); let n = o; if (drive) { const ws = AC.createWaveShaper(); ws.curve = BUS.drive; o.connect(ws); n = ws; }
  n.connect(gn); gn.connect(out || BUS.sfx); o.start(t); o.stop(t + dur + 0.05); vEnd(o);
}
// filtered noise burst
function nz(t, kind, ftype, f, q, dur, gain, out, a = 0.002, f2, crunch = false) {
  const s = AC.createBufferSource(); s.buffer = NZ[kind]; const fl = AC.createBiquadFilter(); fl.type = ftype; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q;
  const gn = AC.createGain(); env(gn, t, a, gain, dur); let n = s;
  if (crunch) { const ws = AC.createWaveShaper(); ws.curve = BUS.crunch; s.connect(ws); n = ws; }
  n.connect(fl); fl.connect(gn); gn.connect(out || BUS.sfx); s.start(t, Math.random() * 1.5); s.stop(t + dur + a + 0.05); vEnd(s);
}
// noise sweep with swell (whoosh)
function swoosh(t, dur, f0, f1, gain, q = 1.4) {
  const s = AC.createBufferSource(); s.buffer = NZ.p; const fl = AC.createBiquadFilter(); fl.type = 'bandpass'; fl.Q.value = q; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const gn = AC.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(gain, t + dur * 0.55); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(gn); gn.connect(BUS.sfx); s.start(t, Math.random()); s.stop(t + dur + 0.05); vEnd(s);
}
function tone(t, f, dur, gain, type = 'sine', out, a = 0.004, f2) { const o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); env(gn, t, a, gain, dur); o.connect(gn); gn.connect(out || BUS.sfx); o.start(t); o.stop(t + dur + a + 0.05); vEnd(o); }
// formant "voice" syllable (sawtooth through two band-pass formants) — grunts, boos, gibberish talk
const VOW = { a: [800, 1200], e: [500, 1900], i: [320, 2300], o: [480, 850], u: [330, 800], ae: [700, 1700], uh: [600, 1100] };
function syl(t, f0, f1, dur, vow, gain, breath = 0.15, out) {
  const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  const vib = AC.createOscillator(), vg = AC.createGain(); vib.frequency.value = 5.5 + Math.random() * 2; vg.gain.value = f0 * 0.02; vib.connect(vg); vg.connect(o.frequency);
  const gn = AC.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(gain, t + Math.min(0.03, dur * 0.2)); gn.gain.setValueAtTime(gain, t + dur * 0.6); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const [F1, F2] = VOW[vow] || VOW.a;
  for (const [f, q, k] of [[F1, 6, 1], [F2, 8, 0.6], [2700, 9, 0.25]]) { const b = AC.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; const kg = AC.createGain(); kg.gain.value = k * 2.2; o.connect(b); b.connect(kg); kg.connect(gn); }
  gn.connect(out || BUS.sfx); o.start(t); vib.start(t); o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05); vEnd(o);
  if (breath > 0) nz(t, 'w', 'bandpass', F2, 2, dur * 0.7, gain * breath, out);
}

/* ---- the crowd (always-on bed + reactions) ---- */
const Crowd = {
  g: null, lvl: 0, target: 0.05, boost: 0,
  start() {
    if (!AC || this.g) return; const c = AC;
    const s = c.createBufferSource(); s.buffer = NZ.p; s.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6;
    const s2 = c.createBufferSource(); s2.buffer = NZ.b; s2.loop = true; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
    this.g = c.createGain(); this.g.gain.value = 0; s.connect(bp); bp.connect(this.g); s2.connect(lp); lp.connect(this.g);
    const mg = c.createGain(); mg.gain.value = 1; const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.31; lg.gain.value = 0.25; lfo.connect(lg); lg.connect(mg.gain);
    this.g.connect(mg); mg.connect(BUS.sfx); s.start(); s2.start(); lfo.start();
  },
  set(v) { this.target = v; },
  update(dt) { if (!this.g) return; this.lvl = approach(this.lvl, this.target, dt * 2.5); this.boost = Math.max(0, this.boost - dt * this.bd); this.g.gain.setTargetAtTime(this.lvl + this.boost, AC.currentTime, 0.06); },
  bd: 0.2, swell(amount, dur) { hitA('crowdSwell'); this.boost = Math.max(this.boost, amount); this.bd = amount / Math.max(0.3, dur); },
};
/* ---- SFX library ---- */
const SFX = {
  // power: 0..1+  kind: jab hook body upper leg head round star block
  punch(kind, power = 1, counter = false) {
    if (!sfxOK('hit_' + kind)) return; const t = aNow() + 0.005, P = power, j = 1 + rand(-0.07, 0.07);
    const big = kind === 'star' || kind === 'round' || kind === 'head';
    // 1) transient click
    nz(t, 'w', 'highpass', 2500, 0.7, 0.012, 0.5 * P);
    // 2) leather smack
    const sm = { jab: [1900, 0.05], hook: [1500, 0.07], body: [900, 0.06], upper: [1300, 0.08], leg: [2600, 0.06], head: [2200, 0.09], round: [1800, 0.11], star: [1400, 0.14] }[kind] || [1500, 0.07];
    nz(t, 'w', 'bandpass', sm[0] * j, 0.9, sm[1], (kind === 'leg' ? 0.95 : 0.7) * P);
    // 3) meat body (low-mid noise)
    nz(t, 'p', 'lowpass', kind === 'body' ? 520 : 850, 0.8, kind === 'body' ? 0.2 : 0.14, 0.9 * P);
    // 4) thump (driven sine)
    const th = { jab: [170, 70, 0.12, 0.7], hook: [150, 50, 0.2, 0.95], body: [110, 38, 0.3, 1.2], upper: [160, 45, 0.24, 1.0], leg: [140, 55, 0.2, 0.95], head: [150, 40, 0.3, 1.15], round: [130, 32, 0.38, 1.3], star: [120, 26, 0.6, 1.5] }[kind] || [150, 50, 0.2, 1];
    thump(t, th[0] * j, th[1], th[2], th[3] * P, null, 'sine', true);
    if (kind === 'body') { thump(t + 0.01, 70, 30, 0.28, 0.8 * P); nz(t + 0.02, 'b', 'lowpass', 300, 1, 0.25, 0.7 * P); }
    if (kind === 'leg' || kind === 'head' || kind === 'round') { nz(t, 'w', 'highpass', 3500, 0.8, 0.04, 0.6 * P); }
    if (big || counter) { // crunch layer
      nz(t + 0.004, 'w', 'bandpass', 700, 0.7, 0.16, 0.55 * P, null, 0.001, 200, true);
      thump(t, 90, 24, 0.5, 0.9 * P, null, 'triangle', true);
    }
    if (kind === 'star') { // the big one
      nz(t, 'w', 'lowpass', 4000, 0.5, 0.45, 0.8, null, 0.001, 300, true);
      thump(t, 70, 20, 0.9, 1.2, null, 'sine', true);
      for (const f of [523, 787, 1210, 1863]) tone(t, f * j, 0.7, 0.07, 'sine', BUS.sfx, 0.002);
      swoosh(t + 0.05, 0.9, 3000, 300, 0.35, 0.8);
    }
  },
  whoosh(kind = 'jab', p = 1) {
    if (!sfxOK('whoosh', 0.03)) return; const t = aNow();
    const d = { jab: [0.12, 900, 2600, 0.25], hook: [0.2, 600, 2200, 0.3], upper: [0.22, 500, 2400, 0.32], body: [0.17, 500, 1600, 0.28], leg: [0.24, 400, 1800, 0.38], head: [0.3, 350, 2400, 0.42], round: [0.42, 300, 2800, 0.5], star: [0.35, 300, 3000, 0.5], opp: [0.22, 500, 1800, 0.35], big: [0.4, 250, 1500, 0.5] }[kind] || [0.15, 700, 2000, 0.3];
    swoosh(t, d[0], d[1], d[2], d[3] * p);
    if (kind === 'round') swoosh(t + 0.18, 0.3, 500, 3000, 0.3);
  },
  block(p = 1) { if (!sfxOK('block')) return; const t = aNow(); nz(t, 'p', 'bandpass', 420, 1.2, 0.09, 0.8 * p); thump(t, 220, 120, 0.08, 0.45 * p, null, 'triangle'); nz(t, 'w', 'highpass', 4000, 0.7, 0.01, 0.15 * p); },
  dodge() { if (!sfxOK('dodge', 0.05)) return; const t = aNow(); swoosh(t, 0.16, 1200, 500, 0.12); nz(t + 0.02, 'w', 'highpass', 6000, 1, 0.03, 0.05); },
  miss() { if (!sfxOK('miss', 0.05)) return; swoosh(aNow(), 0.3, 1800, 300, 0.32); },
  bell(n = 1) {
    if (!sfxOK('bell')) return; let t = aNow() + 0.02;
    for (let i = 0; i < n; i++, t += 0.32) { const f = 1180; nz(t, 'w', 'highpass', 3000, 1, 0.01, 0.4); for (const [r, gn, d] of [[1, 0.28, 2.2], [2.76, 0.14, 1.4], [5.4, 0.08, 0.9], [8.93, 0.05, 0.5], [0.5, 0.1, 1.6]]) tone(t, f * r, d, gn, 'sine', BUS.sfx, 0.001); }
  },
  ting() { if (!sfxOK('ting', 0.08)) return; const t = aNow(); tone(t, 2637, 0.25, 0.12); tone(t + 0.04, 3951, 0.2, 0.08); },
  tell(kind) { // per-attack audio tell
    if (!sfxOK('tell_' + kind, 0.1)) return; const t = aNow();
    if (kind === 'upper') tone(t, 300, 0.25, 0.07, 'square', null, 0.01, 900);
    else if (kind === 'highkick') { tone(t, 900, 0.2, 0.06, 'square', null, 0.01, 1500); tone(t + 0.1, 1500, 0.15, 0.05, 'square'); }
    else if (kind === 'haymaker') tone(t, 160, 0.5, 0.08, 'sawtooth', null, 0.05, 520);
    else if (kind === 'lowkick') tone(t, 500, 0.2, 0.06, 'square', null, 0.01, 220);
    else if (kind === 'body') tone(t, 380, 0.15, 0.05, 'triangle', null, 0.01, 260);
    else tone(t, 700, 0.08, 0.04, 'square');
  },
  star() { if (!sfxOK('starGain')) return; const t = aNow(); [1047, 1319, 1568, 2093].forEach((f, i) => tone(t + i * 0.05, f, 0.25, 0.09, 'square')); tone(t, 2637, 0.6, 0.05); },
  starCharge() { if (!sfxOK('starCharge')) return; const t = aNow(); tone(t, 200, 0.35, 0.12, 'sawtooth', null, 0.02, 1600); tone(t, 400, 0.35, 0.06, 'square', null, 0.02, 3200); },
  gassed() { if (!sfxOK('gassed')) return; const t = aNow(); syl(t, 330, 220, 0.5, 'a', 0.18, 0.9); syl(t + 0.55, 300, 200, 0.5, 'u', 0.15, 0.9); },
  heart() { if (!sfxOK('heart', 0.4)) return; const t = aNow(); thump(t, 60, 40, 0.1, 0.4); thump(t + 0.16, 55, 38, 0.1, 0.3); },
  ui(k = 'move') { if (!sfxOK('ui_' + k, 0.03)) return; const t = aNow(); if (k === 'move') tone(t, 880, 0.05, 0.05, 'square'); else if (k === 'ok') { tone(t, 660, 0.06, 0.07, 'square'); tone(t + 0.06, 990, 0.1, 0.07, 'square'); } else if (k === 'back') tone(t, 440, 0.08, 0.06, 'square', null, 0.004, 300); else if (k === 'blip') tone(t, 600 + Math.random() * 300, 0.03, 0.03, 'square'); },
  thud() { if (!sfxOK('thud')) return; const t = aNow(); thump(t, 90, 30, 0.5, 1.4, null, 'sine', true); nz(t, 'b', 'lowpass', 400, 1, 0.5, 1); nz(t, 'p', 'bandpass', 600, 0.8, 0.12, 0.6); },
  count(n) { if (!sfxOK('count')) return; const t = aNow(); thump(t, 120, 60, 0.12, 0.5, null, 'triangle'); nz(t, 'w', 'bandpass', 1200, 2, 0.04, 0.3); },
  mash() { if (!sfxOK('mash', 0.04)) return; tone(aNow(), 500 + Math.random() * 400, 0.04, 0.05, 'square'); },
  flash() { if (!sfxOK('flash')) return; const t = aNow(); tone(t, 3000, 0.4, 0.08, 'sine', null, 0.002, 6000); nz(t, 'w', 'highpass', 5000, 1, 0.3, 0.2); },
  zap() { if (!sfxOK('zap')) return; const t = aNow(); tone(t, 1800, 0.35, 0.08, 'sawtooth', null, 0.005, 120); tone(t, 2400, 0.3, 0.05, 'square', null, 0.005, 200); },
  drill() { if (!sfxOK('drill', 0.3)) return; const t = aNow(); const o = AC.createOscillator(), gn = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(900, t); o.frequency.linearRampToValueAtTime(1700, t + 0.5); env(gn, t, 0.03, 0.05, 0.6); o.connect(gn); gn.connect(BUS.sfx); o.start(t); o.stop(t + 0.7); vEnd(o); },
  splash() { if (!sfxOK('splash')) return; const t = aNow(); nz(t, 'w', 'bandpass', 2500, 0.6, 0.35, 0.3, null, 0.005, 800); },
  // ---- voices ----
  grunt(who = 'opp', pitch = 110, k = 1) { if (!sfxOK('grunt_' + who, 0.12)) return; const t = aNow(); syl(t, pitch * rand(1, 1.15), pitch * 0.7, 0.22 * k, pick(['uh', 'o', 'u']), 0.22, 0.4); },
  oof(pitch = 110) { if (!sfxOK('oof', 0.15)) return; const t = aNow(); syl(t, pitch * 1.3, pitch * 0.6, 0.3, 'u', 0.25, 0.6); },
  kiai(big = false) { if (!sfxOK('kiai', 0.15)) return; const t = aNow(); syl(t, big ? 420 : 380, big ? 330 : 300, big ? 0.28 : 0.16, pick(['a', 'ae', 'uh']), 0.16, 0.5); },
  careyHurt() { if (!sfxOK('careyHurt', 0.15)) return; const t = aNow(); syl(t, 440, 300, 0.2, pick(['a', 'u', 'uh']), 0.18, 0.6); },
  talk(text, pitch = 140, rate = 1) { // gibberish blips for dialog (Animal-Crossing-ish), 1 syllable per ~2 chars
    if (!sfxOK('talk', 0.05)) return; let t = aNow(); const n = Math.min(14, Math.ceil(String(text).length / 4)), v = ['a', 'e', 'i', 'o', 'u', 'ae', 'uh'];
    for (let i = 0; i < n; i++) { const f = pitch * rand(0.85, 1.25); syl(t, f, f * rand(0.8, 1.05), 0.075 / rate, pick(v), 0.07, 0.05); t += 0.09 / rate; }
  },
  crowd(kind) {
    if (!sfxOK('crowd_' + kind, 0.25)) return; const t = aNow();
    if (kind === 'ooh') { for (let i = 0; i < 6; i++) syl(t + rand(0, 0.08), rand(160, 300), rand(110, 200), rand(0.6, 0.9), 'o', 0.035, 0.4); Crowd.swell(0.06, 0.6); }
    else if (kind === 'roar') { nz(t, 'p', 'bandpass', 1100, 0.5, 1.8, 0.45, null, 0.15); nz(t, 'w', 'bandpass', 2500, 0.8, 1.4, 0.15, null, 0.2); for (let i = 0; i < 7; i++) syl(t + rand(0, 0.2), rand(220, 420), rand(200, 380), rand(0.8, 1.3), pick(['a', 'ae', 'e']), 0.03, 0.4); Crowd.swell(0.15, 1.5); }
    else if (kind === 'boo') { for (let i = 0; i < 8; i++) syl(t + rand(0, 0.15), rand(110, 170), rand(80, 120), rand(0.9, 1.4), 'u', 0.045, 0.3); }
    else if (kind === 'cheer') { nz(t, 'p', 'bandpass', 1300, 0.6, 1.1, 0.3, null, 0.08); for (let i = 0; i < 6; i++) syl(t + rand(0, 0.12), rand(250, 450), rand(300, 500), rand(0.5, 0.8), pick(['ae', 'e', 'a']), 0.03, 0.4); }
    else if (kind === 'laugh') { for (let k = 0; k < 4; k++) for (let i = 0; i < 3; i++) syl(t + k * 0.16 + rand(0, 0.04), rand(200, 330), rand(180, 300), 0.1, 'a', 0.03, 0.3); }
    else if (kind === 'gasp') { nz(t, 'w', 'bandpass', 1800, 1.5, 0.4, 0.15, null, 0.05); }
  },
  sadTrombone() { if (!sfxOK('sadTrombone')) return; let t = aNow(); [[311, 0.4], [294, 0.4], [277, 0.4], [262, 1.2]].forEach(([f, d]) => { syl(t, f, f * (d > 1 ? 0.94 : 0.98), d, 'o', 0.13, 0.05); t += d + 0.02; }); },
};
/* ---- optional speech synthesis (announcer, ref count) ---- */
const Voice = {
  ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined', pickV: null,
  say(text, o = {}) {
    hitA('speech'); if (!this.ok || !S.voice || S.mute || S.sfxVol < 0.01) return false;
    try {
      if (o.cancel !== false) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.rate = o.rate || 0.95; u.pitch = o.pitch || 0.8; u.volume = clamp(S.sfxVol * (o.vol || 1), 0, 1);
      if (!this.pickV) { const vs = speechSynthesis.getVoices() || []; this.pickV = vs.find(v => /en[-_]US/i.test(v.lang) && /male|daniel|alex|fred|david/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null; }
      if (this.pickV) u.voice = this.pickV; speechSynthesis.speak(u); return true;
    } catch (e) { return false; }
  },
  stop() { if (this.ok) try { speechSynthesis.cancel(); } catch (e) { } }
};
