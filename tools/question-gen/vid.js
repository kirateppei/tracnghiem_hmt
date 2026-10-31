const { chromium } = require('/tmp/claude-0/-home-user-giamsat/3e54c203-7db3-5958-ab24-010244a4f39d/scratchpad/emu/node_modules/playwright-core');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 800, height: 500 } })).newPage();
  await p.goto('file:///tmp/hmt-q/scenes.html');
  const vids = await p.evaluate(() => vids), N = { vid_hotspot: 60, vid_trip: 72, vid_test: 45 };
  for (const v of vids) { fs.mkdirSync('fr/' + v, { recursive: true }); for (let k = 0; k < N[v]; k++) { await p.evaluate(([i, k, n]) => renderV(i, k, n), [v, k, N[v]]); await p.locator('#stage').screenshot({ path: `fr/${v}/${String(k).padStart(3, '0')}.png` }); } }
  await b.close(); console.log('ok');
})();
