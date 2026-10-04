// Desktop Chromium: keyboard play-through, timer, decision + KO paths, interview, save, audio, screenshots.
const { chromium } = require('playwright'); const path = require('path');
const URL = process.env.URL || 'file://' + path.resolve(__dirname, '../CareysPunchout.html');
const SHOTS = path.resolve(__dirname, '../screenshots');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript({ path: path.join(__dirname, 'bot.js') });
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(900);
  const sc = () => p.evaluate(() => __CP.scene); const key = async (k, n = 1, d = 160) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(d); } };
  ok(!(await p.evaluate(() => __CP.touch)), 'desktop: keyboard mode (no touch overlay)');
  await p.screenshot({ path: `${SHOTS}/desktop_title.png` });
  // options: volume sliders + mute
  await p.click('button[data-k=opts]'); await p.waitForTimeout(200);
  ok(await sc() === 'options', 'options screen opens');
  await p.locator('#volMusic').fill('30'); await p.locator('#volSfx').fill('60'); await p.waitForTimeout(100);
  const sv = await p.evaluate(() => ({ m: __CP.S.musicVol, s: __CP.S.sfxVol, saved: JSON.parse(localStorage.getItem('careys_punchout_v1')) }));
  ok(Math.abs(sv.m - 0.3) < 0.01 && Math.abs(sv.s - 0.6) < 0.01 && Math.abs(sv.saved.musicVol - 0.3) < 0.01, `volume sliders set + persisted (music ${sv.m}, sfx ${sv.s})`);
  await p.screenshot({ path: `${SHOTS}/desktop_options.png` });
  await key('KeyX'); const m1 = await p.evaluate(() => __CP.S.mute); await key('KeyX'); const m2 = await p.evaluate(() => __CP.S.mute);
  ok(m1 === true && m2 === false, 'X toggles mute');
  await p.click('button[data-k=back]'); await p.waitForTimeout(200);
  // keyboard: title -> ladder -> intro -> fight
  await key('Enter'); ok(await sc() === 'ladder', 'Enter on title -> ladder');
  await p.screenshot({ path: `${SHOTS}/desktop_ladder.png` });
  await key('Enter'); ok(await sc() === 'intro', 'Enter on ladder -> intro');
  await p.waitForTimeout(600); await p.screenshot({ path: `${SHOTS}/desktop_intro.png` });
  for (let i = 0; i < 20 && await sc() === 'intro'; i++) await key('Enter', 1, 250);
  ok(await sc() === 'fight', 'Enter through intro -> fight');
  await p.waitForFunction(() => __CP.F.phase === 'fight', null, { timeout: 5000 });
  const a0 = await p.evaluate(() => __CP.audio.state()); ok(a0.ctx === 'running' && a0.music === 'fight', 'WebAudio running + fight music playing ' + JSON.stringify(a0));
  // every key
  const keys = { KeyJ: 'jabL', KeyK: 'jabR', KeyU: 'hookL', KeyI: 'hookR', KeyN: 'bodyL', KeyM: 'bodyR', KeyL: 'upper', KeyQ: 'legKick', KeyE: 'headKick', KeyR: 'roundhouse', Space: 'star', ArrowLeft: 'dodge', ArrowRight: 'dodge', ArrowDown: 'duck', ArrowUp: 'block' };
  const kr = []; await p.evaluate(() => __CP.audio.reset());
  for (const [k, want] of Object.entries(keys)) {
    await p.waitForFunction(() => __CP.F.P.st === 'idle', null, { timeout: 5000 }).catch(() => { });
    await p.evaluate(() => { const F = __CP.F; F.O.nextAct = 999; F.O.st = 'idle'; F.P.hearts = 20; F.P.stars = 1; F.P.gasT = 0; });
    const t0 = await p.evaluate(() => __CP.F.stats.thrown);
    await p.keyboard.down(k); await p.waitForTimeout(60);
    const r = await p.evaluate(() => ({ st: __CP.F.P.st, thrown: __CP.F.stats.thrown, atk: __CP.F.P.atk && __CP.F.P.atk.id }));
    await p.keyboard.up(k);
    const good = want === 'dodge' || want === 'duck' || want === 'block' ? r.st === want : r.thrown === t0 + 1;
    kr.push(k + '→' + want + (good ? '✓' : '✗' + r.st)); await p.waitForTimeout(500);
  }
  ok(kr.every(s => s.includes('✓')), 'keyboard controls: ' + kr.join(' '));

  // real-time clock
  await p.evaluate(() => { __CP.F.O.nextAct = 2; }); const ck0 = await p.evaluate(() => __CP.F.clock); await p.waitForTimeout(3000); const ck1 = await p.evaluate(() => __CP.F.clock);
  ok(Math.abs((ck0 - ck1) - 3) < 0.35, `round clock runs in real time (${(ck0 - ck1).toFixed(2)}s in 3s)`);
  // pause
  await key('KeyP'); ok(await p.evaluate(() => __CP.F.paused) && await sc() === 'fight', 'P pauses'); const ck2 = await p.evaluate(() => __CP.F.clock); await p.waitForTimeout(800);
  ok(await p.evaluate(c => __CP.F.clock === c, ck2), 'clock frozen while paused'); await p.screenshot({ path: `${SHOTS}/desktop_pause.png` }); await key('Escape'); ok(!(await p.evaluate(() => __CP.F.paused)), 'Esc resumes');
  // ---- decision path: passive defender for 3 full rounds at 8x
  await p.evaluate(() => { window.__BOT = __mkBot({ passive: true, skill: 0.97, react: 0.18 }); __CP.F.ts = 8; });
  let sawCorner = 0;
  for (let i = 0; i < 400; i++) { const s = await sc(); if (s === 'corner') { sawCorner++; if (sawCorner === 1) { await p.waitForTimeout(700); await p.screenshot({ path: `${SHOTS}/desktop_corner.png` }); } for (let j = 0; j < 15 && await sc() === 'corner'; j++) await key('Enter', 1, 120); await p.evaluate(() => { __CP.F.ts = 8; }); } if (s === 'loss' || s === 'interview') break; await p.waitForTimeout(250); }
  const dec = await p.evaluate(() => ({ s: __CP.scene, how: __CP.F.result && __CP.F.result.how, rt: __CP.F.roundTimes, cards: __CP.F.judge && __CP.F.judge.cards, rounds: __CP.F.round }));
  ok(sawCorner === 2, `corner screen shown between rounds (${sawCorner}x)`);
  ok(dec.how === 'DEC' && dec.rt.length === 3 && dec.rt.every(t => Math.abs(t - 90) < 0.2), `3 rounds x 1:30 -> decision (${dec.how}, round times ${dec.rt.map(t => t.toFixed(2)).join('/')}, cards ${JSON.stringify(dec.cards)})`);
  ok(dec.s === 'loss', 'passive fighter loses the decision -> loss screen');
  await p.waitForTimeout(900); await p.screenshot({ path: `${SHOTS}/desktop_loss_decision.png` });
  const jw = await p.evaluate(() => { const F = __CP.F; F.rs = [{ p: 60, o: 20, pk: 1, ok: 0 }, { p: 50, o: 40, pk: 0, ok: 0 }, { p: 30, o: 35, pk: 0, ok: 0 }]; return __CP.judge(); });
  ok(jw.winner === 'p', 'judges score a points win correctly ' + JSON.stringify(jw.cards));
  // ---- KO path vs Doug with a skilled bot -> interview
  await p.evaluate(() => { window.__BOT = null; }); for (let i = 0; i < 25 && await sc() === 'loss'; i++) { if (await p.locator('button[data-k=re]').count()) { await p.click('button[data-k=re]'); break; } await key('Enter', 1, 150); }
  for (let i = 0; i < 20 && await sc() === 'intro'; i++) await key('Enter', 1, 200);
  await p.waitForFunction(() => __CP.F.phase === 'fight', null, { timeout: 6000 });
  await p.evaluate(() => { window.__BOT = __mkBot({ skill: 0.97, react: 0.18, starAt: 1 }); __CP.F.ts = 1; });
  // grab a mid-fight damage shot
  await p.waitForFunction(() => { const F = __CP.F; return F.phase === 'fight' && (F.O.dmg.eyeL + F.O.dmg.eyeR >= 2) && F.P.st === 'idle' && F.P.t > 0.12 && __CP.parts.length >= 3; }, null, { timeout: 60000 }).catch(() => { });
  await p.evaluate(() => { __CP.F.ts = 0.03; }); await p.screenshot({ path: `${SHOTS}/desktop_fight_doug_damage.png` }); await p.evaluate(() => { __CP.F.ts = 2; });
  for (let i = 0; i < 300; i++) { const s = await sc(); if (s === 'corner') { for (let j = 0; j < 15 && await sc() === 'corner'; j++) await key('Enter', 1, 120); await p.evaluate(() => { __CP.F.ts = 2; }); } if (s === 'interview' || s === 'loss') break; await p.waitForTimeout(250); }
  const ko = await p.evaluate(() => ({ s: __CP.scene, how: __CP.F.result && __CP.F.result.how, okd: __CP.F.O.kdTot }));
  ok(ko.s === 'interview' && (ko.how === 'KO' || ko.how === 'TKO'), `skilled fighter wins by ${ko.how} (${ko.okd} knockdowns) -> post-fight interview`);
  await p.evaluate(() => { window.__BOT = null; });
  const ac = await p.evaluate(() => __CP.audio.counts); const sfxK = Object.keys(ac).filter(k => /^hit_|^whoosh|^block|^miss|^crowd_|^bell|^ting|^count|^grunt_|^oof/.test(k));
  ok(Object.keys(ac).some(k => k.startsWith('hit_')) && ac.ting > 0 && ac.bell > 0 && ac.count > 0, 'fight SFX fired: ' + sfxK.map(k => k + ':' + ac[k]).join(','));
  await p.waitForTimeout(1800); await p.screenshot({ path: `${SHOTS}/desktop_interview.png` });
  let lines = 0; for (let i = 0; i < 30 && await sc() === 'interview'; i++) { if (await p.locator('button[data-k=cont]').count()) break; await key('Enter', 1, 120); lines++; if (lines === 3) await p.screenshot({ path: `${SHOTS}/desktop_interview_2.png` }); }
  await p.screenshot({ path: `${SHOTS}/desktop_victory.png` });
  await key('Enter'); ok(await sc() === 'ladder', 'victory -> ladder');
  const sav = await p.evaluate(() => JSON.parse(localStorage.getItem('careys_punchout_v1')));
  ok(sav.unlocked === 1 && sav.rec.doug.w === 1 && sav.rec.doug.l === 1, `ladder progress persisted (unlocked ${sav.unlocked}, doug W${sav.rec.doug.w}-L${sav.rec.doug.l})`);
  await p.reload(); await p.waitForTimeout(700); ok(await p.evaluate(() => __CP.S.unlocked === 1), 'progress survives reload');
  // ---- damage/blood showcase screenshots for later opponents (unlock all)
  for (const [i, name] of [[2, 'nana'], [4, 'kevin'], [5, 'bjorn'], [6, 'hurtz'], [7, 'gary'], [3, 'reggie'], [1, 'chad']]) {
    await p.evaluate(i => { __CP.S.unlocked = 7; __CP.startFight(i); window.__BOT = __mkBot({ skill: 0.99, react: 0.15, starAt: 1 }); __CP.F.ts = 1.5; }, i);
    await p.waitForFunction(() => { const F = __CP.F; return F.phase === 'fight' && F.O.dmg.pts.head > F.O.maxHp * 0.5 && F.P.st === 'idle' && F.P.t > 0.12 && (F.O.st === 'idle' || F.O.st === 'tell' || F.O.st === 'hurt' || F.O.st === 'taunt') && __CP.parts.length >= 3; }, null, { timeout: 90000 }).catch(() => { });
    await p.evaluate(() => { __CP.F.ts = 0.02; }); await p.waitForTimeout(80); await p.screenshot({ path: `${SHOTS}/desktop_fight_${name}_damage.png` });
    await p.evaluate(() => { window.__BOT = null; });
  }
  ok(errs.length === 0, 'no console errors ' + JSON.stringify(errs.slice(0, 5)));
  console.log(fails ? fails + ' FAILURES' : 'DESKTOP ALL PASS'); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
