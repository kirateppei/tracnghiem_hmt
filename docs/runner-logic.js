/* Logic thuần của game "Chạy năng lượng" (không đụng DOM/Three.js nên Node import để kiểm thử được).
   Đơn vị: mét, giây. Người chơi chạy theo trục +x; mọi vật trên đường có toạ độ x tuyệt đối (mét kể từ vạch xuất phát).
   Các hằng số dễ chỉnh theo phản hồi người chơi nằm ở CFG ngay bên dưới. */

export const CFG = {
  // --- tốc độ & độ khó ---
  V0: 7.5,            // tốc độ lúc xuất phát (m/s)
  VMAX: 17,           // tốc độ tối đa (m/s)
  RAMP_DIST: 2400,    // quãng đường để đạt tốc độ tối đa (≈ 3,5 phút chạy)
  // --- nhảy / trượt ---
  JUMP_H: 2.8,        // độ cao nhảy khi giữ hết (m)
  G: 52,              // trọng lực (m/s²); lớn hơn = nhảy gọn hơn
  DOUBLE_K: 0.9,      // lực nhảy đôi so với nhảy thường
  JUMP_CUT: 0.5,      // thả tay sớm thì vận tốc đi lên nhân hệ số này (nhảy thấp)
  JUMP_MIN_T: 0.08,   // sau chừng này giây mới được "cắt" nhảy (chạm nhanh vẫn nhảy ≥ ~1,6 m)
  COYOTE: 0.1,        // ân hạn mép mái: vừa chạy khỏi mái vẫn nhảy được thêm chừng này giây
  JUMP_BUF: 0.12,     // bấm nhảy sớm trước khi chạm đất vẫn tính
  FASTFALL: 28,       // vuốt xuống khi đang bay: lao xuống nhanh (m/s) rồi trượt khi chạm mái
  SLIDE_T: 0.55,      // thời gian một lần trượt (s)
  LEDGE: 0.35,        // chân thấp hơn mép mái tối đa chừng này vẫn bám được mái
  EDGE_TOL: 0.12,     // dung sai tâm người so với mép mái (m)
  // --- thân người (hộp va chạm hơi nhỏ hơn hình vẽ để dễ tính) ---
  HB_HALF: 0.2, STAND_H: 1.7, SLIDE_H: 0.75, FOOT_SLACK: 0.04, HEAD_SLACK: 0.05,
  // --- chấm điểm ---
  KWH_PER_M: 0.1,     // 1 kWh mỗi 10 m
  COINS_PER_POINT: 2, // cứ 2 tia nắng cộng 1 điểm vào điểm cuối
  // --- vật phẩm ---
  MAGNET_T: 10, BOOST_T: 8, BOOST_MULT: 2, MAGNET_R: 7, INVULN: 1.2,
  // --- sinh đường ---
  REACT: 0.25,        // khoảng nghỉ tối thiểu giữa hai chướng ngại (giây × tốc độ)
  ROOF_MIN: 6, ROOF_MAX: 14,
  UNLOCK: { crate: 0, panel: 100, wire: 250, bird: 500 },  // quãng đường (m) bắt đầu xuất hiện
};

export const V_JUMP = () => Math.sqrt(2 * CFG.G * CFG.JUMP_H);
export const AIR_T = () => 2 * V_JUMP() / CFG.G;                 // thời gian bay khi giữ hết

const HOP_HOLD = () => CFG.JUMP_MIN_T + 0.01;
/* Nhảy ngắn (chạm nhanh rồi thả): độ cao theo thời gian, thời gian bay */
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

export function makeRng(seed){
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const lerp = (a, b, k) => a + (b - a) * k;
const r1 = (x) => Math.round(x * 10) / 10;

/* ---------------- Chướng ngại ---------------- */
// hộp va chạm: x..x+w, y0..y1 (y tính từ mặt mái)
const SPEC = {
  crate: { w: [0.9, 1.2], y0: 0, y1: 0.9, w_: 4 },
  panel: { w: [2.4, 2.4], y0: 0, y1: 0.55, w_: 2 },
  wire:  { w: [0.5, 0.5], y0: 0.95, y1: 6, w_: 2 },
  bird:  { w: [0.8, 0.8], y0: 0.95, y1: 1.65, w_: 2 },
};
/* Vùng người chơi "bận" (bay/trượt) quanh một chướng ngại, tính từ x của nó: [x - rel0, x + rel1] */
function zoneRel(type, w, v){
  const air = AIR_T() * v, hop = HOP_T() * v;
  const slide0 = 0.25 + 0.12 * v, slide1 = CFG.SLIDE_T * v - slide0;
  if(type === 'crate' || type === 'panel') return [hop / 2 - w / 2, hop / 2 + w / 2];
  if(type === 'wire') return [slide0, slide1];
  return [Math.max(air / 2 - w / 2, slide0), Math.max(air / 2 + w / 2, slide1)];   // bird: trượt hoặc nhảy hết cỡ
}

/* ---------------- Đường chạy ---------------- */
export function createTrack(seed = 1){
  const rng = makeRng(seed);
  const T = { seed, rng, roofs: [], hz: [], coins: [], items: [], zones: [], end: -14, pendingGap: 0, lastZ1: 20, nextLen: 60, nextItem: 260 + rng() * 120, _ri: 0 };
  T.ensure = (to) => { while(T.end < to) genRoof(T); };
  T.roofAt = (x) => {
    const R = T.roofs, tol = CFG.EDGE_TOL;
    if(!R.length) return null;
    let i = Math.min(T._ri, R.length - 1);
    while(i > 0 && R[i].a - tol > x) i--;
    while(i < R.length - 1 && R[i].b + tol < x) i++;
    T._ri = i;
    return (x >= R[i].a - tol && x <= R[i].b + tol) ? R[i] : null;
  };
  T.ensure(160);
  return T;
}

function pickType(rng, x){
  const ok = Object.keys(SPEC).filter((k) => x >= CFG.UNLOCK[k]);
  let tot = 0; ok.forEach((k) => { tot += SPEC[k].w_; });
  let p = rng() * tot;
  for(const k of ok){ p -= SPEC[k].w_; if(p <= 0) return k; }
  return ok[0];
}

function genRoof(T){
  const r = T.rng;
  const a = T.end + T.pendingGap;
  const v = speedAt(Math.max(a, 0)), diff = diffAt(a);
  const len = T.nextLen != null ? T.nextLen : r1(CFG.ROOF_MIN + r() * (CFG.ROOF_MAX - CFG.ROOF_MIN));
  T.nextLen = null;
  const b = a + len;
  const air = AIR_T() * v, rr = CFG.REACT * v;
  const roof = { a, b };
  T.roofs.push(roof);
  // 1) hố phía sau mái này (hoặc nối liền sang mái kế nếu không đủ chỗ an toàn)
  let gapW = 0;
  if(r() > 0.35 + 0.25 * diff){
    gapW = r1(Math.min(lerp(2.0, 2.8, diff) + r() * lerp(0.4, 1.7, diff), air - 1.8));
    if(b + gapW / 2 - air / 2 < T.lastZ1 + rr) gapW = 0;
  }
  // 2) chướng ngại trên mái
  let z = Math.max(T.lastZ1 + rr, a + 1.0);
  const hi = gapW > 0 ? (b + gapW / 2 - air / 2) - rr : b + 6;
  const dens = 0.6 + 0.25 * diff;
  const placed = [];
  for(let n = 0; n < 6; n++){
    if(r() > dens) break;
    let done = false;
    for(let tr = 0; tr < 3 && !done; tr++){
      const type = pickType(r, z);
      const sp = SPEC[type];
      const w = r1(lerp(sp.w[0], sp.w[1], r()));
      const [rel0, rel1] = zoneRel(type, w, v);
      const x = r1(z + rel0 + r() * Math.min(3, 0.4 * v));
      if(x < a + 0.8 || x + w > b - 0.8 || x + rel1 > hi) continue;
      const h = { type, x, w, y0: sp.y0, y1: sp.y1, z0: x - rel0, z1: x + rel1 };
      T.hz.push(h); placed.push(h); T.zones.push([h.z0, h.z1]);
      z = h.z1 + rr; T.lastZ1 = h.z1; done = true;
    }
    if(!done) break;
  }
  // 3) hố
  if(gapW > 0){
    const gc = b + gapW / 2;
    const h = { type: 'gap', x: b, w: gapW, y0: 0, y1: 0, z0: gc - air / 2, z1: gc + air / 2 };
    T.hz.push(h); T.zones.push([h.z0, h.z1]); T.lastZ1 = h.z1;
  }
  // 4) tia nắng: vòng cung qua chướng ngại, hàng trên mái, vật phẩm
  const coins = [];
  const addCoin = (x, y) => coins.push({ x: r1(x), y: r1(y), taken: false });
  const arc = (kind, c, n, span) => {
    const T_ = kind === 'full' ? AIR_T() : HOP_T();
    for(let i = 0; i < n; i++){
      const f = (i + 0.5) / n, t = f * T_;
      addCoin(c + (f - 0.5) * span, Math.min(3.6, arcY(kind, t) + 0.85));
    }
  };
  for(const h of placed){
    const c = h.x + h.w / 2;
    if(h.type === 'crate' || h.type === 'panel') arc('hop', c, 5, HOP_T() * v * 0.8);
    else if(h.type === 'wire'){ for(let i = 0; i < 4; i++) addCoin(h.x - 1.2 + i * 1.1, 0.45); }
  }
  if(gapW > 0) arc('full', b + gapW / 2, 7, air * 0.9);
  // khoảng trống trên mái (không nằm trong vùng bay/trượt)
  const free = [];
  let cur = a + 0.6;
  const zs = T.zones.filter((q) => q[1] > a && q[0] < b).sort((p, q) => p[0] - q[0]);
  for(const q of zs){ if(q[0] - 0.3 > cur) free.push([cur, q[0] - 0.3]); cur = Math.max(cur, q[1] + 0.3); }
  if(b - 0.6 > cur) free.push([cur, b - 0.6]);
  T.zones = T.zones.filter((q) => q[1] > b - 40);
  let itemAt = null;
  if(b > T.nextItem){
    const big = free.filter((f) => f[1] - f[0] >= 3).sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]))[0];
    if(big){
      const types = ['magnet', 'shield', 'boost'];
      itemAt = { type: types[Math.floor(r() * 3)], x: r1((big[0] + big[1]) / 2), y: 1.1, taken: false, big };
      T.nextItem = b + 300 + r() * 200;
    }
  }
  for(const f of free){
    const L = f[1] - f[0];
    if(L < 3.5 || r() > 0.8) continue;
    const n = Math.min(8, Math.floor(L / 1.15));
    const x0 = (f[0] + f[1]) / 2 - (n - 1) * 0.575;
    for(let i = 0; i < n; i++) addCoin(x0 + i * 1.15, 0.9);
  }
  if(itemAt){
    const { big, ...it } = itemAt;
    for(let i = coins.length - 1; i >= 0; i--) if(Math.abs(coins[i].x - it.x) < 1.0 && coins[i].y < 1.5) coins.splice(i, 1);
    T.items.push(it);
  }
  coins.sort((p, q) => p.x - q.x);
  T.coins.push(...coins);
  T.end = b; T.pendingGap = gapW;
}

/* ---------------- Trạng thái ván chơi ---------------- */
export function createGame(seed = 1){
  const track = createTrack(seed);
  return {
    track, t: 0, dist: 0, speed: CFG.V0, y: 0, vy: 0, onGround: true, jumps: 0, coyote: 0, jumpBuf: 0, jumpAge: 0, cut: false, held: false,
    sliding: false, slideT: 0, slideQ: false, dead: false, cause: '', deadT: 0, coins: 0, energy: 0,
    magnet: 0, boost: 0, shield: false, invuln: 0, combo: 0, comboT: 0, spin: 0, events: [],
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
  const k = second ? CFG.DOUBLE_K : 1;
  g.vy = V_JUMP() * k; g.onGround = false; g.coyote = 0; g.jumpAge = 0; g.cut = false; g.sliding = false; g.slideQ = false;
  g.jumps = second ? 2 : 1;
  if(second) g.spin = 0.55;
  g.events.push(second ? 'jump2' : 'jump');
}
function tryJump(g){
  if(g.onGround || g.coyote > 0){ doJump(g, false); return true; }
  if(g.jumps < 2){ doJump(g, true); return true; }
  return false;
}
function die(g, cause){ g.dead = true; g.cause = cause; g.deadT = 0; g.events.push('die'); }

export function hitboxOf(g, standing){
  const h = (g.sliding && !standing) ? CFG.SLIDE_H : CFG.STAND_H;
  return { x0: g.dist - CFG.HB_HALF, x1: g.dist + CFG.HB_HALF, y0: g.y + CFG.FOOT_SLACK, y1: g.y + h - CFG.HEAD_SLACK };
}
function overlaps(b, h){ return b.x1 > h.x && b.x0 < h.x + h.w && b.y1 > h.y0 && b.y0 < h.y1; }
function collides(g, standing){
  const b = hitboxOf(g, standing), hz = g.track.hz;
  for(let i = Math.max(0, lowerBound(hz, g.dist - 8)); i < hz.length && hz[i].x < g.dist + 2; i++){
    const h = hz[i];
    if(h.type === 'gap' || h.broken) continue;
    if(overlaps(b, h)) return h;
  }
  return null;
}

export function stepGame(g, dt, inp){
  inp = inp || {};
  const T = g.track;
  if(g.dead){ g.deadT += dt; return; }
  g.t += dt;
  g.speed = speedAt(g.dist);
  const v = g.speed;
  g.held = !!inp.held;
  if(inp.jump) g.jumpBuf = CFG.JUMP_BUF;
  if(inp.slide){
    if(g.onGround){ startSlide(g); }
    else { g.vy = Math.min(g.vy, -CFG.FASTFALL); g.slideQ = true; g.cut = true; }
  }
  if(g.coyote > 0){ g.coyote -= dt; if(g.coyote <= 0 && !g.onGround && g.jumps === 0) g.jumps = 1; }
  if(g.jumpBuf > 0){ g.jumpBuf -= dt; if(tryJump(g)) g.jumpBuf = 0; }
  if(g.spin > 0) g.spin = Math.max(0, g.spin - dt);

  // --- theo chiều đứng ---
  if(g.onGround && !T.roofAt(g.dist)){ g.onGround = false; g.coyote = CFG.COYOTE; g.jumps = 0; g.vy = 0; g.sliding = false; g.jumpAge = 0; g.cut = true; }
  if(!g.onGround){
    g.jumpAge += dt;
    if(g.vy > 0 && !g.held && !g.cut && g.jumpAge >= CFG.JUMP_MIN_T){ g.vy *= CFG.JUMP_CUT; g.cut = true; }
    const py = g.y;
    g.y += g.vy * dt - CFG.G * dt * dt / 2; g.vy -= CFG.G * dt;
    if(g.y <= 0 && g.vy <= 0 && py >= -CFG.LEDGE && T.roofAt(g.dist)){
      g.y = 0; g.vy = 0; g.onGround = true; g.jumps = 0; g.coyote = 0; g.cut = false;
      g.events.push('land');
      if(g.slideQ) startSlide(g);
      if(g.jumpBuf > 0){ g.jumpBuf = 0; doJump(g, false); }
    } else if(g.y < -3.5){ die(g, 'fall'); return; }
  }
  if(g.sliding){
    g.slideT -= dt;
    if(g.slideT <= 0){ if(!collides(g, true)) g.sliding = false; else g.slideT = 0.05; }   // còn dưới giàn dây thì chưa đứng dậy
  }

  // --- tiến lên, điểm ---
  g.dist += v * dt;
  g.energy += v * dt * CFG.KWH_PER_M * (g.boost > 0 ? CFG.BOOST_MULT : 1);
  if(g.magnet > 0) g.magnet = Math.max(0, g.magnet - dt);
  if(g.boost > 0) g.boost = Math.max(0, g.boost - dt);
  if(g.invuln > 0) g.invuln -= dt;
  if(g.comboT > 0){ g.comboT -= dt; if(g.comboT <= 0) g.combo = 0; }
  T.ensure(g.dist + 130);

  // --- va chạm ---
  const h = collides(g, false);
  if(h && g.invuln <= 0){
    if(g.shield){ g.shield = false; g.invuln = CFG.INVULN; h.broken = true; g.events.push('shield'); }
    else { die(g, h.type); return; }
  }

  // --- tia nắng & vật phẩm ---
  const cx = g.dist, cy = g.y + (g.sliding ? 0.4 : 0.85);
  const C = T.coins;
  for(let i = Math.max(0, lowerBound(C, cx - 16)); i < C.length && C[i].x < cx + 16; i++){
    const c = C[i]; if(c.taken) continue;
    let dx = c.x - cx, dy = c.y - cy, d2 = dx * dx + dy * dy;
    if(g.magnet > 0 && d2 < CFG.MAGNET_R * CFG.MAGNET_R){
      const d = Math.sqrt(d2) || 1, s = Math.min(d, (v + 22) * dt);
      c.x -= dx / d * s; c.y -= dy / d * s; dx = c.x - cx; dy = c.y - cy; d2 = dx * dx + dy * dy; c.pulled = true;
    }
    if(d2 < 0.9 * 0.9){
      c.taken = true; g.coins++; g.combo = g.comboT > 0 ? g.combo + 1 : 1; g.comboT = 0.9;
      g.events.push('coin');
    }
  }
  const I = T.items;
  for(let i = 0; i < I.length; i++){
    const it = I[i]; if(it.taken || Math.abs(it.x - cx) > 3) continue;
    const dx = it.x - cx, dy = it.y - cy;
    if(dx * dx + dy * dy < 1.1 * 1.1){
      it.taken = true;
      if(it.type === 'magnet') g.magnet = CFG.MAGNET_T; else if(it.type === 'boost') g.boost = CFG.BOOST_T; else g.shield = true;
      g.events.push('item:' + it.type);
    }
  }
}

/* ---------------- Điểm & kỷ lục ---------------- */
export const kwhOf = (g) => Math.floor(g.energy);
export const finalScore = (kwh, coins) => Math.floor(kwh) + Math.floor(coins / CFG.COINS_PER_POINT);
export const isRecord = (score, best) => score > (best || 0);

/* ---------------- Người máy chơi tối ưu (kiểm thử, và chạy thử trong trình duyệt) ---------------- */
export function createBot(opt = {}){ return { hold: null, birdMode: opt.birdMode || 'mix', mistakes: 0 }; }
export function botStep(g, bot){
  const out = { jump: false, held: false, slide: false };
  const v = g.speed, d = g.dist, T = g.track;
  if(bot.hold){ if(!g.onGround) bot.air = true; else if(bot.air){ bot.hold = null; bot.air = false; } }
  if(bot.hold === 'full') out.held = true;
  if(bot.hold === 'hop') out.held = g.jumpAge < HOP_HOLD();
  // rơi xuống hố mà chưa nhảy đôi → nhảy đôi cứu
  if(!g.onGround && g.y < -0.3 && g.jumps < 2 && g.vy < 0){ out.jump = true; out.held = true; return out; }
  if(!(g.onGround || g.coyote > 0) || g.dead) return out;
  const hz = T.hz;
  for(let i = Math.max(0, windowOf(hz, d - 8)); i < hz.length && hz[i].x < d + 60; i++){
    const h = hz[i];
    if(h.botDone || h.x + h.w < d - 0.3) continue;
    const c = h.x + h.w / 2, air = AIR_T() * v, hop = HOP_T() * v;
    let act = null, trig = 0;
    if(h.type === 'gap'){ act = 'full'; trig = c - air / 2; }
    else if(h.type === 'crate' || h.type === 'panel'){ act = 'hop'; trig = c - hop / 2; }
    else if(h.type === 'wire'){ act = 'slide'; trig = h.x - 0.25 - 0.12 * v; }
    else {
      const m = bot.birdMode === 'mix' ? ((Math.floor(h.x) % 2) ? 'slide' : 'full') : bot.birdMode;
      act = m; trig = m === 'slide' ? h.x - 0.25 - 0.12 * v : c - air / 2;
    }
    if(d < trig) break;                       // chưa tới lượt, hazard sau càng chưa tới
    h.botDone = true;
    if(act === 'slide'){ out.slide = true; }
    else { out.jump = true; out.held = true; bot.hold = act; bot.air = false; }
    break;
  }
  return out;
}
