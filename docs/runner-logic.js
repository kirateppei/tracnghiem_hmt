/* Logic thuần của game "Run now: HMT" kiểu Subway Surfers: đường 3 làn, chạy về phía trước.
   Không đụng DOM/Three.js nên Node import được để kiểm thử.
   Đơn vị: mét, giây. `dist` = quãng đường người chơi đã chạy; vật trên đường có toạ độ x = mét kể từ vạch xuất phát.
   Làn: 0 (trái), 1 (giữa), 2 (phải). Các hằng số dễ chỉnh theo phản hồi người chơi nằm ở CFG ngay bên dưới. */

export const CFG = {
  // --- tốc độ & độ khó ---
  V0: 9.5,            // tốc độ lúc xuất phát (m/s)
  VMAX: 23,           // tốc độ tối đa (m/s)
  RAMP_DIST: 1800,    // quãng đường để đạt tốc độ tối đa (≈ 3,5 phút chạy)
  // --- làn đường ---
  LANE_W: 2.0,        // bề rộng một làn (m)
  LANE_SPEED: 7,      // tốc độ đổi làn (làn/giây): 1 làn mất ≈ 0,14 s
  // --- nhảy / trượt ---
  JUMP_H: 2.8,        // độ cao nhảy khi giữ hết (m)
  G: 52,              // trọng lực (m/s²); lớn hơn = nhảy gọn hơn
  DOUBLE_K: 0.9,      // lực nhảy đôi so với nhảy thường
  JUMP_CUT: 0.5,      // thả tay sớm thì vận tốc đi lên nhân hệ số này (nhảy thấp)
  JUMP_MIN_T: 0.08,   // sau chừng này giây mới được "cắt" nhảy (chạm nhanh vẫn nhảy ≥ ~1,6 m)
  JUMP_BUF: 0.12,     // bấm nhảy sớm trước khi chạm đất vẫn tính
  FASTFALL: 28,       // vuốt xuống khi đang bay: lao xuống nhanh (m/s) rồi trượt khi chạm đất
  SLIDE_T: 0.55,      // thời gian một lần trượt (s)
  // --- thân người (hộp va chạm hơi nhỏ hơn hình vẽ để dễ tính) ---
  HB_HALF: 0.3, OBS_HALF: 0.85, STAND_H: 1.7, SLIDE_H: 0.75, FOOT_SLACK: 0.04, HEAD_SLACK: 0.05,
  // --- chấm điểm ---
  KWH_PER_M: 0.1,     // 1 kWh mỗi 10 m
  COINS_PER_POINT: 2, // cứ 2 tia nắng cộng 1 điểm vào điểm cuối
  // --- vật phẩm ---
  MAGNET_T: 10, BOOST_T: 8, BOOST_MULT: 2, MAGNET_R: 7, INVULN: 1.2,
  BIKE_T: 10, BIKE_SPEED: 2, BIKE_SCORE: 2,   // xe đạp: 10 s, tốc độ x2, mỗi mét ghi gấp đôi kWh và tia nắng nhặt được tính gấp đôi; va chạm làm hỏng xe thay vì thua
  // --- sinh đường ---
  REACT: 0.25,        // khoảng nghỉ tối thiểu giữa hai cụm chướng ngại (giây × tốc độ)
  GAP_K: 0.46, GAP_ADD: 1.4,           // khoảng trống giữa hai cụm = GAP_K × tốc độ + GAP_ADD (đủ đổi tới 2 làn)
  BUILD_MIN: 10, BUILD_MAX: 26,     // chiều dài tòa nhà chắn đường (m)
  ROOF_TOL: 0.25,     // chân cao hơn mái từ mức này trở lên thì không đụng tường (nhảy bám mép mái vẫn lên được)
  ZAP_W: 1.2, ZAP_WARN: 15,         // tia sét: bề rộng (m); hiện cảnh báo trên đất, giáng xuống khi người chơi còn cách ZAP_WARN m
  UNLOCK: { crate: 0, building: 50, panel: 60, zap: 90, tray: 75, wire: 140, bird: 260 },  // quãng đường (m) bắt đầu xuất hiện
};

export const V_JUMP = () => Math.sqrt(2 * CFG.G * CFG.JUMP_H);
export const AIR_T = () => 2 * V_JUMP() / CFG.G;                 // thời gian bay khi giữ hết

const HOP_HOLD = () => CFG.JUMP_MIN_T + 0.01;
function hopParams(){
  const v0 = V_JUMP(), G = CFG.G, tc = HOP_HOLD();
  const yc = v0 * tc - G * tc * tc / 2, vc = (v0 - G * tc) * CFG.JUMP_CUT;
  const air = tc + (vc + Math.sqrt(vc * vc + 2 * G * yc)) / G;
  return { tc, yc, vc, air };
}
export const HOP_T = () => hopParams().air + 0.03;
/* Độ cao chân tại thời điểm t kể từ lúc rời đất. kind: 'full' | 'hop' */
export function arcY(kind, t){
  const v0 = V_JUMP(), G = CFG.G;
  if(kind === 'full') return Math.max(0, v0 * t - G * t * t / 2);
  const h = hopParams();
  if(t <= h.tc) return v0 * t - G * t * t / 2;
  const u = t - h.tc;
  return Math.max(0, h.yc + h.vc * u - G * u * u / 2);
}

export const speedAt = (d) => CFG.V0 + (CFG.VMAX - CFG.V0) * Math.min(1, Math.max(0, d) / CFG.RAMP_DIST);
export const diffAt = (d) => Math.min(1, Math.max(0, d) / CFG.RAMP_DIST);
export const laneX = (lane) => (lane - 1) * CFG.LANE_W;

export function makeRng(seed){
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const lerp = (a, b, k) => a + (b - a) * k;
const r1 = (x) => Math.round(x * 10) / 10;

/* ---------------- Chướng ngại ---------------- */
// hộp va chạm: x..x+w (dọc đường), y0..y1 (độ cao); chiếm trọn một làn
const SPEC = {
  crate: { w: [1.2, 1.6], y0: 0, y1: 0.9, w_: 4 },     // biến tần: nhảy qua hoặc nhảy lên mặt trên chạy tiếp
  panel: { w: [2.2, 2.2], y0: 0, y1: 0.55, w_: 2 },    // tấm pin vỡ: nhảy
  wire:  { w: [0.5, 0.5], y0: 0.95, y1: 6, w_: 2 },    // giàn dây điện: phải trượt
  bird:  { w: [0.8, 0.8], y0: 0.95, y1: 1.65, w_: 2 }, // chim bay thấp: trượt hoặc nhảy hết cỡ
};
export const BUILDING_H = 1.3;   // nhà thấp: nhảy lên mái chạy tiếp được (nhảy ngắn ≈ 1,6 m, nhảy hết cỡ 2,8 m)
/* Vùng người chơi "bận" (bay/trượt) quanh một chướng ngại, tính từ x của nó: [x - rel0, x + rel1] */
function zoneRel(type, w, v){
  const air = AIR_T() * v, hop = HOP_T() * v;
  const slide0 = 0.25 + 0.12 * v, slide1 = CFG.SLIDE_T * v - slide0;
  if(type === 'crate' || type === 'panel') return [hop / 2 - w / 2, hop / 2 + w / 2];
  if(type === 'wire') return [slide0, slide1];
  return [Math.max(air / 2 - w / 2, slide0), Math.max(air / 2 + w / 2, slide1)];   // bird
}

/* ---------------- Đường chạy ---------------- */
export function createTrack(seed = 1){
  const rng = makeRng(seed);
  const T = { seed, rng, hz: [], coins: [], items: [], prevZ1: 18, rows: 0, nextItem: 220 + rng() * 120, end: 0 };
  T.ensure = (to) => { while(T.end < to) genRow(T); };
  T.ensure(220);
  return T;
}

function pickType(rng, x){
  const ok = Object.keys(SPEC).filter((k) => x >= CFG.UNLOCK[k]);
  let tot = 0; ok.forEach((k) => { tot += SPEC[k].w_; });
  let p = rng() * tot;
  for(const k of ok){ p -= SPEC[k].w_; if(p <= 0) return k; }
  return ok[0];
}

function genRow(T){
  const r = T.rng;
  const v = speedAt(T.prevZ1 + 20), diff = diffAt(T.prevZ1);
  const G = CFG.GAP_K * v + CFG.GAP_ADD;
  const z0min = T.prevZ1 + G;
  const roll = r();
  const kind = T.rows++ === 0 ? 'haz' : T.prevZ1 < CFG.UNLOCK.building ? (roll < 0.3 ? 'coins' : 'haz') : (roll < 0.09 ? 'coins' : roll < 0.46 ? 'haz' : (roll < 0.72 || T.prevZ1 < CFG.UNLOCK.zap) ? 'build' : 'zap');
  const kindF = (kind === 'haz' && T.prevZ1 >= CFG.UNLOCK.tray && r() < 0.24) ? 'tray' : kind;   // một phần cụm chướng ngại thường đổi thành máng cáp vắt ngang đường
  const coins = [];
  const addCoin = (x, lane, y) => coins.push({ x: r1(x), lane, y: r1(y), taken: false });
  const line = (x0, lane, n, step, y = 0.9) => { for(let i = 0; i < n; i++) addCoin(x0 + i * step, lane, y); };
  let z0, z1;
  if(kindF === 'tray'){
    // máng đi dây điện vắt ngang cả 3 làn, thấp: bắt buộc trượt qua (không đổi làn, không nhảy qua được)
    const w = 0.6, [a] = zoneRel('wire', w, v), x = r1(z0min + a);
    for(const lane of [0, 1, 2]) T.hz.push({ type: 'tray', lane, x, w, y0: 0.95, y1: 6, z0: r1(z0min), z1: r1(x + zoneRel('wire', w, v)[1]) });
    for(let i = 0; i < 4; i++) addCoin(x - 1.2 + i * 1.1, 1, 0.45);
    z0 = z0min; z1 = x + zoneRel('wire', w, v)[1];
  } else if(kind === 'haz'){
    const k = r() < 0.3 ? 1 : (r() < 0.7 || diff < 0.15) ? 2 : 3;
    const lanes = [0, 1, 2].sort(() => r() - 0.5).slice(0, k);
    const list = lanes.map((lane) => { const type = pickType(r, z0min); const sp = SPEC[type]; return { type, lane, w: r1(lerp(sp.w[0], sp.w[1], r())), y0: sp.y0, y1: sp.y1 }; });
    // căn tâm cụm tại c sao cho vùng bay/trượt bắt đầu đúng z0min
    let lo = 1e9;
    for(const h of list){ const [a] = zoneRel(h.type, h.w, v); lo = Math.min(lo, -a - h.w / 2); }
    const c = z0min - lo;
    for(const h of list){
      h.x = r1(c - h.w / 2); const [a, b] = zoneRel(h.type, h.w, v); h.z0 = h.x - a; h.z1 = h.x + b; T.hz.push(h);
      if(h.type === 'crate' || h.type === 'panel'){ const span = HOP_T() * v * 0.8, n = 5; for(let i = 0; i < n; i++){ const f = (i + 0.5) / n; addCoin(c + (f - 0.5) * span, h.lane, Math.min(3.4, arcY('hop', f * HOP_T()) + 0.85)); } }
      else if(h.type === 'wire'){ for(let i = 0; i < 4; i++) addCoin(h.x - 1.2 + i * 1.1, h.lane, 0.45); }
    }
    const free = [0, 1, 2].filter((l) => !lanes.includes(l));
    if(free.length && r() < 0.8) line(c - 5, free[Math.floor(r() * free.length)], 6, 1.8);
    z0 = Math.min(...list.map((h) => h.z0)); z1 = Math.max(...list.map((h) => h.z1));
  } else if(kind === 'build'){
    const k = r() < 0.55 ? 1 : 2;
    const lanes = [0, 1, 2].sort(() => r() - 0.5).slice(0, k);
    const free = [0, 1, 2].filter((l) => !lanes.includes(l));
    let end = 0;
    lanes.forEach((lane, i) => {
      const L = r1(CFG.BUILD_MIN + r() * (CFG.BUILD_MAX - CFG.BUILD_MIN));
      const x = r1(z0min + (i ? r() * 4 : 0));
      T.hz.push({ type: 'building', lane, x, w: L, y0: 0, y1: BUILDING_H, z0: x, z1: x + L });
      end = Math.max(end, x + L);
    });
    const fl = free[Math.floor(r() * free.length)];
    const n = Math.min(12, Math.floor((end - z0min) / 1.8));
    line(z0min + 1, fl, n, 1.8);
    for(const h of T.hz.slice(-lanes.length)){ const m = Math.max(2, Math.floor(h.w / 2) - 1); for(let i = 0; i < m; i++) addCoin(h.x + 1.5 + i * ((h.w - 3) / Math.max(1, m - 1)), h.lane, BUILDING_H + 0.9); }   // thưởng cho ai nhảy lên mái
    z0 = z0min; z1 = end;
  } else if(kind === 'zap'){
    const k = r() < 0.6 ? 1 : 2;
    const lanes = [0, 1, 2].sort(() => r() - 0.5).slice(0, k);
    const free = [0, 1, 2].filter((l) => !lanes.includes(l));
    for(const lane of lanes) T.hz.push({ type: 'zap', lane, x: r1(z0min), w: CFG.ZAP_W, y0: 0, y1: 7, z0: r1(z0min), z1: r1(z0min + CFG.ZAP_W) });
    line(z0min - 6, free[Math.floor(r() * free.length)], 5, 1.8);
    z0 = z0min; z1 = z0min + CFG.ZAP_W;
  } else {
    z0 = z0min; z1 = z0 + 18 + r() * 14;
    const shape = r();
    const lane = Math.floor(r() * 3), n = Math.floor((z1 - z0 - 2) / 1.5);
    if(shape < 0.5) line(z0 + 1, lane, n, 1.5);
    else { let l = lane; for(let i = 0; i < n; i++){ if(i && i % 4 === 0){ l = Math.max(0, Math.min(2, l + (r() < 0.5 ? -1 : 1))); } addCoin(z0 + 1 + i * 1.5, l, 0.9); } }
  }
  // đoạn trống phía trước cụm: có thể có hàng tia nắng
  if(G > 6 && r() < 0.6) line(T.prevZ1 + 1.2, Math.floor(r() * 3), Math.min(5, Math.floor((G - 2) / 1.2)), 1.2);
  // vật phẩm
  if(z0 > T.nextItem){
    const types = ['magnet', 'shield', 'boost', 'bike'];
    T.items.push({ type: types[Math.floor(r() * 4)], x: r1(T.prevZ1 + G * 0.5), lane: Math.floor(r() * 3), y: 1.1, taken: false });
    T.nextItem = z0 + 280 + r() * 200;
  }
  coins.sort((a, b) => a.x - b.x);
  T.coins.push(...coins);
  T.prevZ1 = z1; T.end = z1;
}

/* ---------------- Trạng thái ván chơi ---------------- */
export function createGame(seed = 1){
  const track = createTrack(seed);
  return {
    track, t: 0, dist: 0, speed: CFG.V0, y: 0, vy: 0, onGround: true, jumps: 0, jumpBuf: 0, jumpAge: 0, cut: false, held: false,
    lane: 1, lx: 1, fromLane: 1, sliding: false, slideT: 0, slideQ: false, dead: false, cause: '', deadT: 0, coins: 0, energy: 0,
    magnet: 0, boost: 0, bike: 0, shield: false, invuln: 0, combo: 0, comboT: 0, spin: 0, events: [],
  };
}

function lowerBound(arr, x){
  let lo = 0, hi = arr.length;
  while(lo < hi){ const m = (lo + hi) >> 1; if(arr[m].x < x) lo = m + 1; else hi = m; }
  return lo;
}
export const windowOf = lowerBound;

function startSlide(g){ g.sliding = true; g.slideT = CFG.SLIDE_T; g.slideQ = false; g.events.push('slide'); }
function doJump(g, second){
  g.vy = V_JUMP() * (second ? CFG.DOUBLE_K : 1); g.onGround = false; g.jumpAge = 0; g.cut = false; g.sliding = false; g.slideQ = false;
  g.jumps = second ? 2 : 1;
  if(second) g.spin = 0.55;
  g.events.push(second ? 'jump2' : 'jump');
}
function tryJump(g){
  if(g.onGround){ doJump(g, false); return true; }
  if(g.jumps < 2){ doJump(g, true); return true; }
  return false;
}
function die(g, cause){ g.dead = true; g.cause = cause; g.deadT = 0; g.events.push('die'); }

const CLIMB = new Set(['building', 'crate']);   // vật có thể nhảy lên và chạy trên mặt trên: nhà thấp, biến tần
/* Độ cao mặt đỡ dưới chân: 0 (đất) hoặc mái một tòa nhà nếu chân (ở độ cao fromY) đang ở trên mái hoặc chỉ thấp hơn mái ≤ ROOF_TOL */
export function floorAt(g, fromY){
  const hz = g.track.hz, cx = laneX(g.lx), z0 = g.dist - 0.3, z1 = g.dist + 0.3;
  let f = 0;
  for(let i = Math.max(0, lowerBound(hz, g.dist - CFG.BUILD_MAX - 6)); i < hz.length && hz[i].x < g.dist + 2; i++){
    const h = hz[i];
    if(!CLIMB.has(h.type) || h.broken) continue;
    const hx = laneX(h.lane);
    if(z1 > h.x && z0 < h.x + h.w && cx + CFG.HB_HALF > hx - CFG.OBS_HALF && cx - CFG.HB_HALF < hx + CFG.OBS_HALF && fromY >= h.y1 - CFG.ROOF_TOL && h.y1 > f) f = h.y1;
  }
  return f;
}
export function hitboxOf(g, standing){
  const h = (g.sliding && !standing) ? CFG.SLIDE_H : CFG.STAND_H;
  const cx = laneX(g.lx);
  return { z0: g.dist - 0.3, z1: g.dist + 0.3, x0: cx - CFG.HB_HALF, x1: cx + CFG.HB_HALF, y0: g.y + CFG.FOOT_SLACK, y1: g.y + h - CFG.HEAD_SLACK };
}
function overlaps(b, h){
  const hx = laneX(h.lane);
  return b.z1 > h.x && b.z0 < h.x + h.w && b.x1 > hx - CFG.OBS_HALF && b.x0 < hx + CFG.OBS_HALF && b.y1 > h.y0 && b.y0 < h.y1 - (CLIMB.has(h.type) ? CFG.ROOF_TOL : 0);
}
function collides(g, standing){
  const b = hitboxOf(g, standing), hz = g.track.hz;
  for(let i = Math.max(0, lowerBound(hz, g.dist - CFG.BUILD_MAX - 6)); i < hz.length && hz[i].x < g.dist + 2; i++){
    const h = hz[i];
    if(h.broken) continue;
    if(overlaps(b, h)) return h;
  }
  return null;
}

export function stepGame(g, dt, inp){
  inp = inp || {};
  const T = g.track;
  if(g.dead){ g.deadT += dt; return; }
  g.t += dt;
  g.speed = speedAt(g.dist) * (g.bike > 0 ? CFG.BIKE_SPEED : 1);
  const v = g.speed;
  g.held = !!inp.held;
  if(inp.jump) g.jumpBuf = CFG.JUMP_BUF;
  if(inp.slide){
    if(g.onGround){ startSlide(g); }
    else { g.vy = Math.min(g.vy, -CFG.FASTFALL); g.slideQ = true; g.cut = true; }
  }
  if(inp.left && g.lane > 0){ g.fromLane = g.lane; g.lane--; g.events.push('lane'); }
  if(inp.right && g.lane < 2){ g.fromLane = g.lane; g.lane++; g.events.push('lane'); }
  if(g.jumpBuf > 0){ g.jumpBuf -= dt; if(tryJump(g)) g.jumpBuf = 0; }
  if(g.spin > 0) g.spin = Math.max(0, g.spin - dt);
  // đổi làn
  const dl = g.lane - g.lx, st = CFG.LANE_SPEED * dt;
  g.lx += Math.max(-st, Math.min(st, dl));

  // --- theo chiều đứng ---
  if(g.onGround && g.y > 0 && floorAt(g, g.y) < g.y - 0.01){   // hết mái nhà: rơi xuống
    g.onGround = false; g.vy = 0; g.jumps = 1; g.jumpAge = 1; g.cut = true; g.sliding = false; g.slideQ = false;
  }
  if(!g.onGround){
    g.jumpAge += dt;
    if(g.vy > 0 && !g.held && !g.cut && g.jumpAge >= CFG.JUMP_MIN_T){ g.vy *= CFG.JUMP_CUT; g.cut = true; }
    const prevY = g.y;
    g.y += g.vy * dt - CFG.G * dt * dt / 2; g.vy -= CFG.G * dt;
    const fl = floorAt(g, prevY);
    if(g.y <= fl && g.vy <= 0){
      g.y = fl; g.vy = 0; g.onGround = true; g.jumps = 0; g.cut = false;
      g.events.push('land');
      if(g.slideQ) startSlide(g);
      if(g.jumpBuf > 0){ g.jumpBuf = 0; doJump(g, false); }
    }
  }
  if(g.sliding){
    g.slideT -= dt;
    if(g.slideT <= 0){ if(!collides(g, true)) g.sliding = false; else g.slideT = 0.05; }   // còn dưới giàn dây thì chưa đứng dậy
  }

  // --- tiến lên, điểm ---
  g.dist += v * dt;
  g.energy += v * dt * CFG.KWH_PER_M * Math.max(g.boost > 0 ? CFG.BOOST_MULT : 1, g.bike > 0 ? CFG.BIKE_SCORE : 1);
  if(g.magnet > 0) g.magnet = Math.max(0, g.magnet - dt);
  if(g.boost > 0) g.boost = Math.max(0, g.boost - dt);
  if(g.bike > 0){ g.bike = Math.max(0, g.bike - dt); if(g.bike === 0){ g.invuln = Math.max(g.invuln, 1.0); g.events.push('bike_end'); } }   // hết xe: tốc độ giảm đột ngột nên được an toàn một nhịp
  if(g.invuln > 0) g.invuln -= dt;
  if(g.comboT > 0){ g.comboT -= dt; if(g.comboT <= 0) g.combo = 0; }
  T.ensure(g.dist + 200);

  // --- va chạm ---
  const h = collides(g, false);
  if(h && g.invuln <= 0){
    if(g.bike > 0 || g.shield){
      if(g.bike > 0){ g.bike = 0; g.events.push('bike_break'); } else { g.shield = false; g.events.push('shield'); }
      if(h.type === 'building'){ g.lane = g.fromLane !== g.lane ? g.fromLane : (g.lane === 1 ? 0 : 1); g.invuln = 0.6; }   // bật lại làn cũ
      else { g.invuln = CFG.INVULN; h.broken = true; }
    } else { die(g, h.type); return; }
  }

  // --- tia nắng & vật phẩm ---
  const px = laneX(g.lx), cy = g.y + (g.sliding ? 0.4 : 0.85);
  const C = T.coins, R = CFG.MAGNET_R;
  for(let i = Math.max(0, lowerBound(C, g.dist - 16)); i < C.length && C[i].x < g.dist + 16; i++){
    const c = C[i]; if(c.taken) continue;
    const wx = c.px != null ? c.px : laneX(c.lane);
    let dz = c.x - g.dist, dx = wx - px, dy = c.y - cy, d2 = dz * dz + dx * dx + dy * dy;
    if(g.magnet > 0 && d2 < R * R){
      const d = Math.sqrt(d2) || 1, s = Math.min(d, (v + 22) * dt);
      c.x -= dz / d * s; c.px = wx - dx / d * s; c.y -= dy / d * s;
      dz = c.x - g.dist; dx = c.px - px; dy = c.y - cy; d2 = dz * dz + dx * dx + dy * dy; c.pulled = true;
    }
    if(d2 < 0.9 * 0.9){
      c.taken = true; g.coins += g.bike > 0 ? CFG.BIKE_SCORE : 1; g.combo = g.comboT > 0 ? g.combo + 1 : 1; g.comboT = 0.9;
      g.events.push('coin');
    }
  }
  for(const it of T.items){
    if(it.taken || Math.abs(it.x - g.dist) > 3) continue;
    const dz = it.x - g.dist, dx = laneX(it.lane) - px, dy = it.y - cy;
    if(dz * dz + dx * dx + dy * dy < 1.2 * 1.2){
      it.taken = true;
      if(it.type === 'magnet') g.magnet = CFG.MAGNET_T; else if(it.type === 'boost') g.boost = CFG.BOOST_T; else if(it.type === 'bike') g.bike = CFG.BIKE_T; else g.shield = true;
      g.events.push('item:' + it.type);
    }
  }
}

/* ---------------- Điểm & kỷ lục ---------------- */
export const kwhOf = (g) => Math.floor(g.energy);
export const finalScore = (kwh, coins) => Math.floor(kwh) + Math.floor(coins / CFG.COINS_PER_POINT);
export const isRecord = (score, best) => score > (best || 0);

/* ---------------- Người máy chơi tối ưu (kiểm thử, và chạy thử trong trình duyệt) ---------------- */
const isBlk = (h) => h.type === 'building' || h.type === 'zap';
export function createBot(opt = {}){ return { hold: null, air: false, birdMode: opt.birdMode || 'mix' }; }
export function botStep(g, bot){
  const out = { jump: false, held: false, slide: false, left: false, right: false };
  const v = g.speed, d = g.dist, hz = g.track.hz;
  if(bot.hold){ if(!g.onGround) bot.air = true; else if(bot.air){ bot.hold = null; bot.air = false; } }
  if(bot.hold === 'full') out.held = true;
  if(bot.hold === 'hop') out.held = g.jumpAge < HOP_HOLD();
  // ---- chọn làn: tránh tòa nhà ----
  const active = new Set(), next = new Set(); let sN = Infinity, pending = false;
  const i0 = Math.max(0, windowOf(hz, d - CFG.BUILD_MAX - 6));
  for(let i = i0; i < hz.length && hz[i].x < d + 70; i++){
    const h = hz[i];
    if(isBlk(h)){ if(h.x + h.w > d - 0.6 && h.x <= d + 1.5) active.add(h.lane); else if(h.x > d + 1.5 && h.x < sN) sN = h.x; }
  }
  for(let i = i0; i < hz.length && hz[i].x < sN + 6; i++){ const h = hz[i]; if(isBlk(h) && h.x > d + 1.5 && sN - d < 45) next.add(h.lane); }
  for(let i = i0; i < hz.length && hz[i].x < Math.min(sN, d + 70); i++){ const h = hz[i]; if(!isBlk(h) && h.x + h.w > d - 1.0) pending = true; }
  const blocked = new Set([...active, ...next]);
  const settled = Math.abs(g.lx - g.lane) < 0.1;
  if(blocked.has(g.lane) && settled && !pending){
    let best = -1;
    for(const l of [0, 1, 2]) if(!blocked.has(l) && (best < 0 || Math.abs(l - g.lane) < Math.abs(best - g.lane))) best = l;
    if(best >= 0){
      const step = best > g.lane ? 1 : -1;
      if(!active.has(g.lane + step)){ if(step > 0) out.right = true; else out.left = true; return out; }
    }
  }
  // ---- hành động với chướng ngại trong làn hiện tại ----
  if(!g.onGround || !settled || g.dead) return out;
  for(let i = i0; i < hz.length && hz[i].x < d + 60; i++){
    const h = hz[i];
    if(isBlk(h) || h.lane !== g.lane || h.botDone || h.x + h.w < d - 0.3) continue;
    const c = h.x + h.w / 2, air = AIR_T() * v, hop = HOP_T() * v;
    let act, trig;
    if(h.type === 'crate' || h.type === 'panel'){ act = 'hop'; trig = c - hop / 2; }
    else if(h.type === 'wire' || h.type === 'tray'){ act = 'slide'; trig = h.x - 0.25 - 0.12 * v; }
    else {
      const m = bot.birdMode === 'mix' ? ((Math.floor(h.x) % 2) ? 'slide' : 'full') : bot.birdMode;
      act = m; trig = m === 'slide' ? h.x - 0.25 - 0.12 * v : c - air / 2;
    }
    if(d < trig) continue;
    h.botDone = true;
    if(act === 'slide') out.slide = true;
    else { out.jump = true; out.held = true; bot.hold = act; bot.air = false; }
    break;
  }
  return out;
}
