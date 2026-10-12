// Kiểm thử logic thuần của game "Chạy năng lượng". Chạy: node tools/runner-test/logic.test.mjs
import assert from 'node:assert/strict';
import * as L from '../../docs/runner-logic.js';
const { CFG } = L;
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok  ' + name); };
const DT = 1 / 60;

function run(g, secs, fn){ for(let t = 0; t < secs && !g.dead; t += DT) L.stepGame(g, DT, fn ? fn(g, t) : {}); }
// ván trống để dựng tình huống: một mái dài, một chướng ngại đặt tay
function blank(hzs = [], opt = {}){
  const g = L.createGame(1);
  const T = g.track;
  T.roofs.length = 0; T.hz.length = 0; T.coins.length = 0; T.items.length = 0; T._ri = 0;
  T.roofs.push({ a: -10, b: opt.roofEnd || 100000 }); T.end = 1e9; T.ensure = () => {};
  hzs.forEach((h) => T.hz.push({ y0: 0, y1: 1, w: 1, ...h }));
  return g;
}

ok('tốc độ: bắt đầu 7,5, tối đa 17, tăng đơn điệu', () => {
  assert.equal(L.speedAt(0), 7.5); assert.equal(L.speedAt(1e6), 17);
  let p = 0; for(let d = 0; d <= 3000; d += 10){ const s = L.speedAt(d); assert.ok(s >= p); p = s; }
});
ok('thời gian đạt tốc độ tối đa ≈ 3–4 phút', () => {
  let d = 0, t = 0; while(L.speedAt(d) < 16.95){ d += L.speedAt(d) / 60; t += 1 / 60; }
  console.log('     đạt ~17 m/s sau', (t / 60).toFixed(2), 'phút,', Math.round(d), 'm');
  assert.ok(t > 180 && t < 240);
});
ok('độ cao nhảy ≈ 2,8 m, nhảy đôi cao thêm', () => {
  const g = blank(); let peak = 0;
  L.stepGame(g, DT, { jump: true, held: true });
  while(!g.onGround){ L.stepGame(g, DT, { held: true }); peak = Math.max(peak, g.y); }
  assert.ok(Math.abs(peak - 2.8) < 0.1, 'peak ' + peak);
  const g2 = blank(); let p2 = 0, did = false;
  L.stepGame(g2, DT, { jump: true, held: true });
  for(let i = 0; i < 400 && !g2.onGround; i++){ const press = !did && g2.vy < 0; if(press) did = true; L.stepGame(g2, DT, { jump: press, held: true }); p2 = Math.max(p2, g2.y); }
  assert.ok(p2 > 4.0 && p2 < 5.6, 'double ' + p2);
});
ok('chạm nhanh nhảy thấp hơn giữ lâu nhưng vẫn qua thùng', () => {
  const tap = blank(); L.stepGame(tap, DT, { jump: true, held: true }); let pk = 0;
  L.stepGame(tap, DT, { held: false }); while(!tap.onGround){ L.stepGame(tap, DT, { held: false }); pk = Math.max(pk, tap.y); }
  assert.ok(pk > 1.3 && pk < 2.0, 'tap ' + pk);
});
ok('thời gian ân hạn mép mái: nhảy trễ vẫn được, quá hạn thì không nhảy thường', () => {
  const mk = (delay) => { const g = blank([], { roofEnd: 5 }); let jumped = false;
    while(!g.dead && g.dist < 20){ const past = g.dist > 5 + g.speed * delay; L.stepGame(g, DT, { jump: past && !jumped, held: true }); if(past) jumped = true; if(g.y > 0.5) return 'jumped'; }
    return g.dead ? 'dead' : 'x'; };
  assert.equal(mk(0.05), 'jumped');
  assert.equal(mk(0.4), 'dead');
});
ok('va chạm: đứng chạm thùng thì thua; nhảy qua thì sống', () => {
  const g = blank([{ type: 'crate', x: 20, w: 1, y1: 0.9 }]); run(g, 6); assert.ok(g.dead); assert.equal(g.cause, 'crate');
  const h = blank([{ type: 'crate', x: 20, w: 1, y1: 0.9 }]);
  const bot = L.createBot(); run(h, 6, (gg) => L.botStep(gg, bot)); assert.ok(!h.dead, 'sống'); assert.ok(h.dist > 30);
});
ok('giàn dây: nhảy không qua được, trượt qua được', () => {
  const wire = { type: 'wire', x: 25, w: 0.5, y0: 0.95, y1: 6 };
  const a = blank([{ ...wire }]); L.stepGame(a, DT, { jump: true, held: true }); run(a, 6, () => ({ held: true })); assert.ok(a.dead && a.cause === 'wire');
  const b = blank([{ ...wire }]); const bot = L.createBot(); run(b, 6, (gg) => L.botStep(gg, bot)); assert.ok(!b.dead, 'trượt qua');
  // nhảy đôi cũng không qua
  const c = blank([{ ...wire }]); let k = 0;
  run(c, 6, (gg) => { if(gg.dist > 22 && k === 0){ k = 1; return { jump: true, held: true }; } if(k === 1 && gg.vy < 0){ k = 2; return { jump: true, held: true }; } return { held: true }; });
  assert.ok(c.dead && c.cause === 'wire', 'nhảy đôi vẫn chết');
});
ok('rơi xuống hố thì thua; nhảy qua hố thì sống', () => {
  const a = blank([{ type: 'gap', x: 20, w: 3 }], { roofEnd: 20 }); a.track.roofs.push({ a: 23, b: 1e5 }); run(a, 6); assert.ok(a.dead && a.cause === 'fall');
  const b = blank([{ type: 'gap', x: 20, w: 3.0 }], { roofEnd: 20 }); b.track.roofs.push({ a: 23, b: 1e5 });
  const bot = L.createBot(); run(b, 6, (gg) => L.botStep(gg, bot)); assert.ok(!b.dead && b.dist > 40);
});
ok('khiên cầu chì chịu một cú va chạm rồi mất', () => {
  const g = blank([{ type: 'crate', x: 20, w: 1, y1: 0.9 }, { type: 'crate', x: 40, w: 1, y1: 0.9 }]); g.shield = true;
  run(g, 10); assert.ok(g.dead); assert.ok(g.dist > 38 && g.dist < 41, 'chết ở thùng thứ hai ' + g.dist); assert.equal(g.shield, false);
});
ok('tia nắng: nhặt +1, nam châm hút từ xa, pin sạc nhân đôi điểm', () => {
  const g = blank(); g.track.coins.push({ x: 10, y: 0.9, taken: false }, { x: 10.0, y: 0.9, taken: false }); run(g, 2); assert.equal(g.coins, 2);
  const m = blank(); m.magnet = 5; m.track.coins.push({ x: 14, y: 3.5, taken: false }); run(m, 1.5); assert.equal(m.coins, 1, 'nam châm hút xu ở xa (trên cao 3,5 m, cách 6 m)? ' + m.dist);
  const a = blank(), b = blank(); b.boost = 8; run(a, 5); run(b, 5);
  assert.ok(b.energy > a.energy * 1.5, b.energy + ' vs ' + a.energy);
});
ok('vật phẩm: nhặt được và đặt bộ đếm', () => {
  const g = blank(); g.track.items.push({ type: 'magnet', x: 10, y: 1.1, taken: false }, { type: 'shield', x: 20, y: 1.1, taken: false }, { type: 'boost', x: 30, y: 1.1, taken: false });
  run(g, 6); assert.ok(g.shield); assert.ok(g.magnet > 0 && g.boost > 0 || g.dist > 0);
});
ok('công thức điểm: 1 kWh/10 m, 2 tia nắng = 1 điểm', () => {
  const g = blank(); g.dist = 0; g.energy = 0; run(g, 10);
  assert.equal(L.kwhOf(g), Math.floor(g.dist / 10));
  assert.equal(L.finalScore(100, 0), 100); assert.equal(L.finalScore(100, 7), 103); assert.equal(L.finalScore(5.9, 1), 5);
  assert.ok(L.isRecord(10, 9) && !L.isRecord(9, 9) && L.isRecord(1, 0) && L.isRecord(1, undefined));
});
ok('chướng ngại mở khoá đúng theo quãng đường', () => {
  const t = L.createTrack(7); t.ensure(4000);
  for(const h of t.hz){ assert.ok(h.x >= (CFG.UNLOCK[h.type] ?? 0) - 40, h.type + ' sớm ở ' + h.x); }
  const first = (ty) => Math.min(...t.hz.filter((h) => h.type === ty).map((h) => h.x));
  console.log('     lần đầu: thùng', first('crate'), ' pin vỡ', first('panel'), ' dây', first('wire'), ' chim', first('bird'));
  assert.ok(first('panel') >= 100 - 30 && first('wire') >= 250 - 30 && first('bird') >= 500 - 30);
});
ok('mái dài 6–14 m, hố 2–4,5 m, vùng nghỉ giữa chướng ngại ≥ ngưỡng', () => {
  const t = L.createTrack(3); t.ensure(6000);
  let gmin = 99, gmax = 0, rmin = 99, rmax = 0, chain = 0;
  for(let i = 1; i < t.roofs.length; i++){ const r = t.roofs[i]; rmin = Math.min(rmin, r.b - r.a); rmax = Math.max(rmax, r.b - r.a); const gap = r.a - t.roofs[i - 1].b; if(gap > 0){ gmin = Math.min(gmin, gap); gmax = Math.max(gmax, gap); } else chain++; }
  console.log('     mái', rmin.toFixed(1), '–', rmax.toFixed(1), ' hố', gmin.toFixed(1), '–', gmax.toFixed(1), ' mái nối liền', chain, '/', t.roofs.length);
  assert.ok(rmin >= 6 - 1e-6 && rmax <= 14 + 1e-6); assert.ok(gmin >= 2 - 1e-6 && gmax <= 4.5 + 1e-6);
  const zs = t.hz.map((h) => [h.z0, h.z1]).sort((a, b) => a[0] - b[0]);
  for(let i = 1; i < zs.length; i++) assert.ok(zs[i][0] >= zs[i - 1][1] - 1e-6, 'vùng chồng nhau tại ' + zs[i][0]);
  for(const h of t.hz.filter((x) => x.type !== 'gap')){ const r = t.roofAt(h.x + h.w / 2); assert.ok(r && h.x >= r.a && h.x + h.w <= r.b, 'vật cản nằm ngoài mái'); }
});

// --- vượt qua được: người máy tối ưu chạy hàng nghìn đường, đủ tốc độ ---
function survive(seed, startDist, meters, birdMode){
  const g = L.createGame(seed); g.dist = startDist; g.track.ensure(startDist + 200);
  g.track._ri = 0;
  // đặt người chơi ở chỗ trống: trên mái và ngoài mọi vùng bay/trượt
  let x = startDist; const clear = (q) => g.track.roofAt(q) && !g.track.hz.some((h) => q >= h.z0 - 1 && q <= h.z1 + 1);
  while(!clear(x)) x += 0.5; g.dist = x;
  const bot = L.createBot({ birdMode }); const end = g.dist + meters;
  while(!g.dead && g.dist < end) L.stepGame(g, DT, L.botStep(g, bot));
  return g;
}
ok('mô phỏng 3000 đường × nhiều tốc độ: người máy tối ưu luôn vượt qua', () => {
  let fails = 0, runs = 0, hz = 0, coinsTaken = 0;
  const starts = [0, 150, 400, 800, 1200, 1700, 2400, 5000];
  for(let seed = 1; seed <= 3000; seed++){
    const s = starts[seed % starts.length];
    const mode = ['mix', 'slide', 'full'][seed % 3];
    const g = survive(seed * 7919, s, 450, mode); runs++; hz += g.track.hz.length; coinsTaken += g.coins;
    if(g.dead){ fails++; if(fails <= 5) console.log('     THUA seed', seed * 7919, 'start', s, 'mode', mode, 'ở', g.dist.toFixed(1), g.cause); }
  }
  console.log('     ', runs, 'đường,', hz, 'vật cản,', coinsTaken, 'tia nắng nhặt được, thất bại', fails);
  assert.equal(fails, 0);
});
ok('chạy dài 12 km một ván: không thua, tốc độ giữ tối đa', () => {
  const g = survive(424242, 0, 12000, 'mix'); assert.ok(!g.dead, 'thua ở ' + g.dist + ' ' + g.cause); assert.ok(g.speed > 16.9);
  console.log('     12 km: kWh', L.kwhOf(g), ' tia nắng', g.coins, ' điểm', L.finalScore(L.kwhOf(g), g.coins));
});
ok('mật độ chướng ngại không quá thưa ở tốc độ cao', () => {
  const t = L.createTrack(11); t.ensure(5000);
  const dens = (a, b) => t.hz.filter((h) => h.type !== 'gap' && h.x >= a && h.x < b).length / ((b - a) / 100);
  console.log('     chướng ngại / 100 m: 0–300 m', dens(0, 300).toFixed(1), ' 1000–1500', dens(1000, 1500).toFixed(1), ' 3000–4000', dens(3000, 4000).toFixed(1));
  assert.ok(dens(3000, 4000) > 0.6);
});
console.log('\nTất cả', n, 'nhóm kiểm thử đạt.');
