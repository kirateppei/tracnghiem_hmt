// Kiểm thử logic thuần của game "Chạy năng lượng" (3 làn). Chạy: node tools/runner-test/logic.test.mjs
import assert from 'node:assert/strict';
import * as L from '../../docs/runner-logic.js';
const { CFG } = L;
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok  ' + name); };
const DT = 1 / 60;

function run(g, secs, fn){ for(let t = 0; t < secs && !g.dead; t += DT) L.stepGame(g, DT, fn ? fn(g, t) : {}); }
// ván trống để dựng tình huống: đường không có gì, chướng ngại đặt tay
function blank(hzs = []){
  const g = L.createGame(1), T = g.track;
  T.hz.length = 0; T.coins.length = 0; T.items.length = 0; T.ensure = () => {};
  hzs.forEach((h) => T.hz.push({ y0: 0, y1: 1, w: 1, lane: 1, ...h }));
  T.hz.sort((a, b) => a.x - b.x);
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
ok('độ cao nhảy ≈ 2,8 m, nhảy đôi cao thêm, chạm nhanh nhảy thấp', () => {
  const g = blank(); let peak = 0;
  L.stepGame(g, DT, { jump: true, held: true });
  while(!g.onGround){ L.stepGame(g, DT, { held: true }); peak = Math.max(peak, g.y); }
  assert.ok(Math.abs(peak - 2.8) < 0.1, 'peak ' + peak);
  const g2 = blank(); let p2 = 0, did = false;
  L.stepGame(g2, DT, { jump: true, held: true });
  for(let i = 0; i < 400 && !g2.onGround; i++){ const press = !did && g2.vy < 0; if(press) did = true; L.stepGame(g2, DT, { jump: press, held: true }); p2 = Math.max(p2, g2.y); }
  assert.ok(p2 > 4.0 && p2 < 5.6, 'double ' + p2);
  const tap = blank(); L.stepGame(tap, DT, { jump: true, held: true }); let pk = 0;
  L.stepGame(tap, DT, { held: false }); while(!tap.onGround){ L.stepGame(tap, DT, { held: false }); pk = Math.max(pk, tap.y); }
  assert.ok(pk > 1.3 && pk < 2.0, 'tap ' + pk);
});
ok('đổi làn: 1 làn ≈ 0,15 s, không vượt biên', () => {
  const g = blank(); L.stepGame(g, DT, { left: true }); let t = DT; while(Math.abs(g.lx - 0) > 1e-6 && t < 1){ L.stepGame(g, DT, {}); t += DT; }
  assert.ok(t > 0.12 && t < 0.2, 'mất ' + t); L.stepGame(g, DT, { left: true }); assert.equal(g.lane, 0);
  L.stepGame(g, DT, { right: true }); L.stepGame(g, DT, { right: true }); L.stepGame(g, DT, { right: true }); assert.equal(g.lane, 2);
});
ok('va chạm: đứng trước thùng thì thua; làn bên cạnh thì không; nhảy qua thì sống', () => {
  const g = blank([{ type: 'crate', x: 20, w: 1, y1: 0.9, lane: 1 }]); run(g, 6); assert.ok(g.dead); assert.equal(g.cause, 'crate');
  const h = blank([{ type: 'crate', x: 20, w: 1, y1: 0.9, lane: 0 }]); run(h, 6); assert.ok(!h.dead && h.dist > 30);
  const j = blank([{ type: 'crate', x: 20, w: 1, y1: 0.9, lane: 1 }]); const bot = L.createBot(); run(j, 6, (gg) => L.botStep(gg, bot)); assert.ok(!j.dead && j.dist > 30);
});
ok('giàn dây: nhảy/nhảy đôi không qua, trượt qua được', () => {
  const wire = { type: 'wire', x: 25, w: 0.5, y0: 0.95, y1: 6, lane: 1 };
  const a = blank([{ ...wire }]); L.stepGame(a, DT, { jump: true, held: true }); run(a, 6, () => ({ held: true })); assert.ok(a.dead && a.cause === 'wire');
  const b = blank([{ ...wire }]); const bot = L.createBot(); run(b, 6, (gg) => L.botStep(gg, bot)); assert.ok(!b.dead, 'trượt qua');
  const c = blank([{ ...wire }]); let k = 0;
  run(c, 6, (gg) => { if(gg.dist > 22 && k === 0){ k = 1; return { jump: true, held: true }; } if(k === 1 && gg.vy < 0){ k = 2; return { jump: true, held: true }; } return { held: true }; });
  assert.ok(c.dead && c.cause === 'wire', 'nhảy đôi vẫn chết');
});
ok('tòa nhà: đâm thẳng thì thua, nhảy không qua, đổi sang làn trống thì sống, đâm sườn thì thua', () => {
  const B = (lane) => ({ type: 'building', x: 20, w: 15, y0: 0, y1: 8, lane });
  const a = blank([B(1)]); run(a, 6); assert.ok(a.dead && a.cause === 'building');
  const j = blank([B(1)]); L.stepGame(j, DT, { jump: true, held: true }); run(j, 6, (g) => ({ held: true, jump: g.onGround && g.dist < 19 })); assert.ok(j.dead, 'nhảy cũng không qua tòa nhà');
  const s = blank([B(1)]); run(s, 0.5); L.stepGame(s, DT, { left: true }); run(s, 6); assert.ok(!s.dead && s.dist > 40, 'né sang làn trống');
  const side = blank([B(0)]); run(side, 1.5); L.stepGame(side, DT, { left: true }); run(side, 2); assert.ok(side.dead && side.cause === 'building', 'rẽ vào sườn tòa nhà');
});
ok('khiên cầu chì: chịu một cú va chạm với thùng, bật lại làn cũ khi đâm tòa nhà', () => {
  const g = blank([{ type: 'crate', x: 20, w: 1, y1: 0.9 }, { type: 'crate', x: 40, w: 1, y1: 0.9 }]); g.shield = true;
  run(g, 10); assert.ok(g.dead); assert.ok(g.dist > 38 && g.dist < 41, 'chết ở thùng thứ hai ' + g.dist); assert.equal(g.shield, false);
  const b = blank([{ type: 'building', x: 20, w: 15, y1: 8, lane: 0 }]); b.shield = true; run(b, 1.5); L.stepGame(b, DT, { left: true }); run(b, 3);
  assert.ok(!b.dead && b.lane === 1 && !b.shield, 'bật lại làn giữa');
});
ok('tia nắng: chỉ nhặt đúng làn; nam châm hút từ làn bên; pin sạc nhân đôi điểm', () => {
  const g = blank(); g.track.coins.push({ x: 10, lane: 1, y: 0.9, taken: false }, { x: 12, lane: 0, y: 0.9, taken: false }); run(g, 2); assert.equal(g.coins, 1, 'chỉ làn giữa');
  const m = blank(); m.magnet = 5; m.track.coins.push({ x: 14, lane: 0, y: 3.0, taken: false }); run(m, 1.5); assert.equal(m.coins, 1, 'nam châm hút xu làn bên');
  const a = blank(), b = blank(); b.boost = 8; run(a, 5); run(b, 5); assert.ok(b.energy > a.energy * 1.5);
});
ok('vật phẩm: nhặt đúng làn, bật hiệu ứng', () => {
  const g = blank(); g.track.items.push({ type: 'shield', x: 10, y: 1.1, lane: 1, taken: false }, { type: 'magnet', x: 20, y: 1.1, lane: 0, taken: false });
  run(g, 4); assert.ok(g.shield); assert.equal(g.magnet, 0, 'magnet ở làn khác không nhặt');
  const h = blank(); h.track.items.push({ type: 'boost', x: 10, y: 1.1, lane: 1, taken: false }); run(h, 2); assert.ok(h.boost > 0);
});
ok('công thức điểm: 1 kWh/10 m, 2 tia nắng = 1 điểm, kỷ lục', () => {
  const g = blank(); run(g, 10);
  assert.equal(L.kwhOf(g), Math.floor(g.dist / 10));
  assert.equal(L.finalScore(100, 0), 100); assert.equal(L.finalScore(100, 7), 103); assert.equal(L.finalScore(5.9, 1), 5);
  assert.ok(L.isRecord(10, 9) && !L.isRecord(9, 9) && L.isRecord(1, 0) && L.isRecord(1, undefined));
});
ok('chướng ngại mở khoá đúng theo quãng đường', () => {
  const t = L.createTrack(7); t.ensure(4000);
  const first = (ty) => Math.min(...t.hz.filter((h) => h.type === ty).map((h) => h.x));
  console.log('     lần đầu: thùng', first('crate'), ' nhà', first('building'), ' pin vỡ', first('panel'), ' dây', first('wire'), ' chim', first('bird'));
  assert.ok(first('building') >= 80 && first('panel') >= 100 - 30 && first('wire') >= 250 - 30 && first('bird') >= 500 - 30);
});
ok('sinh đường: các cụm không chồng nhau, luôn còn ≥ 1 làn không bị nhà chắn, nhà dài 10–26 m', () => {
  const t = L.createTrack(3); t.ensure(8000);
  const zs = t.hz.map((h) => [h.z0, h.z1, h]).sort((a, b) => a[0] - b[0]);
  let kinds = {}, maxLanes = 0;
  for(const h of t.hz){ kinds[h.type] = (kinds[h.type] || 0) + 1; if(h.type === 'building'){ assert.ok(h.w >= 10 && h.w <= 26); } }
  // gom cụm: các nhà bắt đầu gần nhau cùng một cụm
  const rows = []; for(const h of t.hz.filter((x) => x.type === 'building')){ const r = rows.find((q) => Math.abs(q.x - h.x) < 5); if(r) r.lanes.add(h.lane); else rows.push({ x: h.x, lanes: new Set([h.lane]) }); }
  rows.forEach((r) => { maxLanes = Math.max(maxLanes, r.lanes.size); });
  console.log('     số vật:', JSON.stringify(kinds), ' nhà tối đa', maxLanes, 'làn/cụm');
  assert.ok(maxLanes <= 2);
  for(let i = 1; i < zs.length; i++){ if(zs[i][2].lane === zs[i - 1][2].lane || true){ /* so sánh theo cụm: z0 của cụm sau ≥ z1 lớn nhất của cụm trước */ } }
  const groups = []; for(const z of zs){ const g = groups[groups.length - 1]; if(g && z[0] < g.z1 + 1) { g.z1 = Math.max(g.z1, z[1]); } else groups.push({ z0: z[0], z1: z[1] }); }
  for(let i = 1; i < groups.length; i++) assert.ok(groups[i].z0 - groups[i - 1].z1 >= 6, 'cụm sát nhau ' + (groups[i].z0 - groups[i - 1].z1));
});

// --- vượt qua được: người máy tối ưu chạy hàng nghìn đường, đủ tốc độ ---
function survive(seed, startDist, meters, birdMode){
  const g = L.createGame(seed); g.dist = startDist; g.track.ensure(startDist + 250);
  // đặt người chơi ở chỗ trống: ngoài mọi vùng bay/trượt/tòa nhà
  let x = startDist; const clear = (q) => !g.track.hz.some((h) => q >= h.z0 - 2 && q <= h.z1 + 2);
  while(!clear(x)) x += 0.5; g.dist = x;
  const bot = L.createBot({ birdMode }); const end = g.dist + meters;
  while(!g.dead && g.dist < end) L.stepGame(g, DT, L.botStep(g, bot));
  return g;
}
ok('mô phỏng 3000 đường × nhiều tốc độ: người máy tối ưu luôn vượt qua', () => {
  let fails = 0, runs = 0, hz = 0, coinsTaken = 0;
  const starts = [0, 150, 400, 800, 1200, 1700, 2400, 5000];
  for(let seed = 1; seed <= 3000; seed++){
    const s = starts[seed % starts.length], mode = ['mix', 'slide', 'full'][seed % 3];
    const g = survive(seed * 7919, s, 450, mode); runs++; hz += g.track.hz.length; coinsTaken += g.coins;
    if(g.dead){ fails++; if(fails <= 6) console.log('     THUA seed', seed * 7919, 'start', s, 'mode', mode, 'ở', g.dist.toFixed(1), g.cause, 'làn', g.lane); }
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
  const dens = (a, b) => t.hz.filter((h) => h.x >= a && h.x < b).length / ((b - a) / 100);
  console.log('     chướng ngại / 100 m: 0–300 m', dens(0, 300).toFixed(1), ' 1000–1500', dens(1000, 1500).toFixed(1), ' 3000–4000', dens(3000, 4000).toFixed(1));
  assert.ok(dens(3000, 4000) > 0.8);
});
console.log('\nTất cả', n, 'nhóm kiểm thử đạt.');
