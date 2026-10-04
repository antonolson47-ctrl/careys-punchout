// In-page bot used by the automated playthrough + balance tests. Injected with page.addInitScript / evaluate.
window.__mkBot = function (cfg) {
  cfg = Object.assign({ skill: 0.9, react: 0.24, jumpy: 0.05, poke: 1.2, mash: 9, starAt: 2, kicks: 0.25, passive: false, interrupt: 0.3 }, cfg || {});
  const B = { t: 0, rel: [], handled: -1, defAt: -1, def: null, early: -1, stats: { def: 0, wrong: 0 }, cfg };
  const press = a => { __CP.press(a); }, rel = (a, d) => B.rel.push({ a, t: B.t + d });
  function chooseDef(kind) {
    const d = __CP.DEF[kind] || __CP.DEF.jab, opts = [];
    if (d.dodge) opts.push(Math.random() < 0.5 ? 'dodgeL' : 'dodgeR'); if (d.duck) opts.push('duck'); if (!opts.length && d.block < 1) opts.push('block');
    if (Math.random() > cfg.skill || !opts.length) { B.stats.wrong++; return ['dodgeL', 'duck', 'block', 'dodgeR'][Math.floor(Math.random() * 4)]; }
    return opts[Math.floor(Math.random() * opts.length)];
  }
  function attackFor(O, P) {
    const F = __CP.F;
    if (cfg.dumb) return ['jabL', 'jabR', 'hookL', 'hookR', 'bodyL', 'bodyR', 'upper', 'legKick', 'headKick'][Math.floor(Math.random() * 9)];
    if (P.stars >= cfg.starAt && (O.st === 'stun' || O.st === 'recover' || O.st === 'taunt')) return 'star';
    if (P.hearts > 8 && Math.random() < cfg.kicks) return ['legKick', 'headKick', 'roundhouse'][Math.floor(Math.random() * 3)];
    if (O.st === 'idle' || O.st === 'gloat') { const gd = O.guard; if (gd === 'high') return Math.random() < 0.5 ? 'bodyL' : 'bodyR'; if (gd === 'low') return Math.random() < 0.5 ? 'hookL' : 'hookR'; if (gd === 'mid') return ['hookL', 'hookR', 'upper', 'legKick'][Math.floor(Math.random() * 4)]; return 'upper'; }
    return ['hookL', 'hookR', 'jabL', 'jabR', 'upper', 'bodyL'][Math.floor(Math.random() * 6)];
  }
  return function (dt) {
    const F = __CP.F; if (!F) return; const O = F.O, P = F.P; B.t += dt;
    for (let i = B.rel.length - 1; i >= 0; i--) if (B.t >= B.rel[i].t) { __CP.release(B.rel[i].a); B.rel.splice(i, 1); }
    if (F.phase === 'pDown') { if (Math.random() < cfg.mash * dt) press('mash'); return; }
    if (F.phase !== 'fight') return;
    // defence: react to the glint (or jump early on the wind-up sometimes)
    if (O.st === 'tell' && B.handled !== O.tellId) {
      if (O.glinted || (Math.random() < cfg.jumpy * dt * 10 && O.t > 0.15)) { B.handled = O.tellId; B.defAt = B.t + cfg.react * (0.75 + Math.random() * 0.5) - (O.glinted ? 0 : 0); B.def = chooseDef(O.move.kind); }
    }
    if (O.st === 'update' && P.st === 'idle') { press(['jabL', 'jabR', 'hookL'][Math.floor(Math.random() * 3)]); return; }
    if (B.defAt > 0 && B.t >= B.defAt) { B.defAt = -1; if (P.st === 'atk') { } press(B.def); rel(B.def, B.def === 'block' ? 0.6 : 0.3); B.stats.def++; return; }
    if (cfg.passive || B.defAt > 0) return;
    if (P.st !== 'idle' || P.gasT > 0) return;
    if (O.st === 'recover' || O.st === 'stun' || O.st === 'taunt') { if (Math.random() < dt * 12) press(attackFor(O, P)); return; }
    if (O.st === 'tell' && !O.glinted && O.move.interrupt && O.t < O.tellDur * 0.4 && Math.random() < cfg.interrupt * dt * 6) { press(Math.random() < 0.5 ? 'hookL' : 'hookR'); return; }
    if ((O.st === 'idle' || O.st === 'gloat') && Math.random() < cfg.poke * dt) press(attackFor(O, P));
  };
};
// fast headless simulation of one fight (no rendering). Returns result summary.
window.__sim = function (idx, cfg, maxSec) {
  const CP = __CP; maxSec = maxSec || 600; const S0 = CP.S, mute = S0.mute; S0.mute = true;
  CP.newFight(CP.ROSTER[idx]); CP.go(CP.Fight); const bot = __mkBot(cfg); window.__BOT = bot; let t = 0; const dt = 1 / 60;
  try {
    while (t < maxSec) {
      CP.fightUpdate(dt); t += dt;
      if (CP.scene === 'corner') { CP.Corner.done(); }
      const F = CP.F; if (F.phase === 'over') break;
    }
  } finally { window.__BOT = null; S0.mute = mute; }
  const F = CP.F; return { opp: CP.ROSTER[idx].id, win: F.result ? F.result.winner === 'p' : null, how: F.result && F.result.how, rounds: F.round, pKD: F.P.kdTot, oKD: F.O.kdTot, t: Math.round(t), stats: F.stats, roundTimes: F.roundTimes, phase: F.phase, ost: F.O.st, scene: CP.scene, oHp: Math.round(F.O.hp), pHp: Math.round(F.P.hp) };
};
