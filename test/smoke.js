const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 960, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
  await p.goto('file:///workspace/careys-punchout/CareysPunchout.html'); await sleep(800);
  await p.screenshot({ path: '/tmp/s_title.png' });
  await p.evaluate(() => __CP.go(__CP.Ladder)); await sleep(400); await p.screenshot({ path: '/tmp/s_ladder.png' });
  for (const i of [0, 4]) {
    await p.evaluate(i => { __CP.startFight(i); }, i); await sleep(2200);
    await p.evaluate(() => { const F = __CP.F; F.O.dmg.eyeL = 3; F.O.dmg.eyeR = 1; F.O.dmg.cheekL = 2; F.O.dmg.lip = 2; F.O.dmg.nose = 2; F.O.dmg.cut = 2; F.O.dmg.teeth = 2; F.O.dmg.lump = 1; F.O.dmg.bruises.push({ x: -8, y: -86, r: 5, lv: 2 }); });
    await p.keyboard.press('KeyJ'); await sleep(40); await p.screenshot({ path: `/tmp/s_fight${i}_a.png` });
    await sleep(400); await p.keyboard.press('KeyE'); await sleep(250); await p.screenshot({ path: `/tmp/s_fight${i}_b.png` });
  }
  console.log(JSON.stringify(await p.evaluate(() => ({ sc: __CP.scene, ph: __CP.F.phase, o: __CP.F.O.st, hp: __CP.F.O.hp, fit: __CP.fit.mode }))));
  console.log(errs.slice(0, 10).join('\n') || 'no errors');
  await b.close();
})();
