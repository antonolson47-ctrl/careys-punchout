// Mobile test: real touchscreen taps in WebKit (iPhone 13 profile) and Chromium (Pixel 7), portrait <-> landscape incl. rotation mid-fight.
const { webkit, chromium, devices } = require('playwright'); const path = require('path');
const URL = process.env.URL || 'file://' + path.resolve(__dirname, '../CareysPunchout.html');
const SHOTS = path.resolve(__dirname, '../screenshots');
const which = process.argv[2] || 'iphone';
const PROFILES = { iphone: { engine: webkit, port: devices['iPhone 13'], land: devices['iPhone 13 landscape'] }, pixel: { engine: chromium, port: devices['Pixel 7'], land: devices['Pixel 7 landscape'] } };
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const P = PROFILES[which]; const b = await P.engine.launch();
  const { defaultBrowserType, ...dev } = P.port;
  const ctx = await b.newContext({ ...dev }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript({ path: path.join(__dirname, 'bot.js') });
  await p.addInitScript(() => localStorage.clear());
  await p.goto(URL); await p.waitForTimeout(800);
  const tap = async (sel) => { const bb = await p.locator(sel).first().boundingBox(); if (!bb) throw new Error('no box ' + sel); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(120); };
  const sc = () => p.evaluate(() => __CP.scene);
  const noScroll = async (tag) => { const r = await p.evaluate(() => ({ sh: document.scrollingElement.scrollHeight, sw: document.scrollingElement.scrollWidth, ih: innerHeight, iw: innerWidth, sy: scrollY, sx: scrollX, scale: visualViewport ? visualViewport.scale : 1 })); ok(r.sh <= r.ih + 1 && r.sw <= r.iw + 1 && r.sy === 0 && r.sx === 0 && Math.abs(r.scale - 1) < 0.01, `${tag}: no scroll/zoom ${JSON.stringify(r)}`); };
  const layout = async (tag, expectMode) => {
    const r = await p.evaluate(() => {
      const vw = innerWidth, vh = innerHeight, c = document.getElementById('cv').getBoundingClientRect(), F = __CP.fit;
      const btns = [...document.querySelectorAll('#tc .tb')].map(e => { const q = e.getBoundingClientRect(); return { a: e.dataset.a, x: q.left, y: q.top, w: q.width, h: q.height, vis: getComputedStyle(e).display !== 'none' && q.width > 0 }; });
      const top = ['#bPause', '#bMute'].map(s => { const q = document.querySelector(s).getBoundingClientRect(); return { a: s, x: q.left, y: q.top, w: q.width, h: q.height }; });
      return { vw, vh, mode: F.mode, gw: F.gw, cw: document.getElementById('cv').width, c: { x: c.left, y: c.top, w: c.width, h: c.height }, k: F.k, btns, top };
    });
    ok(r.mode === expectMode, `${tag}: fit mode ${r.mode} (vp ${r.vw}x${r.vh}, game width ${r.gw})`);
    const inVp = q => q.x >= -0.5 && q.y >= -0.5 && q.x + q.w <= r.vw + 0.5 && q.y + q.h <= r.vh + 0.5;
    ok(inVp(r.c), `${tag}: canvas fully inside viewport (no cropping) ${JSON.stringify(r.c)}`);
    ok(Math.abs(r.c.w / r.c.h - r.cw / 240) < 0.02, `${tag}: canvas aspect preserved (${(r.c.w / r.c.h).toFixed(3)} vs ${(r.cw / 240).toFixed(3)})`);
    const all = r.btns.concat(r.top);
    ok(r.btns.length === 15 && r.btns.every(q => q.vis), `${tag}: all ${r.btns.length} touch buttons visible`);
    ok(all.every(inVp), `${tag}: all buttons inside viewport`);
    const minB = Math.min(...r.btns.map(q => Math.min(q.w, q.h))); ok(minB >= 48, `${tag}: touch buttons >= 48px (min ${minB.toFixed(1)})`);
    let ov = []; for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const A = all[i], B = all[j]; if (A.x < B.x + B.w - 1 && B.x < A.x + A.w - 1 && A.y < B.y + B.h - 1 && B.y < A.y + A.h - 1) ov.push(A.a + '/' + B.a); }
    ok(ov.length === 0, `${tag}: no overlapping buttons ${ov.join(',')}`);
    if (expectMode === 'portrait') ok(r.btns.every(q => q.y >= r.c.y + r.c.h - 0.5), `${tag}: controls below the game view (nothing covers the fight)`);
    else { const cx = r.c.x + r.c.w / 2, half = 118 * r.k; ok(r.btns.every(q => q.x + q.w <= cx - half + 1 || q.x >= cx + half - 1), `${tag}: controls clear of the central ${Math.round(2 * half)}px fight area`); }
    return r;
  };
  // ---- title / menus via touch
  ok(await p.evaluate(() => __CP.touch), 'touch mode detected');
  ok(await p.evaluate(() => { const m = document.querySelector('meta[name=viewport]').content; return /user-scalable=no/.test(m) && /maximum-scale=1/.test(m); }), 'viewport meta disables zoom');
  await noScroll('title');
  await p.screenshot({ path: `${SHOTS}/${which}_portrait_title.png` });
  await tap('button[data-k=play]'); ok(await sc() === 'ladder', 'tap START -> ladder');
  await p.screenshot({ path: `${SHOTS}/${which}_portrait_ladder.png` });
  await tap('button[data-k=fight]'); ok(await sc() === 'intro', 'tap FIGHT -> intro');
  for (let i = 0; i < 20 && await sc() === 'intro'; i++) { if (await p.locator('button[data-k=next]').count()) await tap('button[data-k=next]'); else await p.touchscreen.tap(100, 100); await p.waitForTimeout(150); }
  ok(await sc() === 'fight', 'intro dialog advanced by taps -> fight');
  await p.waitForTimeout(2200);
  await layout('portrait fight', 'portrait'); await noScroll('portrait fight');
  // ---- every button by real touch
  const acts = await p.evaluate(() => [...document.querySelectorAll('#tc .tb')].map(e => e.dataset.a));
  const res = [];
  for (const a of acts) {
    await p.waitForFunction(() => __CP.F.P.st === 'idle', null, { timeout: 5000 }).catch(() => { });
    await p.evaluate(() => { const F = __CP.F; F.O.nextAct = 999; F.P.hearts = 20; F.P.gasT = 0; F.P.stars = 1; F.O.st = 'idle'; });
    const before = await p.evaluate(a => ({ n: __CP.audio.counts['tc_' + a] || 0, thrown: __CP.F.stats.thrown }), a);
    await tap(`#tc .tb[data-a="${a}"]`); await p.waitForTimeout(30);
    const after = await p.evaluate(a => ({ n: __CP.audio.counts['tc_' + a] || 0, thrown: __CP.F.stats.thrown, st: __CP.F.P.st, blockHeld: __CP.F.P.blockHeld }), a);
    const atk = !/dodge|duck|block/.test(a); const effect = atk ? after.thrown === before.thrown + 1 : (a === 'block' ? true : after.st === (a === 'duck' ? 'duck' : 'dodge'));
    res.push(a + (after.n === before.n + 1 && effect ? '✓' : '✗(' + after.st + ')'));
    await p.waitForTimeout(650);
  }
  ok(res.every(s => s.endsWith('✓')), 'each touch button fires its move: ' + res.join(' '));
  // double-tap on a button must not zoom
  const jb = await p.locator('#tc .tb[data-a=jabL]').boundingBox(); await p.touchscreen.tap(jb.x + 20, jb.y + 20); await p.waitForTimeout(60); await p.touchscreen.tap(jb.x + 20, jb.y + 20); await p.waitForTimeout(400);
  await noScroll('after double-tap');
  // ---- let the bot fight a bit, then rotate mid-fight
  await p.evaluate(() => { __CP.F.O.nextAct = 0.5; window.__BOT = __mkBot({ skill: 0.95, react: 0.2 }); });
  await p.waitForTimeout(3000);
  const c0 = await p.evaluate(() => ({ clock: __CP.F.clock, round: __CP.F.round, oHp: __CP.F.O.hp }));
  await p.setViewportSize(P.land.viewport); await p.waitForTimeout(900);
  const L1 = await layout('rotated to landscape mid-fight', 'landscape'); await noScroll('landscape fight');
  const c1 = await p.evaluate(() => ({ clock: __CP.F.clock, scene: __CP.scene, gw: __CP.fit.gw, cw: document.getElementById('cv').width }));
  ok(c1.scene === 'fight' && c1.clock < c0.clock, `fight continues after rotation (clock ${c0.clock.toFixed(1)} -> ${c1.clock.toFixed(1)})`);
  ok(c1.cw === c1.gw && c1.gw > 320, `landscape re-layout widened the arena to ${c1.gw}px game width`);
  // wait for some visible damage, then landscape screenshot
  await p.waitForFunction(() => __CP.F.O.dmg.eyeL + __CP.F.O.dmg.eyeR + __CP.F.O.dmg.lip >= 2 || __CP.F.phase !== 'fight', null, { timeout: 30000 }).catch(() => { });
  await p.waitForFunction(() => __CP.F.phase === 'fight' && __CP.F.O.st === 'tell' && __CP.F.O.glinted, null, { timeout: 15000 }).catch(() => { });
  await p.screenshot({ path: `${SHOTS}/${which}_landscape_fight.png` });
  // landscape: tap a few buttons
  await p.evaluate(() => { window.__BOT = null; __CP.F.O.nextAct = 999; __CP.F.P.hearts = 20; __CP.F.P.gasT = 0; });
  await p.waitForFunction(() => __CP.F.phase === 'fight' && __CP.F.P.st === 'idle', null, { timeout: 20000 }).catch(() => { });
  const lres = [];
  for (const a of ['jabL', 'hookR', 'legKick', 'dodgeL', 'duck', 'upper']) { await p.evaluate(() => { __CP.F.O.nextAct = 999; __CP.F.P.hearts = 20; __CP.F.P.gasT = 0; }); const n0 = await p.evaluate(a => __CP.audio.counts['tc_' + a] || 0, a); await tap(`#tc .tb[data-a="${a}"]`); const n1 = await p.evaluate(a => __CP.audio.counts['tc_' + a] || 0, a); lres.push(a + (n1 === n0 + 1 ? '✓' : '✗')); await p.waitForTimeout(650); }
  ok(lres.every(s => s.endsWith('✓')), 'landscape taps register: ' + lres.join(' '));
  // rotate back to portrait
  await p.evaluate(() => { __CP.F.O.nextAct = 0.6; window.__BOT = __mkBot({ skill: 0.95, react: 0.2 }); });
  await p.setViewportSize(P.port.viewport); await p.waitForTimeout(900);
  await layout('rotated back to portrait', 'portrait'); await noScroll('portrait again');
  await p.screenshot({ path: `${SHOTS}/${which}_portrait_fight.png` });
  const au = await p.evaluate(() => __CP.audio.state()); const ac = await p.evaluate(() => __CP.audio.counts);
  ok(au.ctx === 'running' && au.music === 'fight' && Object.keys(ac).some(k => k.startsWith('hit_') || k === 'whoosh'), 'WebAudio unlocked by touch + fight music/SFX playing ' + JSON.stringify(au));
  // finish the fight quickly (bot + 3x speed), then go through interview by taps.
  // Sound is muted for this fast-forward only: Playwright's Linux WebKit (GStreamer audio, no device) crashes under sustained 3x audio load.
  await p.evaluate(() => { __CP.S.mute = true; __CP.F.ts = 3; });
  for (let i = 0; i < 240; i++) { const s = await sc(); if (s === 'corner') { await p.screenshot({ path: `${SHOTS}/${which}_portrait_corner.png` }); for (let j = 0; j < 12 && await sc() === 'corner'; j++) { if (await p.locator('button[data-k=next]').count()) await tap('button[data-k=next]'); await p.waitForTimeout(100); } await p.evaluate(() => { if (__CP.F) __CP.F.ts = 3; }); } if (s === 'interview' || s === 'loss') break; await p.waitForTimeout(500); }
  const end = await sc(); ok(end === 'interview', 'fight ended in a win -> interview (' + end + ')');
  await p.evaluate(() => { window.__BOT = null; __CP.S.mute = false; });
  await p.waitForTimeout(1500); await p.screenshot({ path: `${SHOTS}/${which}_portrait_interview.png` });
  await p.setViewportSize(P.land.viewport); await p.waitForTimeout(700); await noScroll('landscape interview');
  ok(await p.evaluate(() => { const s = document.querySelector('.sheet'); if (!s) return true; const q = s.getBoundingClientRect(); return q.top >= 0 && q.bottom <= innerHeight + 1 && q.left >= 0 && q.right <= innerWidth + 1; }), 'landscape: dialog sheet fits the screen');
  await p.screenshot({ path: `${SHOTS}/${which}_landscape_interview.png` });
  for (let i = 0; i < 30 && await sc() === 'interview'; i++) { if (await p.locator('button[data-k=cont]').count()) { await tap('button[data-k=cont]'); break; } if (await p.locator('button[data-k=next]').count()) await tap('button[data-k=next]'); await p.waitForTimeout(150); }
  ok(await sc() === 'ladder', 'victory -> ladder via taps');
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('careys_punchout_v1') || '{}'));
  ok(saved.unlocked === 1 && saved.rec && saved.rec.doug && saved.rec.doug.w === 1, 'progress saved to localStorage (unlocked=' + saved.unlocked + ')');
  await p.screenshot({ path: `${SHOTS}/${which}_landscape_ladder.png` });
  // pause button by touch (in a new fight)
  await tap('button[data-k=fight]'); for (let i = 0; i < 20 && await sc() === 'intro'; i++) { if (await p.locator('button[data-k=skip]').count()) await tap('button[data-k=skip]'); else if (await p.locator('button[data-k=next]').count()) await tap('button[data-k=next]'); await p.waitForTimeout(150); }
  await p.waitForTimeout(1500); await tap('#bPause'); ok(await p.evaluate(() => __CP.F.paused === true), 'pause button works by touch');
  await tap('button[data-k=resume]'); ok(await p.evaluate(() => __CP.F.paused === false), 'resume works by touch');
  ok(errs.length === 0, 'no console errors ' + JSON.stringify(errs.slice(0, 5)));
  console.log(`${which}: ${fails ? fails + ' FAILURES' : 'ALL PASS'}`);
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
