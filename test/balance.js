const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript({ path: path.join(__dirname, 'bot.js') });
  await p.goto('file://' + path.resolve(__dirname, '../CareysPunchout.html'));
  await p.waitForTimeout(500);
  const N = +(process.env.N || 6);
  const profiles = { pro: { skill: 0.95, react: 0.2, jumpy: 0.02, starAt: 1 }, avg: { skill: 0.8, react: 0.3, jumpy: 0.06, starAt: 2 }, bad: { skill: 0.6, react: 0.38, jumpy: 0.15, starAt: 3, mash: 6 }, masher: { skill: 0.0, react: 0.5, jumpy: 0, poke: 4, mash: 7, dumb: true } };
  const out = {};
  for (const [name, cfg] of Object.entries(profiles)) {
    out[name] = [];
    for (let i = 0; i < 8; i++) {
      const rs = await p.evaluate(([i, cfg, N]) => { const r = []; for (let k = 0; k < N; k++) r.push(__sim(i, cfg)); return r; }, [i, cfg, N]);
      const w = rs.filter(r => r.win).length, hows = rs.map(r => (r.win ? 'W' : 'L') + (r.how || 'NULL:' + r.t + ':' + JSON.stringify(r.roundTimes))[0] + r.rounds + (r.how ? '' : '!' + r.t + 'ph')).join(' ');
      out[name].push({ opp: rs[0].opp, wins: w, n: N, hows });
      console.log(name.padEnd(6), String(i).padEnd(2), rs[0].opp.padEnd(10), `${w}/${N}`, hows);
    }
  }
  console.log('errors:', errs.slice(0, 5));
  fs.writeFileSync('/tmp/balance.json', JSON.stringify(out, null, 1));
  await b.close();
})();
