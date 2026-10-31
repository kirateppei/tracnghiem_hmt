const { chromium } = require('/tmp/claude-0/-home-user-giamsat/3e54c203-7db3-5958-ab24-010244a4f39d/scratchpad/emu/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 800, height: 500 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///tmp/hmt-q/scenes.html');
  const ids = await p.evaluate(() => ids);
  require('fs').mkdirSync('png', { recursive: true });
  for (const id of ids) { await p.evaluate((i) => render(i), id); await p.locator('#stage').screenshot({ path: `png/${id}.png` }); }
  console.log(ids.length, 'errs', JSON.stringify(errs)); await b.close();
})();
