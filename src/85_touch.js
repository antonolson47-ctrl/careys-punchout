/* ===================== LAYOUT (fit), TOUCH CONTROLS, INPUT ===================== */
const saProbe = document.createElement('div');
saProbe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
document.body.appendChild(saProbe);
function safeInsets() { const c = getComputedStyle(saProbe); return { t: parseFloat(c.paddingTop) || 0, r: parseFloat(c.paddingRight) || 0, b: parseFloat(c.paddingBottom) || 0, l: parseFloat(c.paddingLeft) || 0 }; }
let FIT = {};
function fit() {
  const sa = safeInsets(), vw = window.innerWidth, vh = window.innerHeight, portrait = vh > vw * 1.05;
  const rs = document.documentElement.style, gap = 8;
  let gw, k, cssW, cssH, left, top, b = 64, shH, mode;
  if (IS_TOUCH && portrait) {
    mode = 'portrait'; gw = 320; const aw = vw - sa.l - sa.r; cssW = aw; k = cssW / 320; cssH = 240 * k;
    const ctlMin = 4 * 56 + 3 * gap + 30; if (vh - sa.t - sa.b - cssH < ctlMin) { cssH = Math.max(160, vh - sa.t - sa.b - ctlMin); k = cssH / 240; cssW = 320 * k; }
    left = sa.l + (aw - cssW) / 2; top = sa.t;
    const below = vh - top - cssH - sa.b - 70; // room under the canvas (minus top-button row)
    b = clamp(Math.min((aw / 2 - 18 - gap) / 2, (below - 3 * gap) / 4), 48, 96);
    shH = Math.max(140, vh - top - cssH - sa.b - 16);
  } else if (IS_TOUCH) {
    mode = 'landscape'; const aw = vw - sa.l - sa.r, ah = vh - sa.t - sa.b;
    gw = clamp(Math.round(240 * aw / ah), 320, 560); k = Math.min(aw / gw, ah / 240); cssW = gw * k; cssH = 240 * k; left = sa.l + (aw - cssW) / 2; top = sa.t + (ah - cssH) / 2;
    const side = (vw - 236 * k) / 2 - Math.max(sa.l, sa.r) - 10;
    b = clamp(Math.min((ah - 30 * k - 64 - 3 * gap) / 4, (side - gap) / 2, 86), 48, 86);
    shH = vh * 0.5;
  } else {
    mode = 'desktop'; gw = clamp(Math.round(240 * vw / vh), 320, 427); k = Math.min(vw / gw, vh / 240); cssW = gw * k; cssH = 240 * k; left = (vw - cssW) / 2; top = (vh - cssH) / 2; shH = vh * 0.5;
  }
  gw = Math.round(gw);
  if (cv.width !== gw || cv.height !== GH) { cv.width = gw; cv.height = GH; FILL = ''; }
  GW = gw;
  Object.assign(cv.style, { left: left + 'px', top: top + 'px', width: cssW + 'px', height: cssH + 'px' });
  rs.setProperty('--fs', clamp(Math.min(vw, vh) * 0.042, 13, 22).toFixed(1) + 'px');
  rs.setProperty('--b', Math.round(b) + 'px'); rs.setProperty('--gap', gap + 'px'); rs.setProperty('--shH', Math.round(shH) + 'px');
  const L = $('#tcL'), Rr = $('#tcR'), bot = (sa.b + 10) + 'px';
  L.style.left = (sa.l + 10) + 'px'; L.style.bottom = bot; Rr.style.right = (sa.r + 10) + 'px'; Rr.style.bottom = bot;
  const bp = $('#bPause'), bm = $('#bMute');
  if (mode === 'portrait') { const y = top + cssH + 8; bp.style.cssText = `left:${vw / 2 - 56}px;top:${y}px`; bm.style.cssText = `left:${vw / 2 + 8}px;top:${y}px`; }
  else { const y = top + 30 * k + 6; bp.style.cssText = `left:${Math.max(sa.l + 6, left + 6)}px;top:${y}px`; bm.style.cssText = `left:${Math.min(vw - sa.r - 54, left + cssW - 54)}px;top:${y}px`; }
  FIT = { mode, vw, vh, k, cssW, cssH, left, top, gw, b, sa, portrait };
  if (typeof TC !== 'undefined' && TC.built) TC.sync();
  hitA('fit');
}
let fitTimer = 0;
function refit() { fit(); clearTimeout(fitTimer); fitTimer = setTimeout(fit, 250); setTimeout(fit, 700); }
addEventListener('resize', refit); addEventListener('orientationchange', refit);
if (window.visualViewport) visualViewport.addEventListener('resize', refit);
if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', refit);

function setTouchMode(on) { on = !!on; if (IS_TOUCH === on) return; IS_TOUCH = on; document.body.classList.toggle('touch', on); fit(); if (TC.built) TC.sync(); hitA('touchMode_' + on); }
document.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') setTouchMode(true); }, true);
document.addEventListener('touchstart', () => setTouchMode(true), { capture: true, passive: true });
// iOS/Android: AudioContext may only start inside a user gesture
['touchend', 'pointerup', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => { audioInit(); Music.resume(); }, { capture: true, passive: true }));
document.addEventListener('gesturestart', e => e.preventDefault()); document.addEventListener('dblclick', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (!e.target.closest || !e.target.closest('.scroll,input')) e.preventDefault(); }, { passive: false });
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (F && scene === Fight && !F.paused) Pause.open(); if (AC) try { AC.suspend(); } catch (e) { } Voice.stop(); } else if (AC) try { AC.resume(); } catch (e) { } });

/* ---- on-screen buttons ---- */
const TC = {
  built: false, map: new Map(), held: {},
  build() {
    document.querySelectorAll('#tc .tb').forEach(btn => {
      const a = btn.dataset.a;
      btn.addEventListener('touchstart', e => { e.preventDefault(); audioInit(); for (const t of e.changedTouches) { this.map.set('t' + t.identifier, btn); } this.down(btn, a); }, { passive: false });
      const up = e => { e.preventDefault(); for (const t of e.changedTouches) { const b = this.map.get('t' + t.identifier); this.map.delete('t' + t.identifier); if (b) this.up(b, b.dataset.a); } };
      btn.addEventListener('touchend', up, { passive: false }); btn.addEventListener('touchcancel', up, { passive: false });
      btn.addEventListener('mousedown', e => { e.preventDefault(); this.down(btn, a); const mu = () => { this.up(btn, a); removeEventListener('mouseup', mu); }; addEventListener('mouseup', mu); });
      btn.addEventListener('contextmenu', e => e.preventDefault());
    });
    $('#bPause').addEventListener('click', e => { e.stopPropagation(); audioInit(); SFX.ui('ok'); Pause.toggle(); });
    $('#bMute').addEventListener('click', e => { e.stopPropagation(); audioInit(); toggleMute(); });
    $('#bMute').textContent = S.mute ? '✕' : '♪';
    this.built = true; this.sync();
  },
  down(btn, a) { btn.classList.add('dn'); this.held[a] = (this.held[a] || 0) + 1; hitA('tc_' + a); if (scene === Fight) fightPress(a); },
  up(btn, a) { this.held[a] = Math.max(0, (this.held[a] || 1) - 1); if (!this.held[a]) { btn.classList.remove('dn'); if (scene === Fight) fightRelease(a); } },
  releaseAll() { for (const a in this.held) { if (this.held[a] && F) fightRelease(a); this.held[a] = 0; } this.map.clear(); document.querySelectorAll('#tc .tb.dn').forEach(b => b.classList.remove('dn')); },
  sync() {
    const inFight = scene === Fight && F && !F.paused;
    $('#tc').classList.toggle('on', !!inFight); $('#bPause').classList.toggle('hide', !(scene === Fight && F && !F.paused));
    $('#mashHint').style.display = 'none';
  },
  starReady(on) { const b = document.querySelector('#tc .tb[data-a=star]'); if (b && b.classList.contains('rdy') !== on) b.classList.toggle('rdy', on); const P = F && F.P; document.querySelectorAll('#tc .tb.k').forEach(k => { const off = P && P.gasT > 0; if (k.classList.contains('off') !== off) k.classList.toggle('off', off); }); }
};
/* ---- canvas taps (menus/dialog advance, ladder picking, mash) ---- */
cv.addEventListener('pointerup', e => {
  audioInit(); const r = cv.getBoundingClientRect(), bx = (e.clientX - r.left) / r.width * GW, by = (e.clientY - r.top) / r.height * GH;
  if (scene === Fight) { if (F && F.phase === 'pDown') fightPress('mash'); return; }
  if (scene && scene.tap) scene.tap(bx, by);
});
/* ---- keyboard ---- */
const KEYMAP = { KeyJ: 'jabL', KeyK: 'jabR', KeyU: 'hookL', KeyI: 'hookR', KeyN: 'bodyL', KeyM: 'bodyR', KeyL: 'upper', KeyO: 'upper', Space: 'star', KeyQ: 'legKick', KeyE: 'headKick', KeyR: 'roundhouse', ArrowLeft: 'dodgeL', KeyA: 'dodgeL', ArrowRight: 'dodgeR', KeyD: 'dodgeR', ArrowDown: 'duck', KeyS: 'duck', ArrowUp: 'block', KeyW: 'block', ShiftLeft: 'block', ShiftRight: 'block' };
addEventListener('keydown', e => {
  const a = KEYMAP[e.code];
  if (a && IS_TOUCH && !COARSE && !FORCE_TOUCH) setTouchMode(false);
  if (e.code === 'KeyX') { toggleMute(); return; }
  if (scene === Fight && F) {
    if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); if (F.paused && Pause.sub) { Pause.sub.close(); } else Pause.toggle(); return; }
    if (F.paused) { if (menuKey(e)) e.preventDefault(); return; }
    if (F.phase === 'pDown' && !e.repeat) { fightPress('mash'); e.preventDefault(); return; }
    if (a) { e.preventDefault(); if (!e.repeat) fightPress(a); }
    return;
  }
  if (scene && scene.key && scene.key(e)) { e.preventDefault(); return; }
  if (menuKey(e)) e.preventDefault();
});
addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a && scene === Fight) fightRelease(a); });
addEventListener('blur', () => { if (scene === Fight) { TC.releaseAll(); for (const k in KEYMAP) fightRelease(KEYMAP[k]); } });
