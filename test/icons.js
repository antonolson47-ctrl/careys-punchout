const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => { const out = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '../CareysPunchout.html')); await p.waitForTimeout(400);
  for (const [n, f] of [[180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png'], [32, 'favicon-32.png']]) {
    const d = await p.evaluate(n => __CP.iconURL(n), n); fs.writeFileSync(path.join(out, f), Buffer.from(d.split(',')[1], 'base64'));
  }
  await b.close(); })();
