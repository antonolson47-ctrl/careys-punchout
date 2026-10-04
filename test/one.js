const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.addInitScript({ path: '/workspace/careys-punchout/test/bot.js' });
  await p.goto('file:///workspace/careys-punchout/CareysPunchout.html'); await p.waitForTimeout(300);
  const args = JSON.parse(process.argv[2]);
  for (const [i, cfg] of args) console.log(JSON.stringify(await p.evaluate(([i, cfg]) => __sim(i, cfg), [i, cfg])));
  await b.close(); })();
