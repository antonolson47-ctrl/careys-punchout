/* ===================== MUSIC: tiny chiptune sequencer ===================== */
const NOTE_I = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function nmidi(tok) { const m = /^([A-G])(#|b)?(-?\d)$/.exec(tok); if (!m) return null; return 12 * (+m[3] + 1) + NOTE_I[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
function chordNotes(ch) { const m = /^([A-G])(#|b)?(.*)$/.exec(ch); let r = NOTE_I[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); const q = m[3]; const iv = q.startsWith('maj7') ? [0, 4, 7, 11] : q.startsWith('m7') ? [0, 3, 7, 10] : q.startsWith('m') ? [0, 3, 7] : q.startsWith('7') ? [0, 4, 7, 10] : q.startsWith('sus') ? [0, 5, 7] : [0, 4, 7]; return { root: r, iv }; }
const SONGS = {
  title: { bpm: 128, res: 2, chords: 'C C F G Am F G G', lead: 'E5 - G5 - C6 - B5 A5 G5 - - - E5 - G5 . A5 - F5 - A5 - C6 . B5 - - - G5 - - . C6 - B5 - A5 - E5 . F5 - A5 - C6 - D6 . D6 - C6 - B5 - G5 . G5 - - - - - . .', bass: 'x.x.x.x.x.x.xx.x', arp: 'x.x.x.x.x.x.x.x.', K: 'x...x...x...x...', S: '....x.......x...', H: '..x...x...x...x.' },
  menu: { bpm: 108, res: 2, chords: 'Dm7 G7 Cmaj7 A7', lead: 'D5 . F5 . A5 . . G5 F5 . D5 . . . B4 . C5 . E5 . G5 . E5 . C#5 - E5 - G5 - . .', bass: 'x..x..x.x.x..x..', arp: '..x...x...x...x.', K: 'x.....x...x.....', S: '....x.......x..x', H: 'x.xxx.x.x.xxx.x.' },
  fight: { bpm: 150, res: 2, chords: 'Am Am F G Am Am F E', lead: 'A4 . C5 . E5 D5 C5 B4 A4 - - . G4 A4 C5 . F4 . A4 . C5 . A4 C5 D5 - B4 - G4 - B4 D5 E5 . E5 . D5 C5 D5 E5 A5 - - - G5 - E5 . F5 . E5 . D5 . C5 . B4 - G#4 - E4 - - .', bass: 'x.xx.xx.x.xx.xx.', arp: 'x.x.x.x.x.x.x.x.', K: 'x...x...x...x.x.', S: '....x.......x...', H: 'x.x.x.x.x.x.x.x.' },
  fight3: { bpm: 160, res: 2, chords: 'Am Am F G Am Am F E', lead: 'E5 . A5 . E5 . A5 B5 C6 - B5 - A5 - E5 . F5 . A5 . C6 . A5 . D6 - B5 - G5 - D6 . E6 . E6 . D6 C6 D6 E6 A5 - - - G5 - E5 . F5 . E5 . D5 . C5 . B4 - G#4 - E5 - - .', bass: 'xxxx.xxxx.xxxxx.', arp: 'xxxxxxxxxxxxxxxx', K: 'x.x.x...x.x.x.x.', S: '....x.......x.xx', H: 'xxxxxxxxxxxxxxxx' },
  corner: { bpm: 92, res: 2, chords: 'Em C D B7', lead: 'E4 - - - G4 - B4 - C5 - - - B4 - G4 - A4 - - - F#4 - D4 - D#4 - - - F#4 - B4 -', bass: 'x.......x...x...', arp: 'x...x...x...x...', K: 'x.......x.......', S: '....x.......x...', H: '..x...x...x...x.' },
  win: { bpm: 124, res: 2, chords: 'C F G C C F G7 C', lead: 'C5 E5 G5 C6 - - G5 C6 A5 - F5 - C6 - A5 - B5 - G5 - D6 - B5 - C6 - - - - - - . E5 . G5 . C6 . G5 . A5 . C6 . F6 . C6 . D6 . B5 . G5 . B5 . C6 - - - G5 - C6 .', bass: 'x.x.x.x.x.x.x.x.', arp: 'x.x.x.x.x.x.x.x.', K: 'x...x...x...x...', S: '....x.......x...', H: 'x.x.x.x.x.x.x.x.' },
  lose: { bpm: 80, res: 2, chords: 'Am Dm E Am', lead: 'A4 - G4 - F4 - E4 - D4 - F4 - A4 - - - G#4 - - - B4 - - - A4 - - - - - - .', bass: 'x.......x.......', arp: 'x...x...x...x...', K: 'x.......x.......', S: '................', H: '....x.......x...' },
};
const Music = {
  cur: null, name: '', step: 0, nextT: 0, timer: null, gain: null, pulse25: null, pulse12: null,
  waves() { if (this.pulse25) return; const mk = d => { const n = 32, re = new Float32Array(n), im = new Float32Array(n); for (let i = 1; i < n; i++) im[i] = 2 / (i * Math.PI) * Math.sin(i * Math.PI * d); return AC.createPeriodicWave(re, im); }; this.pulse25 = mk(0.25); this.pulse12 = mk(0.125); },
  play(name) {
    hitA('music_' + name); if (this.name === name) return; this.name = name; const def = SONGS[name]; if (!def) { this.stop(); return; }
    const song = Object.assign({}, def); song.chordsA = def.chords.split(' ').map(chordNotes); song.leadA = def.lead.split(' ');
    this.cur = song; this.step = 0;
    if (!AC) return; this.waves();
    if (this.gain) { const old = this.gain; old.gain.setTargetAtTime(0.0001, AC.currentTime, 0.15); setTimeout(() => { try { old.disconnect(); } catch (e) { } }, 900); }
    this.gain = AC.createGain(); this.gain.gain.value = 0.0001; this.gain.gain.setTargetAtTime(1, AC.currentTime + 0.05, 0.1); this.gain.connect(BUS.music);
    this.nextT = AC.currentTime + 0.08;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 25);
  },
  stop() { this.name = ''; this.cur = null; if (this.gain && AC) { const old = this.gain; old.gain.setTargetAtTime(0.0001, AC.currentTime, 0.1); setTimeout(() => { try { old.disconnect(); } catch (e) { } }, 800); this.gain = null; } },
  resume() { if (AC && this.cur && !this.gain) { const n = this.name; this.name = ''; this.play(n); } },
  tick() {
    if (!AC || !this.cur || !this.gain) return; if (AC.state !== 'running') { this.nextT = AC.currentTime + 0.05; return; }
    const s = this.cur, sd = 60 / s.bpm / 4; if (this.nextT < AC.currentTime - 0.3) this.nextT = AC.currentTime + 0.02;
    while (this.nextT < AC.currentTime + 0.14) { this.note(this.step, this.nextT, sd); this.step++; this.nextT += sd; }
  },
  note(st, t, sd) {
    const s = this.cur, out = this.gain, bars = s.chordsA.length, total = bars * 16, i = st % total, bar = Math.floor(i / 16), b16 = i % 16, ch = s.chordsA[bar];
    if (S.mute || S.musicVol < 0.001) return;
    // lead
    if (i % s.res === 0) { const li = i / s.res, tok = s.leadA[li % s.leadA.length], m = nmidi(tok); if (m != null) { let len = 1; while (s.leadA[(li + len) % s.leadA.length] === '-' && len < 16) len++; this.inst(t, mf(m), len * s.res * sd * 0.92, 'lead', out); } }
    // bass
    if (s.bass[b16] === 'x') { const oct = (b16 % 8 === 6 && s.bass === SONGS.fight.bass) ? 12 : 0; this.inst(t, mf(36 + ch.root + oct), sd * 1.7, 'bass', out); }
    // arp
    if (s.arp[b16] === 'x') { const k = Math.floor(b16 / (s.arp.indexOf('x', 1) || 2)); this.inst(t, mf(60 + ch.root + ch.iv[k % ch.iv.length] + (ch.root > 6 ? -12 : 0)), sd * 0.9, 'arp', out); }
    if (s.K[b16] === 'x') this.drum(t, 'K', out); if (s.S[b16] === 'x') this.drum(t, 'S', out); if (s.H[b16] === 'x') this.drum(t, 'H', out);
    if (i === 0 && st > 0 && this.name.startsWith('fight')) this.drum(t, 'C', out);
  },
  inst(t, f, d, kind, out) {
    const o = AC.createOscillator(), gn = AC.createGain();
    if (kind === 'lead') { o.setPeriodicWave(this.pulse25); const v = AC.createOscillator(), vg = AC.createGain(); v.frequency.value = 5.5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(d, 0.3)); v.connect(vg); vg.connect(o.frequency); v.start(t); v.stop(t + d + 0.1); }
    else if (kind === 'bass') o.type = 'triangle'; else o.setPeriodicWave(this.pulse12);
    o.frequency.value = f; const pk = kind === 'lead' ? 0.085 : kind === 'bass' ? 0.26 : 0.035;
    gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(pk, t + 0.006); gn.gain.setTargetAtTime(pk * (kind === 'arp' ? 0.3 : 0.65), t + 0.02, 0.08); gn.gain.setTargetAtTime(0.0001, t + d, 0.03);
    o.connect(gn); gn.connect(out); o.start(t); o.stop(t + d + 0.2);
  },
  drum(t, k, out) {
    if (k === 'K') { const o = AC.createOscillator(), gn = AC.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); gn.gain.setValueAtTime(0.5, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(gn); gn.connect(out); o.start(t); o.stop(t + 0.22); }
    else { const s = AC.createBufferSource(); s.buffer = NZ.w; const f = AC.createBiquadFilter(), gn = AC.createGain(); const d = k === 'S' ? 0.12 : k === 'C' ? 0.6 : 0.03;
      f.type = k === 'S' ? 'bandpass' : 'highpass'; f.frequency.value = k === 'S' ? 1800 : k === 'C' ? 5000 : 7500; f.Q.value = 0.7;
      gn.gain.setValueAtTime(k === 'S' ? 0.22 : k === 'C' ? 0.1 : 0.06, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(gn); gn.connect(out); s.start(t, Math.random()); s.stop(t + d + 0.02);
      if (k === 'S') { const o = AC.createOscillator(), g2 = AC.createGain(); o.type = 'triangle'; o.frequency.value = 190; g2.gain.setValueAtTime(0.12, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); o.connect(g2); g2.connect(out); o.start(t); o.stop(t + 0.1); } }
  }
};
