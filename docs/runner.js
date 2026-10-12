/* Mini game 3D "Chạy năng lượng": kỹ thuật viên điện mặt trời chạy vô tận trên các mái nhà (2.5D, góc nhìn ngang).
   Module ES, tự đủ: games.js nạp bằng import('./runner.js?v=...') rồi gọi runner(container, opt). Không tự truy cập Firebase.
   Phần luật chơi/sinh đường nằm ở runner-logic.js (thuần, kiểm thử bằng Node). Xem INTEGRACION_RUNNER.md. */
import * as THREE from './vendor/three.module.min.js';
// nạp logic cùng chuỗi ?v= với file này để không lệch phiên bản khi cache
const L = await import('./runner-logic.js' + new URL(import.meta.url).search);
const { CFG } = L;

/* ================= Hằng số dễ chỉnh theo phản hồi người chơi (giao diện/điều khiển) ================= */
const UI = {
  SWIPE_PX: 24,          // vuốt xuống ít nhất chừng này điểm ảnh thì tính là trượt
  SWIPE_RATIO: 1.0,      // độ lệch dọc phải lớn hơn độ lệch ngang × hệ số này
  CYCLE_M: 2000,         // chu kỳ đổi bầu trời: sáng → trưa → hoàng hôn → đêm (mét)
  START_PHASE: 0.02,     // pha bầu trời lúc xuất phát (0 = sáng sớm)
  VIS_W_LAND: 17,        // bề ngang cảnh nhìn thấy (m) khi màn ngang
  VIS_W_PORT: 12.5,        // ... khi màn dọc (điện thoại)
  PLAYER_X: 0.24,        // vị trí nhân vật theo chiều ngang màn hình (0–1)
  GROUND_Y: 0.28,        // mặt mái nằm cách đáy màn hình bao nhiêu phần chiều cao
  MAX_DPR: 2,
  KEY: { best: 'gm_runner_best', rec: 'gm_runner_bestrec', char: 'gm_runner_char', synced: 'gm_runner_synced' },
};

/* ================= Sổ đăng ký skin (thêm skin mới: thêm một mục, rồi gọi setSkin(id)) ================= */
export const SKINS = {
  dongphuc: { name: 'Đồng phục vàng cam', shirt: '#ff9a1f', shirt2: '#f08a10', pants: '#f58a12', helmet: '#ffd21a', band: '#dfe3e8', boots: '#3a2f2a', glove: '#3d3d44', belt: '#5a3a1e', skin: '#e6b08a' },
};
export const supported = () => { try{ const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }catch(e){ return false; } };

const LOGO_URL = new URL('./logo.png', import.meta.url).href;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const store = (k, v) => { try{ if(v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); }catch(e){} return null; };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function canvasTex(w, h, draw, opt = {}){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if(opt.repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}

/* ================= Bầu trời theo quãng đường ================= */
const hex = (s) => new THREE.Color(s);
const SKY = [   // p, top, bottom, ánh sáng trời, bóng tối, cường độ nắng, đêm (0–1), độ cao mặt trời
  { p: 0.00, top: '#69b4ee', bot: '#ffe0b0', hemi: '#fff2dc', gnd: '#6a7a60', sun: '#ffd9a0', hi: 1.0, hs: 1.9, night: 0, sy: 0.30 },
  { p: 0.25, top: '#2d8be6', bot: '#c5e6ff', hemi: '#ffffff', gnd: '#6f8a6a', sun: '#fff6e0', hi: 1.15, hs: 2.3, night: 0, sy: 0.78 },
  { p: 0.50, top: '#5a4aa0', bot: '#ff9a55', hemi: '#ffd6b8', gnd: '#6a5a66', sun: '#ff9a5a', hi: 0.85, hs: 1.5, night: 0.05, sy: 0.22 },
  { p: 0.62, top: '#241f5c', bot: '#e5604a', hemi: '#a8a0d0', gnd: '#38344f', sun: '#ff7a50', hi: 0.6, hs: 0.8, night: 0.5, sy: -0.02 },
  { p: 0.75, top: '#050a22', bot: '#1a2a58', hemi: '#7f90d8', gnd: '#202840', sun: '#7f90d8', hi: 0.55, hs: 0.45, night: 1, sy: -0.4 },
  { p: 0.90, top: '#16224e', bot: '#6a5a8e', hemi: '#a8a8d8', gnd: '#38384f', sun: '#ffb080', hi: 0.6, hs: 0.7, night: 0.7, sy: -0.2 },
  { p: 1.00, top: '#69b4ee', bot: '#ffe0b0', hemi: '#fff2dc', gnd: '#6a7a60', sun: '#ffd9a0', hi: 1.0, hs: 1.9, night: 0, sy: 0.30 },
];
SKY.forEach((k) => { k.c = { top: hex(k.top), bot: hex(k.bot), hemi: hex(k.hemi), gnd: hex(k.gnd), sun: hex(k.sun) }; });
const _c = { top: new THREE.Color(), bot: new THREE.Color(), hemi: new THREE.Color(), gnd: new THREE.Color(), sun: new THREE.Color() };
function skyAt(p){
  let i = 0; while(i < SKY.length - 2 && p > SKY[i + 1].p) i++;
  const a = SKY[i], b = SKY[i + 1], k = smooth(0, 1, (p - a.p) / (b.p - a.p));
  for(const n of ['top', 'bot', 'hemi', 'gnd', 'sun']) _c[n].copy(a.c[n]).lerp(b.c[n], k);
  return { c: _c, hi: lerp(a.hi, b.hi, k), hs: lerp(a.hs, b.hs, k), night: lerp(a.night, b.night, k), sy: lerp(a.sy, b.sy, k) };
}

/* ================= Texture vẽ bằng canvas ================= */
function facadeTex(){
  const m = canvasTex(128, 256, (c, w, h) => {
    c.fillStyle = '#d6d0c2'; c.fillRect(0, 0, w, h);
    for(let i = 0; i < 500; i++){ c.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; c.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
    for(let r = 0; r < 8; r++) for(let k = 0; k < 4; k++){
      c.fillStyle = '#4c6a86'; c.fillRect(8 + k * 30, 10 + r * 31, 20, 20);
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(8 + k * 30, 10 + r * 31, 20, 6);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(6 + k * 30, 31 + r * 31, 24, 3);
    }
  }, { repeat: true });
  const e = canvasTex(128, 256, (c, w, h) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for(let r = 0; r < 8; r++) for(let k = 0; k < 4; k++) if(rnd() < 0.5){ c.fillStyle = rnd() < 0.7 ? '#ffd27a' : '#fff0c0'; c.fillRect(8 + k * 30, 10 + r * 31, 20, 20); }
  }, { repeat: true });
  return { map: m, emi: e };
}
const roofTopTex = () => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#b9b9b4'; c.fillRect(0, 0, w, h);
  for(let i = 0; i < 1500; i++){ c.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.07})`; c.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; c.strokeRect(0, 0, w, h);
  c.fillStyle = '#f2c230'; c.fillRect(0, h - 10, w, 10);   // vạch vàng ở mép gần camera
}, { repeat: true });
function panelTex(cracked){
  return canvasTex(128, 64, (c, w, h) => {
    c.fillStyle = '#c9d2dc'; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2c6fd0'); g.addColorStop(1, '#173f8c');
    c.fillStyle = g; c.fillRect(3, 3, w - 6, h - 6);
    c.strokeStyle = 'rgba(220,235,255,.65)'; c.lineWidth = 1.2;
    for(let x = 3; x <= w - 3; x += (w - 6) / 6){ c.beginPath(); c.moveTo(x, 3); c.lineTo(x, h - 3); c.stroke(); }
    for(let y = 3; y <= h - 3; y += (h - 6) / 3){ c.beginPath(); c.moveTo(3, y); c.lineTo(w - 3, y); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(3, 3); c.lineTo(w * 0.55, 3); c.lineTo(w * 0.2, h - 3); c.lineTo(3, h - 3); c.fill();
    if(cracked){
      c.fillStyle = '#0a0f1a'; c.fillRect(w * 0.5, 3, w * 0.17, h * 0.36);
      c.strokeStyle = '#eef3ff'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(w * 0.3, 3); c.lineTo(w * 0.46, h * 0.5); c.lineTo(w * 0.34, h - 3); c.moveTo(w * 0.46, h * 0.5); c.lineTo(w * 0.8, h * 0.62); c.lineTo(w * 0.95, h * 0.4); c.moveTo(w * 0.62, h * 0.5); c.lineTo(w * 0.7, h - 3); c.stroke();
    }
  }, { repeat: true });
}
const railTex = () => canvasTex(128, 64, (c, w, h) => {
  c.clearRect(0, 0, w, h);
  c.fillStyle = '#9aa3ad'; c.fillRect(0, 4, w, 6); c.fillRect(0, h * 0.55, w, 4); c.fillStyle = '#f2c230'; c.fillRect(0, 0, w, 4);
  c.fillStyle = '#7d8791'; for(let x = 6; x < w; x += 32) c.fillRect(x, 4, 5, h - 4);
}, { repeat: true });
const crateTex = () => canvasTex(128, 96, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#e0452f'); g.addColorStop(1, '#a52a1c');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#f2c230'; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 10, w, 10);
  c.fillStyle = '#2a2a2a'; for(let x = -20; x < w; x += 24){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 12, 0); c.lineTo(x + 2, 10); c.lineTo(x - 10, 10); c.fill(); }
  c.fillStyle = '#f5e9d0'; c.font = '800 20px "Trebuchet MS",Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ĐỒ NGHỀ', w / 2, h / 2 + 2);
  c.fillStyle = '#c9ccd2'; c.fillRect(w / 2 - 12, 12, 24, 8); c.strokeStyle = 'rgba(0,0,0,.3)'; c.strokeRect(1, 1, w - 2, h - 2);
});
const coinFace = () => canvasTex(96, 96, (c, w, h) => {
  c.fillStyle = '#ffc928'; c.fillRect(0, 0, w, h);
  c.translate(w / 2, h / 2);
  c.fillStyle = '#ff9a00'; c.beginPath(); c.arc(0, 0, 38, 0, 7); c.fill();
  c.fillStyle = '#ffe36a'; c.beginPath(); c.arc(0, 0, 33, 0, 7); c.fill();
  c.fillStyle = '#ff9a00'; c.beginPath(); c.arc(0, 0, 14, 0, 7); c.fill();
  c.strokeStyle = '#ff9a00'; c.lineWidth = 5; c.lineCap = 'round';
  for(let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * 19, Math.sin(a) * 19); c.lineTo(Math.cos(a) * 28, Math.sin(a) * 28); c.stroke(); }
});
const glowTex = () => canvasTex(64, 64, (c, w, h) => {
  const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
});
const cloudTex = () => canvasTex(256, 96, (c, w, h) => {
  c.fillStyle = '#fff';
  for(const [x, y, r] of [[60, 60, 30], [100, 46, 38], [150, 52, 34], [190, 64, 26], [120, 68, 30]]){
    const g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
});

/* Ảnh logo công ty (docs/logo.png): chỉ vẽ nhỏ ở ngực trái như phù hiệu áo cầu thủ; vẽ lại texture khi ảnh tải xong */
let logoImg = null, logoWait = [];
function withLogo(cb){
  if(logoImg && logoImg.complete && logoImg.naturalWidth){ cb(logoImg); return; }
  logoWait.push(cb);
  if(!logoImg){
    logoImg = new Image();
    logoImg.onload = () => { const w = logoWait; logoWait = []; w.forEach((f) => { try{ f(logoImg); }catch(e){} }); };
    logoImg.onerror = () => { logoWait = []; };
    logoImg.src = LOGO_URL;
  }
}
function shirtTextures(skin){
  const stripes = (c, w, h) => {
    for(const y of [0.60, 0.74]){
      c.fillStyle = skin.band; c.fillRect(0, h * y, w, h * 0.055);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, h * y, w, 2); c.fillRect(0, h * (y + 0.055) - 2, w, 2);
    }
  };
  const base = (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, skin.shirt2); g.addColorStop(0.5, skin.shirt); g.addColorStop(1, skin.shirt2);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  };
  const side = canvasTex(64, 128, (c, w, h) => { base(c, w, h); stripes(c, w, h); });
  const back = canvasTex(256, 320, (c, w, h) => {
    base(c, w, h); stripes(c, w, h);
    c.fillStyle = 'rgba(40,20,0,.7)'; c.font = '800 21px "Trebuchet MS",Arial'; c.textAlign = 'center'; c.fillText('HIỆP MINH THỊNH', w / 2, h * 0.28); c.font = '700 15px "Trebuchet MS",Arial'; c.fillText('ĐIỆN MẶT TRỜI', w / 2, h * 0.34);
    c.fillStyle = skin.band; c.fillRect(w * 0.1, h * 0.40, w * 0.8, 6);
  });
  const draw = (c, w, h, img) => {
    base(c, w, h); stripes(c, w, h);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(w / 2 - 1.5, h * 0.17, 3, h * 0.83);                  // khóa kéo
    c.fillStyle = '#c9ccd2'; c.fillRect(w / 2 - 4, h * 0.17, 8, 10);
    c.fillStyle = 'rgba(110,50,0,.45)'; c.beginPath(); c.moveTo(w * 0.28, 0); c.lineTo(w / 2, h * 0.19); c.lineTo(w * 0.72, 0); c.fill();   // cổ áo
    for(const x of [0.1, 0.55]){                                                                      // hai túi ngực có nắp và cúc
      const px = w * x, py = h * 0.30, pw = w * 0.35, ph = h * 0.15;
      c.fillStyle = skin.shirt2; c.fillRect(px, py, pw, ph); c.strokeStyle = 'rgba(80,35,0,.55)'; c.lineWidth = 2; c.strokeRect(px, py, pw, ph);
      c.fillStyle = 'rgba(80,35,0,.35)'; c.fillRect(px, py, pw, ph * 0.38);
      c.fillStyle = '#c9ccd2'; c.beginPath(); c.arc(px + pw / 2, py + ph * 0.38, 4, 0, 7); c.fill();
    }
    c.fillStyle = '#f4f1e8'; c.fillRect(w * 0.58, h * 0.50, w * 0.28, h * 0.05);                    // bảng tên trống
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.strokeRect(w * 0.58, h * 0.50, w * 0.28, h * 0.05);
    const cx = w * 0.74, cy = h * 0.2, r = w * 0.075;                                                 // phù hiệu nhỏ ở ngực trái
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.5; c.stroke();
    if(img){ c.save(); c.beginPath(); c.arc(cx, cy, r - 1.5, 0, 7); c.clip(); const d = (r - 1.5) * 2; c.drawImage(img, cx - d / 2, cy - d / 2, d, d); c.restore(); }
  };
  const front = canvasTex(256, 320, (c, w, h) => draw(c, w, h, null));
  withLogo((img) => { const cv = front.image; draw(cv.getContext('2d'), cv.width, cv.height, img); front.needsUpdate = true; });
  return { side, back, front };
}

/* ================= Nhân vật ================= */
function buildCharacter(gender, skin, tex){
  const female = gender === 'f';
  const M = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
  const mShirt = M(skin.shirt), mPants = M(skin.pants), mBand = M(skin.band, { emissive: '#222' }), mBoot = M(skin.boots), mGlove = M(skin.glove);
  const mSkin = M(skin.skin), mHelm = M(skin.helmet), mBelt = M(skin.belt), mDark = M('#1a1a1a'), mHair = M('#2b1a10');
  const mWhite = M('#ffffff'), mBuckle = M('#c9ccd2'), mShirt2 = M(skin.shirt2), mPouch = M('#6b4a2b'), mHelmD = M('#e0b000'), mPad = M('#2c2f36');
  const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if(parent) parent.add(m); return m; };
  const root = new THREE.Group(), flip = new THREE.Group(), body = new THREE.Group(), hips = new THREE.Group();
  root.add(flip); flip.add(body); body.add(hips);
  flip.position.y = 0.9; body.position.y = -0.9; hips.position.y = 0.86;
  const tw = female ? 0.44 : 0.5;
  // thân áo: +z là phía trước (ngực). Thứ tự mặt: +x, -x, +y, -y, +z, -z
  const side = new THREE.MeshLambertMaterial({ map: tex.side }), front = new THREE.MeshLambertMaterial({ map: tex.front }), back = new THREE.MeshLambertMaterial({ map: tex.back });
  const torso = new THREE.Group(); torso.position.y = 0.0; hips.add(torso);
  const tb = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.62, 0.3), [side, side, mShirt, mShirt, front, back]); tb.position.y = 0.33; torso.add(tb);
  box(tw + 0.02, 0.07, 0.32, mBelt, 0, 0.05, 0, torso);                                   // đai đồ nghề
  box(0.08, 0.06, 0.02, mBuckle, 0, 0.05, 0.165, torso);                                   // khóa đai
  box(0.3, 0.07, 0.32, mShirt, 0, 0.62, 0, torso);                                         // cổ áo dựng
  box(tw + 0.02, 0.025, 0.31, mBand, 0, 0.58, 0, torso);                                   // vạch phản quang vai
  for(const sx of [-1, 1]) box(0.1, 0.025, 0.2, mShirt2, sx * (tw / 2 - 0.02), 0.645, 0, torso);   // cầu vai
  box(0.12, 0.17, 0.07, mPouch, -tw * 0.5 - 0.06, -0.01, 0.06, torso);                     // túi đồ nghề bên phải
  box(0.07, 0.15, 0.05, mDark, tw * 0.5 + 0.04, 0.0, -0.06, torso);                        // bộ đàm
  box(0.012, 0.09, 0.012, mDark, tw * 0.5 + 0.04, 0.1, -0.06, torso);                      // ăng-ten
  box(0.1, 0.12, 0.08, mBelt, tw * 0.5 + 0.03, 0.04, 0.05, torso); box(0.1, 0.12, 0.08, mBelt, -tw * 0.5 - 0.03, 0.04, 0.05, torso);
  box(0.06, 0.14, 0.06, mDark, tw * 0.5 + 0.03, -0.06, 0.05, torso);                      // tua vít
  // đầu + mũ bảo hộ
  const neck = box(0.1, 0.08, 0.1, mSkin, 0, 0.68, 0, torso);
  const head = new THREE.Group(); head.position.set(0, 0.84, 0.01); torso.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 12), mSkin); head.add(face);
  const eyeG = new THREE.SphereGeometry(0.02, 6, 6), eyeW = new THREE.SphereGeometry(0.03, 6, 6);
  for(const sx of [-0.05, 0.05]){
    const w_ = new THREE.Mesh(eyeW, mWhite); w_.scale.set(1, 0.8, 0.5); w_.position.set(sx, 0.012, 0.122); head.add(w_);
    const e = new THREE.Mesh(eyeG, mDark); e.scale.set(0.8, 1, 0.6); e.position.set(sx, 0.012, 0.13); head.add(e);
    box(0.06, 0.012, 0.02, mHair, sx, 0.05, 0.125, head);                                  // lông mày
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), mSkin); ear.scale.set(0.5, 1, 0.8); ear.position.set(sx * 2.6, -0.005, 0); head.add(ear);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), mSkin); nose.position.set(0, -0.012, 0.135); head.add(nose);
  box(0.05, 0.01, 0.02, M('#a0504a'), 0, -0.055, 0.122, head);                              // miệng
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.155, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), mHelm); helm.position.set(0, 0.03, -0.005); head.add(helm);
  box(0.3, 0.025, 0.14, mHelm, 0, 0.045, 0.14, head);                                      // vành mũ phía trước
  box(0.34, 0.02, 0.05, mHelmD, 0, 0.04, -0.15, head);                                     // vành sau
  box(0.045, 0.035, 0.32, mHelmD, 0, 0.18, 0, head);                                       // gờ nóc mũ
  for(const sx of [-1, 1]){
    box(0.012, 0.03, 0.2, mHelmD, sx * 0.1, 0.12, 0, head);                                // gân bên mũ
    box(0.012, 0.1, 0.012, mDark, sx * 0.135, -0.04, 0.05, head);                          // quai mũ
  }
  box(0.1, 0.07, 0.02, mDark, 0, -0.1, 0.1, head).rotation.x = 0.3;                         // quai cằm
  box(0.07, 0.045, 0.045, mBuckle, 0, 0.1, 0.16, head);                                    // đèn pin gắn mũ
  box(0.045, 0.03, 0.012, M('#fff6b0', { emissive: '#fff6b0' }), 0, 0.1, 0.185, head);
  let tail = null;
  if(female){
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 10, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.5), mHair); hair.position.set(0, 0.01, -0.025); head.add(hair);
    tail = new THREE.Group(); tail.position.set(0, -0.01, -0.14); head.add(tail);
    const t1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mHair); t1.position.set(0, 0, -0.03); tail.add(t1);
    const t2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 4, 8), mHair); t2.position.set(0, -0.14, -0.06); t2.rotation.x = 0.25; tail.add(t2);
    box(0.07, 0.03, 0.07, M('#e0405a'), 0, 0.01, -0.01, tail);
  }
  // tay
  const arm = (sx) => {
    const sh = new THREE.Group(); sh.position.set(sx * (tw / 2 + 0.06), 0.57, 0); torso.add(sh);
    box(0.12, 0.3, 0.13, mShirt, 0, -0.14, 0, sh); box(0.125, 0.045, 0.135, mBand, 0, -0.1, 0, sh); box(0.13, 0.05, 0.14, mShirt2, 0, 0.0, 0, sh);
    const fore = new THREE.Group(); fore.position.y = -0.29; sh.add(fore);
    box(0.105, 0.26, 0.115, mShirt, 0, -0.12, 0, fore); box(0.115, 0.04, 0.125, mShirt2, 0, -0.22, 0, fore);
    box(0.11, 0.1, 0.12, mGlove, 0, -0.29, 0, fore); box(0.116, 0.03, 0.126, mBand, 0, -0.245, 0, fore); box(0.03, 0.05, 0.1, mGlove, sx * 0.065, -0.3, 0.02, fore);
    return { sh, fore };
  };
  const aL = arm(1), aR = arm(-1);
  // chân
  const leg = (sx) => {
    const th = new THREE.Group(); th.position.set(sx * (tw * 0.24), 0, 0); hips.add(th);
    box(0.18, 0.42, 0.2, mPants, 0, -0.2, 0, th);
    box(0.1, 0.12, 0.03, mShirt2, sx * 0.04, -0.16, 0.105, th);                            // túi hộp trên đùi
    box(0.1, 0.02, 0.032, mDark, sx * 0.04, -0.11, 0.105, th);
    const shin = new THREE.Group(); shin.position.y = -0.41; th.add(shin);
    box(0.155, 0.36, 0.17, mPants, 0, -0.17, 0, shin); box(0.162, 0.05, 0.178, mBand, 0, -0.14, 0, shin); box(0.162, 0.05, 0.178, mBand, 0, -0.22, 0, shin);
    box(0.13, 0.1, 0.04, mPad, 0, 0.0, 0.1, shin);                                         // bảo vệ đầu gối
    box(0.17, 0.12, 0.3, mBoot, 0, -0.33, 0.045, shin); box(0.18, 0.03, 0.32, mDark, 0, -0.385, 0.05, shin); box(0.16, 0.06, 0.1, mPad, 0, -0.35, 0.16, shin);   // đế và mũi giày bảo hộ
    box(0.17, 0.02, 0.03, mBuckle, 0, -0.3, 0.1, shin);
    return { th, shin };
  };
  const lL = leg(1), lR = leg(-1);
  const sc = female ? 0.92 : 1; root.scale.setScalar(sc);
  return { root, flip, body, hips, torso, head, tail, armL: aL.sh, foreL: aL.fore, armR: aR.sh, foreR: aR.fore, legL: lL.th, shinL: lL.shin, legR: lR.th, shinR: lR.shin, sc };
}

/* ================= Vật thể trên đường ================= */
function makeCrate(T){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [T.crateSide, T.crateSide, T.crateSide, T.crateSide, T.crate, T.crateSide]);
  body.position.y = 0.4; body.scale.set(1, 0.8, 0.8); g.add(body);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.1, 0.84), T.crateSide); lid.position.y = 0.85; g.add(lid);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 12, Math.PI), T.metal); handle.position.y = 0.9; g.add(handle);
  g.userData.body = body; g.userData.lid = lid; return g;
}
function makePanel(T){
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1.2), [T.frame, T.frame, T.panelBroken, T.frame, T.frame, T.frame]);
  p.position.y = 0.3; p.rotation.x = 0.0; p.rotation.z = 0.0; g.add(p);
  const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), T.frame); leg1.position.set(-0.4, 0.15, 0.4); g.add(leg1);
  const leg2 = leg1.clone(); leg2.position.set(0.4, 0.15, -0.4); g.add(leg2);
  const shard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), T.panelBroken); shard.position.set(0.3, 0.06, 0.55); shard.rotation.set(0.1, 0.5, 0.25); g.add(shard);
  g.userData.p = p; g.userData.leg2 = leg2; return g;
}
function makeWire(T){
  const g = new THREE.Group();
  for(const z of [-2.6, 2.6]){ const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.7, 8), T.metal); pole.position.set(0, 1.85, z); g.add(pole); }
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 5.6), T.wood); arm.position.y = 3.55; g.add(arm);
  const cabs = [];
  for(let i = 0; i < 7; i++){
    const z = -1.8 + i * 0.6, h = 2.55 + (i % 2) * 0.12;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, h, 5), T.cable); c.position.set(0, 3.5 - h / 2, z); g.add(c);
    const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6), T.white); ins.position.set(0, 3.5, z); g.add(ins); cabs.push(c);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), T.danger); sign.position.set(0.1, 2.9, 2.0); g.add(sign);
  const spark = new THREE.Sprite(T.sparkMat); spark.scale.set(0.9, 0.9, 1); spark.position.set(0, 1.0, 0); g.add(spark);
  g.userData.spark = spark; g.userData.cabs = cabs; return g;
}
function makeBird(T){
  const g = new THREE.Group();
  const bodyM = new THREE.MeshLambertMaterial({ color: '#4b5565' });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), bodyM); b.scale.set(1.3, 0.85, 0.9); g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), bodyM); h.position.set(-0.33, 0.1, 0); g.add(h);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 6), T.beak); beak.rotation.z = Math.PI / 2; beak.position.set(-0.5, 0.08, 0); g.add(beak);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), T.dark); eye.position.set(-0.42, 0.15, 0.1); g.add(eye);
  const tailM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.2), bodyM); tailM.position.set(0.45, 0, 0); g.add(tailM);
  const wing = (s) => { const w = new THREE.Group(); w.position.set(0, 0.1, s * 0.12); const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.55), bodyM); m.position.z = s * 0.28; w.add(m); g.add(w); return w; };
  g.userData.wl = wing(1); g.userData.wr = wing(-1);
  return g;
}
function makeItem(type, T){
  const g = new THREE.Group();
  if(type === 'magnet'){
    const u = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.085, 8, 18, Math.PI), T.red); u.rotation.z = Math.PI; u.position.y = 0.08; g.add(u);
    for(const s of [-1, 1]){ const t = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.2, 0.17), T.white); t.position.set(s * 0.22, -0.12, 0); g.add(t); }
  } else if(type === 'shield'){
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 12), T.ceramic); c.rotation.z = Math.PI / 2; g.add(c);
    for(const s of [-1, 1]){ const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 10), T.gold); cap.rotation.z = Math.PI / 2; cap.position.x = s * 0.3; g.add(cap); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 6, 24), T.cyan); g.add(ring);
  } else {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.22), T.green); g.add(b);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.1), T.white); cap.position.y = 0.28; g.add(cap);
    const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.24), T.yellow); bolt.rotation.z = 0.35; g.add(bolt);
  }
  const glow = new THREE.Sprite(type === 'magnet' ? T.glowRed : type === 'shield' ? T.glowCyan : T.glowGreen); glow.scale.set(1.5, 1.5, 1); g.add(glow);
  g.scale.setScalar(1.2);
  return g;
}

/* ================= Chương trình chính ================= */
export function runner(container, opt = {}){
  const sfx = opt.sfx || {};
  const snd = {
    beep: (...a) => { try{ if(sfx.beep) sfx.beep(...a); }catch(e){} },
    noise: (...a) => { try{ if(sfx.noise) sfx.noise(...a); }catch(e){} },
    buzz: (p) => { try{ if(sfx.buzz) sfx.buzz(p); }catch(e){} },
  };
  const noop = { dispose(){}, pause(){}, resume(){}, restart(){}, setCharacter(){}, setSkin(){} };
  if(!supported()){
    container.innerHTML = '<div style="padding:28px 18px;text-align:center;font-weight:700;color:#444">Game này cần đồ họa 3D (WebGL).<br><span style="font-weight:400;font-size:.9em">Thiết bị hoặc trình duyệt hiện tại chưa hỗ trợ.</span></div>';
    return noop;
  }
  let alive = true;
  const doc = container.ownerDocument || document;

  /* ---------- DOM ---------- */
  injectCss(doc);
  const wrap = doc.createElement('div'); wrap.className = 'rn-root';
  if(!container.clientHeight || container.clientHeight < 200) wrap.style.height = Math.max(420, Math.round((window.innerHeight || 700) * 0.72)) + 'px';
  container.appendChild(wrap);

  /* ---------- Three ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  let dpr = Math.min(window.devicePixelRatio || 1, UI.MAX_DPR);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = false;            // không bật bóng đổ thật; dùng bóng giả
  const canvas = renderer.domElement; canvas.className = 'rn-canvas'; wrap.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color('#69b4ee') }, bot: { value: new THREE.Color('#ffe0b0') } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec2 vUv; void main(){ float k = smoothstep(0.22, 1.0, vUv.y); gl_FragColor = vec4(mix(bot, top, k), 1.0);\n#include <colorspace_fragment>\n}',
    depthTest: false, depthWrite: false, fog: false }));
  sky.frustumCulled = false; sky.renderOrder = -100; scene.add(sky);
  scene.fog = new THREE.Fog('#ffe0b0', 20, 140);
  const hemi = new THREE.HemisphereLight('#ffffff', '#667766', 1.0); scene.add(hemi);
  const sunL = new THREE.DirectionalLight('#ffffff', 2); sunL.position.set(-4, 9, 9); scene.add(sunL);

  /* texture & vật liệu dùng chung */
  const own = [];     // texture/vật liệu cần giải phóng khi dọn
  const keep = (t) => { own.push(t); return t; };
  const Tx = {};
  const fac = facadeTex(); Tx.facade = keep(fac.map); Tx.facadeEmi = keep(fac.emi);
  Tx.roofTop = keep(roofTopTex()); Tx.panel = keep(panelTex(false)); Tx.panelBroken = keep(panelTex(true)); Tx.rail = keep(railTex());
  Tx.crate = keep(crateTex()); Tx.coin = keep(coinFace()); Tx.glow = keep(glowTex()); Tx.cloud = keep(cloudTex());
  const Lm = (c, o = {}) => keep(new THREE.MeshLambertMaterial({ color: c, ...o }));
  const spr = (c, s) => keep(new THREE.SpriteMaterial({ map: Tx.glow, color: c, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: s == null ? 1 : s }));
  const MAT = {
    crate: Lm('#ffffff', { map: Tx.crate }), crateSide: Lm('#c93a24'), metal: Lm('#9aa3ad'), wood: Lm('#6b4a2b'), cable: Lm('#16181c'), white: Lm('#f2f2f2'),
    danger: Lm('#ffffff', { map: keep(canvasTex(64, 40, (c, w, h) => { c.fillStyle = '#ffdd22'; c.fillRect(0, 0, w, h); c.fillStyle = '#c00'; c.font = '900 30px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⚡', w / 2, h / 2 + 2); })), side: THREE.DoubleSide }),
    frame: Lm('#aab3be'), panelBroken: Lm('#ffffff', { map: Tx.panelBroken }), beak: Lm('#ff9a1f'), dark: Lm('#111'),
    red: Lm('#e0302a'), ceramic: Lm('#f4efe6'), gold: Lm('#e8b830'), cyan: Lm('#46d6ff', { emissive: '#1a90b0' }), green: Lm('#38b04a', { emissive: '#144a1c' }), yellow: Lm('#ffe14a', { emissive: '#aa8a00' }),
  };
  const TEX = { ...MAT, sparkMat: spr('#ffe9a0'), glowRed: spr('#ff5a4a'), glowCyan: spr('#6ae0ff'), glowGreen: spr('#6aff7a'), glowGold: spr('#ffd04a', 0.9) };
  const geoms = { unit: new THREE.BoxGeometry(1, 1, 1), plane: new THREE.PlaneGeometry(1, 1) };

  /* ---------- Mái nhà ---------- */
  const facMats = [0, 1, 2].map((i) => keep(new THREE.MeshLambertMaterial({ map: Tx.facade, emissiveMap: Tx.facadeEmi, emissive: '#ffffff', emissiveIntensity: 0, color: ['#ffffff', '#f0e0d0', '#dbe6f2'][i] })));
  const roofSlots = [];
  function makeRoofSlot(i){
    const g = new THREE.Group();
    const top = Tx.roofTop.clone(); top.needsUpdate = true; top.wrapS = top.wrapT = THREE.RepeatWrapping; own.push(top);
    const fr = Tx.facade.clone(); fr.needsUpdate = true; own.push(fr);
    const fe = Tx.facadeEmi.clone(); fe.needsUpdate = true; own.push(fe);
    const fm = keep(new THREE.MeshLambertMaterial({ map: fr, emissiveMap: fe, emissive: '#ffffff', emissiveIntensity: 0, color: ['#ffffff', '#f0e0d0', '#dbe6f2'][i % 3] }));
    const topM = keep(new THREE.MeshLambertMaterial({ map: top }));
    const bodyM = new THREE.Mesh(geoms.unit, [facMats[0], facMats[0], topM, facMats[0], fm, facMats[0]]);
    g.add(bodyM);
    const curb = new THREE.Mesh(geoms.unit, MAT.metal); g.add(curb);
    const rt = Tx.rail.clone(); rt.needsUpdate = true; own.push(rt);
    const railM = keep(new THREE.MeshBasicMaterial({ map: rt, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, fog: true }));
    const rail = new THREE.Mesh(geoms.plane, railM); g.add(rail);
    const pt = Tx.panel.clone(); pt.needsUpdate = true; own.push(pt);
    const pm = keep(new THREE.MeshLambertMaterial({ map: pt }));
    const panels = new THREE.Mesh(geoms.unit, [MAT.frame, MAT.frame, pm, MAT.frame, MAT.frame, MAT.frame]); g.add(panels);
    const panels2 = new THREE.Mesh(geoms.unit, [MAT.frame, MAT.frame, pm, MAT.frame, MAT.frame, MAT.frame]); g.add(panels2);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 12), MAT.metal); g.add(tank);
    g.userData = { top, fr, fe, bodyM, curb, rail, railM, rt, panels, panels2, pt, tank, fm };
    g.visible = false; scene.add(g);
    return g;
  }
  for(let i = 0; i < 18; i++) roofSlots.push(makeRoofSlot(i));
  function setRoof(g, a, b, wx, idx){
    const u = g.userData, len = b - a;
    g.visible = true; g.position.set(wx, 0, 0);
    u.bodyM.scale.set(len, 18, 6.7); u.bodyM.position.set(len / 2, -9, -1.15);
    u.top.repeat.set(len / 4, 2); u.fr.repeat.set(len / 6, 2.2); u.fe.repeat.set(len / 6, 2.2);
    u.curb.scale.set(len, 0.55, 0.3); u.curb.position.set(len / 2, 0.27, -4.35);
    u.rail.scale.set(len, 0.9, 1); u.rail.position.set(len / 2, 0.95, -4.2); u.rt.repeat.set(len / 1.4, 1);
    const pl = Math.max(2, len - 2.4);
    u.panels.scale.set(pl, 0.07, 1.25); u.panels.position.set(len / 2, 0.78, -3.3); u.panels.rotation.x = 0.5; u.pt.repeat.set(pl / 1.2, 1);
    u.panels2.scale.set(pl, 0.07, 1.25); u.panels2.position.set(len / 2, 0.78, -1.9); u.panels2.rotation.x = 0.5; u.panels2.visible = len >= 9;
    u.tank.visible = idx % 3 === 0; u.tank.scale.set(0.9, 1.1, 0.9); u.tank.position.set(len - 1, 0.55, -3.7);
  }

  /* ---------- Nền: nhà xa, cột điện, mây, mặt trời, sao ---------- */
  const farLayers = [];
  const panelTop = keep(new THREE.MeshLambertMaterial({ color: '#2a5fb8', emissive: '#0a1d44' }));
  function makeFarLayer(z, n, hMin, hMax, tintBase, withPanels, seed){
    let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const pats = []; let off = 0;
    for(let i = 0; i < n; i++){ const w = 7 + rnd() * 6, h = hMin + rnd() * (hMax - hMin); pats.push({ off, w, h, tint: Math.floor(rnd() * 3) }); off += w + 1 + rnd() * 3; }
    const period = off;
    const geos = pats.map((p) => { const g = geoms.unit.clone(); const uv = g.attributes.uv; for(let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * p.w / 6, uv.getY(i) * (p.h + 10) / 8); return g; });
    const slots = [];
    const want = Math.ceil(n * 3.4);
    const mats = [0, 1, 2].map((i) => keep(new THREE.MeshLambertMaterial({ map: Tx.facade, emissiveMap: Tx.facadeEmi, emissive: '#ffffff', emissiveIntensity: 0, color: new THREE.Color(tintBase).multiplyScalar(0.85 + i * 0.1) })));
    for(let i = 0; i < want; i++){
      const m = new THREE.Mesh(geos[0], mats[i % 3]); m.visible = false; scene.add(m);
      let pan = null;
      if(withPanels){ pan = new THREE.Mesh(geoms.unit, [MAT.frame, MAT.frame, panelTop, MAT.frame, MAT.frame, MAT.frame]); m.add(pan); }
      slots.push({ m, pan });
    }
    farLayers.push({ z, pats, period, slots, mats, n, geos });
  }
  makeFarLayer(-24, 12, 5, 11, '#cfc8bc', true, 11);
  makeFarLayer(-46, 12, 9, 19, '#b9c0cc', false, 23);
  makeFarLayer(-78, 10, 14, 28, '#a2adc2', false, 37);
  function updateFar(distNow, nightK){
    for(const L_ of farLayers){
      let k = 0; const base = Math.floor((distNow - 100) / L_.period);
      const reach = 140 + Math.abs(L_.z);
      for(let rep = base; rep < base + 7 && k < L_.slots.length; rep++){
        for(let i = 0; i < L_.n && k < L_.slots.length; i++){
          const p = L_.pats[i], x0 = rep * L_.period + p.off - distNow;
          if(x0 + p.w < -100 || x0 > reach) continue;
          const sl = L_.slots[k++], H = p.h + 10;
          sl.m.visible = true; sl.m.geometry = L_.geos[i]; sl.m.scale.set(p.w, H, p.w * 0.8); sl.m.position.set(x0 + p.w / 2, (p.h - 10) / 2, L_.z);
          if(sl.pan){ sl.pan.scale.set(0.8, 0.5 / H, 0.55); sl.pan.position.set(0, 0.5 + 0.25 / H, 0); }
        }
      }
      for(; k < L_.slots.length; k++) L_.slots[k].m.visible = false;
      L_.mats.forEach((m) => { m.emissiveIntensity = nightK * 0.9; });
    }
  }
  // cột điện + đường dây + đèn
  const POLE_GAP = 26, poles = [];
  const wireGeo = (() => {
    const pts = [];
    for(const z of [-0.9, 0, 0.9]){ let prev = null; for(let i = 0; i <= 10; i++){ const t = i / 10, q = [t * POLE_GAP, 6.6 - 1.6 * 4 * t * (1 - t), z]; if(prev) pts.push(...prev, ...q); prev = q; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g;
  })();
  const wireMat = keep(new THREE.LineBasicMaterial({ color: '#15171c' }));
  const lampMat = keep(new THREE.MeshBasicMaterial({ color: '#555' }));
  for(let i = 0; i < 9; i++){
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 26, 8), MAT.wood); pole.position.y = -6; g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.2), MAT.wood); arm.position.y = 6.6; g.add(arm);
    const lampArm = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 0.07), MAT.metal); lampArm.position.set(0.5, 6.0, 1.0); g.add(lampArm);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), lampMat); lamp.position.set(1.0, 5.95, 1.0); g.add(lamp);
    const glow = new THREE.Sprite(spr('#ffe7a0', 0)); glow.scale.set(5, 5, 1); glow.position.set(1.0, 5.6, 1.0); g.add(glow);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 6, 16, 1, true), keep(new THREE.MeshBasicMaterial({ color: '#ffe7a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }))); cone.position.set(1.0, 2.8, 1.0); g.add(cone);
    const wires = new THREE.LineSegments(wireGeo, wireMat); g.add(wires);
    g.visible = false; g.position.z = -7; scene.add(g);
    poles.push({ g, glow, cone });
  }
  const sunSpr = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: Tx.glow, color: '#fff2c0', transparent: true, depthWrite: false, fog: false })));
  sunSpr.renderOrder = -90; scene.add(sunSpr);
  const sunHalo = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: Tx.glow, color: '#ffd080', transparent: true, depthWrite: false, fog: false, opacity: 0.55, blending: THREE.AdditiveBlending })));
  sunHalo.renderOrder = -91; scene.add(sunHalo);
  const clouds = [];
  for(let i = 0; i < 9; i++){
    const m = keep(new THREE.SpriteMaterial({ map: Tx.cloud, transparent: true, depthWrite: false, fog: false, opacity: 0.9 }));
    const s = new THREE.Sprite(m); s.renderOrder = -80; scene.add(s);
    clouds.push({ s, m, bx: (i / 9) * 170 - 20, y: 0.45 + (i * 37 % 10) / 20, k: 0.16 + (i * 13 % 9) * 0.022, sp: 0.5 + (i % 4) * 0.25 });
  }
  const starGeo = new THREE.BufferGeometry();
  { const p = []; for(let i = 0; i < 140; i++) p.push((Math.random() - 0.5) * 2, 0.15 + Math.random() * 0.85, 0); starGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); }
  const starMat = keep(new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  const stars = new THREE.Points(starGeo, starMat); stars.frustumCulled = false; stars.renderOrder = -95; scene.add(stars);
  const pit = new THREE.Mesh(geoms.plane, keep(new THREE.MeshLambertMaterial({ color: '#2a2f3a' }))); pit.rotation.x = -Math.PI / 2; pit.position.y = -17; pit.scale.set(900, 300, 1); scene.add(pit);

  /* ---------- Bóng giả, hiệu ứng ---------- */
  const shadow = new THREE.Mesh(geoms.plane, keep(new THREE.MeshBasicMaterial({ map: keep(canvasTex(64, 64, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(0,0,0,.65)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); })), transparent: true, depthWrite: false })));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; scene.add(shadow);
  const sparks = []; for(let i = 0; i < 20; i++){ const s = new THREE.Sprite(spr('#ffe27a')); s.visible = false; s.scale.set(0.5, 0.5, 1); scene.add(s); sparks.push({ s, t: 0, vx: 0, vy: 0 }); }
  let sparkI = 0;
  function spark(x, y, color){ const p = sparks[sparkI++ % sparks.length]; p.t = 0.45; p.vx = (Math.random() - 0.3) * 3; p.vy = 1 + Math.random() * 2.5; p.s.position.set(x, y, 0.5); p.s.material.color.set(color || '#ffe27a'); p.s.visible = true; }
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 14), keep(new THREE.MeshBasicMaterial({ color: '#5ae0ff', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))); bubble.visible = false; scene.add(bubble);
  const magRing = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.03, 6, 40), keep(new THREE.MeshBasicMaterial({ color: '#ff6a5a', transparent: true, opacity: 0.6, fog: false }))); magRing.visible = false; scene.add(magRing);
  const boostRing = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 6, 40), keep(new THREE.MeshBasicMaterial({ color: '#7dff7a', transparent: true, opacity: 0.55, fog: false }))); boostRing.visible = false; scene.add(boostRing);

  /* ---------- Pool vật cản, tia nắng, vật phẩm ---------- */
  const pools = { crate: [], panel: [], wire: [], bird: [], item: { magnet: [], shield: [], boost: [] } };
  const mk = (n, f, arr) => { for(let i = 0; i < n; i++){ const o = f(); o.visible = false; scene.add(o); arr.push(o); } };
  mk(8, () => makeCrate(TEX), pools.crate); mk(6, () => makePanel(TEX), pools.panel); mk(5, () => makeWire(TEX), pools.wire); mk(6, () => makeBird(TEX), pools.bird);
  for(const t of ['magnet', 'shield', 'boost']) mk(3, () => makeItem(t, TEX), pools.item[t]);
  const coinGeo = (() => { const g = new THREE.CylinderGeometry(0.34, 0.34, 0.08, 20); g.rotateX(Math.PI / 2); return g; })();
  const coinMats = [keep(new THREE.MeshLambertMaterial({ color: '#ffb020', emissive: '#ff8a00', emissiveIntensity: 0.7 })), keep(new THREE.MeshLambertMaterial({ map: Tx.coin, emissive: '#ffa000', emissiveMap: Tx.coin, emissiveIntensity: 0.6 })), keep(new THREE.MeshLambertMaterial({ map: Tx.coin, emissive: '#ffa000', emissiveMap: Tx.coin, emissiveIntensity: 0.6 }))];
  const coinPool = [];
  for(let i = 0; i < 90; i++){
    const m = new THREE.Mesh(coinGeo, coinMats); const gl = new THREE.Sprite(TEX.glowGold); gl.scale.set(1.5, 1.5, 1); m.add(gl);
    m.visible = false; scene.add(m); coinPool.push(m);
  }

  /* ---------- Nhân vật ---------- */
  let gender = store(UI.KEY.char) === 'f' ? 'f' : 'm';
  let skinId = 'dongphuc';
  const shirtTex = {};
  let ch = null;
  function setCharacterModel(){
    if(ch){ scene.remove(ch.root); ch.root.traverse((o) => { if(o.geometry) o.geometry.dispose(); if(o.material){ (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); } }); }
    const skin = SKINS[skinId] || SKINS.dongphuc;
    if(!shirtTex[skinId]){ shirtTex[skinId] = shirtTextures(skin); Object.values(shirtTex[skinId]).forEach(keep); }
    ch = buildCharacter(gender, skin, shirtTex[skinId]);
    scene.add(ch.root);
  }
  setCharacterModel();
  const pose = { legL: 0, legR: 0, shinL: 0.2, shinR: 0.2, armL: 0, armR: 0, foreL: -0.4, foreR: -0.4, lean: 0, flip: 0, flipY: 0.9, bob: 0, yaw: -1.1, tail: 0.3 };
  const tgt = { ...pose };

  /* ---------- Camera ---------- */
  let camK = 1;                     // 1 = cận cảnh màn chờ, 0 = camera chạy
  let vw = 300, vh = 400, runDist = 13, visW = 17, lookX = 4;
  function resize(){
    vw = wrap.clientWidth || container.clientWidth || 300; vh = wrap.clientHeight || container.clientHeight || 400;
    renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.updateProjectionMatrix();
    const asp = vw / vh, tan = Math.tan(camera.fov * Math.PI / 360);
    visW = asp >= 1.2 ? UI.VIS_W_LAND : UI.VIS_W_PORT;
    runDist = clamp(visW / (2 * tan * asp), 11, 44);
    const actualW = 2 * tan * runDist * asp;
    lookX = actualW * (0.5 - UI.PLAYER_X);
    scene.fog.near = runDist + 12; scene.fog.far = runDist + 115;
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  if(ro) ro.observe(wrap); else window.addEventListener('resize', resize);
  function placeCamera(shakeX, shakeY){
    const tan = Math.tan(camera.fov * Math.PI / 360), h = tan * runDist;
    const ly = h * (1 - 2 * UI.GROUND_Y);                  // mặt mái (y=0) nằm ở UI.GROUND_Y chiều cao màn hình
    const run = { px: lookX, py: ly + 1.0, pz: runDist, lx: lookX, ly };
    const near = { px: 0.9, py: 1.25, pz: Math.max(3.9, 4.8 / Math.max(0.6, Math.min(1.4, camera.aspect * 1.2))), lx: 0.1, ly: 0.8 };
    const k = camK * camK * (3 - 2 * camK);
    camera.position.set(lerp(run.px, near.px, k) + (shakeX || 0), lerp(run.py, near.py, k) + (shakeY || 0), lerp(run.pz, near.pz, k));
    camera.lookAt(lerp(run.lx, near.lx, k), lerp(run.ly, near.ly, k), 0);
  }

  /* ---------- Trạng thái ---------- */
  let screen = 'menu', boardFrom = 'menu';
  let G = L.createGame((opt.seed || 1) | 0 || 1);
  let paused = false, last = performance.now(), raf = 0, acc = 0, tClock = 0, shake = 0, deathShown = false;
  let best = +store(UI.KEY.best) || 0;
  const input = { jump: false, held: false, slide: false };
  let rIdx = 0, comboSfx = 0;
  const dbg = { autoplay: false, bot: L.createBot(), phase: null, bird: 'mix' };
  let finalRes = null;

  /* ---------- Giao diện phủ ---------- */
  wrap.insertAdjacentHTML('beforeend', `
    <div class="rn-scr rn-hud" hidden>
      <div class="rn-hud-top">
        <div class="rn-stat"><b id="rn-kwh">0</b><small>⚡ kWh</small></div>
        <div class="rn-stat rn-sun"><b id="rn-coin">0</b><small>☀ tia nắng</small></div>
        <div class="rn-stat rn-bestc"><b id="rn-bestv">0</b><small>🏆 kỷ lục</small></div>
        <button class="rn-ibtn" id="rn-pause" aria-label="Tạm dừng">⏸</button>
      </div>
      <div class="rn-pw">
        <div class="rn-chip" id="rn-pw-magnet" hidden><span>🧲</span><i></i></div>
        <div class="rn-chip" id="rn-pw-shield" hidden><span>🛡️</span><i></i></div>
        <div class="rn-chip" id="rn-pw-boost" hidden><span>🔋</span><i></i></div>
      </div>
    </div>
    <div class="rn-scr rn-menu">
      <div class="rn-title"><h2>⚡ Chạy năng lượng</h2><p>Chạm = nhảy (giữ để cao hơn, chạm lần nữa trên không = nhảy đôi) · vuốt xuống = trượt</p></div>
      <div class="rn-bottom">
        <div class="rn-chars" role="group" aria-label="Chọn nhân vật">
          <button class="rn-char" data-g="m">👷‍♂️ Nam</button><button class="rn-char" data-g="f">👷‍♀️ Nữ</button>
        </div>
        <div class="rn-best" id="rn-menubest"></div>
        <button class="rn-btn rn-pri" id="rn-start">▶ Bắt đầu</button>
        <div class="rn-row"><button class="rn-btn" id="rn-board1">🏆 Xếp hạng</button><button class="rn-btn" id="rn-exit1" hidden>← Thoát</button></div>
      </div>
    </div>
    <div class="rn-scr rn-pausescr" hidden>
      <div class="rn-card"><h3>Tạm dừng</h3>
        <button class="rn-btn rn-pri" id="rn-resume">▶ Tiếp tục</button>
        <div class="rn-row"><button class="rn-btn" id="rn-restart2">↻ Chơi lại</button><button class="rn-btn" id="rn-exit2" hidden>← Thoát</button></div></div>
    </div>
    <div class="rn-scr rn-over" hidden>
      <div class="rn-card"><h3>🔋 Hết pin!</h3>
        <div class="rn-newrec" id="rn-newrec" hidden>🎉 Kỷ lục mới!</div>
        <div class="rn-grid"><div><b id="rn-ok">0</b><small>⚡ kWh</small></div><div><b id="rn-oc">0</b><small>☀ tia nắng</small></div><div class="rn-score"><b id="rn-os">0</b><small>Điểm</small></div></div>
        <div class="rn-note" id="rn-onote"></div>
        <button class="rn-btn rn-pri" id="rn-again">↻ Chơi lại</button>
        <div class="rn-row"><button class="rn-btn" id="rn-board2">🏆 Xếp hạng</button><button class="rn-btn" id="rn-exit3" hidden>← Thoát</button></div></div>
    </div>
    <div class="rn-scr rn-boardscr" hidden>
      <div class="rn-card rn-boardcard"><div class="rn-bh"><h3>🏆 Xếp hạng — Top 20</h3><button class="rn-ibtn" id="rn-bclose" aria-label="Đóng">✕</button></div>
        <div class="rn-list" id="rn-list"></div></div>
    </div>`);
  const $ = (id) => wrap.querySelector('#' + id);
  const scr = { hud: wrap.querySelector('.rn-hud'), menu: wrap.querySelector('.rn-menu'), pause: wrap.querySelector('.rn-pausescr'), over: wrap.querySelector('.rn-over'), board: wrap.querySelector('.rn-boardscr') };
  const showOnly = (...names) => { for(const k in scr) scr[k].hidden = !names.includes(k); };
  const hudEl = { kwh: $('rn-kwh'), coin: $('rn-coin'), best: $('rn-bestv'), chips: { magnet: $('rn-pw-magnet'), shield: $('rn-pw-shield'), boost: $('rn-pw-boost') } };
  const hudCache = { kwh: -1, coin: -1, best: -1 };
  if(opt.onExit) ['rn-exit1', 'rn-exit2', 'rn-exit3'].forEach((id) => { const b = $(id); b.hidden = false; b.addEventListener('click', () => { try{ opt.onExit(); }catch(e){} }); });

  function refreshMenu(){
    wrap.querySelectorAll('.rn-char').forEach((b) => b.classList.toggle('on', b.dataset.g === gender));
    $('rn-menubest').innerHTML = best > 0 ? `Kỷ lục của bạn: <b>${best}</b> điểm` : 'Chưa có kỷ lục — chạy thử nào!';
  }
  function setCharacter(g2){
    gender = g2 === 'f' ? 'f' : 'm'; store(UI.KEY.char, gender); setCharacterModel(); refreshMenu();
  }
  function setSkin(id){ if(!SKINS[id]) return; skinId = id; setCharacterModel(); }
  wrap.querySelectorAll('.rn-char').forEach((b) => b.addEventListener('click', () => { setCharacter(b.dataset.g); snd.beep(660, 0.06, 'triangle', 0.07); }));

  function startGame(){
    const seed = opt.seed ? (opt.seed | 0) : (Math.floor(Math.random() * 2147483000) + 1);
    G = L.createGame(seed); rIdx = 0; deathShown = false; finalRes = null; shake = 0; hudCache.kwh = hudCache.coin = hudCache.best = -1;
    acc = 0; input.jump = input.slide = false; input.held = false; comboSfx = 0; paused = false; screen = 'play'; camTo = 0;
    Object.values(hudEl.chips).forEach((c) => { c.hidden = true; });
    showOnly('hud'); snd.beep(523, 0.08, 'triangle', 0.08); snd.beep(784, 0.12, 'triangle', 0.08, 0.08);
  }
  let camTo = 1;
  function doPause(on){
    if(screen !== 'play' && !(screen === 'pause')) return;
    if(on && screen === 'play'){ screen = 'pause'; paused = true; showOnly('hud', 'pause'); }
    else if(!on && screen === 'pause'){ screen = 'play'; paused = false; last = performance.now(); input.held = false; showOnly('hud'); }
  }
  $('rn-start').addEventListener('click', startGame);
  $('rn-again').addEventListener('click', startGame);
  $('rn-pause').addEventListener('click', () => doPause(true));
  $('rn-resume').addEventListener('click', () => doPause(false));
  $('rn-restart2').addEventListener('click', startGame);
  $('rn-board1').addEventListener('click', () => openBoard('menu'));
  $('rn-board2').addEventListener('click', () => openBoard('over'));
  $('rn-bclose').addEventListener('click', () => { screen = boardFrom; showOnly(boardFrom === 'over' ? 'over' : 'menu'); });

  /* ---------- Bảng xếp hạng ---------- */
  async function openBoard(from){
    boardFrom = from; screen = 'board'; showOnly('board');
    const list = $('rn-list'); list.innerHTML = '<div class="rn-msg">Đang tải…</div>';
    let rows = null, failed = false;
    if(opt.loadBoard){ try{ rows = await opt.loadBoard(); }catch(e){ failed = true; } } else failed = true;
    if(!alive || screen !== 'board') return;
    rows = Array.isArray(rows) ? rows.filter((r) => r && r.best > 0).sort((a, b) => b.best - a.best) : [];
    const top = rows.slice(0, 20), meId = opt.me && opt.me.uid;
    let html = top.map((r, i) => rowHtml(i + 1, r, r.uid === meId)).join('');
    if(!top.length) html = `<div class="rn-msg">${failed ? 'Chưa tải được bảng xếp hạng. Bạn vẫn chơi và lưu kỷ lục trên máy bình thường.' : 'Chưa có ai trên bảng. Hãy là người đầu tiên!'}</div>`;
    if(best > 0 && !top.some((r) => r.uid === meId)){
      html += `<div class="rn-sep">Kỷ lục trên máy này</div>` + rowHtml('–', { name: (opt.me && opt.me.name) || 'Bạn', photo: opt.me && opt.me.photo, best }, true);
    }
    list.innerHTML = html;
    list.querySelectorAll('img.rn-av').forEach((im) => im.addEventListener('error', () => { const s = doc.createElement('span'); s.className = 'rn-av'; s.textContent = im.dataset.i || '?'; im.replaceWith(s); }));
    const mine = list.querySelector('.me'); if(mine && mine.scrollIntoView) { try{ mine.scrollIntoView({ block: 'nearest' }); }catch(e){} }
  }
  function rowHtml(rank, r, me){
    const nm = String(r.name || 'Ẩn danh'), ini = esc(nm.trim().charAt(0).toUpperCase() || '?');
    const okPhoto = r.photo && /^https:\/\/[a-z0-9.-]+\.googleusercontent\.com\//.test(r.photo);
    const av = okPhoto ? `<img class="rn-av" src="${esc(r.photo)}" data-i="${ini}" referrerpolicy="no-referrer" alt="" loading="lazy">` : `<span class="rn-av">${ini}</span>`;
    return `<div class="rn-row2${me ? ' me' : ''}"><span class="rn-rk">${rank}</span>${av}<span class="rn-nm">${esc(nm)}${me ? ' <em>(bạn)</em>' : ''}</span><b class="rn-sc">${esc(r.best)}</b></div>`;
  }
  async function submitBest(rec){
    if(!opt.submitScore || !opt.me || !opt.me.uid) return 'none';
    try{ await opt.submitScore(rec); store(UI.KEY.synced, rec.best); return 'ok'; }catch(e){ return 'denied'; }
  }
  function syncPending(){      // lần mở menu: nếu kỷ lục máy này chưa gửi lên thì gửi lặng lẽ
    if(!opt.submitScore || !opt.me || !opt.me.uid || best <= 0) return;
    if((+store(UI.KEY.synced) || 0) >= best) return;
    const r = store(UI.KEY.rec) || {};
    submitBest({ best, kwh: +r.kwh || 0, coins: +r.coins || 0 });
  }

  /* ---------- Điều khiển ---------- */
  let ptr = null;
  canvas.addEventListener('pointerdown', (e) => {
    if(screen !== 'play' || paused) return;
    e.preventDefault(); try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), swiped: false };
    input.jump = true; input.held = true;
  });
  canvas.addEventListener('pointermove', (e) => {
    if(!ptr || e.pointerId !== ptr.id || ptr.swiped || screen !== 'play') return;
    const dy = e.clientY - ptr.y, dx = Math.abs(e.clientX - ptr.x);
    if(dy > UI.SWIPE_PX && dy > dx * UI.SWIPE_RATIO){ ptr.swiped = true; input.slide = true; input.held = false; }
  });
  const up = (e) => { if(ptr && e.pointerId === ptr.id){ ptr = null; input.held = false; } };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  const JUMPK = new Set([' ', 'Spacebar', 'ArrowUp', 'w', 'W']), SLIDEK = new Set(['ArrowDown', 's', 'S']);
  function onKey(e){
    if(!container.isConnected) return;
    const k = e.key;
    if(k === 'p' || k === 'P'){ if(screen === 'play' || screen === 'pause'){ doPause(screen === 'play'); e.preventDefault(); } return; }
    if(screen === 'menu' && (k === ' ' || k === 'Enter') && !/BUTTON|INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')){ startGame(); e.preventDefault(); return; }
    if(screen !== 'play' || paused) return;
    if(JUMPK.has(k)){ e.preventDefault(); if(!e.repeat){ input.jump = true; } input.held = true; }
    else if(SLIDEK.has(k)){ e.preventDefault(); if(!e.repeat) input.slide = true; }
  }
  function onKeyUp(e){ if(JUMPK.has(e.key)) input.held = false; }
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp);
  const onVis = () => { if(doc.hidden) doPause(true); else last = performance.now(); };
  doc.addEventListener('visibilitychange', onVis);

  /* ---------- Cập nhật cảnh ---------- */
  const tmpC = new THREE.Color();
  function applySky(p, distNow){
    const s = skyAt(p);
    sky.material.uniforms.top.value.copy(s.c.top); sky.material.uniforms.bot.value.copy(s.c.bot);
    scene.fog.color.copy(s.c.bot);
    hemi.color.copy(s.c.hemi); hemi.groundColor.copy(s.c.gnd); hemi.intensity = s.hi;
    sunL.color.copy(s.c.sun); sunL.intensity = s.hs;
    const night = s.night;
    facMats.forEach((m) => { m.emissiveIntensity = night * 0.9; });
    roofSlots.forEach((g) => { g.userData.fm.emissiveIntensity = night * 0.9; });
    const tan = Math.tan(camera.fov * Math.PI / 360), D = 90;                       // đặt các vật ở nền theo toạ độ màn hình
    const hh = tan * (runDist + D), ww = hh * camera.aspect;
    const sunX = clamp(lerp(-0.55, 0.65, ((p + 0.2) % 1.0)), -0.7, 0.8);
    const gy = (1 - 2 * UI.GROUND_Y) * tan * runDist;                               // y của điểm ngắm (≈ mặt mái)
    const fy = (f) => gy + (f - 0.5) * 2 * hh;                                      // f = vị trí theo chiều cao màn hình (0 đáy – 1 đỉnh)
    sunSpr.position.set(lookX + sunX * ww, fy(UI.GROUND_Y + 0.1 + s.sy * 0.5), -D);
    sunSpr.scale.setScalar(ww * 0.34); sunHalo.position.copy(sunSpr.position); sunHalo.scale.setScalar(ww * 0.8);
    sunSpr.visible = sunHalo.visible = s.sy > -0.3;
    sunSpr.material.color.copy(s.c.sun).lerp(tmpC.set('#ffffff'), 0.5);
    sunHalo.material.color.copy(s.c.sun);
    starMat.opacity = clamp((night - 0.35) * 1.6, 0, 1);
    stars.scale.set(ww, hh, 1); stars.position.set(lookX, gy + hh * 0.15, -D);
    for(const c of clouds){
      const span = 2 * ww + 60, x = ((c.bx * ww / 80 - tClock * c.sp - distNow * 0.01) % span + span) % span - span / 2;
      const cs = ww * c.k;
      c.s.position.set(lookX + x, fy(0.58 + c.y * 0.32), -D + 10); c.s.scale.set(cs, cs * 0.38, 1);
      c.m.opacity = lerp(0.9, 0.12, night); c.m.color.copy(tmpC.set('#ffffff')).lerp(s.c.bot, 0.35 * (1 - night));
    }
    return night;
  }
  function updateWorld(night){
    const d = G.dist, T = G.track;
    // mái
    while(rIdx < T.roofs.length - 1 && T.roofs[rIdx].b < d - 25) rIdx++;
    let k = 0;
    for(let i = rIdx; i < T.roofs.length && k < roofSlots.length; i++){
      const r = T.roofs[i]; if(r.a - d > 95) break;
      setRoof(roofSlots[k++], r.a, r.b, r.a - d, i);
    }
    for(; k < roofSlots.length; k++) roofSlots[k].visible = false;
    // cột điện
    const pbase = Math.floor((d - 30) / POLE_GAP);
    poles.forEach((p, i) => {
      const x = (pbase + i) * POLE_GAP - d; p.g.visible = true; p.g.position.x = x;
      p.glow.material.opacity = night; p.cone.material.opacity = night * 0.1;
    });
    lampMat.color.set(night > 0.3 ? '#fff0b0' : '#555');
    // hố & vật cản
    const used = { crate: 0, panel: 0, wire: 0, bird: 0 };
    const hz = T.hz;
    for(let i = Math.max(0, L.windowOf(hz, d - 12)); i < hz.length && hz[i].x < d + 85; i++){
      const h = hz[i]; if(h.type === 'gap' || h.broken) continue;
      const o = pools[h.type][used[h.type]++]; if(!o) continue;
      o.visible = true; const x = h.x - d;
      if(h.type === 'crate'){ o.position.set(x + h.w / 2, 0, 0); o.userData.body.scale.set(h.w, 0.8, 0.8); o.userData.lid.scale.x = h.w / 1.0; o.scale.set(1, 1, 1); }
      else if(h.type === 'panel'){ o.position.set(x + h.w / 2, 0, 0); o.scale.set(h.w, 1, 1); o.rotation.y = 0; }
      else if(h.type === 'wire'){ o.position.set(x + h.w / 2, 0, 0); const sw = Math.sin(tClock * 3 + h.x) * 0.03; o.userData.cabs.forEach((c, j) => { c.rotation.x = sw * (j % 2 ? 1 : -1); }); const sp = o.userData.spark; sp.material.opacity = Math.random() < 0.5 ? 1 : 0.3; sp.position.set(0, 0.95 + Math.random() * 0.1, (Math.random() - 0.5) * 3.2); }
      else if(h.type === 'bird'){
        o.position.set(x + h.w / 2, 1.3 + Math.sin(tClock * 6 + h.x) * 0.06, 0); const f = Math.sin(tClock * 22 + h.x) * 0.9;
        o.userData.wl.rotation.x = f; o.userData.wr.rotation.x = -f;
      }
    }
    for(const t in used){ for(let j = used[t]; j < pools[t].length; j++) pools[t][j].visible = false; }
    // tia nắng
    let ci = 0;
    for(let i = Math.max(0, L.windowOf(T.coins, d - 8)); i < T.coins.length && T.coins[i].x < d + 85; i++){
      const c = T.coins[i]; if(c.taken) continue;
      const m = coinPool[ci++]; if(!m) break;
      m.visible = true; m.position.set(c.x - d, c.y + Math.sin(tClock * 4 + c.x) * 0.05, 0); m.rotation.y = tClock * 3 + c.x * 0.7;
    }
    for(; ci < coinPool.length; ci++) coinPool[ci].visible = false;
    // vật phẩm
    const iu = { magnet: 0, shield: 0, boost: 0 };
    for(const it of T.items){
      if(it.taken || it.x < d - 8 || it.x > d + 85) continue;
      const o = pools.item[it.type][iu[it.type]++]; if(!o) continue;
      o.visible = true; o.position.set(it.x - d, it.y + Math.sin(tClock * 3 + it.x) * 0.1, 0); o.rotation.y = tClock * 2;
    }
    for(const t in iu){ for(let j = iu[t]; j < pools.item[t].length; j++) pools.item[t][j].visible = false; }
    updateFar(d, night);
  }
  function setPose(g, dt){
    const t = g.t, v = g.speed;
    const ph = t * (7.5 + v * 0.45), s = Math.sin(ph), c = Math.cos(ph);
    const T_ = tgt;
    T_.flipY = 0.9; T_.bob = 0; T_.yaw = -0.5; T_.flip = 0;
    if(screen === 'menu'){
      T_.yaw = -0.95 + Math.sin(tClock * 0.8) * 0.3; T_.legL = 0.05; T_.legR = -0.05; T_.shinL = T_.shinR = 0.06; T_.armL = 0.12 + Math.sin(tClock * 1.6) * 0.05; T_.armR = -0.12; T_.foreL = T_.foreR = -0.25; T_.lean = 0.02; T_.bob = Math.sin(tClock * 2) * 0.008; T_.tail = Math.sin(tClock * 1.6) * 0.15;
    } else if(g.dead){
      T_.yaw = -0.7;
      if(g.cause === 'fall'){ T_.flip = g.deadT * 7; T_.legL = -0.9; T_.legR = 0.4; T_.armL = -2.6; T_.armR = -2.2; T_.shinL = 1.1; T_.shinR = 0.8; T_.lean = 0; }
      else { T_.flip = -1.45; T_.flipY = 0.35; T_.legL = -0.25; T_.legR = 0.15; T_.shinL = 0.2; T_.shinR = 0.4; T_.armL = -1.7; T_.armR = -1.4; T_.foreL = T_.foreR = -0.2; T_.lean = 0; }
    } else if(g.sliding){
      T_.flip = -1.15; T_.flipY = 0.5; T_.legL = -0.35; T_.legR = -0.15; T_.shinL = 0.15; T_.shinR = 0.1; T_.armL = -1.9; T_.armR = -1.7; T_.foreL = T_.foreR = -0.3; T_.lean = 0;
    } else if(!g.onGround){
      if(g.spin > 0){ T_.flip = (1 - g.spin / 0.55) * Math.PI * 2; T_.legL = -1.5; T_.legR = -1.3; T_.shinL = T_.shinR = 1.9; T_.armL = -1.2; T_.armR = -1.2; T_.foreL = T_.foreR = -1.6; T_.lean = 0.1; }
      else if(g.vy > 0){ T_.legL = -0.9; T_.legR = 0.35; T_.shinL = 1.2; T_.shinR = 1.4; T_.armL = -2.5; T_.armR = -2.2; T_.foreL = T_.foreR = -0.3; T_.lean = 0.12; }
      else { T_.legL = -0.45; T_.legR = 0.3; T_.shinL = 0.4; T_.shinR = 0.6; T_.armL = -2.0; T_.armR = -1.7; T_.foreL = T_.foreR = -0.35; T_.lean = 0.12; }
      T_.tail = -0.5;
    } else {
      T_.legL = -0.95 * s; T_.legR = 0.95 * s; T_.shinL = 0.25 + 1.05 * Math.max(0, c); T_.shinR = 0.25 + 1.05 * Math.max(0, -c);
      T_.armL = 0.95 * s; T_.armR = -0.95 * s; T_.foreL = -1.0 - 0.25 * s; T_.foreR = -1.0 + 0.25 * s; T_.lean = 0.2; T_.bob = Math.abs(s) * 0.05;
      T_.tail = 0.5 + 0.35 * Math.sin(ph * 1.0);
    }
    const k = 1 - Math.exp(-dt * (g.dead ? 14 : (screen === 'menu' ? 8 : 24)));
    for(const n in T_) pose[n] += (T_[n] - pose[n]) * (n === 'flip' && g.spin > 0 ? 1 : k);
    ch.legL.rotation.x = pose.legL; ch.legR.rotation.x = pose.legR; ch.shinL.rotation.x = pose.shinL; ch.shinR.rotation.x = pose.shinR;
    ch.armL.rotation.x = pose.armL; ch.armR.rotation.x = pose.armR; ch.foreL.rotation.x = pose.foreL; ch.foreR.rotation.x = pose.foreR;
    ch.torso.rotation.x = pose.lean; ch.flip.rotation.x = pose.flip; ch.flip.position.y = pose.flipY; ch.body.position.y = -pose.flipY;
    ch.hips.position.y = 0.86 + pose.bob;
    if(ch.tail) ch.tail.rotation.x = pose.tail;
    ch.root.rotation.y = Math.PI / 2 + pose.yaw;
    ch.root.position.set(0, Math.max(g.y, -4), 0);
    shadow.position.set(0, 0.04, 0);
    const over = G.track.roofAt(G.dist) && g.y > -0.2 && !g.dead;
    shadow.visible = !!over; const sc = (female() ? 0.9 : 1) * 1.0 * (1 - clamp(g.y / 5, 0, 0.6)); shadow.scale.set(1.2 * sc, 1.2 * sc, 1);
    shadow.material.opacity = 0.7 - clamp(g.y / 6, 0, 0.45);
    const cy = g.y + 0.9;
    bubble.visible = !!g.shield && !g.dead; bubble.position.set(0, cy, 0); bubble.scale.setScalar(1 + Math.sin(tClock * 6) * 0.03 + (g.invuln > 0 ? Math.sin(tClock * 40) * 0.1 : 0));
    magRing.visible = g.magnet > 0 && !g.dead; magRing.position.set(0, cy, 0); magRing.rotation.set(tClock * 2, tClock * 3, 0); magRing.scale.setScalar(1 + (tClock * 1.5 % 1) * 0.5);
    boostRing.visible = g.boost > 0 && !g.dead; boostRing.position.set(0, cy, 0); boostRing.rotation.set(Math.PI / 2, 0, tClock * 5); boostRing.scale.setScalar(1.1 + Math.sin(tClock * 8) * 0.08);
  }
  const female = () => gender === 'f';

  function updateHud(){
    const kwh = L.kwhOf(G);
    if(hudCache.kwh !== kwh){ hudCache.kwh = kwh; hudEl.kwh.textContent = kwh; }
    if(hudCache.coin !== G.coins){ hudCache.coin = G.coins; hudEl.coin.textContent = G.coins; }
    const bs = Math.max(best, L.finalScore(kwh, G.coins));
    if(hudCache.best !== bs){ hudCache.best = bs; hudEl.best.textContent = bs; }
    const set = (el, on, frac) => { if(el.hidden === on) el.hidden = !on; if(on) el.style.setProperty('--p', Math.round(frac * 100) + '%'); };
    set(hudEl.chips.magnet, G.magnet > 0, G.magnet / CFG.MAGNET_T);
    set(hudEl.chips.boost, G.boost > 0, G.boost / CFG.BOOST_T);
    set(hudEl.chips.shield, !!G.shield, 1);
  }

  /* ---------- Sự kiện (âm thanh/hiệu ứng) ---------- */
  function handleEvents(){
    const ev = G.events; if(!ev.length) return;
    for(const e of ev){
      if(e === 'coin'){
        const step = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24][Math.min(G.combo - 1, 10)] || 0;
        snd.beep(880 * Math.pow(2, step / 12), 0.09, 'triangle', 0.09);
        spark(0.35, G.y + 1.0, '#ffe27a');
      } else if(e === 'jump'){ snd.beep(330, 0.09, 'square', 0.05); snd.beep(520, 0.09, 'square', 0.04, 0.05); snd.buzz(8); }
      else if(e === 'jump2'){ snd.beep(520, 0.07, 'square', 0.05); snd.beep(780, 0.1, 'square', 0.05, 0.05); snd.buzz(8); for(let i = 0; i < 4; i++) spark(-0.2, G.y + 0.6, '#cfe8ff'); }
      else if(e === 'slide'){ snd.noise(0.14, 0.07); }
      else if(e === 'shield'){ snd.noise(0.25, 0.2); snd.beep(240, 0.2, 'sawtooth', 0.12); snd.buzz([40, 30, 60]); shake = 0.25; for(let i = 0; i < 8; i++) spark(0.3, G.y + 0.9, '#6ae0ff'); }
      else if(e.startsWith('item:')){ snd.beep(660, 0.08, 'triangle', 0.1); snd.beep(880, 0.08, 'triangle', 0.1, 0.08); snd.beep(1320, 0.14, 'triangle', 0.1, 0.16); for(let i = 0; i < 6; i++) spark(0.3, G.y + 0.9, '#9dffb0'); }
      else if(e === 'die'){ snd.noise(0.35, 0.28); snd.beep(110, 0.45, 'sawtooth', 0.2); snd.beep(70, 0.5, 'sine', 0.2, 0.1); snd.buzz([60, 40, 140]); shake = 0.4; }
    }
    ev.length = 0;
  }
  function gameOver(){
    deathShown = true;
    const kwh = L.kwhOf(G), score = L.finalScore(kwh, G.coins), rec = L.isRecord(score, best);
    finalRes = { kwh, coins: G.coins, score, rec };
    $('rn-ok').textContent = kwh; $('rn-oc').textContent = G.coins; $('rn-os').textContent = score;
    $('rn-newrec').hidden = !rec; $('rn-onote').textContent = '';
    screen = 'over'; showOnly('over');
    if(rec){
      best = score; store(UI.KEY.best, best); store(UI.KEY.rec, { kwh, coins: G.coins });
      snd.beep(784, 0.12, 'triangle', 0.1, 0.1); snd.beep(988, 0.12, 'triangle', 0.1, 0.22); snd.beep(1318, 0.25, 'triangle', 0.1, 0.34);
      submitBest({ best: score, kwh, coins: G.coins }).then((r) => {
        if(!alive || screen !== 'over') return;
        const n = $('rn-onote');
        if(r === 'ok') n.textContent = '✓ Đã lưu lên bảng xếp hạng';
        else if(r === 'denied') n.textContent = 'Kỷ lục đã lưu trên máy này.';
      });
    }
  }

  /* ---------- Vòng lặp ---------- */
  let slow = 0, frames = 0;
  function frame(now){
    if(!alive) return;
    if(!container.isConnected){ dispose(); return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if(paused && screen !== 'menu'){ return; }
    tClock += dt;
    if(++frames > 30 && frames < 150){ slow += dt; if(frames === 149 && slow / 119 > 0.03 && dpr > 1){ dpr = 1; renderer.setPixelRatio(1); resize(); } }
    if(screen === 'play'){
      if(dbg.autoplay){ dbg.bot.birdMode = dbg.bird; const a = L.botStep(G, dbg.bot); input.jump = a.jump; input.held = a.held; input.slide = a.slide; }
      let rest = dt;
      while(rest > 1e-6){
        const h = Math.min(rest, 1 / 60); rest -= h;
        L.stepGame(G, h, input); input.jump = false; input.slide = false;
        if(G.dead) break;
      }
      handleEvents();
      updateHud();
      if(G.dead && !deathShown && G.deadT > (G.cause === 'fall' ? 0.7 : 0.95)) gameOver();
    } else if(screen === 'over' || screen === 'board'){
      if(G.dead) G.deadT += dt;
    }
    if(G.dead){ if(!deathShown) L.stepGame(G, dt, input); handleEvents(); }
    camK += (camTo - camK) * (1 - Math.exp(-dt * 5));
    const sk = shake > 0 ? shake : 0; shake = Math.max(0, shake - dt);
    const phase = dbg.phase != null ? dbg.phase : (UI.START_PHASE + G.dist / UI.CYCLE_M) % 1;
    const night = applySky(phase, G.dist);
    updateWorld(night);
    setPose(G, dt);
    for(const p of sparks){ if(p.t > 0){ p.t -= dt; p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.material.opacity = clamp(p.t / 0.45, 0, 1); if(p.t <= 0) p.s.visible = false; } }
    placeCamera((Math.random() - 0.5) * sk * 0.8, (Math.random() - 0.5) * sk * 0.8);
    renderer.render(scene, camera);
  }

  /* ---------- Dọn dẹp ---------- */
  function dispose(){
    if(!alive) return; alive = false; cancelAnimationFrame(raf);
    if(ro) ro.disconnect(); else window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp);
    doc.removeEventListener('visibilitychange', onVis);
    scene.traverse((o) => {
      if(o.geometry) o.geometry.dispose();
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach((m) => m.dispose());
    });
    own.forEach((t) => { try{ t.dispose(); }catch(e){} });
    renderer.dispose();
    try{ renderer.forceContextLoss(); }catch(e){}
    wrap.remove();
  }

  resize(); refreshMenu(); showOnly('menu'); syncPending();
  last = performance.now(); raf = requestAnimationFrame(frame);

  return {
    dispose,
    pause(){ doPause(true); },
    resume(){ doPause(false); },
    restart(){ if(alive) startGame(); },
    setCharacter, setSkin, skins: SKINS,
    // phục vụ kiểm thử trình duyệt
    debug: { get game(){ return G; }, get screen(){ return screen; }, dbg, setCam(k){ camTo = camK = k; }, openBoard, THREE },
  };
}

/* ================= CSS (chèn một lần) ================= */
function injectCss(doc){
  if(doc.getElementById('rn-css')) return;
  const st = doc.createElement('style'); st.id = 'rn-css';
  st.textContent = `
.rn-root{position:relative;width:100%;height:100%;min-height:320px;overflow:hidden;background:#000;border-radius:14px;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff}
.rn-canvas{display:block;width:100%;height:100%;touch-action:none}
.rn-scr{position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:none}
.rn-scr[hidden]{display:none}
.rn-scr button,.rn-scr .rn-list,.rn-scr .rn-card{pointer-events:auto}
.rn-title{padding:14px 14px 0;text-align:center;text-shadow:0 2px 8px rgba(0,0,0,.55)}
.rn-title h2{margin:0;font-size:1.55rem;font-weight:900;letter-spacing:.2px}
.rn-title p{margin:6px auto 0;font-size:.82rem;line-height:1.35;max-width:30em;background:rgba(0,0,0,.35);border-radius:10px;padding:5px 10px;display:inline-block}
.rn-bottom{margin-top:auto;padding:10px 14px 14px;display:flex;flex-direction:column;gap:8px;align-items:center;background:linear-gradient(transparent,rgba(0,0,0,.55) 40%)}
.rn-chars{display:flex;gap:8px}
.rn-char{border:2px solid rgba(255,255,255,.5);background:rgba(0,0,0,.4);color:#fff;border-radius:999px;padding:8px 18px;font-size:.95rem;font-weight:700;cursor:pointer}
.rn-char.on{background:#ff9a1f;border-color:#fff;color:#2a1600}
.rn-best{font-size:.9rem;text-shadow:0 1px 4px #000}
.rn-btn{border:0;border-radius:14px;padding:11px 18px;font-size:1rem;font-weight:800;background:rgba(255,255,255,.92);color:#27303f;cursor:pointer;min-width:120px}
.rn-btn.rn-pri{background:linear-gradient(#ffb23c,#ff8a0d);color:#2a1600;font-size:1.15rem;padding:13px 30px;min-width:220px;box-shadow:0 4px 0 #b85f00}
.rn-btn:active{transform:translateY(2px)}
.rn-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.rn-ibtn{border:0;background:rgba(0,0,0,.45);color:#fff;width:42px;height:42px;border-radius:12px;font-size:1.2rem;cursor:pointer;flex:none}
.rn-hud-top{display:flex;gap:8px;padding:10px;align-items:flex-start}
.rn-stat{background:rgba(0,0,0,.42);border-radius:12px;padding:5px 11px;min-width:64px;text-align:center;line-height:1.1}
.rn-stat b{display:block;font-size:1.35rem;font-variant-numeric:tabular-nums}
.rn-stat small{font-size:.68rem;opacity:.85}
.rn-sun b{color:#ffd54a}.rn-bestc{margin-left:auto}.rn-bestc b{color:#cfe2ff;font-size:1.1rem}
.rn-pw{display:flex;gap:8px;padding:0 10px}
.rn-chip{position:relative;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.4rem;background:conic-gradient(#7dff9a var(--p,100%),rgba(0,0,0,.45) 0);}
.rn-chip[hidden]{display:none}
.rn-chip span{position:relative;z-index:1}
.rn-chip i{position:absolute;inset:4px;border-radius:50%;background:rgba(10,15,30,.85)}
.rn-pausescr,.rn-over,.rn-boardscr{align-items:center;justify-content:center;background:rgba(5,10,25,.55)}
.rn-card{background:rgba(18,26,48,.94);border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:10px;align-items:center;width:min(92%,380px);box-shadow:0 10px 40px rgba(0,0,0,.5)}
.rn-card h3{margin:0;font-size:1.5rem}
.rn-newrec{background:#ffd54a;color:#4a2a00;font-weight:900;border-radius:999px;padding:4px 14px}
.rn-grid{display:flex;gap:10px;width:100%;justify-content:center}
.rn-grid>div{flex:1;background:rgba(255,255,255,.08);border-radius:12px;padding:8px 4px;text-align:center}
.rn-grid b{display:block;font-size:1.5rem;font-variant-numeric:tabular-nums}.rn-grid small{font-size:.72rem;opacity:.8}
.rn-score b{color:#ffd54a;font-size:1.8rem}
.rn-note{font-size:.8rem;opacity:.8;min-height:1.1em;text-align:center}
.rn-boardcard{max-height:86%;align-items:stretch;gap:8px}
.rn-bh{display:flex;align-items:center;justify-content:space-between;gap:8px}.rn-bh h3{font-size:1.15rem}
.rn-list{overflow-y:auto;overscroll-behavior:contain;flex:1;min-height:120px;max-height:62vh;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.rn-row2{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px}
.rn-row2:nth-child(odd){background:rgba(255,255,255,.05)}
.rn-row2.me{background:rgba(255,154,31,.28);outline:1px solid #ff9a1f}
.rn-rk{width:1.8em;text-align:center;font-weight:800;opacity:.85}
.rn-av{width:30px;height:30px;border-radius:50%;object-fit:cover;background:#3b4a78;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;flex:none}
.rn-nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rn-nm em{opacity:.7;font-style:normal;font-size:.8em}
.rn-sc{font-variant-numeric:tabular-nums;color:#ffd54a}
.rn-msg{padding:18px 8px;text-align:center;opacity:.85;font-size:.9rem}
.rn-sep{font-size:.72rem;opacity:.7;padding:8px 8px 2px}
@media (max-height:430px){.rn-title p{display:none}.rn-title h2{font-size:1.15rem}.rn-bottom{flex-direction:row;flex-wrap:wrap;justify-content:center;padding:6px}.rn-btn.rn-pri{min-width:140px;padding:9px 18px}}
`;
  doc.head.appendChild(st);
}
