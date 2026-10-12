/* Mini game 3D "Chạy năng lượng": kỹ thuật viên điện mặt trời chạy vô tận trên các mái nhà (2.5D, góc nhìn ngang).
   Module ES, tự đủ: games.js nạp bằng import('./runner.js?v=...') rồi gọi runner(container, opt). Không tự truy cập Firebase.
   Phần luật chơi/sinh đường nằm ở runner-logic.js (thuần, kiểm thử bằng Node). Xem INTEGRACION_RUNNER.md. */
import * as THREE from './vendor/three.module.min.js';
// nạp logic cùng chuỗi ?v= với file này để không lệch phiên bản khi cache
const L = await import('./runner-logic.js' + new URL(import.meta.url).search);
const { CFG } = L;

/* ================= Hằng số dễ chỉnh theo phản hồi người chơi (giao diện/điều khiển) ================= */
const UI = {
  SWIPE_PX: 14,          // vuốt ít nhất chừng này điểm ảnh thì tính là vuốt (trái/phải = đổi làn, xuống = trượt, lên = nhảy)
  SWIPE_RATIO: 1.0,      // độ lệch theo hướng chính phải lớn hơn hướng kia × hệ số này
  CYCLE_M: 2000,         // chu kỳ đổi bầu trời: sáng → trưa → hoàng hôn → đêm (mét)
  START_PHASE: 0.02,     // pha bầu trời lúc xuất phát (0 = sáng sớm)
  VIS_W: 8.6,            // bề ngang cảnh nhìn thấy (m) tại chỗ nhân vật; nhỏ hơn = nhân vật to hơn
  DRAW_DIST: 105,        // nhìn xa bao nhiêu mét (vật ở xa hơn không được vẽ)
    MAX_DPR: 2,
  KEY: { best: 'gm_runner_best', rec: 'gm_runner_bestrec', char: 'gm_runner_char', skin: 'gm_runner_skin', synced: 'gm_runner_synced' },
};

/* ================= Sổ đăng ký skin (thêm skin mới: thêm một mục, rồi gọi setSkin(id)) ================= */
export const SKINS = {
  dongphuc: { name: 'Đồng phục vàng cam', need: 0, shirt: '#ff9a1f', shirt2: '#f08a10', pants: '#f58a12', helmet: '#ffd21a', band: '#dfe3e8', boots: '#3a2f2a', glove: '#3d3d44', belt: '#5a3a1e', skin: '#e6b08a' },
  dien:    { name: 'Điện lực cam đậm', need: 0, shirt: '#f2680c', shirt2: '#d9570a', pants: '#e8610b', helmet: '#f4f6f8', band: '#e8edf0', boots: '#2e2a28', glove: '#e9e9ea', belt: '#4a3018', skin: '#e6b08a' },
  xanh:    { name: 'Kỹ thuật viên xanh HMT', need: 60, shirt: '#1d4f8f', shirt2: '#163B6D', pants: '#17407a', helmet: '#f4f6f8', band: '#F2B807', boots: '#1b1f2a', glove: '#F2B807', belt: '#2a2a2a', skin: '#e6b08a' },
  nang:    { name: 'Chiến binh mặt trời', need: 120, shirt: '#ffd24d', shirt2: '#f2b705', pants: '#ff9a1f', helmet: '#ff7a00', band: '#ffffff', boots: '#5a3a1e', glove: '#ffffff', belt: '#7a3a00', skin: '#e6b08a' },
  pin:     { name: 'Xanh lá pin sạc', need: 200, shirt: '#1e9e6b', shirt2: '#14805A', pants: '#0f6b4a', helmet: '#F2B807', band: '#dfffe9', boots: '#1f2a24', glove: '#F2B807', belt: '#33261a', skin: '#e6b08a' },
  dem:     { name: 'Ca đêm phản quang', need: 300, shirt: '#2a2e38', shirt2: '#1f222a', pants: '#232630', helmet: '#3a3f4a', band: '#7dffd1', boots: '#111318', glove: '#7dffd1', belt: '#111318', skin: '#e6b08a' },
  vang:    { name: 'Vàng kim huyền thoại', need: 500, shirt: '#f0c53a', shirt2: '#d9a91e', pants: '#d9a91e', helmet: '#fff0a0', band: '#8a5a00', boots: '#1a1a1a', glove: '#fff0a0', belt: '#1a1a1a', skin: '#e6b08a' },
};
export const supported = () => { try{ const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }catch(e){ return false; } };

const LOGO_URL = new URL('./logo.png', import.meta.url).href;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const store = (k, v) => { try{ if(v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); }catch(e){} return null; };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function roundedBoxGeo(size, r, seg){   // hộp bo tròn (giữ UV của BoxGeometry nên texture vẫn dán đúng mặt)
  const g = new THREE.BoxGeometry(size, size, size, seg, seg, seg);
  const p = g.attributes.position, n = g.attributes.normal, half = size / 2 - r;
  const v = new THREE.Vector3(), inner = new THREE.Vector3(), d = new THREE.Vector3();
  for(let i = 0; i < p.count; i++){
    v.fromBufferAttribute(p, i);
    inner.set(Math.max(-half, Math.min(half, v.x)), Math.max(-half, Math.min(half, v.y)), Math.max(-half, Math.min(half, v.z)));
    d.copy(v).sub(inner);
    if(d.lengthSq() > 1e-9){ d.normalize(); n.setXYZ(i, d.x, d.y, d.z); v.copy(inner).addScaledVector(d, r); p.setXYZ(i, v.x, v.y, v.z); }
  }
  return g;
}
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
/* Biến tần (inverter) tham khảo ảnh thật: GoodWe (nắp đỏ, dải đen có đèn ở đáy) và Sungrow (nắp trắng xám, nhãn "INVERTER n") */
const screws = (c, w, h) => { c.fillStyle = '#9aa0a6'; for(const [x, y] of [[10, 10], [w / 2, 8], [w - 10, 10], [10, h - 10], [w / 2, h - 8], [w - 10, h - 10]]){ c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill(); } };
const crateTex = () => canvasTex(256, 145, (c, w, h) => {   // GoodWe đỏ
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#e0343a'); g.addColorStop(1, '#b01d22');
  c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w * 0.55, 0); c.lineTo(w * 0.2, h); c.lineTo(0, h); c.fill();
  c.strokeStyle = '#8f1519'; c.lineWidth = 5; c.strokeRect(2.5, 2.5, w - 5, h - 5); screws(c, w, h);
  c.fillStyle = '#e9d9d9'; c.save(); c.translate(26, 30); c.rotate(Math.PI / 4); c.fillRect(-7, -7, 14, 14); c.restore();
  c.fillStyle = '#f1dede'; c.font = '800 13px "Trebuchet MS",Arial'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('GOODWE', 40, 31);
  c.fillStyle = '#f1dede'; c.beginPath(); c.arc(w - 20, 30, 6, 0, 7); c.fill();
  c.fillStyle = '#16181b'; c.beginPath(); c.roundRect ? c.roundRect(14, h - 46, w - 28, 26, 5) : c.rect(14, h - 46, w - 28, 26); c.fill();   // dải đen hiển thị
  c.fillStyle = '#d6291f'; c.beginPath(); c.moveTo(34, h - 33); c.lineTo(40, h - 27); c.lineTo(34, h - 21); c.lineTo(28, h - 27); c.fill();
  c.fillStyle = '#2eea6a'; c.fillRect(w - 84, h - 32, 26, 10); c.fillStyle = '#e8e8e8'; c.beginPath(); c.arc(w - 32, h - 33, 3.5, 0, 7); c.fill();
});
const crateTexH = () => canvasTex(256, 145, (c, w, h) => {   // Huawei kem, góc bo tròn, ô đen bầu dục có logo ở giữa
  c.fillStyle = '#8a8a86'; c.fillRect(0, 0, w, h);
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#f2eddc'); g.addColorStop(1, '#d9d2bd');
  c.fillStyle = g; c.beginPath(); if(c.roundRect) c.roundRect(3, 3, w - 6, h - 6, 22); else c.rect(3, 3, w - 6, h - 6); c.fill();
  c.strokeStyle = '#b9b29d'; c.lineWidth = 3; c.stroke();
  screws(c, w, h);
  c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(w / 2, h / 2 - 4, 40, 19, 0, 0, 7); c.fill();
  c.fillStyle = '#111316'; c.beginPath(); c.ellipse(w / 2, h / 2 - 4, 36, 15, 0, 0, 7); c.fill();
  c.fillStyle = '#d6293a'; for(let i = 0; i < 9; i++){ const a = (i / 9) * Math.PI - Math.PI * 0.95, r0 = 5; c.beginPath(); c.ellipse(w / 2 + Math.cos(a) * 6, h / 2 - 11 + Math.sin(a) * -2 + 6, 1.6, 4, a + 1.57, 0, 7); c.fill(); }
  c.fillStyle = '#e8e8e8'; c.font = '700 6px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('HUAWEI', w / 2, h / 2 + 4);
});
const crateTexW = () => canvasTex(256, 145, (c, w, h) => {   // Sungrow trắng xám, hai nửa nắp
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#f1f1ed'); g.addColorStop(1, '#d4d5cf');
  c.fillStyle = g; c.fillRect(0, 0, w, h); c.strokeStyle = '#aab0b5'; c.lineWidth = 5; c.strokeRect(2.5, 2.5, w - 5, h - 5); screws(c, w, h);
  c.fillStyle = 'rgba(60,60,60,.22)'; c.fillRect(w * 0.76, 4, 3, h - 8);                                   // khe giữa hai nắp
  c.strokeStyle = '#3f7bff'; c.lineWidth = 3; c.strokeRect(w * 0.31, 22, 16, 12);                         // đèn trạng thái xanh
  c.fillStyle = '#ffffff'; c.fillRect(w * 0.27, 44, 34, 38); c.strokeStyle = '#222'; c.lineWidth = 2; c.strokeRect(w * 0.27, 44, 34, 38);   // nhãn INVERTER n
  c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 8px "Trebuchet MS",Arial'; c.fillText('INVERTER', w * 0.27 + 17, 53); c.font = '900 22px "Times New Roman",serif'; c.fillText(String(1 + Math.floor(Math.random() * 9)), w * 0.27 + 17, 71);
  c.fillStyle = '#e9e9e6'; c.fillRect(w * 0.3, h - 36, 40, 12); c.strokeStyle = '#999'; c.lineWidth = 1.5; c.strokeRect(w * 0.3, h - 36, 40, 12); c.fillStyle = '#555'; c.font = '700 8px "Trebuchet MS",Arial'; c.fillText('SUNGROW', w * 0.3 + 20, h - 30);
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
  // nhân vật dáng hoạt hình mềm: thân và chi bo tròn, đầu to, mắt có điểm sáng, má hồng, mũ bảo hộ bóng, ba lô đồ nghề
  const female = gender === 'f';
  const M = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
  const G = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.05, ...o });
  const mShirt = M(skin.shirt), mPants = M(skin.pants), mBand = new THREE.MeshStandardMaterial({ color: skin.band, roughness: 0.25, metalness: 0.55, emissive: '#2a2a2a' }), mBoot = G(skin.boots, { roughness: 0.5 }), mGlove = M(skin.glove);
  const mSkin = M(skin.skin), mHelm = G(skin.helmet), mBelt = M(skin.belt), mDark = M('#1a1a1a'), mHair = M('#2b1a10');
  const mWhite = M('#ffffff'), mBuckle = G('#c9ccd2', { metalness: 0.7, roughness: 0.3 }), mShirt2 = M(skin.shirt2), mPouch = M('#6b4a2b'), mHelmD = G('#e0b000'), mPad = M('#2c2f36');
  const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if(parent) parent.add(m); return m; };
  const rbox = (w, h, d, r, mat, x = 0, y = 0, z = 0, parent) => { const g = roundedBoxGeo(1, r, 4); g.scale(w, h, d); const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); if(parent) parent.add(m); return m; };
  const cap = (r, len, mat, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat); m.position.set(x, y, z); if(parent) parent.add(m); return m; };
  const ring = (r, tube, mat, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 18), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); if(parent) parent.add(m); return m; };
  const sph = (r, mat, x, y, z, parent, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); if(parent) parent.add(m); return m; };
  const root = new THREE.Group(), flip = new THREE.Group(), body = new THREE.Group(), hips = new THREE.Group();
  root.add(flip); flip.add(body); body.add(hips);
  flip.position.y = 0.9; body.position.y = -0.9; hips.position.y = 0.86;
  const tw = female ? 0.44 : 0.5;
  // thân áo (hộp bo tròn giữ nguyên mapping texture): +z là phía trước. Thứ tự mặt: +x, -x, +y, -y, +z, -z
  const side = new THREE.MeshLambertMaterial({ map: tex.side }), front = new THREE.MeshLambertMaterial({ map: tex.front }), back = new THREE.MeshLambertMaterial({ map: tex.back });
  const torso = new THREE.Group(); torso.position.y = 0.0; hips.add(torso);
  const tg = roundedBoxGeo(1, 0.16, 5); tg.scale(tw, 0.64, 0.32);
  const tb = new THREE.Mesh(tg, [side, side, mShirt, mShirt, front, back]); tb.position.y = 0.33; torso.add(tb);
  rbox(tw + 0.03, 0.075, 0.34, 0.3, mBelt, 0, 0.05, 0, torso);                            // đai đồ nghề
  rbox(0.09, 0.065, 0.03, 0.3, mBuckle, 0, 0.05, 0.172, torso);                           // khóa đai
  rbox(0.3, 0.07, 0.3, 0.4, mShirt, 0, 0.64, 0, torso);                                   // cổ áo dựng
  rbox(tw + 0.03, 0.03, 0.335, 0.3, mBand, 0, 0.56, 0, torso);                            // vạch phản quang ngang ngực
  rbox(0.12, 0.17, 0.07, 0.3, mPouch, -tw * 0.5 - 0.06, -0.01, 0.06, torso);              // túi đồ nghề
  rbox(0.07, 0.15, 0.05, 0.3, mDark, tw * 0.5 + 0.04, 0.0, -0.06, torso);                 // bộ đàm
  box(0.012, 0.09, 0.012, mDark, tw * 0.5 + 0.04, 0.1, -0.06, torso);                     // ăng-ten
  rbox(0.1, 0.12, 0.08, 0.3, mBelt, tw * 0.5 + 0.03, 0.04, 0.05, torso); rbox(0.1, 0.12, 0.08, 0.3, mBelt, -tw * 0.5 - 0.03, 0.04, 0.05, torso);
  cap(0.025, 0.1, mDark, tw * 0.5 + 0.03, -0.06, 0.05, torso);                            // tua vít
  // ba lô đồ nghề phía sau, có vạch phản quang
  rbox(tw * 0.82, 0.42, 0.14, 0.3, mShirt2, 0, 0.36, -0.23, torso); rbox(tw * 0.84, 0.035, 0.145, 0.3, mBand, 0, 0.3, -0.23, torso); rbox(tw * 0.6, 0.12, 0.05, 0.3, mPouch, 0, 0.18, -0.31, torso);
  // đầu to hoạt hình + mũ bảo hộ
  cap(0.045, 0.04, mSkin, 0, 0.7, 0, torso);                                              // cổ
  const head = new THREE.Group(); head.position.set(0, 0.86, 0.01); torso.add(head);
  sph(0.16, mSkin, 0, 0, 0, head, 1.02, 0.98, 0.96);
  for(const sx of [-0.055, 0.055]){
    const w_ = sph(0.036, mWhite, sx, 0.01, 0.135, head, 1, 1.1, 0.5);
    sph(0.022, mDark, sx + sx * 0.08, 0.008, 0.147, head, 0.9, 1.1, 0.5);
    sph(0.008, new THREE.MeshBasicMaterial({ color: '#ffffff' }), sx + sx * 0.14 + 0.006, 0.02, 0.158, head);   // điểm sáng trong mắt
    const br = box(0.062, 0.014, 0.02, mHair, sx, 0.062, 0.138, head); br.rotation.z = sx > 0 ? -0.15 : 0.15;
    sph(0.025, M('#ff9a9a'), sx * 1.55, -0.04, 0.125, head, 1, 0.65, 0.4);                // má hồng
    sph(0.034, mSkin, sx * 2.9, -0.005, 0, head, 0.5, 1, 0.8);                            // tai
  }
  sph(0.022, mSkin, 0, -0.018, 0.152, head);                                              // mũi
  const sm = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 14, Math.PI), M('#8a3a3a')); sm.position.set(0, -0.045, 0.14); sm.rotation.z = Math.PI; head.add(sm);   // miệng cười
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.172, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.53), mHelm); helm.position.set(0, 0.03, -0.005); head.add(helm);
  rbox(0.3, 0.03, 0.15, 0.5, mHelm, 0, 0.045, 0.145, head);                               // vành mũ phía trước
  rbox(0.34, 0.025, 0.06, 0.5, mHelmD, 0, 0.04, -0.16, head);                             // vành sau
  rbox(0.05, 0.04, 0.34, 0.5, mHelmD, 0, 0.2, 0, head);                                   // gờ nóc mũ
  for(const sx of [-1, 1]){
    rbox(0.014, 0.035, 0.22, 0.5, mHelmD, sx * 0.11, 0.13, 0, head);                       // gân bên mũ
    box(0.012, 0.1, 0.012, mDark, sx * 0.15, -0.04, 0.05, head);                           // quai mũ
  }
  box(0.1, 0.06, 0.02, mDark, 0, -0.115, 0.11, head).rotation.x = 0.3;                      // quai cằm
  rbox(0.08, 0.05, 0.05, 0.4, mBuckle, 0, 0.115, 0.17, head);                              // đèn pin gắn mũ
  box(0.05, 0.034, 0.012, M('#fff6b0', { emissive: '#fff6b0' }), 0, 0.115, 0.197, head);
  const dec = new THREE.Mesh(new THREE.CircleGeometry(0.04, 20), new THREE.MeshBasicMaterial({ color: '#ffffff' })); dec.position.set(0.1, 0.13, 0.115); dec.rotation.y = 0.9; head.add(dec);   // tem tròn trên mũ
  let tail = null;
  if(female){
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.162, 16, 12, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.5), mHair); hair.position.set(0, 0.01, -0.03); head.add(hair);
    tail = new THREE.Group(); tail.position.set(0, -0.01, -0.15); head.add(tail);
    sph(0.065, mHair, 0, 0, -0.03, tail);
    const t2 = cap(0.055, 0.22, mHair, 0, -0.15, -0.06, tail); t2.rotation.x = 0.25;
    box(0.075, 0.035, 0.075, M('#e0405a'), 0, 0.01, -0.01, tail);
  }
  // tay: vai tròn, cánh tay/cẳng tay dạng viên nhộng, găng tay tròn, vạch phản quang là vòng đeo quanh tay
  const arm = (sx) => {
    const sh = new THREE.Group(); sh.position.set(sx * (tw / 2 + 0.065), 0.57, 0); torso.add(sh);
    sph(0.08, mShirt2, 0, 0, 0, sh, 1, 1, 1);
    cap(0.058, 0.2, mShirt, 0, -0.15, 0, sh); ring(0.062, 0.014, mBand, 0, -0.12, 0, sh);
    const fore = new THREE.Group(); fore.position.y = -0.29; sh.add(fore);
    sph(0.058, mShirt2, 0, 0, 0, fore);
    cap(0.052, 0.17, mShirt, 0, -0.13, 0, fore); ring(0.056, 0.012, mBand, 0, -0.1, 0, fore);
    sph(0.07, mGlove, 0, -0.27, 0.01, fore, 1, 1.05, 1);                                    // găng tay
    sph(0.03, mGlove, sx * 0.065, -0.28, 0.04, fore);                                       // ngón cái
    return { sh, fore };
  };
  const aL = arm(1), aR = arm(-1);
  // chân: đùi/ống chân dạng viên nhộng, đầu gối có bảo vệ, giày bảo hộ mũi tròn
  const leg = (sx) => {
    const th = new THREE.Group(); th.position.set(sx * (tw * 0.24), 0, 0); hips.add(th);
    cap(0.098, 0.26, mPants, 0, -0.2, 0, th);
    rbox(0.1, 0.12, 0.04, 0.3, mShirt2, sx * 0.04, -0.17, 0.095, th);                      // túi hộp trên đùi
    const shin = new THREE.Group(); shin.position.y = -0.41; th.add(shin);
    sph(0.088, mPants, 0, 0, 0, shin);
    cap(0.082, 0.22, mPants, 0, -0.18, 0, shin); ring(0.086, 0.014, mBand, 0, -0.14, 0, shin); ring(0.085, 0.014, mBand, 0, -0.23, 0, shin);
    rbox(0.13, 0.1, 0.05, 0.4, mPad, 0, 0.0, 0.085, shin);                                 // bảo vệ đầu gối
    rbox(0.19, 0.13, 0.32, 0.35, mBoot, 0, -0.33, 0.05, shin); rbox(0.2, 0.035, 0.34, 0.3, mDark, 0, -0.385, 0.05, shin); sph(0.085, mPad, 0, -0.34, 0.17, shin, 1, 0.8, 0.9);   // giày và mũi giày bảo hộ
    return { th, shin };
  };
  const lL = leg(1), lR = leg(-1);
  const sc = female ? 0.92 : 1; root.scale.setScalar(sc);
  return { root, flip, body, hips, torso, head, tail, armL: aL.sh, foreL: aL.fore, armR: aR.sh, foreR: aR.fore, legL: lL.th, shinL: lL.shin, legR: lR.th, shinR: lR.shin, sc };
}

/* ================= Vật thể trên đường (làn chạy dọc trục z; người chơi chạy về phía -z, camera ở sau lưng) ================= */
function makeCrate(T){
  // biến tần gắn trên hai trụ thép; mặt trước có hàng đầu nối MC4 + cáp DC phía dưới. userData.mA = bản GoodWe đỏ, mB = bản Sungrow trắng
  const g = new THREE.Group();
  const mA = [T.crateSide, T.crateSide, T.crateTopR, T.crateTopR, T.crate, T.crateSide];
  const mB = [T.crateSideW, T.crateSideW, T.crateTop, T.crateTop, T.crateW, T.crateSideW];
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.78, 1), mA); body.position.y = 0.52; g.add(body);
  for(const x of [-0.62, 0.62]){ const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.2, 0.09), T.metal); post.position.set(x, 0.1, 0.3); g.add(post); const bk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.5), T.metal); bk.position.set(x, 0.13, 0.15); g.add(bk); }
  for(let i = 0; i < 12; i++){   // hàng đầu nối MC4 đỏ/đen và cáp DC rủ xuống ở đáy mặt trước
    const x = -0.62 + i * 0.113, red = i % 2 === 0;
    const mc = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.05), red ? T.mc4r : T.mc4b); mc.position.set(x, 0.1, 0.46); g.add(mc);
    const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 5), red ? T.mc4r : T.mc4b); cb.position.set(x, 0.04, 0.47); g.add(cb);
  }
  const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10), T.conduit); cd.position.set(0.5, 0.09, 0.42); g.add(cd);   // ống ruột gà cam (bản trắng)
  const mC = [T.crateSideH, T.crateSideH, T.crateTopH, T.crateTopH, T.crateH, T.crateSideH];
  g.userData = { body, mA, mB, mC, cd };
  return g;
}
function makePanel(T){
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 2.2), [T.frame, T.frame, T.panelBroken, T.frame, T.frame, T.frame]);
  p.position.y = 0.33; p.rotation.x = -0.18; g.add(p);
  for(const [x, z] of [[-0.7, 0.8], [0.7, 0.8], [-0.7, -0.9], [0.7, -0.9]]){ const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), T.frame); l.position.set(x, 0.1, z); g.add(l); }
  const shard = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.5), T.panelBroken); shard.position.set(0.55, 0.05, 1.1); shard.rotation.set(0.05, 0.5, 0.2); g.add(shard);
  return g;
}
function makeZap(T){
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.82, 28), new THREE.MeshBasicMaterial({ color: '#ffe14a', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.46, 20), new THREE.MeshBasicMaterial({ color: '#ff3b2e', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); dot.rotation.x = -Math.PI / 2; dot.position.y = 0.06; g.add(dot);
  const seg = 14, mkLine = (color, op) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((seg + 1) * 3), 3)); const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: op, fog: false })); l.frustumCulled = false; g.add(l); return l; };
  const bolts = [mkLine('#ffffff', 1), mkLine('#9fe8ff', 0.85), mkLine('#6ac8ff', 0.7)];
  const glow = new THREE.Sprite(T.glowCyan); glow.scale.set(3.4, 3.4, 1); glow.position.y = 0.6; g.add(glow);
  const core = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 8), new THREE.MeshBasicMaterial({ color: '#bfeeff', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); core.position.y = 4; g.add(core);
  g.userData = { ring, dot, bolts, glow, core, seg };
  return g;
}
function zapShape(o, on, t){
  const u = o.userData;
  u.ring.visible = u.dot.visible = !on || true;
  u.ring.material.opacity = on ? 0.9 : 0.45 + 0.4 * Math.abs(Math.sin(t * 8));
  u.dot.material.opacity = on ? 0.8 : 0.25 + 0.3 * Math.abs(Math.sin(t * 8));
  u.glow.visible = u.core.visible = on; u.bolts.forEach((b) => { b.visible = on; });
  if(!on) return;
  u.bolts.forEach((b, k) => {
    const p = b.geometry.attributes.position; let x = 0, z = 0;
    for(let i = 0; i <= u.seg; i++){
      const f = i / u.seg, y = 8.5 * (1 - f); if(i > 0 && i < u.seg){ x += (Math.random() - 0.5) * 1.1; z += (Math.random() - 0.5) * 0.4; x *= 0.78; }
      else { x = 0; z = 0; }
      p.setXYZ(i, x + (k - 1) * 0.07, y, z);
    }
    p.needsUpdate = true; b.material.opacity = (k === 0 ? 1 : 0.8) * (Math.random() < 0.18 ? 0.25 : 1);
  });
  u.glow.material.opacity = 0.6 + Math.random() * 0.4; u.core.material.opacity = 0.2 + Math.random() * 0.3;
}
function makeTray(T){
  // máng đi dây điện (cable tray) vắt ngang đường rồi nối ra ngoài 3 làn: đầu trái xuống dàn pin mặt trời, đầu phải vào biến tần.
  // Mỗi đối tượng là một đoạn rộng một làn; làn trái/phải có thêm đoạn máng kéo dài ra ngoài lề đường và thiết bị, làn giữa có biển cảnh báo.
  const g = new THREE.Group();
  const steel = T.metal;
  const segment = (x0, x1) => {
    const L = Math.abs(x1 - x0), cx = (x0 + x1) / 2, p = new THREE.Group();
    for(const z of [-0.26, 0.26]){ const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.14, 0.05), steel); rail.position.set(cx, 1.18, z); p.add(rail); }
    const n = Math.max(2, Math.round(L / 0.225)); for(let i = 0; i < n; i++){ const rung = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.52), steel); rung.position.set(x0 + (i + 0.5) * (x1 - x0) / n, 1.1, 0); p.add(rung); }
    [['#16181c', -0.14], ['#d6291f', -0.04], ['#1d5fd0', 0.06], ['#f2c230', 0.16]].forEach(([c, z], k) => { const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, L, 8), new THREE.MeshLambertMaterial({ color: c })); cab.rotation.z = Math.PI / 2; cab.position.set(cx, 1.2 + (k % 2) * 0.03, z); p.add(cab); });
    return p;
  };
  const mkPost = (sx) => { const p = new THREE.Group(); const pole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.12), steel); pole.position.set(sx * 1.05, 0.75, 0); p.add(pole); const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 0.6), steel); arm.position.set(sx * 0.95, 1.05, 0); p.add(arm); const base = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.32), T.crateBase); base.position.set(sx * 1.05, 0.03, 0); p.add(base); g.add(p); return p; };
  const mid = segment(-1, 1); g.add(mid);
  // đầu trái: máng kéo ra ngoài, rủ xuống dàn pin mặt trời trên giá đỡ
  const left = new THREE.Group(); left.add(segment(-2.1, -1)); left.add(mkPost(-1));
  const cabL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.95, 8), T.cable); cabL.position.set(-2.1, 0.7, 0); left.add(cabL);
  const arr = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 1.3), [T.frame, T.frame, T.panelOk, T.frame, T.frame, T.frame]); arr.position.set(-2.1, 0.62, 0.05); arr.rotation.x = -0.35; left.add(arr);
  for(const [x, z, h] of [[-2.75, 0.55, 0.45], [-1.45, 0.55, 0.45], [-2.75, -0.5, 0.75], [-1.45, -0.5, 0.75]]){ const lg = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, 0.06), T.frame); lg.position.set(x, h / 2, z); left.add(lg); }
  g.add(left);
  // đầu phải: máng kéo ra ngoài, ống dây đi xuống vào biến tần gắn trên hai trụ
  const right = new THREE.Group(); right.add(segment(1, 2.1)); right.add(mkPost(1));
  const inv = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.62, 0.34), [T.crateSideW, T.crateSideW, T.crateTop, T.crateTop, T.crateW, T.crateSideW]); inv.position.set(2.1, 0.55, 0.1); right.add(inv);
  for(const x of [1.7, 2.5]){ const pst = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), T.metal); pst.position.set(x, 0.15, 0.1); right.add(pst); }
  const cabR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8), T.cable); cabR.position.set(2.1, 0.97, 0.1); right.add(cabR);
  for(let i = 0; i < 6; i++){ const mc = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.04), i % 2 ? T.mc4b : T.mc4r); mc.position.set(1.7 + i * 0.16, 0.2, 0.22); right.add(mc); }
  g.add(right);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.42), T.danger); sign.position.set(0, 1.55, 0.3); g.add(sign);
  const signB = sign.clone(); signB.position.z = -0.3; signB.rotation.y = Math.PI; g.add(signB);
  g.userData = { left, right, sign, signB };
  return g;
}
function makeWire(T){
  const g = new THREE.Group();
  for(const x of [-0.95, 0.95]){ const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.7, 8), T.metal); pole.position.set(x, 1.85, 0); g.add(pole); }
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.14), T.wood); arm.position.y = 3.55; g.add(arm);
  for(let i = 0; i < 7; i++){
    const x = -0.9 + i * 0.3, h = 2.55 + (i % 2) * 0.12;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, h, 5), T.cable); c.position.set(x, 3.5 - h / 2, 0); g.add(c);
    const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6), T.white); ins.position.set(x, 3.5, 0); g.add(ins);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.55), T.danger); sign.position.set(0, 3.0, 0.1); g.add(sign);
  const spark = new THREE.Sprite(T.sparkMat); spark.scale.set(0.9, 0.9, 1); spark.position.set(0, 1.0, 0); g.add(spark);
  g.userData.spark = spark; return g;
}
function makeBird(T){
  const g = new THREE.Group();
  const bodyM = new THREE.MeshLambertMaterial({ color: '#4b5565' });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), bodyM); b.scale.set(0.9, 0.85, 1.3); g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), bodyM); h.position.set(0, 0.1, 0.33); g.add(h);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 6), T.beak); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.08, 0.5); g.add(beak);
  for(const s of [-1, 1]){ const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), T.dark); e.position.set(s * 0.09, 0.15, 0.42); g.add(e); }
  const tailM = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.3), bodyM); tailM.position.set(0, 0, -0.45); g.add(tailM);
  const wing = (s) => { const w = new THREE.Group(); w.position.set(s * 0.12, 0.1, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.34), bodyM); m.position.x = s * 0.28; w.add(m); g.add(w); return w; };
  g.userData.wl = wing(1); g.userData.wr = wing(-1);
  return g;
}
function makeBike(T){
  // xe đạp hướng về +z (cùng hướng nhân vật): khung đỏ cam, hai bánh có nan hoa, ghi đông, yên, bàn đạp
  const g = new THREE.Group();
  const red = new THREE.MeshLambertMaterial({ color: '#ff7a1a' }), dark = new THREE.MeshLambertMaterial({ color: '#202226' }), chrome = new THREE.MeshStandardMaterial({ color: '#cfd5dc', metalness: 0.8, roughness: 0.25 });
  const tube = (x0, y0, z0, x1, y1, z1, r, m) => { const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1), d = b.clone().sub(a), mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), m); mesh.position.copy(a.clone().add(b).multiplyScalar(0.5)); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(mesh); return mesh; };
  const wheels = [];
  for(const z of [-0.55, 0.55]){
    const w = new THREE.Group(); w.position.set(0, 0.33, z); g.add(w);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.04, 8, 24), dark); tire.rotation.y = Math.PI / 2; w.add(tire);
    for(let i = 0; i < 6; i++){ const sp = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.6, 0.012), chrome); sp.rotation.x = i * Math.PI / 6; w.add(sp); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8), chrome); hub.rotation.z = Math.PI / 2; w.add(hub);
    wheels.push(w);
  }
  tube(0, 0.33, -0.55, 0, 0.62, -0.1, 0.022, red); tube(0, 0.62, -0.1, 0, 0.62, 0.38, 0.022, red); tube(0, 0.33, 0.55, 0, 0.62, 0.38, 0.022, red); tube(0, 0.33, -0.55, 0, 0.2, -0.05, 0.02, red); tube(0, 0.2, -0.05, 0, 0.62, -0.1, 0.02, red); tube(0, 0.2, -0.05, 0, 0.62, 0.38, 0.02, red);
  tube(0, 0.62, 0.38, 0, 0.95, 0.4, 0.02, chrome); tube(-0.22, 0.97, 0.4, 0.22, 0.97, 0.4, 0.017, dark);   // cổ phuộc và ghi đông
  tube(0, 0.62, -0.1, 0, 0.82, -0.14, 0.017, chrome); const seat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.26), dark); seat.position.set(0, 0.85, -0.15); g.add(seat);
  const crank = new THREE.Group(); crank.position.set(0, 0.2, -0.05); g.add(crank);
  for(const s of [-1, 1]){ const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.02), chrome); arm.position.set(s * 0.1, s * 0.11, 0); crank.add(arm); const pd = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.12), dark); pd.position.set(s * 0.14, s * 0.22, 0); crank.add(pd); }
  g.userData = { wheels, crank };
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
  } else if(type === 'bike'){
    const b = makeBike(T); b.scale.setScalar(0.62); b.rotation.y = Math.PI / 2; b.position.y = -0.3; g.add(b); g.userData.bike = b;
  } else {   // x2: huy hiệu logo công ty
    const gm = new THREE.CylinderGeometry(0.46, 0.46, 0.1, 32); gm.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(gm, [T.gold, T.medal, T.medal]); g.add(m);
  }
  const glow = new THREE.Sprite(type === 'magnet' ? T.glowRed : type === 'shield' ? T.glowCyan : type === 'bike' ? T.glowGreen : T.glowGold); glow.scale.set(1.6, 1.6, 1); g.add(glow);
  g.scale.setScalar(1.2);
  return g;
}
/* Huy hiệu x2: logo công ty trong vòng cam, nhãn "x2" */
function medalTex(){
  const draw = (c, w, h, img) => {
    c.fillStyle = '#ffb02a'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ff8a0d'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.49, 0, 7); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.4, 0, 7); c.fill();
    if(img){ c.save(); c.beginPath(); c.arc(w / 2, h / 2, w * 0.38, 0, 7); c.clip(); const s = w * 0.76; c.drawImage(img, w / 2 - s / 2, h / 2 - s / 2, s, s); c.restore(); }
    c.fillStyle = '#e03a1a'; c.beginPath(); c.arc(w * 0.78, h * 0.78, w * 0.17, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.font = '900 ' + Math.round(w * 0.2) + 'px "Trebuchet MS",Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('x2', w * 0.78, h * 0.79);
  };
  const t = canvasTex(128, 128, (c, w, h) => draw(c, w, h, null));
  withLogo((img) => { const cv = t.image; draw(cv.getContext('2d'), cv.width, cv.height, img); t.needsUpdate = true; });
  return t;
}
/* Tòa nhà gắn pin năng lượng mặt trời (thay cho toa tàu): thân tường có cửa sổ, nửa trên phủ giàn pin */
function buildingTex(front){
  const cols = front ? 2 : 4;
  const draw = (c, w, h, lit) => {
    c.fillStyle = lit ? '#000' : '#d9d3c4'; c.fillRect(0, 0, w, h);
    const ph = h * 0.44;
    if(!lit){
      for(let i = 0; i < 600; i++){ c.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; c.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
      const g = c.createLinearGradient(0, 0, w, ph); g.addColorStop(0, '#2c6fd0'); g.addColorStop(1, '#16397f');
      c.fillStyle = '#c9d2dc'; c.fillRect(0, 0, w, ph + 6); c.fillStyle = g; c.fillRect(4, 4, w - 8, ph - 4);
      c.strokeStyle = 'rgba(225,238,255,.7)'; c.lineWidth = 1.5;
      for(let i = 1; i < cols * 2; i++){ const x = 4 + (w - 8) * i / (cols * 2); c.beginPath(); c.moveTo(x, 4); c.lineTo(x, ph); c.stroke(); }
      for(let i = 1; i < 4; i++){ const y = 4 + (ph - 4) * i / 4; c.beginPath(); c.moveTo(4, y); c.lineTo(w - 4, y); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(4, 4); c.lineTo(w * 0.5, 4); c.lineTo(w * 0.2, ph); c.lineTo(4, ph); c.fill();
      c.fillStyle = '#f2c230'; c.fillRect(0, ph + 6, w, 6);
    }
    const rows = 2, top = ph + 22, ch_ = (h - top - 10) / rows;
    let s = 5; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for(let r = 0; r < rows; r++) for(let k = 0; k < cols; k++){
      const x = (k + 0.18) * w / cols, ww = w / cols * 0.64, y = top + r * ch_ + ch_ * 0.12, hh = ch_ * 0.7;
      if(lit){ if(rnd() < 0.55){ c.fillStyle = '#ffd27a'; c.fillRect(x, y, ww, hh); } }
      else { c.fillStyle = '#486a88'; c.fillRect(x, y, ww, hh); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x, y, ww, hh * 0.25); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x - 2, y + hh, ww + 4, 3); }
    }
  };
  const w = front ? 128 : 256;
  const map = canvasTex(w, 256, (c, ww, hh) => draw(c, ww, hh, false), { repeat: true });
  const emi = canvasTex(w, 256, (c, ww, hh) => draw(c, ww, hh, true), { repeat: true });
  return { map, emi };
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
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color('#69b4ee') }, bot: { value: new THREE.Color('#ffe0b0') }, hv: { value: 0.5 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; uniform float hv; varying vec2 vUv; void main(){ float k = smoothstep(hv, 1.0, vUv.y); gl_FragColor = vec4(mix(bot, top, k), 1.0);\n#include <colorspace_fragment>\n}',
    depthTest: false, depthWrite: false, fog: false }));
  sky.frustumCulled = false; sky.renderOrder = -100; scene.add(sky);
  scene.fog = new THREE.Fog('#ffe0b0', 30, 130);
  const hemi = new THREE.HemisphereLight('#ffffff', '#667766', 1.0); scene.add(hemi);
  const sunL = new THREE.DirectionalLight('#ffffff', 2); sunL.position.set(-4, 9, 9); scene.add(sunL);

  /* texture & vật liệu dùng chung */
  const own = [];     // texture/vật liệu cần giải phóng khi dọn
  const keep = (t) => { own.push(t); return t; };
  const Tx = {};
  const fac = facadeTex(); Tx.facade = keep(fac.map); Tx.facadeEmi = keep(fac.emi);
  Tx.panel = keep(panelTex(false)); Tx.panelBroken = keep(panelTex(true));
  Tx.crate = keep(crateTex()); Tx.crateW = keep(crateTexW()); Tx.crateH = keep(crateTexH()); Tx.coin = keep(coinFace()); Tx.glow = keep(glowTex()); Tx.cloud = keep(cloudTex());
  const Lm = (c, o = {}) => keep(new THREE.MeshLambertMaterial({ color: c, ...o }));
  const spr = (c, s) => keep(new THREE.SpriteMaterial({ map: Tx.glow, color: c, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: s == null ? 1 : s }));
  const MAT = {
    crate: Lm('#ffffff', { map: Tx.crate }), crateW: Lm('#ffffff', { map: Tx.crateW }), crateH: Lm('#ffffff', { map: Tx.crateH }), crateSideH: Lm('#e3dcc8'), crateTopH: Lm('#ebe5d2'), crateSide: Lm('#b81f24'), crateSideW: Lm('#dfe0da'), crateTop: Lm('#c9ccd1'), crateTopR: Lm('#c4242a'), conduit: Lm('#e0663a'), crateBase: Lm('#3a3f46'), mc4r: Lm('#d6291f'), mc4b: Lm('#1a1a1a'), metal: Lm('#9aa3ad'), wood: Lm('#6b4a2b'), cable: Lm('#16181c'), white: Lm('#f2f2f2'),
    danger: Lm('#ffffff', { map: keep(canvasTex(64, 40, (c, w, h) => { c.fillStyle = '#ffdd22'; c.fillRect(0, 0, w, h); c.fillStyle = '#c00'; c.font = '900 30px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⚡', w / 2, h / 2 + 2); })), side: THREE.DoubleSide }),
    barrier: Lm('#b8b9bc'), medal: Lm('#ffffff', { map: keep(medalTex()), emissive: '#442200' }), frame: Lm('#aab3be'), panelBroken: Lm('#ffffff', { map: Tx.panelBroken }), beak: Lm('#ff9a1f'), dark: Lm('#111'),
    red: Lm('#e0302a'), ceramic: Lm('#f4efe6'), gold: Lm('#e8b830'), cyan: Lm('#46d6ff', { emissive: '#1a90b0' }), green: Lm('#38b04a', { emissive: '#144a1c' }), yellow: Lm('#ffe14a', { emissive: '#aa8a00' }),
  };
  const TEX = { ...MAT, sparkMat: spr('#ffe9a0'), glowRed: spr('#ff5a4a'), glowCyan: spr('#6ae0ff'), glowGreen: spr('#6aff7a'), glowGold: spr('#ffd04a', 0.9), glowCoin: spr('#ffc040', 0.45) };
  TEX.panelOk = Lm('#ffffff', { map: Tx.panel });
  const geoms = { unit: new THREE.BoxGeometry(1, 1, 1), plane: new THREE.PlaneGeometry(1, 1) };

  /* ---------- Đường 3 làn, cánh đồng pin, nhà xa, cột điện, tòa nhà chắn đường ---------- */
  const ROAD_LEN = 240, DRAW = UI.DRAW_DIST;
  const roadTex = keep(canvasTex(256, 512, (c, w, h) => {
    c.fillStyle = '#4a4d55'; c.fillRect(0, 0, w, h);
    for(let i = 0; i < 2500; i++){ c.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.06})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    c.fillStyle = '#6d6f73'; c.fillRect(0, 0, w * 0.25, h); c.fillRect(w * 0.75, 0, w * 0.25, h);
    c.fillStyle = '#f2c230'; c.fillRect(w * 0.25 - 4, 0, 6, h); c.fillRect(w * 0.75 - 2, 0, 6, h);
    c.fillStyle = '#f2f2f2'; for(const u of [5 / 12, 7 / 12]) c.fillRect(w * u - 3, 0, 6, h * 0.38);      // vạch đứt giữa các làn
  }, { repeat: true }));
  roadTex.repeat.set(1, ROAD_LEN / 8);
  const road = new THREE.Mesh(geoms.plane, keep(new THREE.MeshLambertMaterial({ map: roadTex })));
  road.rotation.x = -Math.PI / 2; road.scale.set(12, ROAD_LEN, 1); road.position.set(0, 0, 40 - ROAD_LEN / 2); scene.add(road);
  const ground = new THREE.Mesh(geoms.plane, keep(new THREE.MeshLambertMaterial({ color: '#7b8470' })));
  ground.rotation.x = -Math.PI / 2; ground.scale.set(700, 700, 1); ground.position.set(0, -0.06, -120); scene.add(ground);
  for(const sx of [-1, 1]){ const b = new THREE.Mesh(geoms.unit, MAT.barrier); b.scale.set(0.35, 0.8, ROAD_LEN); b.position.set(sx * 3.35, 0.4, 40 - ROAD_LEN / 2); scene.add(b); }
  // cánh đồng pin hai bên đường (InstancedMesh: mỗi tấm nghiêng về phía người chơi, đặt trên chân đế)
  Tx.panel.repeat.set(3, 1);
  const PF = { cols: [-9, 9, -17.5, 17.5], per: 40, step: 4 };
  const pfMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(7.4, 0.08, 2.2), [MAT.frame, MAT.frame, Lm('#ffffff', { map: Tx.panel }), MAT.frame, MAT.frame, MAT.frame], PF.cols.length * PF.per);
  const pfPost = new THREE.InstancedMesh(new THREE.BoxGeometry(6.8, 0.8, 0.1), MAT.dark, PF.cols.length * PF.per);
  pfMesh.frustumCulled = pfPost.frustumCulled = false; scene.add(pfMesh); scene.add(pfPost);
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, 0, 0)), _qi = new THREE.Quaternion(), _s1 = new THREE.Vector3(1, 1, 1), _pv = new THREE.Vector3();
  function updateField(d){
    let k = 0;
    for(const cx of PF.cols) for(let i = 0; i < PF.per; i++){
      const z = 18 - ((((PF.step * i - d) % 160) + 160) % 160);
      _pv.set(cx, 0.95, z); _m4.compose(_pv, _q, _s1); pfMesh.setMatrixAt(k, _m4);
      _pv.set(cx, 0.4, z - 0.25); _m4.compose(_pv, _qi, _s1); pfPost.setMatrixAt(k, _m4); k++;
    }
    pfMesh.instanceMatrix.needsUpdate = pfPost.instanceMatrix.needsUpdate = true;
  }
  // nhà xa hai bên (cửa sổ sáng đèn về đêm, giàn pin trên mái)
  const BH = [16, 26, 38], bdGeo = BH.map((h) => { const g = geoms.unit.clone(); const uv = g.attributes.uv; for(let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 14 / 6, uv.getY(i) * h / 8); return g; });
  const bdMats = [0, 1, 2].map((i) => keep(new THREE.MeshLambertMaterial({ map: Tx.facade, emissiveMap: Tx.facadeEmi, emissive: '#ffffff', emissiveIntensity: 0, color: ['#e6dfd0', '#d3d9e3', '#e8d6c6'][i] })));
  const bdPan = Lm('#2a5fb8', { emissive: '#0a1d44' });
  const backdrop = [];
  for(let i = 0; i < 16; i++){
    const side = i % 2 ? 1 : -1, j = i >> 1, v = (i * 5) % 3;
    const m = new THREE.Mesh(bdGeo[v], bdMats[i % 3]); m.scale.set(14, BH[v], 14); scene.add(m);
    const pan = new THREE.Mesh(geoms.unit, bdPan); pan.scale.set(0.8, 0.5 / BH[v], 0.5); pan.position.set(0, 0.5 + 0.3 / BH[v], 0); m.add(pan);
    backdrop.push({ m, x: side * (31 + (j * 7) % 9), s: j * 24 + (side > 0 ? 12 : 0), h: BH[v] });
  }
  // cột điện + đường dây (bên trái), cột đèn đường (hai bên)
  const POLE_GAP = 22;
  const wireGeo = (() => {
    const pts = [];
    for(const x of [-0.8, 0, 0.8]){ let prev = null; for(let i = 0; i <= 10; i++){ const t = i / 10, q = [x, 7.4 - 0.6 * 4 * t * (1 - t), -POLE_GAP * t]; if(prev) pts.push(...prev, ...q); prev = q; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g;
  })();
  const wireMat = keep(new THREE.LineBasicMaterial({ color: '#15171c' }));
  const lampMat = keep(new THREE.MeshBasicMaterial({ color: '#555' }));
  const coneMat = keep(new THREE.MeshBasicMaterial({ color: '#ffe7a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }));
  const glowMat = spr('#ffe7a0', 0);
  const poles = [];
  function makePole(side, wires){
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8, 8), MAT.wood); pole.position.y = 4; g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.12), MAT.wood); arm.position.y = 7.4; if(wires) g.add(arm);
    const la = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 0.07), MAT.metal); la.position.set(-side * 0.7, 6.6, 0); g.add(la);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), lampMat); lamp.position.set(-side * 1.35, 6.55, 0); g.add(lamp);
    const glow = new THREE.Sprite(glowMat); glow.scale.set(3.2, 3.2, 1); glow.position.set(-side * 1.35, 6.2, 0); g.add(glow);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6.4, 16, 1, true), coneMat); cone.position.set(-side * 1.35, 3.3, 0); g.add(cone);
    if(wires) g.add(new THREE.LineSegments(wireGeo, wireMat));
    scene.add(g); return g;
  }
  for(let i = 0; i < 9; i++){ poles.push({ g: makePole(-1, true), x: -4.7, s: i * POLE_GAP }); poles.push({ g: makePole(1, false), x: 4.7, s: i * POLE_GAP + POLE_GAP / 2 }); }
  // tòa nhà gắn pin mặt trời chắn đường (thay cho toa tàu)
  const BT = buildingTex(false), BF = buildingTex(true); [BT.map, BT.emi, BF.map, BF.emi].forEach(keep);
  const bldTints = ['#ffffff', '#f2e4d2', '#dbe6f2'];
  const roofTex = keep(canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#c9d2dc'; c.fillRect(0, 0, w, h); const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2c6fd0'); g.addColorStop(1, '#16397f'); c.fillStyle = g; c.fillRect(5, 5, w - 10, h - 10); c.strokeStyle = 'rgba(225,238,255,.75)'; c.lineWidth = 2; for(let i = 1; i < 4; i++){ c.beginPath(); c.moveTo(5 + (w - 10) * i / 4, 5); c.lineTo(5 + (w - 10) * i / 4, h - 5); c.stroke(); c.beginPath(); c.moveTo(5, 5 + (h - 10) * i / 4); c.lineTo(w - 5, 5 + (h - 10) * i / 4); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(5, 5); c.lineTo(w * 0.6, 5); c.lineTo(w * 0.2, h - 5); c.lineTo(5, h - 5); c.fill(); }, { repeat: true }));
  const bldSlots = [];
  for(let i = 0; i < 8; i++){
    const sm = BT.map.clone(), se = BT.emi.clone(); sm.needsUpdate = se.needsUpdate = true; own.push(sm, se);
    const sideMats = bldTints.map((t) => keep(new THREE.MeshLambertMaterial({ map: sm, emissiveMap: se, emissive: '#ffffff', emissiveIntensity: 0, color: t })));
    const frontMats = bldTints.map((t) => keep(new THREE.MeshLambertMaterial({ map: BF.map, emissiveMap: BF.emi, emissive: '#ffffff', emissiveIntensity: 0, color: t })));
    const rt = roofTex.clone(); rt.needsUpdate = true; own.push(rt); const topMat = keep(new THREE.MeshLambertMaterial({ map: rt }));
    const mesh = new THREE.Mesh(geoms.unit, [sideMats[0], sideMats[0], topMat, topMat, frontMats[0], frontMats[0]]);
    mesh.visible = false; scene.add(mesh);
    bldSlots.push({ mesh, sm, se, rt, sideMats, frontMats, mats: bldTints.map((_, t) => [sideMats[t], sideMats[t], topMat, topMat, frontMats[t], frontMats[t]]) });
  }
  /* ---------- Mặt trời, mây, sao: gắn vào camera nên luôn nằm đúng vị trí trên màn hình ---------- */
  scene.add(camera);
  const SKY_D = 150;
  const sunSpr = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: Tx.glow, color: '#fff2c0', transparent: true, depthWrite: false, fog: false })));
  sunSpr.renderOrder = -90; camera.add(sunSpr);
  const sunHalo = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: Tx.glow, color: '#ffd080', transparent: true, depthWrite: false, fog: false, opacity: 0.55, blending: THREE.AdditiveBlending })));
  sunHalo.renderOrder = -91; camera.add(sunHalo);
  const clouds = [];
  for(let i = 0; i < 9; i++){
    const m = keep(new THREE.SpriteMaterial({ map: Tx.cloud, transparent: true, depthWrite: false, fog: false, opacity: 0.9 }));
    const s = new THREE.Sprite(m); s.renderOrder = -80; camera.add(s);
    clouds.push({ s, m, bx: (i / 9) * 2.8 - 1.4, y: 0.2 + (i * 37 % 10) / 14, k: 0.28 + (i * 13 % 9) * 0.03, sp: 0.004 + (i % 4) * 0.002 });
  }
  const starGeo = new THREE.BufferGeometry();
  { const p = []; for(let i = 0; i < 140; i++) p.push((Math.random() - 0.5) * 2, 0.2 + Math.random() * 0.8, 0); starGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); }
  const starMat = keep(new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  const stars = new THREE.Points(starGeo, starMat); stars.frustumCulled = false; stars.renderOrder = -95; camera.add(stars);

  /* ---------- Bóng giả, hiệu ứng ---------- */
  const shadow = new THREE.Mesh(geoms.plane, keep(new THREE.MeshBasicMaterial({ map: keep(canvasTex(64, 64, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(0,0,0,.65)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); })), transparent: true, depthWrite: false })));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; scene.add(shadow);
  const sparks = []; for(let i = 0; i < 20; i++){ const s = new THREE.Sprite(spr('#ffe27a')); s.visible = false; s.scale.set(0.5, 0.5, 1); scene.add(s); sparks.push({ s, t: 0, vx: 0, vy: 0 }); }
  let sparkI = 0;
  function spark(x, y, color){ const p = sparks[sparkI++ % sparks.length]; p.t = 0.45; p.vx = (Math.random() - 0.3) * 3; p.vy = 1 + Math.random() * 2.5; p.s.position.set(x, y, 0.5); p.s.material.color.set(color || '#ffe27a'); p.s.visible = true; }
  const bikeRide = makeBike(TEX); bikeRide.visible = false; scene.add(bikeRide);
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 14), keep(new THREE.MeshBasicMaterial({ color: '#5ae0ff', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))); bubble.visible = false; scene.add(bubble);
  const magRing = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.03, 6, 40), keep(new THREE.MeshBasicMaterial({ color: '#ff6a5a', transparent: true, opacity: 0.6, fog: false }))); magRing.visible = false; scene.add(magRing);
  const boostRing = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 6, 40), keep(new THREE.MeshBasicMaterial({ color: '#7dff7a', transparent: true, opacity: 0.55, fog: false }))); boostRing.visible = false; scene.add(boostRing);

  /* ---------- Pool vật cản, tia nắng, vật phẩm ---------- */
  const pools = { crate: [], panel: [], wire: [], bird: [], zap: [], tray: [], item: { magnet: [], shield: [], boost: [], bike: [] } };
  const mk = (n, f, arr) => { for(let i = 0; i < n; i++){ const o = f(); o.visible = false; scene.add(o); arr.push(o); } };
  mk(14, () => makeCrate(TEX), pools.crate); mk(10, () => makePanel(TEX), pools.panel); mk(10, () => makeWire(TEX), pools.wire); mk(10, () => makeBird(TEX), pools.bird); mk(6, () => makeZap(TEX), pools.zap); mk(9, () => makeTray(TEX), pools.tray);
  for(const t of ['magnet', 'shield', 'boost', 'bike']) mk(3, () => makeItem(t, TEX), pools.item[t]);
  const coinGeo = (() => { const g = new THREE.CylinderGeometry(0.34, 0.34, 0.08, 20); g.rotateX(Math.PI / 2); return g; })();
  const coinMats = [keep(new THREE.MeshLambertMaterial({ color: '#ffb020', emissive: '#ff8a00', emissiveIntensity: 0.7 })), keep(new THREE.MeshLambertMaterial({ map: Tx.coin, emissive: '#ffa000', emissiveMap: Tx.coin, emissiveIntensity: 0.6 })), keep(new THREE.MeshLambertMaterial({ map: Tx.coin, emissive: '#ffa000', emissiveMap: Tx.coin, emissiveIntensity: 0.6 }))];
  const coinPool = [];
  for(let i = 0; i < 150; i++){
    const m = new THREE.Mesh(coinGeo, coinMats); const gl = new THREE.Sprite(TEX.glowCoin); gl.scale.set(1.0, 1.0, 1); m.add(gl);
    m.visible = false; scene.add(m); coinPool.push(m);
  }

  /* ---------- Nhân vật ---------- */
  let gender = store(UI.KEY.char) === 'f' ? 'f' : 'm';
  const unlockedSkin = (id) => !!SKINS[id] && (SKINS[id].need || 0) <= best;
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
  const pose = { legL: 0, legR: 0, shinL: 0.2, shinR: 0.2, armL: 0, armR: 0, foreL: -0.4, foreR: -0.4, lean: 0, flip: 0, flipY: 0.9, bob: 0, yaw: 0, roll: 0, tail: 0.3 };
  const tgt = { ...pose };

  /* ---------- Camera: sau lưng nhân vật, nhìn dọc đường 3 làn ---------- */
  let camK = 1;                     // 1 = cận cảnh màn chờ, 0 = camera chạy
  let vw = 300, vh = 400, camD = 9, camH = 4.5, camX = 0, horizonFy = 0.3;
  const _dir = new THREE.Vector3();
  function resize(){
    vw = wrap.clientWidth || container.clientWidth || 300; vh = wrap.clientHeight || container.clientHeight || 400;
    renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.updateProjectionMatrix();
    const tan = Math.tan(camera.fov * Math.PI / 360);
    camD = clamp(UI.VIS_W / (2 * tan * camera.aspect), 6.5, 15);
    camH = 0.34 * camD + 1.7;
    scene.fog.near = 30; scene.fog.far = UI.DRAW_DIST + 25;
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  if(ro) ro.observe(wrap); else window.addEventListener('resize', resize);
  function placeCamera(shakeX, shakeY){
    const run = { px: camX * 0.55, py: camH, pz: camD, lx: camX * 0.4, ly: 1.1, lz: -16 };
    const near = { px: 0.5, py: 1.35, pz: Math.max(3.6, 4.6 / Math.max(0.6, Math.min(1.4, camera.aspect * 1.2))), lx: 0, ly: 0.95, lz: 0 };
    const k = camK * camK * (3 - 2 * camK);
    camera.position.set(lerp(run.px, near.px, k) + (shakeX || 0), lerp(run.py, near.py, k) + (shakeY || 0), lerp(run.pz, near.pz, k));
    camera.lookAt(lerp(run.lx, near.lx, k), lerp(run.ly, near.ly, k), lerp(run.lz, near.lz, k));
    camera.updateMatrixWorld(true);
    camera.getWorldDirection(_dir);
    horizonFy = Math.tan(-Math.asin(clamp(_dir.y, -0.99, 0.99))) / Math.tan(camera.fov * Math.PI / 360);   // vị trí đường chân trời trên màn hình
  }

  /* ---------- Trạng thái ---------- */
  let screen = 'menu', boardFrom = 'menu';
  let G = L.createGame((opt.seed || 1) | 0 || 1);
  let paused = false, last = performance.now(), raf = 0, acc = 0, tClock = 0, shake = 0, deathShown = false;
  let best = +store(UI.KEY.best) || 0;
  { const sv = store(UI.KEY.skin); if(unlockedSkin(sv) && sv !== skinId){ skinId = sv; setCharacterModel(); } }
  const input = { jump: false, held: false, slide: false, left: false, right: false };
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
        <div class="rn-chip" id="rn-pw-bike" hidden><span>🚲</span><i></i></div>
        <div class="rn-chip" id="rn-pw-boost" hidden><span><img src="${LOGO_URL}" alt=""><b>x2</b></span><i></i></div>
      </div>
    </div>
    <div class="rn-scr rn-menu">
      <div class="rn-title"><h2>⚡ Chạy năng lượng</h2><p>Vuốt trái/phải = đổi làn · vuốt lên = nhảy (vuốt lên lần nữa trên không = nhảy đôi; nhảy lên mái nhà, biến tần để chạy trên đó) · vuốt xuống = trượt · tránh tia sét giật</p></div>
      <div class="rn-bottom">
        <div class="rn-chars" role="group" aria-label="Chọn nhân vật">
          <button class="rn-char" data-g="m">👷‍♂️ Nam</button><button class="rn-char" data-g="f">👷‍♀️ Nữ</button>
        </div>
        <div class="rn-skins" id="rn-skins" role="group" aria-label="Chọn trang phục"></div>
        <div class="rn-skinname" id="rn-skinname"></div>
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
  const hudEl = { kwh: $('rn-kwh'), coin: $('rn-coin'), best: $('rn-bestv'), chips: { magnet: $('rn-pw-magnet'), shield: $('rn-pw-shield'), boost: $('rn-pw-boost'), bike: $('rn-pw-bike') } };
  const hudCache = { kwh: -1, coin: -1, best: -1 };
  if(opt.onExit) ['rn-exit1', 'rn-exit2', 'rn-exit3'].forEach((id) => { const b = $(id); b.hidden = false; b.addEventListener('click', () => { try{ opt.onExit(); }catch(e){} }); });

  function refreshMenu(){
    wrap.querySelectorAll('.rn-char').forEach((b) => b.classList.toggle('on', b.dataset.g === gender));
    $('rn-skins').innerHTML = Object.keys(SKINS).map((id) => { const s = SKINS[id], ok = unlockedSkin(id);
      return `<button class="rn-sk${id === skinId ? ' on' : ''}${ok ? '' : ' lock'}" data-s="${id}" aria-label="${s.name}" style="background:linear-gradient(135deg,${s.shirt} 55%,${s.helmet} 55%)">${ok ? '' : '🔒'}</button>`; }).join('');
    $('rn-skinname').textContent = SKINS[skinId].name;
    $('rn-menubest').innerHTML = best > 0 ? `Kỷ lục của bạn: <b>${best}</b> điểm` : 'Chưa có kỷ lục — chạy thử nào!';
  }
  function setCharacter(g2){
    gender = g2 === 'f' ? 'f' : 'm'; store(UI.KEY.char, gender); setCharacterModel(); refreshMenu();
  }
  function setSkin(id){ if(!SKINS[id]) return; skinId = id; store(UI.KEY.skin, id); setCharacterModel(); refreshMenu(); }
  $('rn-skins').addEventListener('click', (e) => { const b = e.target.closest('.rn-sk'); if(!b) return; const id = b.dataset.s;
    if(unlockedSkin(id)){ setSkin(id); snd.beep(660, 0.06, 'triangle', 0.07); }
    else { $('rn-skinname').textContent = '🔒 ' + SKINS[id].name + ' — mở khóa khi đạt ' + SKINS[id].need + ' điểm'; snd.beep(220, 0.08, 'square', 0.05); } });
  wrap.querySelectorAll('.rn-char').forEach((b) => b.addEventListener('click', () => { setCharacter(b.dataset.g); snd.beep(660, 0.06, 'triangle', 0.07); }));

  function startGame(){
    const seed = opt.seed ? (opt.seed | 0) : (Math.floor(Math.random() * 2147483000) + 1);
    G = L.createGame(seed); rIdx = 0; deathShown = false; finalRes = null; shake = 0; hudCache.kwh = hudCache.coin = hudCache.best = -1;
    acc = 0; input.jump = input.slide = input.left = input.right = false; input.held = false; camX = 0; comboSfx = 0; paused = false; screen = 'play'; camTo = 0;
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
  // Chỉ điều khiển bằng VUỐT (không còn chạm = nhảy, vì chạm hay bị nhận nhầm khi vuốt): lên = nhảy (vuốt lần nữa trên không = nhảy đôi),
  // xuống = trượt, trái/phải = đổi làn. Mỗi lần đặt ngón chỉ một thao tác; ngưỡng vuốt thấp nên phản hồi ngay khi ngón vừa trượt.
  let ptr = null;
  canvas.addEventListener('pointerdown', (e) => {
    if(screen !== 'play' || paused) return;
    e.preventDefault(); try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, acted: false, up: false };
  });
  canvas.addEventListener('pointermove', (e) => {
    if(!ptr || e.pointerId !== ptr.id || screen !== 'play' || ptr.acted) return;
    const dx = e.clientX - ptr.x0, dy = e.clientY - ptr.y0, ax = Math.abs(dx), ay = Math.abs(dy), R = UI.SWIPE_RATIO;
    if(ax < UI.SWIPE_PX && ay < UI.SWIPE_PX) return;
    ptr.acted = true;
    if(ax > ay * R){ if(dx > 0) input.right = true; else input.left = true; }
    else if(dy > 0){ input.slide = true; input.held = false; }
    else { input.jump = true; input.held = true; ptr.up = true; }       // giữ ngón thì nhảy cao hơn, nhấc sớm thì nhảy thấp
  });
  const up = (e) => { if(!ptr || e.pointerId !== ptr.id) return; const wasUp = ptr.up; ptr = null; if(wasUp) setTimeout(() => { if(!ptr) input.held = false; }, 380); else input.held = false; };   // vuốt lên nhanh vẫn nhảy hết cỡ
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  const JUMPK = new Set([' ', 'Spacebar', 'ArrowUp', 'w', 'W']), SLIDEK = new Set(['ArrowDown', 's', 'S']), LEFTK = new Set(['ArrowLeft', 'a', 'A']), RIGHTK = new Set(['ArrowRight', 'd', 'D']);
  function onKey(e){
    if(!container.isConnected) return;
    const k = e.key;
    if(k === 'p' || k === 'P'){ if(screen === 'play' || screen === 'pause'){ doPause(screen === 'play'); e.preventDefault(); } return; }
    if(screen === 'menu' && (k === ' ' || k === 'Enter') && !/BUTTON|INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')){ startGame(); e.preventDefault(); return; }
    if(screen !== 'play' || paused) return;
    if(JUMPK.has(k)){ e.preventDefault(); if(!e.repeat){ input.jump = true; } input.held = true; }
    else if(SLIDEK.has(k)){ e.preventDefault(); if(!e.repeat) input.slide = true; }
    else if(LEFTK.has(k)){ e.preventDefault(); if(!e.repeat) input.left = true; }
    else if(RIGHTK.has(k)){ e.preventDefault(); if(!e.repeat) input.right = true; }
  }
  function onKeyUp(e){ if(JUMPK.has(e.key)) input.held = false; }
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp);
  const onVis = () => { if(doc.hidden) doPause(true); else last = performance.now(); };
  doc.addEventListener('visibilitychange', onVis);

  /* ---------- Cập nhật cảnh ---------- */
  const tmpC = new THREE.Color();
  function applySky(p){
    const s = skyAt(p);
    sky.material.uniforms.top.value.copy(s.c.top); sky.material.uniforms.bot.value.copy(s.c.bot);
    sky.material.uniforms.hv.value = clamp((1 + horizonFy) / 2, 0.05, 0.95);
    scene.fog.color.copy(s.c.bot);
    hemi.color.copy(s.c.hemi); hemi.groundColor.copy(s.c.gnd); hemi.intensity = s.hi;
    sunL.color.copy(s.c.sun); sunL.intensity = s.hs;
    const night = s.night;
    bdMats.forEach((m) => { m.emissiveIntensity = night * 0.9; });
    bldSlots.forEach((b) => { b.sideMats.forEach((m) => { m.emissiveIntensity = night * 0.9; }); b.frontMats.forEach((m) => { m.emissiveIntensity = night * 0.9; }); });
    const tan = Math.tan(camera.fov * Math.PI / 360), hh = tan * SKY_D, ww = hh * camera.aspect;
    const sunX = clamp(lerp(-0.55, 0.65, ((p + 0.2) % 1.0)), -0.7, 0.8);
    sunSpr.position.set(sunX * ww, (horizonFy + s.sy * 0.75) * hh, -SKY_D);
    sunSpr.scale.setScalar(ww * 0.34); sunHalo.position.copy(sunSpr.position); sunHalo.scale.setScalar(ww * 0.55);
    sunSpr.visible = sunHalo.visible = s.sy > -0.3;
    sunSpr.material.color.copy(s.c.sun).lerp(tmpC.set('#ffffff'), 0.5);
    sunHalo.material.color.copy(s.c.sun);
    starMat.opacity = clamp((night - 0.35) * 1.6, 0, 1);
    stars.scale.set(ww, hh, 1); stars.position.set(0, 0, -SKY_D);
    for(const c of clouds){
      const span = 2.8, x = ((((c.bx - tClock * c.sp) % span) + span) % span) - span / 2;
      const cs = ww * c.k;
      c.s.position.set(x * ww, (horizonFy + 0.08 + c.y * 0.55) * hh, -SKY_D + 10); c.s.scale.set(cs, cs * 0.38, 1);
      c.m.opacity = lerp(0.9, 0.12, night); c.m.color.copy(tmpC.set('#ffffff')).lerp(s.c.bot, 0.35 * (1 - night));
    }
    return night;
  }
  function updateWorld(night){
    const d = G.dist, T = G.track;
    roadTex.offset.y = (d / 8) % 1;
    updateField(d);
    for(const b of backdrop){ b.m.position.set(b.x, b.h / 2 - 0.1, 20 - ((((b.s - d) % 192) + 192) % 192)); }
    for(const p of poles){ p.g.position.set(p.x, 0, 20 - ((((p.s - d) % 198) + 198) % 198)); }
    glowMat.opacity = night * 0.7; coneMat.opacity = night * 0.035; lampMat.color.set(night > 0.3 ? '#fff0b0' : '#555');
    const used = { crate: 0, panel: 0, wire: 0, bird: 0, zap: 0, tray: 0, building: 0 };
    const hz = T.hz;
    for(let i = Math.max(0, L.windowOf(hz, d - CFG.BUILD_MAX - 8)); i < hz.length && hz[i].x < d + DRAW; i++){
      const h = hz[i]; if(h.broken || h.x + h.w < d - 8) continue;
      const zc = -(h.x + h.w / 2 - d), x = L.laneX(h.lane);
      if(h.type === 'building'){
        const sl = bldSlots[used.building++]; if(!sl) continue;
        const t = Math.floor(h.x) % 3;
        sl.mesh.material = sl.mats[t]; sl.mesh.visible = true; sl.mesh.position.set(x, L.BUILDING_H / 2, zc); sl.mesh.scale.set(1.7, L.BUILDING_H, h.w);
        sl.sm.repeat.set(h.w / 6, 1); sl.se.repeat.set(h.w / 6, 1); sl.rt.repeat.set(1, Math.max(1, h.w / 1.7));
        continue;
      }
      const o = pools[h.type][used[h.type]++]; if(!o) continue;
      o.visible = true; o.position.set(x, 0, zc);
      if(h.type === 'crate'){ o.scale.set(1, 1, h.w); const u = o.userData, v3 = Math.floor(h.x) % 3; u.body.material = v3 === 0 ? u.mA : v3 === 1 ? u.mB : u.mC; u.cd.visible = v3 === 1; }
      else if(h.type === 'wire'){ const sp = o.userData.spark; sp.material.opacity = Math.random() < 0.5 ? 1 : 0.3; sp.position.set((Math.random() - 0.5) * 1.6, 0.95 + Math.random() * 0.1, 0); }
      else if(h.type === 'tray'){ const u = o.userData; u.left.visible = h.lane === 0; u.right.visible = h.lane === 2; u.sign.visible = u.signB.visible = h.lane === 1; }
      else if(h.type === 'zap'){ zapShape(o, h.x - d < CFG.ZAP_WARN, tClock); }
      else if(h.type === 'bird'){ o.position.y = 1.3 + Math.sin(tClock * 6 + h.x) * 0.06; const f = Math.sin(tClock * 22 + h.x) * 0.9; o.userData.wl.rotation.z = f; o.userData.wr.rotation.z = -f; }
    }
    for(const t in used){ if(t === 'building'){ for(let j = used[t]; j < bldSlots.length; j++) bldSlots[j].mesh.visible = false; } else for(let j = used[t]; j < pools[t].length; j++) pools[t][j].visible = false; }
    let ci = 0;
    for(let i = Math.max(0, L.windowOf(T.coins, d - 8)); i < T.coins.length && T.coins[i].x < d + DRAW; i++){
      const c = T.coins[i]; if(c.taken) continue;
      const m = coinPool[ci++]; if(!m) break;
      m.visible = true; m.position.set(c.px != null ? c.px : L.laneX(c.lane), c.y + Math.sin(tClock * 4 + c.x) * 0.05, -(c.x - d)); m.rotation.y = tClock * 3 + c.x * 0.7;
    }
    for(; ci < coinPool.length; ci++) coinPool[ci].visible = false;
    const iu = { magnet: 0, shield: 0, boost: 0, bike: 0 };
    for(const it of T.items){
      if(it.taken || it.x < d - 8 || it.x > d + DRAW) continue;
      const o = pools.item[it.type][iu[it.type]++]; if(!o) continue;
      o.visible = true; o.position.set(L.laneX(it.lane), it.y + Math.sin(tClock * 3 + it.x) * 0.1, -(it.x - d)); o.rotation.y = tClock * 2;
    }
    for(const t in iu){ for(let j = iu[t]; j < pools.item[t].length; j++) pools.item[t][j].visible = false; }
  }
  function setPose(g, dt){
    const t = g.t, v = g.speed;
    const ph = t * (7.5 + v * 0.45), s = Math.sin(ph), c = Math.cos(ph);
    const T_ = tgt;
    T_.flipY = 0.9; T_.bob = 0; T_.flip = 0; const dl = clamp(g.lane - g.lx, -1, 1); T_.yaw = Math.PI - 0.35 * dl; T_.roll = -0.15 * dl;
    if(screen === 'menu'){
      T_.yaw = Math.sin(tClock * 0.8) * 0.4; T_.roll = 0; T_.legL = 0.05; T_.legR = -0.05; T_.shinL = T_.shinR = 0.06; T_.armL = 0.12 + Math.sin(tClock * 1.6) * 0.05; T_.armR = -0.12; T_.foreL = T_.foreR = -0.25; T_.lean = 0.02; T_.bob = Math.sin(tClock * 2) * 0.008; T_.tail = Math.sin(tClock * 1.6) * 0.15;
    } else if(g.dead){
      T_.yaw = Math.PI + 0.4; T_.roll = 0;
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
    const riding = g.bike > 0 && !g.dead && screen === 'play';
    if(riding){   // ngồi trên xe đạp, người chồm về trước, hai tay nắm ghi đông, hai chân đạp
      const pc = g.dist * 2.4;
      T_.legL = -1.05 + 0.45 * Math.sin(pc); T_.legR = -1.05 - 0.45 * Math.sin(pc); T_.shinL = 1.25 + 0.55 * Math.cos(pc); T_.shinR = 1.25 - 0.55 * Math.cos(pc);
      T_.armL = T_.armR = -1.2; T_.foreL = T_.foreR = -0.45; T_.lean = 0.42; T_.bob = 0; T_.flip = 0; T_.tail = 0.9;
    }
    const k = 1 - Math.exp(-dt * (g.dead ? 14 : (screen === 'menu' ? 8 : 24)));
    for(const n in T_) pose[n] += (T_[n] - pose[n]) * (n === 'flip' && g.spin > 0 ? 1 : k);
    ch.legL.rotation.x = pose.legL; ch.legR.rotation.x = pose.legR; ch.shinL.rotation.x = pose.shinL; ch.shinR.rotation.x = pose.shinR;
    ch.armL.rotation.x = pose.armL; ch.armR.rotation.x = pose.armR; ch.foreL.rotation.x = pose.foreL; ch.foreR.rotation.x = pose.foreR;
    ch.torso.rotation.x = pose.lean; ch.flip.rotation.x = pose.flip; ch.flip.position.y = pose.flipY; ch.body.position.y = -pose.flipY;
    ch.hips.position.y = 0.86 + pose.bob;
    if(ch.tail) ch.tail.rotation.x = pose.tail;
    const px = L.laneX(g.lx);
    ch.root.rotation.y = pose.yaw; ch.body.rotation.z = pose.roll;
    ch.root.position.set(px, Math.max(g.y, -4) + (g.bike > 0 && !g.dead && screen === 'play' ? 0.1 : 0), 0);
    const rideOn = g.bike > 0 && !g.dead && screen === 'play'; bikeRide.visible = rideOn;
    if(rideOn){ bikeRide.position.set(px, Math.max(g.y, -4), -0.15); bikeRide.rotation.y = pose.yaw; bikeRide.userData.wheels.forEach((w) => { w.rotation.x = -g.dist / 0.33; }); bikeRide.userData.crank.rotation.x = g.dist * 2.4; }
    shadow.position.set(px, L.floorAt(g, g.y) + 0.04, 0);
    shadow.visible = g.y > -0.2; const sc = (female() ? 0.9 : 1) * 1.0 * (1 - clamp(g.y / 5, 0, 0.6)); shadow.scale.set(1.2 * sc, 1.2 * sc, 1);
    shadow.material.opacity = 0.7 - clamp(g.y / 6, 0, 0.45);
    const cy = g.y + 0.9;
    bubble.visible = !!g.shield && !g.dead; bubble.position.set(px, cy, 0); bubble.scale.setScalar(1 + Math.sin(tClock * 6) * 0.03 + (g.invuln > 0 ? Math.sin(tClock * 40) * 0.1 : 0));
    magRing.visible = g.magnet > 0 && !g.dead; magRing.position.set(px, cy, 0); magRing.rotation.set(tClock * 2, tClock * 3, 0); magRing.scale.setScalar(1 + (tClock * 1.5 % 1) * 0.5);
    boostRing.visible = g.boost > 0 && !g.dead; boostRing.position.set(px, cy, 0); boostRing.rotation.set(Math.PI / 2, 0, tClock * 5); boostRing.scale.setScalar(1.1 + Math.sin(tClock * 8) * 0.08);
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
    set(hudEl.chips.bike, G.bike > 0, G.bike / CFG.BIKE_T);
    set(hudEl.chips.shield, !!G.shield, 1);
  }

  /* ---------- Sự kiện (âm thanh/hiệu ứng) ---------- */
  function handleEvents(){
    const ev = G.events; if(!ev.length) return;
    for(const e of ev){
      if(e === 'coin'){
        const step = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24][Math.min(G.combo - 1, 10)] || 0;
        snd.beep(880 * Math.pow(2, step / 12), 0.09, 'triangle', 0.09);
        spark(L.laneX(G.lx), G.y + 1.0, '#ffe27a');
      } else if(e === 'jump'){ snd.beep(330, 0.09, 'square', 0.05); snd.beep(520, 0.09, 'square', 0.04, 0.05); snd.buzz(8); }
      else if(e === 'jump2'){ snd.beep(520, 0.07, 'square', 0.05); snd.beep(780, 0.1, 'square', 0.05, 0.05); snd.buzz(8); for(let i = 0; i < 4; i++) spark(L.laneX(G.lx), G.y + 0.6, '#cfe8ff'); }
      else if(e === 'slide'){ snd.noise(0.14, 0.07); }
      else if(e === 'lane'){ snd.noise(0.06, 0.05); }
      else if(e === 'shield'){ snd.noise(0.25, 0.2); snd.beep(240, 0.2, 'sawtooth', 0.12); snd.buzz([40, 30, 60]); shake = 0.25; for(let i = 0; i < 8; i++) spark(L.laneX(G.lx), G.y + 0.9, '#6ae0ff'); }
      else if(e === 'bike_break'){ snd.noise(0.3, 0.25); snd.beep(180, 0.25, 'sawtooth', 0.12); snd.buzz([50, 30, 80]); shake = 0.3; for(let i = 0; i < 10; i++) spark(L.laneX(G.lx), G.y + 0.5, '#ffb347'); }
      else if(e === 'bike_end'){ snd.beep(440, 0.1, 'triangle', 0.08); snd.beep(330, 0.14, 'triangle', 0.08, 0.1); }
      else if(e.startsWith('item:')){ snd.beep(660, 0.08, 'triangle', 0.1); snd.beep(880, 0.08, 'triangle', 0.1, 0.08); snd.beep(1320, 0.14, 'triangle', 0.1, 0.16); for(let i = 0; i < 6; i++) spark(L.laneX(G.lx), G.y + 0.9, '#9dffb0'); }
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
      const old = best, got = Object.values(SKINS).filter((s) => s.need > old && s.need <= score).map((s) => s.name);
      if(got.length) $('rn-newrec').textContent = '🎉 Kỷ lục mới! 🎁 Mở khóa: ' + got.join(', '); else $('rn-newrec').textContent = '🎉 Kỷ lục mới!';
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
      if(dbg.autoplay){ dbg.bot.birdMode = dbg.bird; const a = L.botStep(G, dbg.bot); input.jump = a.jump; input.held = a.held; input.slide = a.slide; input.left = a.left; input.right = a.right; }
      let rest = dt;
      while(rest > 1e-6){
        const h = Math.min(rest, 1 / 60); rest -= h;
        L.stepGame(G, h, input); input.jump = input.slide = input.left = input.right = false;
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
    camX += (L.laneX(G.lx) - camX) * (1 - Math.exp(-dt * 8));
    setPose(G, dt);
    for(const p of sparks){ if(p.t > 0){ p.t -= dt; p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.material.opacity = clamp(p.t / 0.45, 0, 1); if(p.t <= 0) p.s.visible = false; } }
    placeCamera((Math.random() - 0.5) * sk * 0.8, (Math.random() - 0.5) * sk * 0.8);
    const night = applySky(phase);
    updateWorld(night);
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
.rn-skins{display:flex;gap:6px;padding:0 54px;flex-wrap:wrap;justify-content:center;margin-top:8px}
.rn-sk{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.55);cursor:pointer;font-size:.9rem;padding:0;line-height:1;color:#fff}
.rn-sk.on{border-color:#fff;box-shadow:0 0 0 3px #ff9a1f}
.rn-sk.lock{filter:grayscale(.85) brightness(.6)}
.rn-skinname{text-align:center;color:#fff;font-weight:800;font-size:.85rem;margin-top:4px;text-shadow:0 1px 3px #000}
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
.rn-chip span{position:relative;z-index:1;display:flex}
.rn-chip img{width:30px;height:30px;border-radius:50%;background:#fff;object-fit:cover}
.rn-chip b{position:absolute;right:-8px;bottom:-6px;background:#e03a1a;color:#fff;border-radius:8px;padding:0 4px;font-size:.62rem;line-height:1.3}
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
