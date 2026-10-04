/* ===================== FIGHT ENGINE ===================== */
const PM = {
  jabL: { kind: 'jab', side: 'L', tgt: 'head', dmg: 3, su: 0.09, rec: 0.17, snd: 'jab', name: 'L JAB' },
  jabR: { kind: 'jab', side: 'R', tgt: 'head', dmg: 3, su: 0.09, rec: 0.17, snd: 'jab', name: 'R JAB' },
  hookL: { kind: 'hook', side: 'L', tgt: 'head', dmg: 6, su: 0.17, rec: 0.27, snd: 'hook', name: 'L HOOK' },
  hookR: { kind: 'hook', side: 'R', tgt: 'head', dmg: 6, su: 0.17, rec: 0.27, snd: 'hook', name: 'R HOOK' },
  bodyL: { kind: 'body', side: 'L', tgt: 'body', dmg: 5, su: 0.14, rec: 0.23, snd: 'body', name: 'L BODY' },
  bodyR: { kind: 'body', side: 'R', tgt: 'body', dmg: 5, su: 0.14, rec: 0.23, snd: 'body', name: 'R BODY' },
  upper: { kind: 'upper', side: 'R', tgt: 'head', dmg: 9, su: 0.24, rec: 0.35, snd: 'upper', name: 'UPPERCUT' },
  legKick: { kind: 'leg', side: 'R', tgt: 'leg', dmg: 6, su: 0.2, rec: 0.3, cost: 1, snd: 'leg', name: 'LEG KICK' },
  headKick: { kind: 'head', side: 'R', tgt: 'head', dmg: 13, su: 0.32, rec: 0.42, cost: 2, snd: 'head', name: 'HEAD KICK' },
  roundhouse: { kind: 'round', side: 'L', tgt: 'head', dmg: 17, su: 0.46, rec: 0.5, cost: 3, snd: 'round', name: 'ROUNDHOUSE' },
  star: { kind: 'star', side: 'R', tgt: 'head', dmg: 14, su: 0.42, rec: 0.45, snd: 'star', name: 'STAR PUNCH' },
};
const HEARTS_MAX = 20, ROUND_SECS = 90, ROUNDS = 3;
let F = null;
function newDmg() { return { eyeL: 0, eyeR: 0, cheekL: 0, cheekR: 0, lip: 0, nose: 0, cut: 0, teeth: 0, lump: 0, puff: 0, bruises: [], leg: 0, maskOff: false, pts: { L: 0, R: 0, nose: 0, lip: 0, cut: 0, lump: 0, head: 0, leg: 0 } }; }
let P_DMG = 0.55, O_DMG = 0.7;
function newFight(opp) {
  clearFx();
  const O = { C: opp.C, st: 'intro', t: 0, guard: 'mid', hp: opp.st.hp, maxHp: opp.st.hp, move: null, combo: [], nextAct: 1.2, hitStreak: 0, pose: basePose(), dmg: newDmg(), legDmg: 0, kdTot: 0, glint: 0, glintAt: 'R', tauntCD: 6, sweat: 0, guardT: 2, headScr: { x: GW / 2, y: 90 }, bodyScr: { x: GW / 2, y: 140 }, mouthScr: { x: GW / 2, y: 100 }, count: 0, downT: 0, stT: 0, updHits: 0, patternBlock: null };
  const P = { st: 'idle', t: 0, hp: 100, hearts: HEARTS_MAX, stars: 0, gasT: 0, dx: 0, dy: 0, atk: null, hitDone: false, hold: false, blockHeld: false, buf: null, kdTot: 0, dizzy: 0, dmgTaken: 0 };
  F = { opp, O, P, round: 1, clock: ROUND_SECS, phase: 'pre', phaseT: 0, kd: { p: 0, o: 0 }, rs: [], stats: { thrown: 0, landed: 0, counters: 0, kicks: 0, dodges: 0, gassed: 0, blocked: 0, hitsTaken: 0, stars: 0 }, cx: GW / 2, oHead: { x: GW / 2, y: 90 }, oBody: { x: GW / 2, y: 140 }, shake: 0, hitStop: 0, flash: 0, flashC: '#fff', banner: null, blind: 0, lastKinds: [], ts: 1, result: null, mash: 0, mashNeed: 10, count: 0, countT: 0, crowd: 0, sparks: [], hintT: 0, hint: '', paused: false, elapsed: 0, roundTimes: [] };
  F.rs.push({ p: 0, o: 0, pk: 0, ok: 0 });
  return F;
}
function banner(s, life = 1.2, c = '#ffd23f', sc = 3) { F.banner = { s, t: 0, life, c, sc }; }
function startRound() {
  const P = F.P, O = F.O;
  F.phase = 'pre'; F.phaseT = 0; F.handed = false; F.clock = ROUND_SECS; F.kd.p = 0; F.kd.o = 0; P.hearts = HEARTS_MAX; P.gasT = 0; P.st = 'idle'; P.t = 0; P.atk = null; P.dx = 0; P.dy = 0;
  O.st = 'idle'; O.t = 0; O.nextAct = 1.4; O.combo = []; O.glint = 0; O.hitStreak = 0;
  if (F.rs.length < F.round) F.rs.push({ p: 0, o: 0, pk: 0, ok: 0 });
  banner('ROUND ' + F.round, 1.3, '#ffffff', 3); Crowd.set(0.06);
  Music.play(F.round === 3 ? 'fight3' : 'fight');
}
/* ---------------- input ---------------- */
function fightPress(a) {
  if (!F || F.paused) return; const P = F.P;
  if (F.phase === 'pDown') { if (P.st === 'down' && F.countT >= 0) { F.mash += 1; SFX.mash();  } return; }
  if (F.phase !== 'fight') return;
  if (a === 'block') { P.blockHeld = true; if (P.st === 'idle') { P.st = 'block'; P.t = 0; } return; }
  if (a === 'dodgeL' || a === 'dodgeR' || a === 'duck') P.hold = a;
  if (P.st === 'idle' || P.st === 'block') doAction(a); else P.buf = { a, t: F.elapsed };
}
function fightRelease(a) {
  if (!F) return; const P = F.P;
  if (a === 'block') { P.blockHeld = false; if (P.st === 'block') { P.st = 'idle'; P.t = 0; } }
  if (P.hold === a) P.hold = false;
}
function doAction(a) {
  const P = F.P;
  if (a === 'dodgeL' || a === 'dodgeR' || a === 'duck') { P.st = a === 'duck' ? 'duck' : 'dodge'; P.dir = a === 'dodgeL' ? -1 : a === 'dodgeR' ? 1 : 0; P.t = 0; P.evaded = false; SFX.dodge(); return true; }
  if (a === 'block') { P.st = 'block'; P.t = 0; return true; }
  const mv = PM[a]; if (!mv) return false;
  if (P.gasT > 0) { pop('TIRED!', F.cx + P.dx, 150, '#ff7ac8'); return false; }
  if (a === 'star') { if (P.stars <= 0) { pop('NO STARS', F.cx, 150, '#aaa'); return false; } P.starUsed = P.stars; P.stars = 0; SFX.starCharge(); F.stats.stars++; }
  if (mv.cost) { P.hearts -= mv.cost; F.stats.kicks++; }
  P.st = 'atk'; P.atk = mv; P.t = 0; P.hitDone = false; P.whooshed = false; F.stats.thrown++;
  if (mv.cost) SFX.kiai(mv.kind !== 'leg');
  return true;
}
/* ---------------- opponent AI ---------------- */
function oSt() { return F.opp.st; }
function pickWeighted(obj) { let tot = 0; for (const k in obj) tot += obj[k]; let r = Math.random() * tot; for (const k in obj) { r -= obj[k]; if (r <= 0) return k; } return Object.keys(obj)[0]; }
function oDecide() {
  const O = F.O, st = oSt(), opp = F.opp;
  if (O.tauntCD <= 0 && chance(st.taunt) && F.P.gasT <= 0) { O.st = 'taunt'; O.t = 0; O.tauntCD = rand(8, 14); const ln = pick(opp.lines.taunt); say(ln, 2.2); return; }
  if (opp.combos.length && chance(st.combo * (F.round === 3 ? 1.2 : 1))) { const c = pick(opp.combos); O.combo = c.slice(1); startTell(c[0], { feint: false }); return; }
  let key = pickWeighted(opp.ai);
  if (key === 'update' && O.hp > O.maxHp * 0.8) key = 'jab';
  startTell(key, { feint: chance(st.feint) });
}
function startTell(key, opts = {}) {
  const O = F.O, st = oSt(), mv = F.opp.moves[key]; if (!mv) return;
  O.move = mv; O.moveKey = key; O.t = 0; O.feint = !!opts.feint; O.tellId = (O.tellId || 0) + 1; O.glint = 0; O.glinted = false; O.flashed = false;
  if (mv.kind === 'update') { O.st = 'update'; O.stT = 0; O.updHits = 0; say('INSTALLING FIRMWARE UPDATE 3.0.1... DO NOT TURN OFF YOUR FIGHTER.', 2.5); SFX.zap(); return; }
  O.st = 'tell';
  const legSlow = 1 + Math.min(0.3, O.legDmg * 0.035), r3 = F.round === 3 ? 0.94 : 1;
  let d = mv.tell * st.tf * legSlow * r3 * (opts.follow ? 0.6 : 1) * (opts.punish ? 0.55 : 1);
  O.tellDur = Math.max(st.gl + 0.16, d); O.glintLead = st.gl;
  O.feintAt = O.tellDur * rand(0.45, 0.62);
  O.glintAt = mv.kind === 'lowkick' || mv.kind === 'highkick' ? 'K' : mv.kind === 'laser' ? 'E' : mv.side;
  SFX.tell(mv.kind === 'rocket' ? 'haymaker' : mv.kind === 'laser' ? 'highkick' : mv.kind); if (chance(0.5) || mv.kind === 'haymaker') SFX.grunt('opp', F.opp.voice, 0.8);
  if (S.hints && !O.feint) { F.hint = (DEF[mv.kind] || DEF.jab).hint; F.hintT = Math.min(1.4, O.tellDur + 0.1); F.hintName = mv.name; }
  else if (S.hints) { F.hint = (DEF[mv.kind] || DEF.jab).hint; F.hintT = O.feintAt; F.hintName = mv.name; }
  if (mv.kind === 'highkick' && F.opp.id === 'reggie' && chance(0.5)) say('The Royal Boot!', 0.9);
  if (F.opp.id === 'hurtz' && key === 'root') say('Open WIDE!', 0.9);
  if (F.opp.id === 'gary' && (mv.kind === 'rocket' || mv.kind === 'laser')) say(mv.kind === 'rocket' ? 'ROCKET FIST ENGAGED.' : 'LASER EYES: ON.', 0.9);
}
function oImpact() {
  const O = F.O, P = F.P, mv = O.move, d = DEF[mv.kind] || DEF.jab, st = oSt();
  const ev = (P.st === 'dodge' || P.st === 'duck') && P.invuln;
  let res = 'hit', mult = 1;
  if (ev && P.st === 'dodge' && d.dodge) res = 'miss';
  else if (ev && P.st === 'duck' && d.duck) res = 'miss';
  else if (ev && P.st === 'duck' && !d.duck) { mult = 1.25; pop(mv.kind === 'upper' ? 'DUCKED INTO IT!' : "CAN'T DUCK THAT!", F.cx, 132, '#ff6b6b'); }
  else if (ev && P.st === 'dodge' && !d.dodge) { mult = 1.15; pop('DUCK THAT ONE!', F.cx, 132, '#ff6b6b'); }
  else if (P.st === 'block' && d.block < 1) res = 'block';
  else if (P.st === 'block' && d.block >= 1) { mult = 1.1; pop('UNBLOCKABLE!', F.cx, 132, '#ff6b6b'); }
  if (P.st === 'atk' && res === 'hit') mult *= 1.2;
  O.lastRes = res;
  const snd = { jab: 'jab', hook: 'hook', upper: 'upper', body: 'body', lowkick: 'leg', highkick: 'head', haymaker: 'round', rocket: 'round', laser: 'hook' }[mv.kind] || 'hook';
  if (res === 'miss') {
    SFX.miss(); F.stats.dodges++; P.evaded = true; if (P.gasT > 0) P.gasT = Math.max(0.05, P.gasT - 0.7); pop(pick(['MISS!', 'WHIFF!', 'NOPE!']), F.cx + P.dx, 150, '#7ef0ff');
    if (P.hearts < HEARTS_MAX && chance(0.5)) P.hearts++;
    if (mv.kind === 'haymaker' || mv.kind === 'rocket') SFX.crowd('ooh');
  } else if (res === 'block') {
    const dmg = mv.dmg * st.dmg * d.block * O_DMG; P.hp -= dmg; P.hearts -= 1; F.rs[F.round - 1].o += dmg * 0.5; SFX.block(1); F.shake = Math.max(F.shake, 2); pop('BLOCKED', F.cx, 150, '#ccc'); F.stats.blocked++;
  } else {
    const dmg = mv.dmg * st.dmg * mult * O_DMG; P.hp -= dmg; P.dmgTaken += dmg; P.hearts -= 3; F.rs[F.round - 1].o += dmg; F.stats.hitsTaken++;
    if (P.stars > 0) { P.stars--; pop('-★', F.cx - 40, 150, '#ff6b6b'); }
    P.st = 'hurt'; P.t = 0; P.atk = null; P.hurtDur = 0.42; P.hurtDir = mv.side === 'L' ? 1 : -1;
    SFX.punch(snd, 0.95); SFX.careyHurt(); if (mv.kind === 'laser') SFX.zap();
    F.shake = Math.max(F.shake, mv.dmg > 15 ? 7 : 4); F.hitStop = Math.max(F.hitStop, mv.dmg > 15 ? 0.09 : 0.05); F.flash = 0.18; F.flashC = '#ff2040';
    const hp = P.headPos || { x: F.cx, y: 168 }; spray(hp.x, hp.y + 4, 6, 'spit', 0, 0.8); for (let i = 0; i < 5; i++) part({ type: 'star', x: hp.x + rand(-10, 10), y: hp.y + rand(-10, 4), vx: rand(-80, 80), vy: rand(-120, -40), life: 0.5, g: 200, s: 2, c: '#ffd23f' });
    if (mv.steal && chance(0.6)) { tooth(hp.x, hp.y + 6, rand(-1, 1)); pop('TOOTH STOLEN!', F.cx, 140, '#fff'); say('One for the collection! Hee hee!', 1.4); }
    if (chance(0.3)) say(pick(F.opp.lines.hit), 1.4);
    if (chance(0.4)) SFX.crowd(chance(0.5) ? 'ooh' : 'boo');
    if (P.hp <= 0) { playerDown(); return; }
  }
  if (P.hearts <= 0 && P.gasT <= 0) gas();
}
function gas() { const P = F.P; P.hearts = 0; P.gasT = 2.4; F.stats.gassed++; SFX.gassed(); pop('GASSED!', F.cx, 140, '#ff7ac8', 2, 1.2); }
/* ---------------- player hits ---------------- */
function pImpact(a) {
  const O = F.O, P = F.P, st = oSt(), opp = F.opp;
  let res = 'land', mult = 1, counter = false, star = false, label = '';
  const isKick = a.kind === 'leg' || a.kind === 'head' || a.kind === 'round';
  if (O.st === 'down' || O.st === 'getup' || O.st === 'ko' || O.st === 'win') return;
  // adaptive robot: repeated attack kind gets read
  if (st.adapt) { F.lastKinds.push(a.kind); if (F.lastKinds.length > 3) F.lastKinds.shift(); if (F.lastKinds.length === 3 && F.lastKinds.every(k => k === a.kind) && a.kind !== 'star' && (O.st === 'idle' || O.st === 'hurt' || O.st === 'gloat')) { res = 'block'; label = 'PATTERN DETECTED'; say(pick(opp.lines.pattern), 1.2); F.lastKinds = []; } }
  if (res === 'land') {
    if (a.kind === 'star') { mult = 1; }
    else if (O.st === 'tell') {
      if (O.feint) { counter = true; mult = 1.5; label = 'COUNTER!'; }
      else if (st.armor || !O.move.interrupt) { mult = 0.5; label = 'ARMORED!'; }
      else if (a.tgt === 'leg') { mult = 1; }
      else { counter = true; mult = 1.5; label = 'INTERRUPT!'; }
    }
    else if (O.st === 'swing') { res = 'block'; label = 'CLASH'; }
    else if (O.st === 'recover') { if (!O.countered) { O.countered = true; counter = true; mult = 1.6; label = 'COUNTER!'; } else mult = 0.9; }
    else if (O.st === 'taunt') { counter = true; mult = 1.5; label = 'SHUT UP!'; }
    else if (O.st === 'stun') { mult = 1.25; }
    else if (O.st === 'update') { mult = 1.2; O.updHits++; if (O.updHits >= 3) { O.st = 'stun'; O.t = 0; O.stunDur = 1.3; say('UPDATE FAILED. PLEASE TRY AGAIN NEVER.', 1.5); pop('UPDATE FAILED!', F.cx, 70, '#7ef0ff', 1, 1.2); counter = true; } }
    else if (O.st === 'hurt' && O.hitStreak >= st.comboLimit && !isKick) { res = 'block'; }
    else if (O.st === 'block') { res = isKick && a.kind === 'round' ? 'land' : 'block'; if (res === 'land') { mult = 0.7; label = 'GUARD BREAK!'; } }
    else if (O.st === 'idle' || O.st === 'gloat' || O.st === 'hurt') {
      const gd = O.st === 'hurt' ? 'open' : O.guard;
      if (st.evade && O.st === 'idle' && !isKick && chance(st.evade)) { res = 'evade'; }
      else if (a.kind === 'leg') { if (st.checkKick && O.st === 'idle' && chance(st.checkKick)) res = 'check'; }
      else if (a.kind === 'round') { if (gd !== 'open') { mult = 0.7; label = 'GUARD BREAK!'; O.forceStun = 0.8; } }
      else if (a.tgt === 'head') { if (gd === 'high' || (gd === 'mid' && a.kind === 'jab')) res = 'block'; }
      else if (a.tgt === 'body') { if (gd === 'low') res = 'block'; }
      // alert opponents also just read a lone poke from neutral
      if (res === 'land' && O.st !== 'hurt' && a.kind !== 'round' && chance(st.readP || 0)) res = 'block';
      if (res === 'land' && O.st !== 'hurt') { O.guard = a.tgt === 'body' ? 'low' : a.tgt === 'leg' ? O.guard : 'high'; O.guardT = rand(0.8, 1.6); }
    }
  }
  if (res === 'evade') { SFX.miss(); pop('DODGED!', O.headScr.x, O.headScr.y - 30, '#ccc'); O.st = 'idle'; O.pose.bx = rand(-1, 1) < 0 ? -14 : 14; P.hearts -= 1; if (P.hearts <= 0) gas(); return; }
  if (res === 'check') { SFX.block(1.2); SFX.punch('leg', 0.4); pop('CHECKED!', F.cx + 20, 170, '#ff6b6b'); P.hp -= 2; P.hearts -= 1; if (P.hearts <= 0) gas(); return; }
  if (res === 'block') {
    SFX.block(isKick ? 1.2 : 0.9); P.hearts -= 1; F.stats.blocked++; pop(label || 'BLOCKED', O.headScr.x, O.headScr.y - 28, '#ccc');
    if (O.st !== 'tell' && O.st !== 'swing') { O.st = 'block'; O.t = 0; O.hitStreak = 0; O.blocks = (O.blocks || 0) + 1; if (chance(st.punish + 0.12 + 0.12 * O.blocks)) { O.punishNext = true; O.blocks = 0; } }
    if (P.hearts <= 0) gas(); return;
  }
  // ---- LANDED ----
  let dmg = a.dmg * mult * P_DMG;
  if (a.kind === 'star') { dmg = (12 + 9 * (P.starUsed || 1)) * P_DMG; star = true; label = P.starUsed >= 3 ? 'SUPER STAR PUNCH!!' : 'STAR PUNCH!'; }
  if (a.kind === 'leg' && st.legWeak) { dmg *= st.legWeak; if (chance(0.4)) label = 'SKIPPED LEG DAY!'; }
  if (a.kind === 'leg') O.legDmg++;
  O.hp -= dmg; F.rs[F.round - 1].p += dmg; F.stats.landed++; if (counter) F.stats.counters++;
  const big = star || counter || a.kind === 'head' || a.kind === 'round' || (O.hp <= 0);
  oppDamage(a, dmg, big);
  // stars for counters
  if (counter && P.stars < 3 && !O.starGiven) { P.stars++; O.starGiven = true; SFX.star(); pop('+★', F.cx - 60, 130, '#ffd23f', 2); }
  // reaction state
  const sd = a.side === 'L' ? -1 : 1;
  O.hurtKind = a.tgt; O.hurtDir = sd; O.hitStreak++;
  if (O.st === 'update' && O.updHits < 3) { /* stays updating */ }
  else if (star || label === 'INTERRUPT!' || O.forceStun || a.kind === 'round') { O.st = 'stun'; O.t = 0; O.stunDur = star ? 1.4 : O.forceStun || (a.kind === 'round' ? 0.9 : 1.0); O.forceStun = 0; O.combo = []; }
  else if (label === 'ARMORED!') { /* keeps winding up */ }
  else { O.st = 'hurt'; O.t = 0; O.hurtDur = isKick ? 0.42 : 0.3; O.combo = []; }
  // FX
  const hp = a.tgt === 'body' ? O.bodyScr : a.tgt === 'leg' ? { x: O.bodyScr.x + 16, y: FLOOR_Y - 30 } : O.headScr;
  const power = star ? 1.4 : big ? 1.15 : a.kind === 'jab' ? 0.75 : 1;
  SFX.punch(a.snd === 'star' ? 'star' : a.snd, power, counter);
  if (a.tgt === 'body') SFX.oof(F.opp.voice); else if (chance(0.6)) SFX.grunt('opp', F.opp.voice * 1.1);
  F.sparks.push({ x: hp.x + rand(-3, 3), y: hp.y + rand(-3, 3), t: 0, big: big || isKick });
  F.shake = Math.max(F.shake, star ? 12 : big ? 7 : isKick ? 5 : 2.5);
  F.hitStop = Math.max(F.hitStop, star ? 0.22 : big ? 0.11 : isKick ? 0.07 : a.kind === 'jab' ? 0.025 : 0.045);
  if (big) { F.flash = star ? 0.35 : 0.14; F.flashC = '#ffffff'; }
  const m = O.mouthScr, robot = !!O.C.robot;
  if (big && a.tgt === 'head') { spray(m.x, m.y, star ? 26 : 12, 'blood', sd, star ? 1.4 : 1, robot); spray(m.x, m.y, star ? 30 : 16, 'spit', sd, 1.2, robot); if (robot) spray(m.x, m.y, 14, 'spark', sd); SFX.crowd(star ? 'roar' : 'ooh'); }
  else if (a.tgt === 'head') { spray(m.x, m.y, 4, 'spit', sd, 0.7, robot); if (O.dmg.nose >= 2 && chance(0.4)) spray(m.x, m.y - 6, 3, 'blood', sd, 0.6, robot); }
  else if (a.tgt === 'body') { spray(m.x, m.y, 5, 'spit', 0, 0.8, robot); if (big) SFX.crowd('ooh'); }
  if (isKick || big) spray(hp.x, hp.y, 6, 'spark', sd);
  if (label) pop(label, hp.x, hp.y - 26, star ? '#ffd23f' : counter ? '#7ef0ff' : '#fff', label.length > 12 ? 1 : 2, 1.0);
  if (big && chance(0.35) && O.hp > 0) say(pick(F.opp.lines.hurt), 1.3);
  O.sweat = Math.min(3, O.sweat + 0.05);
  if (O.hp <= 0) oppDown(star || big);
}
function oppDamage(a, dmg, big) {
  const O = F.O, D = O.dmg, Pt = D.pts, mh = O.maxHp, sd = a.side === 'L' ? 'L' : 'R';
  if (a.tgt === 'head') {
    Pt[sd] += dmg * (a.kind === 'star' ? 0.7 : 1); Pt.head += dmg; if (a.kind === 'star') { Pt.L += dmg * 0.3; Pt.R += dmg * 0.3; }
    D['eye' + sd] = Math.min(4, Math.floor(Pt[sd] / (mh * 0.14))); D['cheek' + sd] = Math.min(4, Math.floor(Pt[sd] / (mh * 0.1)));
    const o2 = sd === 'L' ? 'R' : 'L'; D['eye' + o2] = Math.min(4, Math.floor(Pt[o2] / (mh * 0.14)));
    if (a.kind === 'jab' || a.kind === 'star' || a.kind === 'upper') Pt.nose += dmg; D.nose = Math.min(3, Math.floor(Pt.nose / (mh * 0.11)));
    if (a.kind === 'upper' || a.kind === 'hook' || a.kind === 'star') Pt.lip += dmg; D.lip = Math.min(3, Math.floor(Pt.lip / (mh * 0.1)));
    if (big) Pt.cut += dmg; D.cut = Math.min(3, Math.floor(Pt.cut / (mh * 0.14)));
    if (a.kind === 'hook' || a.kind === 'head' || a.kind === 'round') Pt.lump += dmg; D.lump = Math.min(3, Math.floor(Pt.lump / (mh * 0.14)));
    D.puff = Math.min(3, Pt.head / (mh * 0.55));
    if (Pt.head > mh * 0.3) { if (!D.maskOff && F.opp.id === 'hurtz') { pop('MASK OFF!', O.headScr.x, O.headScr.y - 30, '#9ad4f0'); } D.maskOff = true; }
    if ((dmg >= 9 || a.kind === 'star') && D.teeth < 6 && chance(a.kind === 'star' ? 0.9 : 0.45)) {
      const n = F.opp.st.dentures && D.teeth === 0 ? 6 : 1; D.teeth = Math.min(6, D.teeth + n);
      for (let i = 0; i < Math.min(n, 4); i++) tooth(O.mouthScr.x, O.mouthScr.y, a.side === 'L' ? -1 : 1);
      if (n > 1) pop('DENTURES!', O.mouthScr.x, O.mouthScr.y - 20, '#fff');
    }
  } else if (a.tgt === 'body') {
    const near = D.bruises.find(b => Math.abs(b.x - (sd === 'L' ? -10 : 10)) < 12 && b.lv < 4);
    if (near && chance(0.6)) near.lv = Math.min(4, near.lv + 1), near.r = Math.min(9, near.r + 1);
    else if (D.bruises.length < 9) D.bruises.push({ x: (sd === 'L' ? -10 : 10) + rand(-6, 6), y: rand(-96, -72), r: 3 + dmg * 0.25, lv: 1 });
  } else { Pt.leg += dmg; D.leg = Math.min(4, Math.floor(Pt.leg / (mh * 0.08))); }
}
/* ---------------- knockdowns ---------------- */
function oppDown(big) {
  const O = F.O, st = oSt(); O.hp = 0; O.st = 'down'; O.t = 0; O.downT = 0; O.kdTot++; F.kd.o++; F.rs[F.round - 1].pk++; O.combo = []; O.glint = 0;
  F.phase = 'oDown'; F.phaseT = 0; F.count = 0; F.countT = -1.1; F.P.st = 'idle'; F.P.atk = null;
  SFX.thud(); SFX.crowd('roar'); F.hitStop = 0.3; F.flash = 0.4; F.flashC = '#fff'; F.shake = 12;
  banner('DOWN!', 1.2, '#ff3b5c', 4); Crowd.set(0.16);
  const n = O.kdTot, idx = F.opp.idx;
  let up = n === 1 ? irand(3, 5) : n === 2 ? irand(5, 8) : irand(7, 9);
  if (n >= 3 && chance(0.4 + 0.15 * (n - 3) - idx * 0.02)) up = 11;
  if (big && F.P.starUsed >= 3) up += 1;
  if (F.kd.o >= 3) up = 99;
  O.getupAt = up; O.count = 0;
  setTimeout(() => { if (F && F.phase === 'oDown' && F.O.st === 'down') say(pick(F.opp.lines.down), 1.8); }, 900);
}
function playerDown() {
  const P = F.P; P.hp = 0; P.st = 'down'; P.t = 0; P.kdTot++; F.kd.p++; F.rs[F.round - 1].ok++; P.atk = null;
  F.phase = 'pDown'; F.phaseT = 0; F.count = 0; F.countT = -1.0; F.mash = 0; F.mashNeed = Math.round(9 + 5 * (P.kdTot - 1) + F.opp.idx * 0.8);
  F.O.st = 'gloat'; F.O.t = 0; F.O.combo = [];
  SFX.thud(); SFX.crowd('gasp'); F.hitStop = 0.25; F.shake = 10; F.flash = 0.3; F.flashC = '#ff2040';
  banner('CAREY IS DOWN!', 1.3, '#ff3b5c', 2); if (F.kd.p >= 3) F.mashNeed = 999;
}
function endFight(winner, how) {
  F.phase = 'over'; F.phaseT = 0; F.result = { winner, how };
  SFX.bell(winner === 'p' ? 4 : 3);
  if (winner === 'p') { SFX.crowd('roar'); banner(how === 'DEC' ? 'DECISION!' : how, 2.5, '#ffd23f', 4); F.P.st = 'win'; F.O.st = how === 'DEC' ? 'idle' : 'ko'; Crowd.set(0.2); }
  else { SFX.crowd('boo'); banner(how === 'DEC' ? 'DECISION...' : how === 'TKO' ? 'TKO...' : 'KO...', 2.5, '#ff3b5c', 4); F.O.st = 'win'; Music.stop(); }
}
function judge() {
  const names = ['JUDGE DORIS (WOKE UP FOR THIS)', 'JUDGE PETE (HAS MONEY ON IT)', 'JUDGE-O-TRON 9000'];
  const cards = names.map((n, j) => {
    let p = 0, o = 0; const bias = [0.04, -0.03, 0][j];
    F.rs.forEach(r => { const m = (r.p - r.o) / Math.max(1, r.p + r.o) + bias + rand(-0.04, 0.04); let a = 10, b = 10; if (m > 0.05) b = 9; else if (m < -0.05) a = 9; a -= r.ok; b -= r.pk; p += a; o += b; });
    return { n, p, o };
  });
  const pw = cards.filter(c => c.p > c.o).length, ow = cards.filter(c => c.o > c.p).length;
  return { cards, winner: pw > ow ? 'p' : 'o', draw: pw === ow };
}
/* ---------------- per-frame update ---------------- */
function fightUpdate(dt0) {
  if (!F || F.paused) return; const dt = dt0 * (F.ts || 1); const P = F.P, O = F.O, st = oSt();
  F.cx = GW / 2;
  if (F.banner) { F.banner.t += dt; if (F.banner.t > F.banner.life) F.banner = null; }
  F.flash = Math.max(0, F.flash - dt * 2.2); F.blind = Math.max(0, F.blind - dt * 1.4); F.shake = Math.max(0, F.shake - dt * 30);
  if (F.hitStop > 0) { F.hitStop -= dt; if (F.phase === 'fight') { F.clock -= dt; F.rt = (F.rt || 0) + dt; } return; }
  F.elapsed += dt; updParts(dt); for (let i = F.sparks.length - 1; i >= 0; i--) { F.sparks[i].t += dt; if (F.sparks[i].t > 0.16) F.sparks.splice(i, 1); }
  F.phaseT += dt; F.hintT -= dt;
  if (window.__BOT) window.__BOT(dt);
  // lateral / vertical offsets for Carey
  const tdx = P.st === 'dodge' ? P.dir * (P.invuln || P.t < 0.05 ? 56 : 26) : (F.phase === 'oDown' ? -50 : 0) + (P.st === 'hurt' ? P.hurtDir * 6 * Math.max(0, 1 - P.t * 4) : 0);
  const tdy = P.st === 'duck' ? (P.invuln || P.t < 0.05 ? 38 : 16) : P.st === 'down' ? 90 - 34 * clamp(F.mash / F.mashNeed, 0, 1) : 0;
  P.dx = approach(P.dx, tdx, dt * 28); P.dy = approach(P.dy, tdy, dt * (P.st === 'down' ? 6 : 28));
  if (P.gasT > 0) { P.gasT -= dt; if (P.gasT <= 0) { P.hearts = 8; pop('2ND WIND', F.cx, 140, '#b9ff7a'); } }
  if (F.phase === 'pre') {
    O.st = 'idle'; oPoseUpdate(dt);
    if (F.phaseT > 1.3 && !F.fightShown) { F.fightShown = true; banner('FIGHT!', 0.9, '#ff3b5c', 4); SFX.bell(1); SFX.crowd('cheer'); }
    if (F.phaseT > 1.7) { F.phase = 'fight'; F.phaseT = 0; F.fightShown = false; F.roundStartEl = F.elapsed; }
    return;
  }
  if (F.phase === 'fight') {
    F.clock -= dt; F.rt = (F.rt || 0) + dt;
    if (F.clock <= 0) { F.roundTimes.push(F.rt + F.clock); F.clock = 0; F.rt = 0; F.phase = 'roundEnd'; F.phaseT = 0; SFX.bell(3); banner('END OF ROUND ' + F.round, 2, '#fff', 2); Crowd.set(0.1); P.st = 'idle'; P.atk = null; O.st = 'idle'; O.glint = 0; return; }
    playerUpdate(dt); oppUpdate(dt);
    Crowd.set(0.05 + (1 - O.hp / O.maxHp) * 0.04 + (P.hp < 30 ? 0.03 : 0));
  } else if (F.phase === 'oDown') {
    O.downT += dt; oPoseUpdate(dt);
    if (O.st === 'down') { F.countT += dt; if (F.countT >= 1) { F.countT -= 1; F.count++; O.count = F.count; SFX.count(F.count); Voice.say(String(F.count), { rate: 1.1, pitch: 0.7 }); if (F.kd.o >= 3 && F.count >= 2) { endFight('p', 'TKO'); return; } if (F.count >= 10) { endFight('p', 'KO'); return; } if (F.count >= O.getupAt) { O.st = 'getup'; O.t = 0; O.hp = O.maxHp * [0.75, 0.6, 0.45, 0.35, 0.3][Math.min(4, O.kdTot - 1)]; SFX.crowd('ooh'); } } }
    else if (O.st === 'getup') { O.t += dt; if (O.t > 1.0) { O.st = 'idle'; O.t = 0; O.nextAct = 1.0; O.hitStreak = 0; F.phase = 'fight'; F.phaseT = 0; banner('FIGHT!', 0.8, '#ff3b5c', 3); SFX.bell(1); } }
  } else if (F.phase === 'pDown') {
    oPoseUpdate(dt); F.mash = Math.max(0, F.mash - dt * 1.6);
    F.countT += dt; if (F.countT >= 1) { F.countT -= 1; F.count++; SFX.count(F.count); Voice.say(String(F.count), { rate: 1.1, pitch: 0.7 }); if (F.kd.p >= 3 && F.count >= 3) { endFight('o', 'TKO'); return; } if (F.count >= 10) { endFight('o', 'KO'); return; } }
    if (F.mash >= F.mashNeed && F.countT >= 0) { P.st = 'idle'; P.t = 0; P.hp = 100 * [0.62, 0.45, 0.35, 0.3][Math.min(3, P.kdTot - 1)]; P.dizzy = 0; F.phase = 'fight'; F.phaseT = 0; O.st = 'idle'; O.nextAct = 1.2; banner('FIGHT!', 0.8, '#ff3b5c', 3); SFX.bell(1); SFX.crowd('cheer'); }
  } else if (F.phase === 'roundEnd') {
    oPoseUpdate(dt);
    if (F.phaseT > 2.4 && !F.handed) { F.handed = true; if (F.round < ROUNDS) go(Corner); else { const j = judge(); F.judge = j; endFight(j.winner === 'p' && !j.draw ? 'p' : 'o', 'DEC'); } }
  } else if (F.phase === 'over') {
    oPoseUpdate(dt); if (F.result.winner === 'p') { P.st = 'win'; if (Math.random() < 0.3) confetti(2); }
    if (F.phaseT > 3.2 && !F.handed2) { F.handed2 = true; afterFight(); }
  }
}
function playerUpdate(dt) {
  const P = F.P; P.t += dt;
  if (P.st === 'atk') {
    const a = P.atk;
    if (!P.whooshed && P.t >= a.su - 0.07) { P.whooshed = true; SFX.whoosh(a.snd === 'star' ? 'star' : a.snd); }
    if (!P.hitDone && P.t >= a.su) { P.hitDone = true; pImpact(a); }
    if (P.st === 'atk' && P.t >= a.su + a.rec) { P.st = P.blockHeld ? 'block' : 'idle'; P.t = 0; P.atk = null; }
  } else if (P.st === 'dodge' || P.st === 'duck') {
    const held = P.hold === (P.st === 'duck' ? 'duck' : P.dir < 0 ? 'dodgeL' : 'dodgeR');
    P.invuln = P.t >= 0.02 && (P.t < 0.42 || (held && P.t < 1.1));
    if (!P.invuln && P.t >= 0.42) { if (!P.recT) P.recT = P.t; if (P.t - P.recT > 0.13) { P.st = P.blockHeld ? 'block' : 'idle'; P.t = 0; P.recT = 0; P.invuln = false; } }
  } else if (P.st === 'hurt') { if (P.t >= P.hurtDur) { P.st = 'idle'; P.t = 0; } }
  else if (P.st === 'block') { if (!P.blockHeld) { P.st = 'idle'; P.t = 0; } }
  if ((P.st === 'idle' || P.st === 'block') && P.buf && F.elapsed - P.buf.t < 0.22) { const b = P.buf; P.buf = null; if (b.a !== 'block') doAction(b.a); }
  else if (P.buf && F.elapsed - P.buf.t >= 0.22) P.buf = null;
}
function oppUpdate(dt) {
  const O = F.O, st = oSt(), P = F.P; O.t += dt; O.tauntCD -= dt;
  O.glint = Math.max(0, O.glint - dt);
  switch (O.st) {
    case 'idle': case 'gloat': {
      if (O.st === 'gloat' && O.t > 0.6) { O.st = 'idle'; O.t = 0; }
      O.guardT -= dt; if (O.guardT <= 0) { O.guard = pickWeighted(st.guard); O.guardT = rand(1.2, 2.6) * (st.guardSwap || 1.4); }
      if (O.punishNext) { O.punishNext = false; const k = Object.keys(F.opp.moves).find(k => F.opp.moves[k].kind === 'jab') || Object.keys(F.opp.moves)[0]; startTell(k, { punish: true }); break; }
      O.nextAct -= dt * (P.gasT > 0 ? 1.4 : 1) * (F.round === 3 ? 1.12 : 1);
      if (O.nextAct <= 0) oDecide();
      break;
    }
    case 'tell': {
      if (O.feint && O.t >= O.feintAt) { O.st = 'idle'; O.t = 0; O.nextAct = rand(0.25, 0.45); O.feint = false; if (chance(0.5)) say(pick(['Ha! Flinched!', 'Gotcha!', 'Made you look!', 'Psych!']), 0.9); SFX.crowd('laugh'); O.guard = 'mid'; break; }
      const glintT = O.tellDur - O.glintLead;
      if (!O.feint && !O.glinted && O.t >= glintT) { O.glinted = true; O.glint = O.glintLead + 0.05; SFX.ting(); }
      if (O.move.flash && !O.flashed && O.t >= O.tellDur * 0.35) { O.flashed = true; F.blind = 0.75; SFX.flash(); }
      if (O.t >= O.tellDur) { O.st = 'swing'; O.t = 0; O.glint = 0; SFX.whoosh(O.move.kind === 'haymaker' || O.move.kind === 'rocket' ? 'big' : 'opp'); oImpact(); }
      break;
    }
    case 'swing': {
      if (O.t >= 0.2) {
        if (F.phase !== 'fight') break;
        if (O.lastRes === 'miss') { O.st = 'recover'; O.t = 0; O.starGiven = false; O.countered = false; O.recDur = st.rec * (O.move.kind === 'haymaker' || O.move.kind === 'rocket' || O.move.kind === 'highkick' ? 1.25 : 1) * (O.combo.length ? 0.45 : 1); }
        else if (O.combo.length) { const k = O.combo.shift(); startTell(k, { follow: true }); }
        else { O.st = O.lastRes === 'hit' ? 'gloat' : 'idle'; O.t = 0; O.nextAct = rand(st.idle[0], st.idle[1]) * (O.lastRes === 'hit' ? 1.2 : 1); }
      }
      break;
    }
    case 'recover': if (O.t >= O.recDur) { if (O.combo.length) { const k = O.combo.shift(); startTell(k, { follow: true }); } else { O.st = 'idle'; O.t = 0; O.nextAct = rand(st.idle[0], st.idle[1]) * 0.7; O.guard = 'mid'; } } break;
    case 'hurt': if (O.t >= O.hurtDur) { O.st = 'idle'; O.t = 0; O.nextAct = Math.min(O.nextAct, O.hitStreak >= st.comboLimit ? rand(0.2, 0.5) : rand(st.idle[0], st.idle[1]) * 0.6); if (O.hitStreak >= st.comboLimit) { O.guard = 'high'; O.st = 'block'; if (chance(st.punish + 0.1)) O.punishNext = true; } O.hitStreak = 0; } break;
    case 'block': if (O.t >= 0.32) { O.st = 'idle'; O.t = 0; O.hitStreak = 0; } break;
    case 'stun': if (O.t >= O.stunDur) { O.st = 'idle'; O.t = 0; O.hitStreak = 0; O.nextAct = rand(0.5, 1.0); O.guard = 'high'; } break;
    case 'taunt': if (O.t >= 1.9) { O.st = 'idle'; O.t = 0; O.nextAct = rand(0.3, 0.8); } break;
    case 'update': O.stT += dt; if (O.stT >= 3.2) { const h = O.maxHp * 0.15; O.hp = Math.min(O.maxHp, O.hp + h); pop('UPDATE COMPLETE +HP', F.cx, 60, '#2aff7a', 1, 1.4); say('UPDATE COMPLETE. NEW FEATURE: PUNCHING YOU.', 1.6); O.st = 'idle'; O.t = 0; O.nextAct = 0.6; } break;
  }
  if ((O.st === 'hurt' || O.st === 'block') && F.phase === 'fight') O.nextAct -= dt * 0.5;
  if (O.st === 'stun' || O.st === 'recover' || O.st === 'taunt') O.hitStreak = Math.min(O.hitStreak, 1);
  oPoseUpdate(dt);
}
/* ---------------- opponent pose targets ---------------- */
function oPoseUpdate(dt) {
  const O = F.O, p = basePose(), mv = O.move, sd = mv ? (mv.side === 'L' ? -1 : 1) : 1, k = O.st === 'tell' ? clamp(O.t / O.tellDur, 0, 1) : 0;
  let snap = 14;
  p.by = Math.sin(T * 3.2) * 1.5; p.lean = Math.sin(T * 1.7) * 2.5; p.look = clamp(F.P.dx / 40, -1, 1);
  const guard = (gd) => { if (gd === 'high') { p.gl = { x: -14, y: -128, r: 10.5 }; p.gr = { x: 14, y: -128, r: 10.5 }; } else if (gd === 'low') { p.gl = { x: -20, y: -78, r: 10 }; p.gr = { x: 20, y: -78, r: 10 }; } else if (gd === 'open') { p.gl = { x: -34, y: -92, r: 10 }; p.gr = { x: 34, y: -92, r: 10 }; } else { p.gl = { x: -20, y: -106, r: 10 }; p.gr = { x: 20, y: -106, r: 10 }; } };
  const G = () => sd < 0 ? p.gl : p.gr;
  switch (O.st) {
    case 'idle': case 'intro': guard(O.st === 'intro' ? 'open' : O.guard); p.face = O.st === 'intro' ? 'smug' : (O.hp < O.maxHp * 0.3 ? 'angry' : 'normal'); break;
    case 'gloat': guard('open'); p.face = 'gloat'; p.by -= Math.abs(Math.sin(T * 10)) * 2; break;
    case 'block': p.gl = { x: -8, y: -134, r: 11.5 }; p.gr = { x: 8, y: -134, r: 11.5 }; p.face = 'angry'; p.crouch = 3; break;
    case 'tell': {
      guard('mid'); p.face = 'tell'; p.jit = k > 0.45 ? 0.7 : 0; const g = G(), e = ease(Math.min(1, k * 2.2));
      switch (mv.kind) {
        case 'jab': g.x = sd * 30; g.y = lerp(-106, -116, e); p.lean = -sd * 4 * e; break;
        case 'hook': g.x = lerp(sd * 20, sd * 50, e); g.y = -120; p.lean = -sd * 8 * e; p.hx = -sd * 3 * e; break;
        case 'upper': g.x = sd * 24; g.y = lerp(-106, -62, e); p.crouch = 10 * e; p.lean = sd * 3 * e; break;
        case 'body': g.x = sd * 34; g.y = lerp(-100, -84, e); p.crouch = 12 * e; p.lean = -sd * 4 * e; break;
        case 'haymaker': case 'rocket': g.x = lerp(sd * 20, sd * 18, e); g.y = lerp(-106, -178, e); g.r = 10 + (mv.kind === 'rocket' ? 2 * e : 1); p.lean = -sd * 6 * e; p.crouch = -4 * e; if (mv.kind === 'rocket' && k > 0.5) spray(F.cx + sd * 18 * O.C.s, FLOOR_Y - 170 * O.C.s, 1, 'spark'); break;
        case 'lowkick': p.lean = sd * 6 * e; p.kick = { side: sd, x: sd * 20, y: -10 * e, r: 7 }; p.gl.y -= 6; p.gr.y -= 6; break;
        case 'highkick': p.lean = -sd * 12 * e; p.kick = { side: sd, x: lerp(sd * 20, sd * 30, e), y: lerp(-4, -56, e), r: 7 }; p.gl = { x: -40, y: -116, r: 10 }; p.gr = { x: 40, y: -116, r: 10 }; break;
        case 'laser': p.hy = -4 * e; p.face = 'angry'; p.crouch = -3 * e; guard('high'); if (k > 0.4) { O.laserCharge = k; } break;
      }
      if (mv.flash) p.prop = O.flashed ? 'flash' : 'taunt';
      break;
    }
    case 'swing': {
      snap = 40; const e = ease(Math.min(1, O.t / 0.09)), back = O.t > 0.12 ? ease((O.t - 0.12) / 0.08) : 0, ee = e * (1 - back * 0.4); guard('mid'); p.face = 'yell';
      const g = G();
      const tgtY = (172 - FLOOR_Y) / O.C.s, tgtX = 0;
      if (mv.kind === 'lowkick') { p.kick = { side: sd, x: lerp(sd * 20, sd * 6, ee), y: lerp(-10, 14, ee), r: lerp(7, 16, ee) }; p.front = 'K'; p.lean = -sd * 6; }
      else if (mv.kind === 'highkick') { p.kick = { side: sd, x: lerp(sd * 30, sd * 4, ee), y: lerp(-56, tgtY, ee), r: lerp(7, 18, ee) }; p.front = 'K'; p.lean = -sd * 14; p.gl = { x: -40, y: -116, r: 10 }; p.gr = { x: 40, y: -116, r: 10 }; }
      else if (mv.kind === 'laser') { p.face = 'angry'; }
      else {
        const startY = mv.kind === 'upper' ? -62 : mv.kind === 'haymaker' || mv.kind === 'rocket' ? -178 : mv.kind === 'body' ? -84 : -116;
        const startX = mv.kind === 'hook' ? sd * 50 : sd * 28, endY = mv.kind === 'body' ? tgtY + 14 : mv.kind === 'upper' ? tgtY - 6 : tgtY;
        const arcX = mv.kind === 'hook' ? Math.sin(ee * Math.PI) * sd * 20 : 0;
        g.x = lerp(startX, tgtX + sd * 4, ee) + arcX; g.y = lerp(startY, endY, ee); g.r = lerp(10, mv.kind === 'haymaker' || mv.kind === 'rocket' ? 26 : 22, ee); p.front = sd < 0 ? 'L' : 'R'; p.lean = sd * 8 * ee; p.crouch = mv.kind === 'body' ? 10 : 2;
        if (mv.kind === 'rocket' && Math.random() < 0.6) spray(F.cx + g.x * O.C.s, FLOOR_Y + g.y * O.C.s, 2, 'spark');
      }
      break;
    }
    case 'recover': { const e = 1 - ease(O.t / Math.max(0.1, O.recDur)); guard('open'); const g = G(); p.face = 'surprise'; p.lean = sd * 12 * e; p.crouch = 6 * e;
      if (mv.kind === 'lowkick' || mv.kind === 'highkick') { p.lean = -sd * 8 * e; p.by += 2; }
      else { g.x = lerp(g.x, sd * 6, e); g.y = lerp(g.y, -66, e); g.r = lerp(10, 15, e); p.front = sd < 0 ? 'L' : 'R'; }
      p.jit = 0.4; break; }
    case 'hurt': { guard('open'); p.gl.y += 10; p.gr.y += 10; const dir = O.hurtDir || 1, e = 1 - ease(O.t / O.hurtDur);
      if (O.hurtKind === 'body') { p.crouch = 12 * e; p.face = 'ouch'; p.gl = { x: -14, y: -80, r: 10 }; p.gr = { x: 14, y: -80, r: 10 }; }
      else if (O.hurtKind === 'leg') { p.crouch = 6 * e; p.by += 3 * e; p.lean = -dir * 8 * e; p.face = 'ouch'; p.fr.x = 14; }
      else { p.hx = dir * 9 * e; p.hy = -4 * e; p.lean = dir * 6 * e; p.face = 'hurt'; }
      snap = 30; break; }
    case 'stun': p.lean = Math.sin(T * 4) * 9; p.hx = Math.sin(T * 4 + 1) * 4; p.gl = { x: -32, y: -82, r: 10 }; p.gr = { x: 32, y: -84, r: 10 }; p.face = 'dizzy'; p.crouch = 4; break;
    case 'taunt': guard('open'); p.face = chance(0.02) ? 'laugh' : (O.t < 1 ? 'smug' : 'laugh'); p.gr = { x: 22, y: -130, r: 10 }; p.prop = F.opp.id === 'gary' ? 'buffer' : 'taunt'; if (F.opp.id === 'chad') { p.gl = { x: -40, y: -140, r: 11 }; p.gr = { x: 40, y: -140, r: 11 }; p.face = 'smug'; } break;
    case 'update': p.gl = { x: -26, y: -96, r: 10 }; p.gr = { x: 26, y: -96, r: 10 }; p.face = 'normal'; p.prop = 'update'; p.jit = 0.3; break;
    case 'getup': { const e = 1 - ease(O.t); p.kneel = e; p.face = 'dizzy'; guard('low'); break; }
    case 'win': p.gl = { x: -36, y: -160 + Math.sin(T * 8) * 4, r: 10 }; p.gr = { x: 36, y: -160 - Math.sin(T * 8) * 4, r: 10 }; p.face = 'laugh'; p.by -= Math.abs(Math.sin(T * 6)) * 4; break;
  }
  if (O.st === 'down' || O.st === 'ko') { O.pose = p; return; }
  lerpPose(O.pose, p, Math.min(1, dt * snap));
}
/* ---------------- drawing ---------------- */
function drawFight() {
  const P = F.P, O = F.O; const sx = S.shake ? rand(-1, 1) * F.shake : 0, sy = S.shake ? rand(-1, 1) * F.shake * 0.6 : 0;
  g.save(); g.translate(Math.round(sx), Math.round(sy));
  drawArena('ring', F.crowd);
  if (F.phase === 'oDown' || F.phase === 'over' && F.result && F.result.winner === 'p' && F.result.how !== 'DEC') drawRef(F.cx + 78, FLOOR_Y - 2, 0.8, O.st === 'down' || O.st === 'ko' ? 1 : 0, Math.min(5, F.count));
  drawOpp(O, F.cx, 0, F);
  F.oHead = O.headScr; F.oBody = O.bodyScr;
  if (O.laserCharge && O.st === 'tell' && O.move && O.move.kind === 'laser') { const hx = O.headScr.x, hy = O.headScr.y - 10 * O.C.s; E(hx - 9, hy, 3 + O.laserCharge * 3, 3, '#ff2a2a'); E(hx + 9, hy, 3 + O.laserCharge * 3, 3, '#ff2a2a'); }
  if (O.st === 'swing' && O.move && O.move.kind === 'laser' && O.t < 0.18) { const hx = O.headScr.x, hy = O.headScr.y - 10 * O.C.s; for (const sd of [-1, 1]) { LN(hx + sd * 9, hy, F.cx + sd * 6, 175, '#ff2a2a', 3); LN(hx + sd * 9, hy, F.cx + sd * 6, 175, '#ffd0d0', 1); } }
  drawCareyBack(F.cx, P, F);
  drawOpp(O, F.cx, 1, F);
  for (const s of F.sparks) { const k = s.t / 0.16, r = (s.big ? 16 : 10) * (0.6 + k * 0.6); burst(s.x, s.y, r, k < 0.5 ? '#ffffff' : '#ffd23f', 8, 0.45); if (s.big && k < 0.5) burst(s.x, s.y, r * 0.55, '#ff3b5c', 6, 0.5); }
  drawParts();
  g.restore();
  if (F.blind > 0) { g.globalAlpha = Math.min(1, F.blind * 1.6); R(0, 0, GW, GH, '#ffffff'); g.globalAlpha = 1; }
  if (F.flash > 0) { g.globalAlpha = Math.min(0.75, F.flash * 2); R(0, 0, GW, GH, F.flashC); g.globalAlpha = 1; }
  drawHUD();
  // hint (beginner-friendly defense cue)
  if (S.hints && F.hintT > 0 && F.phase === 'fight' && O.st === 'tell') { const y = 34; TX(F.hint, F.cx, y, O.glint > 0 ? '#ffd23f' : '#7ef0ff', 1, 0.5); }
  if (F.banner) { const b = F.banner, k = b.t / b.life, sc = b.sc, y = 92 - (k < 0.15 ? (1 - k / 0.15) * 30 : 0); if (k < 0.92 || Math.floor(b.t * 20) % 2) TX(b.s, F.cx, y, b.c, sc, 0.5); }
  if (F.phase === 'oDown' || F.phase === 'pDown') { if (F.count > 0) TX(String(F.count), F.cx, 48, '#fff', 6, 0.5); }
  if (F.phase === 'pDown') {
    const w = 140, x = F.cx - w / 2, y = 150; R(x - 2, y - 2, w + 4, 14, '#000'); R(x, y, w * clamp(F.mash / F.mashNeed, 0, 1), 10, '#ffd23f');
    TX(IS_TOUCH ? 'TAP FAST TO GET UP!' : 'MASH ANY KEY TO GET UP!', F.cx, y + 16, Math.floor(T * 6) % 2 ? '#fff' : '#ffd23f', 1, 0.5);
  }
  if (F.phase === 'over' && F.result) { const r = F.result; if (r.how === 'DEC' && F.judge && F.phaseT > 0.8) { F.judge.cards.forEach((c, i) => TX(c.p + '-' + c.o + ' ' + (c.p > c.o ? 'CAREY' : c.p < c.o ? F.opp.short : 'EVEN'), F.cx, 120 + i * 10, '#fff', 1, 0.5)); } }
}
function drawHUD() {
  const P = F.P, O = F.O, C = GW / 2, W = 316, x0 = C - W / 2, x1 = C + W / 2;
  R(0, 0, GW, 27, '#0b0412'); R(0, 27, GW, 1, '#ffd23f');
  TX('CAREY', x0 + 2, 2, '#ff7ac8', 1, 0); bar(x0 + 2, 11, 108, 6, P.hp / 100, '#3bff6a');
  TX('♥' + Math.max(0, P.hearts), x0 + 2, 19, P.gasT > 0 ? '#ff7ac8' : '#ff3b5c', 1, 0, null);
  for (let i = 0; i < 3; i++) star(x0 + 40 + i * 9, 22, 3.5, i < P.stars ? (Math.floor(T * 8) % 2 && P.stars === 3 ? '#fff' : '#ffd23f') : '#3a2a4a');
  for (let i = 0; i < F.kd.p; i++) R(x0 + 70 + i * 6, 20, 4, 4, '#ff3b5c');
  const nm = F.opp.short; TX(nm, x1 - 2, 2, '#7ef0ff', 1, 1); bar(x1 - 110, 11, 108, 6, O.hp / O.maxHp, '#3bc6ff', true);
  for (let i = 0; i < F.kd.o; i++) R(x1 - 6 - i * 6, 20, 4, 4, '#ffd23f');
  const c = Math.max(0, Math.ceil(F.clock)), mm = Math.floor(c / 60), ss = c % 60;
  TX(mm + ':' + (ss < 10 ? '0' : '') + ss, C, 3, c <= 10 && F.phase === 'fight' && Math.floor(T * 4) % 2 ? '#ff3b5c' : '#fff', 2, 0.5);
  TX('RD ' + F.round, C, 19, '#ffd23f', 1, 0.5, null);
}
/* ---------------- speech bubble (DOM) ---------------- */
let bubT = 0;
function say(text, secs = 1.8) {
  const b = $('#bub'); b.textContent = text; b.style.display = 'block'; bubT = secs; hitA('say');
  SFX.talk(text, F && F.opp ? F.opp.voice * 1.4 : 150);
  placeBubble();
}
function placeBubble() {
  const b = $('#bub'); if (b.style.display !== 'block') return; const O = F && F.O; const r = cv.getBoundingClientRect(), k = r.height / GH;
  const hx = O ? O.headScr.x : GW / 2, hy = O ? O.headScr.y : 80; let x = r.left + (hx + 34) * k, y = r.top + (hy - 18) * k;
  b.className = 'tl'; const bw = b.offsetWidth || 160; x = Math.min(x, innerWidth - bw - 8); y = Math.max(y, b.offsetHeight + 6);
  b.style.left = x + 'px'; b.style.top = y + 'px';
}
function bubUpdate(dt) { if (bubT > 0) { bubT -= dt; placeBubble(); if (bubT <= 0) $('#bub').style.display = 'none'; } }
function hideBubble() { bubT = 0; $('#bub').style.display = 'none'; }
