// Kiểm thử trình duyệt giả lập (Chromium headless, WebGL phần mềm). Dùng:
//   node tools/runner-test/browser.mjs <thư-mục-ảnh> [đường-dẫn-playwright-core]
// Cần: playwright-core đã cài (npm i playwright-core trong một thư mục tạm) và Chromium trong /opt/pw-browsers.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.resolve(here, '../../docs');
const out = path.resolve(process.argv[2] || path.join(here, 'shots')); fs.mkdirSync(out, { recursive: true });
const require = createRequire(process.argv[3] || '/tmp/claude-0/pw/');
const { chromium } = require('playwright-core');
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`).find((p) => fs.existsSync(p));
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); let f = path.join(docs, decodeURIComponent(u.pathname));
  if(u.pathname === '/runner-test.html') { res.setHeader('content-type', 'text/html'); return res.end(HTML); }
  if(!f.startsWith(docs) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.statusCode = 404; return res.end('no'); }
  res.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res);
});
const HTML = `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><body style="margin:0;background:#223"><div id=c style="width:100vw;height:100vh"></div>
<script type=module>
import { runner, supported } from './runner.js?v=t';
window.supported = supported;
const board = [];
const names = ['Nguyễn Văn An','Trần Thị Bích','Lê Hoàng Long','Phạm Minh Tuấn','Hoàng Anh','Đỗ Thu Hà','Vũ Quang Huy','Bùi Thanh Tâm','Ngô Đức','Đặng Mai Linh','Phan Quốc Bảo','Lý Thị Hồng'];
names.forEach((n,i)=>board.push({uid:'u'+i,name:n,photo:i%3===0?'https://lh3.googleusercontent.com/none.png':'',best:4000-i*213,kwh:3000,coins:900}));
board.push({uid:'me',name:'Người chơi thử',photo:'',best:3650,kwh:3300,coins:700}, {uid:'me',name:'Người chơi thử',photo:'',best:3100,kwh:2900,coins:400});
window.submitted = [];
window.api = runner(document.getElementById('c'), {
  sfx: { beep(){ window.__sfx = (window.__sfx||0)+1; }, noise(){}, buzz(){} },
  loadBoard: (p) => { (window.periods = window.periods || []).push(p); return new Promise(r => setTimeout(() => r(board.slice()), 60)); },
  getQuestion: () => ({ q: 'Hai cộng hai bằng mấy?', options: ['3', '4', '5', '6'], correct: 1, explain: 'Hai cộng hai là bốn.' }),
  submitScore: (rec) => { window.submitted.push(rec); return Promise.resolve(); },
  me: { uid: 'me', name: 'Người chơi thử', photo: '' }, onExit(){ window.exited = true; }, seed: 4242,
});
</script>`;
await new Promise((r) => srv.listen(0, r));
const base = 'http://127.0.0.1:' + srv.address().port;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [];
async function open(w, h){
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
  const page = await ctx.newPage();
  page.on('console', (m) => { if(m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(base + '/runner-test.html'); await page.waitForFunction(() => window.api, null, { timeout: 20000 });
  await page.waitForTimeout(900);
  return page;
}
const shot = (page, name) => page.screenshot({ path: path.join(out, name + '.png') });
let ok = true; const check = (c, m) => { console.log((c ? 'ok   ' : 'LỖI ') + m); if(!c) ok = false; };

let page = await open(390, 760);
check(await page.evaluate(() => window.supported()), 'supported() = true');
await shot(page, '1-menu-nam');
await page.click('.rn-char[data-g=f]'); await page.waitForTimeout(500); await shot(page, '2-menu-nu');
check(await page.evaluate(() => localStorage.getItem('gm_runner_char')) === '"f"', 'lưu lựa chọn nhân vật Nữ');
await page.click('.rn-char[data-g=m]');
await page.click('#rn-start');
await page.evaluate(() => { window.api.debug.dbg.autoplay = true; });
await page.waitForTimeout(3500);
const st = await page.evaluate(() => { const g = window.api.debug.game; return { dist: g.dist, dead: g.dead, coins: g.coins, screen: window.api.debug.screen }; });
console.log('     sau 3,5 s: ', JSON.stringify(st));
check(!st.dead && st.dist > 8, 'bot chạy được trong trình duyệt');
await shot(page, '3-chay-ngay');
// ban đêm
await page.evaluate(() => { window.api.debug.dbg.phase = 0.78; }); await page.waitForTimeout(500); await shot(page, '4-chay-dem');
await page.evaluate(() => { window.api.debug.dbg.phase = 0.5; const g = window.api.debug.game; g.shield = true; g.magnet = 6; }); await page.waitForTimeout(500); await shot(page, '5-hoang-hon-khien');
await page.evaluate(() => { window.api.debug.dbg.phase = null; window.api.debug.dbg.autoplay = false; });
// tạm dừng bằng phím P và tiếp tục
await page.keyboard.press('p'); check(await page.evaluate(() => window.api.debug.screen) === 'pause', 'phím P tạm dừng');
await page.keyboard.press('p'); check(await page.evaluate(() => window.api.debug.screen) === 'play', 'phím P tiếp tục');
// thua: đứng yên chờ chạm chướng ngại / rơi
await page.waitForFunction(() => ['over', 'revive'].includes(window.api.debug.screen), null, { timeout: 30000 });
if(await page.evaluate(() => window.api.debug.screen) === 'revive'){ await page.click('.rn-ropt:nth-child(1)'); await page.waitForFunction(() => window.api.debug.screen === 'over', null, { timeout: 8000 }); }
await page.waitForTimeout(300); await shot(page, '6-het-pin');
const over = await page.evaluate(() => ({ k: document.querySelector('#rn-ok').textContent, c: document.querySelector('#rn-oc').textContent, s: document.querySelector('#rn-os').textContent, rec: !document.querySelector('#rn-newrec').hidden, best: localStorage.getItem('gm_runner_best'), sub: window.submitted.length }));
console.log('     hết pin:', JSON.stringify(over));
check(+over.s >= 0 && over.best != null || +over.s === 0, 'điểm cuối hiển thị & kỷ lục lưu cục bộ');
await page.click('#rn-board2'); await page.waitForTimeout(500); await shot(page, '7-xep-hang');
const rows = await page.evaluate(() => ({ n: document.querySelectorAll('.rn-row2').length, me: document.querySelectorAll('.rn-row2.me').length }));
check(rows.n === 10 && rows.me === 2, 'bảng chỉ hiện top 10; cùng một người xuất hiện nhiều dòng và đều được đánh dấu ' + JSON.stringify(rows));
await page.click('#rn-tabs button[data-p="year"]'); await page.waitForTimeout(300); await page.click('#rn-tabs button[data-p="all"]'); await page.waitForTimeout(300);
check(JSON.stringify(await page.evaluate(() => window.periods)) === JSON.stringify(['month', 'year', 'all']), 'ba tab Tháng này / Năm nay / Tất cả gọi đúng kỳ');
await page.click('#rn-bclose'); await page.click('#rn-again'); await page.waitForTimeout(600);
check(await page.evaluate(() => window.api.debug.screen) === 'play', 'Chơi lại');
// hồi sinh bằng câu hỏi: đúng = chạy tiếp (chỉ một lần mỗi ván), lần chết thứ hai = hết pin
await page.evaluate(() => { const g = window.api.debug.game; g.track.hz = []; g.dead = true; g.cause = 'crate'; g.deadT = 0; g.events.push('die'); });
await page.waitForFunction(() => window.api.debug.screen === 'revive', null, { timeout: 8000 });
check(await page.evaluate(() => document.querySelectorAll('.rn-ropt').length) === 4, 'chết lần đầu: hiện câu hỏi hồi sinh với 4 đáp án');
await page.click('.rn-ropt:nth-child(2)'); await page.waitForFunction(() => window.api.debug.screen === 'play', null, { timeout: 5000 });
check(await page.evaluate(() => window.api.debug.game.dead) === false, 'trả lời đúng: hồi sinh, chạy tiếp');
await page.evaluate(() => { const g = window.api.debug.game; g.invuln = 0; g.track.hz = []; g.dead = true; g.cause = 'crate'; g.deadT = 0; g.events.push('die'); });
await page.waitForFunction(() => window.api.debug.screen === 'over', null, { timeout: 8000 });
check(true, 'chết lần hai trong cùng ván: không còn cơ hội hồi sinh, hết pin');
await page.click('#rn-again'); await page.waitForTimeout(500);
await page.evaluate(() => { const g = window.api.debug.game; g.track.hz = []; g.dead = true; g.cause = 'crate'; g.deadT = 0; g.events.push('die'); });
await page.waitForFunction(() => window.api.debug.screen === 'revive', null, { timeout: 8000 });
await page.click('.rn-ropt:nth-child(1)'); await page.waitForFunction(() => window.api.debug.screen === 'over', null, { timeout: 6000 });
check(true, 'trả lời sai: hết pin');
await page.click('#rn-again'); await page.waitForTimeout(500);
// điều khiển cảm ứng: chạm = nhảy, vuốt trái/phải = đổi làn, vuốt xuống = trượt
const box = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await page.evaluate(() => { const g = window.api.debug.game; g.track.hz = g.track.hz.filter((h) => h.x < g.dist - 30); });   // đường trống để thử điều khiển không bị chướng ngại làm gián đoạn
await page.waitForTimeout(150);
// chạm đơn thuần KHÔNG còn nhảy (tránh nhận nhầm khi vuốt)
await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.waitForTimeout(400); await page.mouse.up(); await page.waitForTimeout(200);
check(await page.evaluate(() => window.api.debug.game.jumps) === 0 && await page.evaluate(() => window.api.debug.game.y) < 0.05, 'chạm đơn thuần không nhảy, không làm gì');
// vuốt lên = nhảy (một cú), vuốt lên lần nữa trên không = nhảy đôi
await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x, box.y - 60, { steps: 4 }); await page.waitForTimeout(250);
check(await page.evaluate(() => window.api.debug.game.y) > 0.05 || await page.evaluate(() => window.api.debug.game.jumps) > 0, 'vuốt lên = nhảy'); check(await page.evaluate(() => window.api.debug.game.jumps) === 1, 'một lần vuốt lên = đúng một cú nhảy (không nhảy đôi)'); await page.mouse.up(); await page.waitForTimeout(1200);
await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x - 70, box.y, { steps: 4 }); await page.waitForTimeout(200); await page.mouse.up();
check(await page.evaluate(() => window.api.debug.game.lane) === 0, 'vuốt trái = sang làn trái');
for(let k = 0; k < 2; k++){ await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 70, box.y, { steps: 4 }); await page.waitForTimeout(150); await page.mouse.up(); await page.waitForTimeout(300); }
// một lần chạm chỉ một thao tác: kéo dài không đổi thêm làn, không nhảy kèm
await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x - 60, box.y, { steps: 3 }); await page.mouse.move(box.x - 140, box.y, { steps: 5 }); await page.waitForTimeout(200); await page.mouse.up();
check(await page.evaluate(() => window.api.debug.game.lane) === 1 && await page.evaluate(() => window.api.debug.game.jumps) === 0, 'một lần vuốt dài chỉ đổi đúng một làn, không kèm nhảy'); await page.waitForTimeout(400);
for(let k = 0; k < 1; k++){ await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 70, box.y, { steps: 4 }); await page.waitForTimeout(150); await page.mouse.up(); await page.waitForTimeout(300); }
check(await page.evaluate(() => window.api.debug.game.lane) === 2, 'vuốt phải hai lần = sang làn phải');
await page.waitForTimeout(900);
await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x, box.y + 60, { steps: 4 }); await page.waitForTimeout(200);
const sl = await page.evaluate(() => window.api.debug.game.sliding || window.api.debug.game.slideQ); await page.mouse.up();
check(sl, 'vuốt xuống = trượt');
// dọn dẹp khi gỡ container
await page.evaluate(() => { window.__c = document.getElementById('c'); window.__c.remove(); }); await page.waitForTimeout(400);
check(await page.evaluate(() => !document.querySelector('canvas')), 'tự dọn dẹp khi container bị gỡ khỏi trang');
await page.context().close();

// màn ngang + nhân vật nữ khi chạy
page = await open(900, 440);
await page.click('.rn-char[data-g=f]'); await page.click('#rn-start'); await page.evaluate(() => { window.api.debug.dbg.autoplay = true; }); await page.waitForTimeout(2500);
await shot(page, '8-ngang-nu-chay');
await page.context().close();
// nhân vật nam cận cảnh để xem logo trên áo
page = await open(420, 520);
await page.evaluate(() => window.api.debug.setCam(1)); await page.waitForTimeout(700); await shot(page, '9-logo-ao-nam');
await page.context().close();


// các vật cản và vật phẩm (dựng tay một đoạn đường trước mặt người chơi)
page = await open(1100, 460);
await page.click('#rn-start');
await page.evaluate(() => {
  const g = window.api.debug.game, T = g.track, d = g.dist;
  T.hz.length = 0; T.coins.length = 0; T.items.length = 0;
  const add = (o) => T.hz.push({ y0: 0, y1: 1, w: 1, ...o });
  add({ type: 'crate', x: d + 9, w: 1.1, y1: 0.9, lane: 0 }); add({ type: 'panel', x: d + 9, w: 2.2, y1: 0.55, lane: 2 });
  add({ type: 'wire', x: d + 17, w: 0.5, y0: 0.95, y1: 6, lane: 1 }); add({ type: 'bird', x: d + 17, w: 0.8, y0: 0.95, y1: 1.65, lane: 0 });
  add({ type: 'building', x: d + 26, w: 18, y1: 8, lane: 1 }); add({ type: 'building', x: d + 26, w: 14, y1: 8, lane: 2 });
  T.hz.sort((a, b) => a.x - b.x);
  for(let i = 0; i < 8; i++) T.coins.push({ x: d + 6 + i * 1.8, lane: 1, y: 0.9, taken: false });
  T.items.push({ type: 'magnet', x: d + 6, y: 1.1, lane: 1, taken: false }, { type: 'shield', x: d + 13, y: 1.1, lane: 2, taken: false }, { type: 'boost', x: d + 14, y: 1.1, lane: 0, taken: false });
  T.items.sort((a, b) => a.x - b.x);
  window.api.debug.setCam(0);
});
await page.waitForTimeout(700);
await page.evaluate(() => { window.api.pause(); document.querySelector('.rn-pausescr').style.display = 'none'; });
await shot(page, '10-vat-can');
await page.context().close();

console.log(errs.length ? 'Cảnh báo/lỗi console:\n' + [...new Set(errs)].slice(0, 12).join('\n') : 'Không có lỗi console.');
await browser.close(); srv.close();
process.exit(ok ? 0 : 1);
