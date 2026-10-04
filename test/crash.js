const { webkit, devices } = require('playwright'); const path = require('path');
(async () => {
  const b = await webkit.launch(); const { defaultBrowserType, ...dev } = devices['iPhone 13'];
  const ctx = await b.newContext({ ...dev }); const p = await ctx.newPage(); let last = null; let crashed = false;
  p.on('crash', () => { crashed = true; console.log('CRASH; last state:', JSON.stringify(last)); });
  p.on('console', m => { if (m.type() === 'error') console.log('console error', m.text()); });
  await p.addInitScript({ path: path.join(__dirname, 'bot.js') });
  await p.goto('file://' + path.resolve(__dirname, '../CareysPunchout.html')); await p.waitForTimeout(600);
  await p.touchscreen.tap(200, 500); // gesture -> audio
  const mode = process.argv[2] || 'ts3';
  for (let fight = 0; fight < 6 && !crashed; fight++) {
    await p.evaluate(([i, mode]) => { __CP.startFight(i); window.__BOT = __mkBot({ skill: 0.95, react: 0.2 }); if (mode === 'ts3') __CP.F.ts = 3; if (mode === 'mute') { __CP.S.mute = true; __CP.F.ts = 3; } if (mode === 'novoice') { __CP.S.voice = false; __CP.F.ts = 3; } }, [fight % 8, mode]);
    for (let i = 0; i < 400 && !crashed; i++) {
      try { last = await p.evaluate(() => ({ sc: __CP.scene, ph: __CP.F.phase, clock: __CP.F.clock, ost: __CP.F.O.st, log: __CP.audio.log.slice(-12), parts: __CP.parts.length, st: __CP.audio.state() })); } catch (e) { break; }
      if (last.sc === 'corner') await p.evaluate(() => __CP.Corner.done());
      if (last.sc !== 'fight' && last.sc !== 'corner') break;
      await p.waitForTimeout(200);
    }
    console.log('fight', fight, 'ended', last && last.sc, last && last.ph);
  }
  await b.close().catch(() => { });
})();
