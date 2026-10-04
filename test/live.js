// Verify the live GitHub Pages URL: loads, assets/manifest OK, plays a fight on desktop Chromium + iPhone WebKit, no console errors.
const { chromium, webkit, devices } = require('playwright'); const path = require('path');
const BASE = 'https://antonolson47-ctrl.github.io/careys-punchout/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  for (const [label, eng, opts] of [['desktop-chromium', chromium, { viewport: { width: 1280, height: 720 } }], ['iphone-webkit', webkit, (({ defaultBrowserType, ...d }) => d)(devices['iPhone 13'])]]) {
    const b = await eng.launch(); const ctx = await b.newContext(opts); const p = await ctx.newPage(); const errs = [], bad = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
    await p.addInitScript({ path: path.join(__dirname, 'bot.js') });
    const r = await p.goto(BASE + '?v=' + Date.now(), { waitUntil: 'load' }); ok(r.status() === 200, `${label}: live page HTTP ${r.status()}`);
    await p.waitForTimeout(1200);
    ok(await p.title() === "Carey's Punchout", `${label}: title "${await p.title()}"`);
    const man = await p.evaluate(async () => { const l = document.querySelector('link[rel=manifest]'); const j = await (await fetch(l.href)).json(); const ic = await fetch(document.querySelector('link[rel=apple-touch-icon]').href); return { name: j.name, orientation: j.orientation, icons: j.icons.length, apple: ic.status }; });
    ok(man.name === "Carey's Punchout" && man.orientation === 'any' && man.icons >= 2 && man.apple === 200, `${label}: manifest + icons served ${JSON.stringify(man)}`);
    ok(await p.evaluate(() => __CP.scene === 'title'), `${label}: title screen running`);
    if (label.startsWith('iphone')) { const bb = await p.locator('button[data-k=play]').boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    else await p.keyboard.press('Enter');
    await p.waitForTimeout(300); ok(await p.evaluate(() => __CP.scene === 'ladder'), `${label}: ladder reached by ${label.startsWith('iphone') ? 'tap' : 'keyboard'}`);
    await p.evaluate(() => { __CP.startFight(0); window.__BOT = __mkBot({ skill: 0.97, react: 0.18, starAt: 1 }); });
    await p.waitForTimeout(8000);
    const st = await p.evaluate(() => ({ sc: __CP.scene, clock: __CP.F.clock, landed: __CP.F.stats.landed, audio: __CP.audio.state().ctx }));
    ok(st.sc === 'fight' && st.clock < 90 && st.landed > 0, `${label}: fight plays (clock ${st.clock.toFixed(1)}, ${st.landed} punches landed, audio ${st.audio})`);
    if (label.startsWith('iphone')) { await p.setViewportSize(devices['iPhone 13 landscape'].viewport); await p.waitForTimeout(800); const f = await p.evaluate(() => ({ m: __CP.fit.mode, gw: __CP.fit.gw })); ok(f.m === 'landscape', `${label}: rotates to landscape on live site (game width ${f.gw})`); await p.screenshot({ path: path.resolve(__dirname, '../screenshots/live_iphone_landscape.png') }); }
    else await p.screenshot({ path: path.resolve(__dirname, '../screenshots/live_desktop_fight.png') });
    ok(bad.length === 0, `${label}: no failed requests ${JSON.stringify(bad)}`);
    ok(errs.length === 0, `${label}: no console errors ${JSON.stringify(errs.slice(0, 5))}`);
    await b.close();
  }
  console.log(fails ? fails + ' FAILURES' : 'LIVE ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
