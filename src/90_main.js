/* ===================== MAIN LOOP, ICONS, TEST HOOKS ===================== */
function drawAppIcon(c, n) {
  const k = n / 64, og = g, of = FILL; g = c; FILL = '';
  try {
    g.setTransform(k, 0, 0, k, 0, 0);
    R(0, 0, 64, 64, '#2a0838'); for (let i = 0; i < 64; i += 4) R(0, i, 64, 2, '#34104a');
    burst(32, 30, 30, '#ff3b5c', 10, 0.62); burst(32, 30, 22, '#ffd23f', 10, 0.6);
    glove(30, 30, 15, CAR.glove, 1, { knuckles: true });
    g.setTransform(k, 0, 0, k, 0, 0); TX('CP', 32, 49, '#fff', 2, 0.5, '#000');
  } finally { g = og; FILL = of; FILL = ''; }
}
function iconURL(n) { const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; drawAppIcon(x, n); return c.toDataURL('image/png'); }
(function headIcons() {
  try {
    const add = (rel, href, sizes) => { const l = document.createElement('link'); l.rel = rel; l.href = href; if (sizes) l.sizes = sizes; document.head.appendChild(l); };
    add('icon', iconURL(64));
    if (!document.querySelector('link[rel=apple-touch-icon]')) add('apple-touch-icon', iconURL(180), '180x180');
    if (!document.querySelector('link[rel=manifest]') && /^https?:$/.test(location.protocol)) {
      const man = { name: "Carey's Punchout", short_name: 'Punchout', start_url: location.href.split('#')[0], scope: location.href.replace(/[^/]*$/, ''), display: 'fullscreen', orientation: 'any', background_color: '#0b0412', theme_color: '#14061f', icons: [{ src: iconURL(192), sizes: '192x192', type: 'image/png' }, { src: iconURL(512), sizes: '512x512', type: 'image/png' }] };
      add('manifest', URL.createObjectURL(new Blob([JSON.stringify(man)], { type: 'application/manifest+json' })));
    }
  } catch (e) { }
})();
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; T += dt; DT = dt;
  try {
    if (scene && scene.update) scene.update(dt);
    if (dialog.cur && scene && !scene.update) dialog.cur.update(dt);
    Crowd.update(dt);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; FILL = ''; g.imageSmoothingEnabled = false;
    if (scene && scene.draw) scene.draw();
  } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
window.__CP = {
  get S() { return S; }, get F() { return F; }, get parts() { return PARTS; }, get stains() { return STAINS; }, get scene() { return scene ? scene.name : null; }, get fit() { return FIT; }, get touch() { return IS_TOUCH; },
  go, Title, Ladder, Intro, Fight, Corner, Interview, Loss, Champion, Help, Options, Pause, ROSTER, PM, DEF,
  press: fightPress, release: fightRelease, newFight, startRound, fightUpdate, oPoseUpdate, judge, afterFight, setTouchMode, iconURL, dialog,
  tune(p, o) { if (p) P_DMG = p; if (o) O_DMG = o; return [P_DMG, O_DMG]; },
  startFight(i) { newFight(ROSTER[i]); go(Fight); return F; },
  audio: { get counts() { return AUD.counts; }, get log() { return AUD.log; }, state() { return { ctx: AC ? AC.state : 'none', music: Music.name, mute: S.mute, musicVol: S.musicVol, sfxVol: S.sfxVol, voices: AUD.voices }; }, reset() { AUD.counts = {}; AUD.log = []; } },
};
loadSave(); TC.build(); if (COARSE || FORCE_TOUCH) setTouchMode(true); fit(); go(Title); requestAnimationFrame(frame);
