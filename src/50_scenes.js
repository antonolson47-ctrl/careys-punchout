/* ===================== SCENES & UI ===================== */
let scene = null;
function go(sc, arg) { if (scene && scene.exit) scene.exit(); scene = sc; hideBubble(); uiClear(); if (sc.enter) sc.enter(arg); TC.sync(); hitA('scene_' + sc.name); }
const UI = $('#ui');
function uiClear() { UI.innerHTML = ''; }
function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function sheet(html, cls = '') { const s = el(`<div class="sheet ${cls}">${html}</div>`); UI.appendChild(s); bindButtons(s); return s; }
function bindButtons(root) { root.querySelectorAll('button[data-k]').forEach(b => { b.addEventListener('click', e => { e.stopPropagation(); audioInit(); const k = b.dataset.k; SFX.ui(k === 'back' ? 'back' : 'ok'); const h = root._h && root._h[k]; if (h) h(b); }); }); }
function on(root, handlers) { root._h = handlers; return root; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// keyboard menu navigation over visible buttons
function menuKey(e) {
  const bs = [...UI.querySelectorAll('button.btn')].filter(b => b.offsetParent && !b.disabled); if (!bs.length) return false;
  let i = bs.findIndex(b => b.classList.contains('sel'));
  if (/^(ArrowRight|ArrowDown|KeyD|KeyS|Tab)$/.test(e.code)) { i = (i + 1) % bs.length; } else if (/^(ArrowLeft|ArrowUp|KeyA|KeyW)$/.test(e.code)) { i = (i - 1 + bs.length) % bs.length; }
  else if (e.code === 'Enter' || e.code === 'Space') { (bs[i] || bs[0]).click(); return true; } else return false;
  bs.forEach(b => b.classList.remove('sel')); bs[i].classList.add('sel'); SFX.ui('move'); return true;
}
/* ---- typewriter dialog ---- */
const WHO = { chet: ['CHET RUCKUS', 'r', 135], barry: ['BARRY "BIG DADDY" BIGGS', 'b', 95], carey: ['CAREY', 'c', 270], ann: ['LENNY THE ANNOUNCER', 'a', 115], coach: ['COACH GUS', 't', 120], opp: ['', 'o', 120], ref: ['REF LARRY', 'a', 140] };
function dialog(lines, done, opts = {}) {
  let i = -1, shown = 0, full = '', sp = null, tAcc = 0;
  const s = sheet(`<div class="small">${opts.title || ''}</div><div class="who"></div><div class="line"></div><div class="row"><button class="btn" data-k="next">NEXT ▶</button>${opts.noSkip ? '' : '<button class="btn dim" data-k="skip">SKIP</button>'}</div><div class="tap">${IS_TOUCH ? 'tap to continue' : 'ENTER / SPACE to continue'}</div>`);
  const W = s.querySelector('.who'), L = s.querySelector('.line');
  const next = () => {
    if (i >= 0 && shown < full.length) { shown = full.length; L.textContent = full; return; }
    i++; if (i >= lines.length) { s.remove(); dialog.cur = null; done && done(); return; }
    const ln = lines[i], w = WHO[ln.who] || WHO.opp; full = ln.text; shown = 0; L.textContent = '';
    W.textContent = ln.who === 'opp' ? (opts.oppName || 'OPPONENT') : w[0]; W.className = 'who ' + w[1];
    if (ln.speak) Voice.say(ln.speak === true ? ln.text : ln.speak, { pitch: ln.who === 'ann' ? 0.6 : 1, rate: ln.who === 'ann' ? 0.9 : 1.05 }); else SFX.talk(ln.text, ln.who === 'opp' ? (opts.oppPitch || 120) * 1.4 : w[2] * 1.3);
    if (ln.fx) ln.fx(); dialog.speaker = ln.who; dialog.lineIdx = i;
  };
  on(s, { next, skip: () => { i = lines.length; shown = full.length; next(); } });
  dialog.cur = { next, update(dt) { if (shown < full.length) { tAcc += dt * 45; const n = Math.floor(tAcc); if (n > 0) { tAcc -= n; shown = Math.min(full.length, shown + n); L.textContent = full.slice(0, shown); } } }, el: s };
  next(); return s;
}
dialog.cur = null; dialog.speaker = '';
/* ---------------- TITLE ---------------- */
const Title = {
  name: 'title',
  enter() {
    Music.play('title'); Crowd.set(0.03);
    const s = sheet(`<div class="row" style="margin-top:2px"><button class="btn red" data-k="play" style="font-size:calc(var(--fs)*1.3);padding:10px 26px">▶ ${S.unlocked > 0 || S.fights ? 'CONTINUE CAREER' : 'START CAREER'}</button></div>
      <div class="row"><button class="btn" data-k="help">HOW TO PLAY</button><button class="btn" data-k="opts">SOUND &amp; OPTIONS</button></div>
      <div class="small" style="text-align:center;margin-top:6px">${S.champ ? '👑 WORLD CHAMPION — defend your title on the ladder! · ' : ''}${IS_TOUCH ? 'Add to Home Screen for full-screen play' : 'Keyboard: arrows/WASD + J K U I N M L, Q E R kicks, SPACE star'}</div>`);
    on(s, { play: () => go(Ladder), help: () => go(Help, Title), opts: () => go(Options, Title) });
  },
  update(dt) { },
  draw() {
    drawArena('title', 0.5); vignette(0.35);
    const C = GW / 2, bob = Math.sin(T * 2) * 2;
    TX("CAREY'S", C, 18 + bob, ['#fff7b0', '#ffe066', '#ffd23f', '#ffb81f', '#ff9d1f', '#ff8a1f', '#ff7a1f'], 3, 0.5, '#7a0b2e');
    TX('PUNCHOUT', C, 44 + bob, ['#ffffff', '#ffd0dc', '#ff8aa8', '#ff3b5c', '#e01a40', '#c0102e', '#a00a20'], 5, 0.5, '#2a0838');
    // lineup silhouettes
    for (let i = 0; i < ROSTER.length; i++) { const x = C + (i - 3.5) * 34, y = 128; E(x, y, 13, 12, i <= S.unlocked ? sh(ROSTER[i].color, -0.55) : '#1a0a26'); R(x - 14, y + 10, 28, 30, i <= S.unlocked ? sh(ROSTER[i].color, -0.6) : '#140820'); }
    drawCareyFront(C, 236, 1.05, { mouth: 'grit', belt: S.champ });
    TX('KICK. PUNCH. TALK TRASH.', C, 92, '#7ef0ff', 1, 0.5);
  }
};
/* ---------------- LADDER ---------------- */
const Ladder = {
  name: 'ladder', sel: 0, dummies: null,
  enter() {
    Music.play('menu'); Crowd.set(0.02);
    this.sel = clamp(S.sel != null ? S.sel : S.unlocked, 0, Math.min(S.unlocked, ROSTER.length - 1));
    if (!this.dummies) this.dummies = ROSTER.map(r => ({ C: r.C, dmg: newDmg(), pose: basePose(), sweat: 0, hp: 1, maxHp: 1 }));
    this.render();
  },
  render() {
    uiClear(); const r = ROSTER[this.sel], rc = rec(r.id), locked = this.sel > S.unlocked;
    const s = sheet(`<h2>${locked ? '??? (LOCKED)' : esc(r.name)}</h2>
      ${locked ? `<p class="small">Beat ${esc(ROSTER[this.sel - 1].short)} to unlock this fighter.</p>` : `<div class="kv"><b>FROM</b><span>${esc(r.from)}</span><b>WEIGHT</b><span>${esc(r.weight)}</span><b>RECORD</b><span>${esc(r.record)}</span><b>VS CAREY</b><span>${rc.w}W - ${rc.l}L${rc.ko ? ' (' + rc.ko + ' KO)' : ''}</span></div><p class="small">${esc(r.blurb)}</p>`}
      <div class="row"><button class="btn dim" data-k="prev">◀</button><button class="btn red" data-k="fight" ${locked ? 'disabled' : ''}>FIGHT!</button><button class="btn dim" data-k="nextOpp">▶</button><button class="btn dim" data-k="back">BACK</button></div>`);
    on(s, { prev: () => this.move(-1), nextOpp: () => this.move(1), fight: () => { S.sel = this.sel; save(); go(Intro, ROSTER[this.sel]); }, back: () => go(Title) });
  },
  move(d) { this.sel = (this.sel + d + ROSTER.length) % ROSTER.length; SFX.ui('move'); this.render(); },
  key(e) { if ((e.code === 'Enter' || e.code === 'Space') && this.sel <= S.unlocked && !UI.querySelector('button.sel')) { S.sel = this.sel; save(); go(Intro, ROSTER[this.sel]); return true; } if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.move(-1); return true; } if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.move(1); return true; } if (e.code === 'Escape') { go(Title); return true; } return false; },
  cell(i) { const cols = 4, cw = Math.min(70, (GW - 16) / cols), x0 = GW / 2 - cw * cols / 2, row = Math.floor(i / cols), col = i % cols; return { x: x0 + col * cw + cw / 2, y: 22 + row * 52, w: cw - 5, h: 49 }; },
  tap(bx, by) { for (let i = 0; i < ROSTER.length; i++) { const c = this.cell(i); if (Math.abs(bx - c.x) < c.w / 2 && Math.abs(by - (c.y + c.h / 2)) < c.h / 2 + 3) { if (this.sel === i && i <= S.unlocked) { S.sel = i; save(); go(Intro, ROSTER[i]); } else { this.sel = i; SFX.ui('move'); this.render(); } return; } } },
  draw() {
    for (let y = 0; y < GH; y += 4) R(0, y, GW, 4, sh('#1a0a2a', -y / 600)); for (let x = 0; x < GW; x += 16) R(x, 0, 1, GH, '#24123a');
    TX('THE CIRCUIT', GW / 2, 3, '#ffd23f', 2, 0.5, '#7a0b2e');
    const circ = [['MINOR', '#3bff6a'], ['MINOR', '#3bff6a'], ['MINOR', '#3bff6a'], ['MAJOR', '#3bc6ff'], ['MAJOR', '#3bc6ff'], ['MAJOR', '#3bc6ff'], ['WORLD', '#ff3b5c'], ['WORLD', '#ff3b5c']];
    for (let i = 0; i < ROSTER.length; i++) {
      const c = this.cell(i), r = ROSTER[i], locked = i > S.unlocked, beat = rec(r.id).w > 0, cc = circ[i][1];
      const selB = i === this.sel && Math.floor(T * 4) % 2;
      R(c.x - c.w / 2 - 2, c.y - 2, c.w + 4, c.h + 4, selB ? '#fff' : i === this.sel ? '#ffd23f' : '#000'); R(c.x - c.w / 2, c.y, c.w, c.h, locked ? '#140820' : sh(cc, -0.75)); R(c.x - c.w / 2, c.y, c.w, 9, cc);
      TX((i + 1) + '. ' + circ[i][0], c.x, c.y + 1, '#000', 1, 0.5, null);
      if (locked) { E(c.x, c.y + 25, 12, 12, '#2a1838'); TX('?', c.x, c.y + 19, '#6a4a8a', 2, 0.5, null); }
      else { const d = this.dummies[i]; drawHeadGeneric(d, c.x, c.y + 27, 0.44, i === this.sel ? (Math.sin(T * 2) > 0.6 ? 'laugh' : 'smug') : 'normal'); }
      TX(locked ? '???' : r.short, c.x, c.y + c.h - 9, locked ? '#6a4a8a' : '#fff', 1, 0.5);
      if (beat) { R(c.x + c.w / 2 - 17, c.y + 12, 15, 9, '#ffd23f'); TX('W', c.x + c.w / 2 - 10, c.y + 13, '#7a0b2e', 1, 0.5, null); }
    }
    TX(S.champ ? 'WORLD CHAMPION: CAREY' : 'CHAMPION: ' + ROSTER[7].short, GW / 2, 128, S.champ ? '#ffd23f' : '#aaa', 1, 0.5);
  }
};
/* ---------------- ANNOUNCER INTRO ---------------- */
const Intro = {
  name: 'intro', showCarey: false,
  enter(opp) {
    newFight(opp); F.O.st = 'intro'; this.showCarey = false; Music.play('menu'); Crowd.set(0.08); SFX.crowd('cheer');
    const L = [
      { who: 'ann', text: 'LADIEEEES AND GENTLEMEN! Welcome to CAREY\'S PUNCHOUT!', speak: 'Ladies and gentlemen! Welcome to Carey\'s Punchout!', fx: () => SFX.crowd('roar') },
      { who: 'ann', text: `In the blue corner... from ${opp.from}... weighing in at ${opp.weight}... with a record of ${opp.record}...`, speak: `In the blue corner, from ${opp.from}, weighing in at ${opp.weight}.` },
      { who: 'ann', text: `${opp.name}!!!`, speak: opp.name.replace(/"/g, '').replace('D.D.S.', ''), fx: () => SFX.crowd(chance(0.5) ? 'boo' : 'roar') },
      { who: 'opp', text: opp.lines.intro[0], fx: () => { F.O.st = 'gloat'; } },
      { who: 'ann', text: 'And in the red corner... the people\'s champion of absolutely nothing yet... CAAAAREEEEY!!!', speak: 'And in the red corner... Carey!', fx: () => { this.showCarey = true; SFX.crowd('roar'); F.O.st = 'intro'; } },
      { who: 'ref', text: `Okay, I want a clean fight. Three rounds, ninety seconds each. No biting${opp.id === 'nana' ? ', and that INCLUDES dentures' : ''}. Touch gloves!`, fx: () => SFX.bell(1) },
    ];
    dialog(L, () => go(Fight), { oppName: opp.short, oppPitch: opp.voice, title: opp.circuit });
  },
  update(dt) { oPoseUpdate(dt); if (dialog.cur) dialog.cur.update(dt); },
  tap() { if (dialog.cur) dialog.cur.next(); },
  key(e) { if (e.code === 'Enter' || e.code === 'Space') { dialog.cur && dialog.cur.next(); return true; } if (e.code === 'Escape') { go(Ladder); return true; } return false; },
  draw() {
    drawArena('ring', 0.4);
    drawOpp(F.O, GW / 2 + 16, 0, F); drawOpp(F.O, GW / 2 + 16, 1, F);
    drawAnnouncer(GW / 2 - 84, 238, 1.05, dialog.speaker === 'ann');
    if (dialog.speaker === 'ref') drawRef(GW / 2 + 92, 236, 0.9, 0, 0);
    if (this.showCarey) { F.P.st = 'idle'; drawCareyBack(GW / 2, F.P, F); }
    TX(F.opp.circuit, GW / 2, 4, '#ffd23f', 1, 0.5);
  }
};
/* ---------------- FIGHT ---------------- */
const Fight = {
  name: 'fight',
  enter() { startRound(); },
  update(dt) { fightUpdate(dt); bubUpdate(dt); TC.starReady(F.P.stars > 0); },
  draw() { drawFight(); },
  exit() { Voice.stop(); }
};
/* ---------------- CORNER (between rounds) ---------------- */
const Corner = {
  name: 'corner', splashT: 0,
  enter() {
    const P = F.P, O = F.O, r = F.rs[F.round - 1];
    Music.play('corner'); Crowd.set(0.07);
    const healP = (100 - P.hp) * 0.35, healO = (O.maxHp - O.hp) * 0.12; P.hp = Math.min(100, P.hp + healP); O.hp = Math.min(O.maxHp, O.hp + healO);
    const tips = [];
    const specific = F.opp.corner[(F.round - 1 + F.opp.idx) % F.opp.corner.length], spec2 = F.opp.corner[(F.round + 1 + F.opp.idx) % F.opp.corner.length];
    if (P.hp < 40) tips.push("You're leakin', kid. Keep the hands up and let 'em come to you. Dodge, THEN hit.");
    if (F.stats.gassed > 0 && F.round === 1) tips.push("You keep runnin' outta hearts. Stop swingin' at gloves and quit spammin' kicks!");
    if (r.p < r.o) tips.push("We're losin' this round on the cards. You need a knockdown, sweetheart.");
    else tips.push(pick(["That's my girl! Keep doin' exactly that, but more.", "Beautiful! The judges love you. Well, two of 'em. The robot's undecided.", "He's hurtin'! I can smell it. Or that's the hot dog guy."]));
    if (F.stats.counters < 2) tips.push('Make him miss, then make him pay. Counters give you STARS. Stars make him go night-night.');
    const L = [{ who: 'coach', text: specific }, { who: 'coach', text: pick(tips) }, { who: 'coach', text: chance(0.5) ? pick(GENERIC_CORNER) : spec2 }];
    const sum = `END OF ROUND ${F.round} · You dealt <b>${Math.round(r.p)}</b> · took <b>${Math.round(r.o)}</b>${r.pk ? ' · knockdowns ' + r.pk : ''}`;
    dialog(L, () => this.done(), { title: sum, noSkip: false });
  },
  done() { F.round++; go(Fight); },
  update(dt) { this.splashT -= dt; if (this.splashT <= 0) { this.splashT = rand(2, 4); SFX.splash(); for (let i = 0; i < 14; i++) part({ type: 'spit', x: GW / 2 - 30 + rand(-4, 4), y: 112 - (FIT.mode === 'portrait' ? 0 : 36), vx: rand(-60, 60), vy: rand(-80, 10), life: 0.7, g: 300, s: rand(0.8, 1.6), c: '#bfefff' }); } updParts(dt); if (dialog.cur) dialog.cur.update(dt); },
  tap() { dialog.cur && dialog.cur.next(); },
  key(e) { if (e.code === 'Enter' || e.code === 'Space') { dialog.cur && dialog.cur.next(); return true; } return false; },
  draw() {
    for (let y = 0; y < GH; y += 2) R(0, y, GW, 2, sh('#2a1030', -y / 500)); const C = GW / 2;
    R(C - 100, 40, 10, 200, '#000'); R(C - 99, 40, 8, 200, '#d02040'); for (const [y, c] of [[70, '#ff3b5c'], [96, '#fff'], [122, '#3b7cff']]) { P([C - 95, y, GW, y + 40, GW, y + 44, C - 95, y + 4], '#000'); P([C - 95, y + 1, GW, y + 41, GW, y + 43, C - 95, y + 3], c); }
    const lift = FIT.mode === 'portrait' ? 0 : 36;
    R(C - 56, 200 - lift, 60, 6, '#5a3a1a'); R(C - 52, 206 - lift, 4, 34 + lift, '#3a2a10'); R(C - 4, 206 - lift, 4, 34 + lift, '#3a2a10');
    drawCareyFront(C - 30, 236 - lift, 1.0, { sit: true, dmg: 1 - F.P.hp / 100, mouth: F.P.hp < 40 ? 'open' : 'grit' });
    drawCoach(C + 56, 240 - lift, 1.05, dialog.speaker === 'coach');
    drawParts();
    TX('ROUND ' + F.round + ' OF 3', C, 6, '#ffd23f', 2, 0.5);
    bar(10, 26, 80, 6, F.P.hp / 100, '#3bff6a'); TX('CAREY', 10, 16, '#ff7ac8', 1, 0);
    bar(GW - 90, 26, 80, 6, F.O.hp / F.O.maxHp, '#3bc6ff', true); TX(F.opp.short, GW - 10, 16, '#7ef0ff', 1, 1);
  }
};
/* ---------------- AFTER FIGHT ---------------- */
function afterFight() {
  const r = F.result, o = F.opp, rc = rec(o.id); S.fights++;
  if (r.winner === 'p') { rc.w++; if (r.how !== 'DEC') rc.ko++; const was = S.unlocked; S.unlocked = Math.min(ROSTER.length - 1, Math.max(S.unlocked, o.idx + 1)); if (o.idx === ROSTER.length - 1) S.champ = true; S.sel = Math.min(S.unlocked, o.idx + 1); save(); go(Interview, { firstChamp: o.idx === ROSTER.length - 1 }); }
  else { rc.l++; save(); go(Loss); }
}
const Interview = {
  name: 'interview', champ: false,
  enter(arg) {
    const o = F.opp, how = F.result.how; this.champ = o.idx === ROSTER.length - 1; this.raised = false;
    Music.play('win'); Crowd.set(0.14); confetti(60); Voice.stop();
    const howTxt = how === 'KO' ? 'KNOCKOUT' : how === 'TKO' ? 'TECHNICAL KNOCKOUT' : 'DECISION';
    const L = [{ who: 'ann', text: `Ladies and gentlemen, your winner by ${howTxt}${how === 'DEC' ? ' (' + F.judge.cards.map(c => c.p + '-' + c.o).join(', ') + ')' : ''}... CAAAREY!!!`, speak: `Your winner, by ${howTxt}... Carey!`, fx: () => { this.raised = true; SFX.crowd('roar'); SFX.bell(2); } }];
    if (how === 'DEC') L.push({ who: 'chet', text: "She went the distance! Three rounds of pure violence! Pull that up, look at his FACE!" });
    for (const [w, t] of o.interview) L.push({ who: w, text: t, fx: w === 'barry' && chance(0.5) ? () => SFX.crowd('laugh') : null });
    L.push({ who: 'chet', text: pick(["That was CRAZY. Hundred percent. Hey, have you ever tried elk meat? It's incredible for recovery.", "I've been saying it for years: legs are the most underrated weapon. It's entirely possible she's the best ever.", "Folks, that's why you never skip cardio. Or kicks. Or Carey."]) });
    dialog(L, () => this.done(), { title: 'POST-FIGHT INTERVIEW · ' + o.short + ' DEFEATED' });
  },
  done() {
    if (this.champ) { go(Champion); return; }
    uiClear(); const nxt = ROSTER[Math.min(S.unlocked, ROSTER.length - 1)];
    const s = sheet(`<h2>VICTORY!</h2><p class="small">${S.unlocked > F.opp.idx ? 'NEW CHALLENGER UNLOCKED: <b>' + esc(nxt.name) + '</b>' : 'Rematch any fighter on the circuit.'}</p><div class="row"><button class="btn red" data-k="cont">CONTINUE ▶</button><button class="btn dim" data-k="title">TITLE</button></div>`);
    on(s, { cont: () => go(Ladder), title: () => go(Title) });
  },
  update(dt) { updParts(dt); if (Math.random() < 0.05) confetti(3); oPoseUpdate(dt); if (dialog.cur) dialog.cur.update(dt); },
  tap() { dialog.cur && dialog.cur.next(); },
  key(e) { if (e.code === 'Enter' || e.code === 'Space') { if (dialog.cur) { dialog.cur.next(); return true; } return menuKey(e); } return menuKey(e); },
  draw() {
    drawArena('ring', 1 + Math.sin(T * 6)); const C = GW / 2, O = F.O;
    if (F.result.how === 'DEC') { O.st = 'idle'; O.pose.face = 'hurt'; drawOpp(O, C + 60, 0, F, 168, 0.62); }
    else { O.st = 'ko'; O.downT = 2; drawOpp(O, C + 66, 0, F, 172, 0.6); }
    drawRef(C + 30, 222, 0.85, this.raised ? 1 : 0, 0);
    drawCareyFront(C - 8, 226, 0.9, { armUp: this.raised ? 'R' : null, mouth: this.raised ? 'open' : 'smile', dmg: F.P.dmgTaken / 160, belt: this.champ && this.raised });
    const lf = FIT.mode === 'portrait' ? 0 : 26; drawChet(Math.max(42, C - 124), 246 - lf, 1.1, dialog.speaker === 'chet'); drawBarry(Math.min(GW - 46, C + 128), 246 - lf, 1.05, dialog.speaker === 'barry');
    drawParts();
    TX(this.champ ? 'NEW WORLD CHAMPION!' : 'WINNER: CAREY', C, 6, '#ffd23f', 2, 0.5, '#7a0b2e');
  }
};
const Loss = {
  name: 'loss',
  enter() {
    Music.play('lose'); SFX.sadTrombone(); Crowd.set(0.06); const o = F.opp, how = F.result.how;
    const L = [{ who: 'opp', text: o.lines.win[0] }, { who: 'coach', text: pick(["We'll get 'em next time, kid. Probably. Maybe. Look, I'm old.", "Shake it off. Literally — I think you got a little brain stuck in your ear.", "Watch the TWINKLE, dodge, then counter. You know this! Your face just forgot.", "That's boxing. Well, kickboxing. Well, whatever THAT was. Rematch!"]) }];
    const cards = how === 'DEC' && F.judge ? ' (' + F.judge.cards.map(c => c.p + '-' + c.o).join(', ') + ')' : '';
    dialog(L, () => this.done(), { oppName: o.short, oppPitch: o.voice, title: `${how === 'DEC' ? 'LOST BY DECISION' + cards : how === 'TKO' ? 'TKO LOSS' : 'KNOCKED OUT'} · ${o.short} WINS` });
  },
  done() { const s = sheet(`<h2>DEFEAT</h2><p class="small">Tip: the glint (✦) on a glove or foot means the attack lands about a third of a second later. Check HOW TO PLAY for which defense beats which attack.</p><div class="row"><button class="btn red" data-k="re">REMATCH</button><button class="btn" data-k="lad">LADDER</button><button class="btn dim" data-k="title">TITLE</button></div>`); on(s, { re: () => go(Intro, F.opp), lad: () => go(Ladder), title: () => go(Title) }); },
  update(dt) { updParts(dt); F.O.st = 'win'; oPoseUpdate(dt); if (dialog.cur) dialog.cur.update(dt); },
  tap() { dialog.cur && dialog.cur.next(); },
  key(e) { if (dialog.cur && (e.code === 'Enter' || e.code === 'Space')) { dialog.cur.next(); return true; } return menuKey(e); },
  draw() { drawArena('ring', 0); vignette(0.25); drawOpp(F.O, GW / 2 + 30, 0, F); drawCareyFront(GW / 2 - 70, 238, 0.8, { sit: true, dmg: 1, mouth: 'open' }); for (let i = 0; i < 3; i++) { const a = T * 4 + i * 2.1; star(GW / 2 - 70 + Math.cos(a) * 14, 128 + Math.sin(a) * 4, 3, '#ffd23f', '#000'); } TX(F.result.how === 'DEC' ? 'DECISION' : F.result.how, GW / 2, 6, '#ff3b5c', 3, 0.5); }
};
const Champion = {
  name: 'champion',
  enter() {
    Music.play('win'); confetti(120); SFX.crowd('roar');
    const s = sheet(`<h2>👑 CAREY — WORLD CHAMPION 👑</h2><div class="scroll small" style="max-height:30vh">
      <p>Carey beat all eight fighters on the circuit. Doug went back to his couch. Chad started doing leg day. Nana is knitting a new set of dentures. Sir Reginald was disowned by his monocle. Kevin's channel got demonetized. Bjorn opened a meatball restaurant. Dr. Hurtz lost his license (again). Cyber-Gary was rebooted as a smart fridge.</p>
      <p><b>CAREY'S PUNCHOUT</b> — an original parody game made for Anton Olson. All characters are made up. Any resemblance to real podcast hosts, analysts, dentists, vikings or robots is purely coincidental and also hilarious.</p>
      <p>Thanks for playing! Rematch anyone on the ladder to defend your title.</p></div>
      <div class="row"><button class="btn red" data-k="lad">DEFEND THE TITLE</button><button class="btn" data-k="title">TITLE</button></div>`);
    on(s, { lad: () => go(Ladder), title: () => go(Title) });
  },
  update(dt) { updParts(dt); if (Math.random() < 0.15) confetti(4); },
  key: e => menuKey(e),
  draw() { drawArena('title', 1.5); vignette(0.2); const C = GW / 2; drawCareyFront(C, 236, 1.1, { armUp: 'both', belt: true, mouth: 'open' }); drawParts(); TX('WORLD CHAMPION', C, 8, ['#fff7b0', '#ffe066', '#ffd23f', '#ffb81f', '#ff9d1f', '#ff8a1f', '#ff7a1f'], 3, 0.5, '#7a0b2e'); }
};
/* ---------------- HELP ---------------- */
const Help = {
  name: 'help', back: null,
  enter(back) {
    this.back = back || Title;
    const kb = `<div class="kv"><b>Dodge L / R</b><span><span class="key">←</span><span class="key">→</span> or <span class="key">A</span><span class="key">D</span> (hold to stay out)</span><b>Duck</b><span><span class="key">↓</span> or <span class="key">S</span></span><b>Block (hold)</b><span><span class="key">↑</span> or <span class="key">W</span></span>
      <b>Jabs L / R</b><span><span class="key">J</span><span class="key">K</span></span><b>Head hooks L / R</b><span><span class="key">U</span><span class="key">I</span></span><b>Body hooks L / R</b><span><span class="key">N</span><span class="key">M</span></span><b>Uppercut</b><span><span class="key">L</span> or <span class="key">O</span></span>
      <b>Leg kick</b><span><span class="key">Q</span></span><b>Head kick</b><span><span class="key">E</span></span><b>Roundhouse</b><span><span class="key">R</span></span><b>★ Star punch</b><span><span class="key">SPACE</span> (needs a star)</span><b>Pause / Mute</b><span><span class="key">P</span>/<span class="key">ESC</span> · <span class="key">X</span></span></div>`;
    const tc = `<p class="small">Phone: hold it either way. <b>Right thumb</b> = punches (JABS at the bottom, BODY, HOOKS, UPPER and ★ STAR on top). <b>Left thumb</b> = DODGE ◀ ▶, DUCK, BLOCK (hold) and the three KICKS. Tap fast to get up after a knockdown. II = pause, ♪ = mute.</p>`;
    const s = sheet(`<h2>HOW TO PLAY</h2><div class="scroll">
      <p class="small">Beat 8 fighters. Each fight is 3 rounds × 1:30. Win by <b>KO</b> (they don't beat the 10 count), <b>TKO</b> (3 knockdowns in one round) or on the judges' scorecards.</p>
      <h3>READ THE TELLS</h3><p class="small">Every attack has a wind-up pose. A <b style="color:#ffd23f">✦ TWINKLE</b> on the glove/foot (plus a "ting") means it lands in about a third of a second — that's when to defend. Fakes never twinkle.</p>
      <div class="kv"><b>Jab</b><span>dodge, duck or block</span><b>Hook (wide)</b><span>dodge or duck</span><b>Uppercut (low glove)</b><span>DODGE — ducking into it hurts</span><b>Body blow (crouch)</b><span>dodge or block</span><b>Low kick</b><span>dodge or block</span><b>High kick (knee up)</b><span>DUCK</span><b>Haymaker (arm overhead)</b><span>dodge or duck — can't block</span><b>Rocket fist / Lasers</b><span>dodge only / duck only</span></div>
      <h3>HIT BACK</h3><p class="small">Their gloves show their guard: <b>high</b> guard blocks head shots (go body), <b>low</b> guard blocks body shots (go head), <b>middle</b> guard stops jabs (hooks & uppercuts get around). Hitting someone right after they miss is a <b>COUNTER</b> (extra damage) and earns a <b>★ STAR</b>. Hitting them mid-wind-up or mid-taunt also counts. Big guys can't be interrupted — move first!</p>
      <p class="small"><b>★ STAR PUNCH</b> uses all your stars (up to 3) for a massive hit. Getting hit costs a star.</p>
      <h3>HEARTS (STAMINA)</h3><p class="small">♥ drop when you get hit or when your attacks get blocked. Kicks cost hearts (leg 1, head 2, roundhouse 3) but hit much harder; leg kicks also slow them down. At 0 hearts you're GASSED and can only defend for a few seconds.</p>
      <h3>CONTROLS</h3>${IS_TOUCH ? tc + '<details><summary class="small">Keyboard</summary>' + kb + '</details>' : kb + tc}
      </div><div class="row"><button class="btn" data-k="back">BACK</button></div>`, 'center');
    on(s, { back: () => this.close() });
  },
  close() { if (this.back === 'pause') { uiClear(); Pause.open(); } else go(this.back); },
  key(e) { if (e.code === 'Escape' || e.code === 'Enter') { this.close(); return true; } return false; },
  update() { }, draw() { if (Fight.drawUnder()) return; drawArena('title', 0); vignette(0.5); }
};
Fight.drawUnder = () => { if (F && F.paused) { drawFight(); vignette(0.5); return true; } return false; };
/* ---------------- OPTIONS ---------------- */
const Options = {
  name: 'options', back: null,
  enter(back) { this.back = back || Title; this.render(); },
  render() {
    uiClear(); const pct = v => Math.round(v * 100);
    const s = sheet(`<h2>SOUND &amp; OPTIONS</h2>
      <label class="sl"><span>MUSIC</span><input type="range" min="0" max="100" value="${pct(S.musicVol)}" id="volMusic"><span class="v" id="vM">${pct(S.musicVol)}%</span></label>
      <label class="sl"><span>SFX</span><input type="range" min="0" max="100" value="${pct(S.sfxVol)}" id="volSfx"><span class="v" id="vS">${pct(S.sfxVol)}%</span></label>
      <div class="row"><button class="btn ${S.mute ? 'red' : ''}" data-k="mute">${S.mute ? '🔇 MUTED' : '🔊 SOUND ON'}</button><button class="btn" data-k="voice">ANNOUNCER VOICE: ${S.voice ? 'ON' : 'OFF'}</button></div>
      <div class="row"><button class="btn" data-k="hints">DEFENSE HINTS: ${S.hints ? 'ON' : 'OFF'}</button><button class="btn" data-k="shake">SCREEN SHAKE: ${S.shake ? 'ON' : 'OFF'}</button></div>
      <div class="row"><button class="btn" data-k="back">BACK</button>${this.back === Title ? '<button class="btn dim" data-k="reset">RESET PROGRESS</button>' : ''}</div>`, 'center');
    const vm = s.querySelector('#volMusic'), vs = s.querySelector('#volSfx');
    vm.addEventListener('input', () => { S.musicVol = vm.value / 100; s.querySelector('#vM').textContent = vm.value + '%'; applyVol(); save(); });
    vs.addEventListener('input', () => { S.sfxVol = vs.value / 100; s.querySelector('#vS').textContent = vs.value + '%'; applyVol(); save(); });
    vs.addEventListener('change', () => SFX.punch('hook', 0.8));
    on(s, { mute: () => { toggleMute(); this.render(); }, voice: () => { S.voice = !S.voice; save(); this.render(); if (S.voice) Voice.say('Carey!'); }, hints: () => { S.hints = !S.hints; save(); this.render(); }, shake: () => { S.shake = !S.shake; save(); this.render(); },
      back: () => this.close(), reset: b => { if (b.dataset.sure) { const keep = { musicVol: S.musicVol, sfxVol: S.sfxVol, mute: S.mute, voice: S.voice, hints: S.hints, shake: S.shake }; Object.assign(S, { unlocked: 0, rec: {}, champ: false, sel: 0, fights: 0 }, keep); save(); this.render(); } else { b.dataset.sure = 1; b.textContent = 'TAP AGAIN TO CONFIRM'; } } });
  },
  close() { if (this.back === 'pause') { uiClear(); Pause.open(); } else go(this.back); },
  key(e) { if (e.code === 'Escape') { this.close(); return true; } return menuKey(e); },
  update() { }, draw() { if (Fight.drawUnder()) return; drawArena('title', 0); vignette(0.5); }
};
function toggleMute() { S.mute = !S.mute; save(); applyVol(); hitA(S.mute ? 'mute' : 'unmute'); $('#bMute').textContent = S.mute ? '✕' : '♪'; if (!S.mute) Music.resume(); }
/* ---------------- PAUSE (overlay on the fight) ---------------- */
const Pause = {
  open() {
    if (!F || scene !== Fight) return; F.paused = true; TC.releaseAll(); TC.sync(); Voice.stop();
    const s = sheet(`<h2>PAUSED</h2><p class="small">${esc(F.opp.short)} · ROUND ${F.round} · ${Math.ceil(F.clock)}s left</p><div class="row"><button class="btn red" data-k="resume">▶ RESUME</button></div><div class="row"><button class="btn" data-k="opts">SOUND &amp; OPTIONS</button><button class="btn" data-k="help">HOW TO PLAY</button><button class="btn dim" data-k="quit">QUIT FIGHT</button></div>`, 'center');
    s.id = 'pauseSheet';
    on(s, { resume: () => this.close(), opts: () => { uiClear(); Options.back = 'pause'; Options.render(); Pause.sub = Options; }, help: () => { uiClear(); Help.enter('pause'); Pause.sub = Help; }, quit: b => { if (b.dataset.sure) { F.paused = false; Music.stop(); go(Ladder); } else { b.dataset.sure = 1; b.textContent = 'QUIT? TAP AGAIN'; } } });
    Pause.sub = null; hitA('pause');
  },
  close() { uiClear(); if (F) F.paused = false; Pause.sub = null; TC.sync(); hitA('resume'); },
  toggle() { if (!F || scene !== Fight) return; if (F.paused) this.close(); else this.open(); }
};
