/* Đồ họa 3D cho mini game (Three.js, tải khi cần). Module ES: games.js nạp bằng import('./g3d.js').
   Mỗi game có một hàm dựng cảnh trả về bộ điều khiển {..., dispose()}. Không có WebGL thì games.js dùng bản 2D. */
import * as THREE from './vendor/three.module.min.js';

export function supported(){
  try{ const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }catch(e){ return false; }
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);

/* Logo công ty (docs/logo.png): nạp một lần, dùng làm huy hiệu tròn trên các cảnh 3D */
let logoImg = null, bgImg = null, logoP = null;
export function loadLogo(){   // nạp logo và ảnh tập thể công ty (dùng làm nền sân chơi)
  if(!logoP){
    const load = (src, set) => new Promise((res) => { const i = new Image(); i.onload = () => { set(i); res(i); }; i.onerror = () => res(null); i.src = src; });
    logoP = Promise.all([load('logo.png', (i) => { logoImg = i; }), load('hmt-bg.jpg', (i) => { bgImg = i; })]).then(() => logoImg);
  }
  return logoP;
}
// vẽ huy hiệu logo (nền trắng, viền) vào ctx tại (cx,cy) bán kính r; sx,sy co giãn để bù méo khi dán lên mặt cong
function drawBadge(c, cx, cy, r, ring, sx = 1, sy = 1){
  if(!logoImg) return;
  c.save(); c.translate(cx, cy); c.scale(sx, sy);
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = '#ffffff'; c.fill();
  c.lineWidth = Math.max(2, r * 0.07); c.strokeStyle = ring || '#F2B807'; c.stroke();
  const k = r * 1.62; c.drawImage(logoImg, -k / 2, -k / 2 - r * 0.04, k, k * (logoImg.height / logoImg.width));
  c.restore();
}
function badgeTex(size, ring){
  return canvasTex(size, size, (c, w, h) => { drawBadge(c, w / 2, h / 2, w * 0.47, ring); });
}

function disposeScene(scene){
  scene.traverse((o) => {
    if(o.geometry) o.geometry.dispose();
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    ms.forEach((m) => { Object.keys(m).forEach((k) => { if(m[k] && m[k].isTexture) m[k].dispose(); }); m.dispose(); });
  });
}

/* Khung dựng chung: renderer trong container, vòng lặp tự dừng khi container bị gỡ khỏi trang */
export function stage(container, opt = {}){
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opt.maxDpr || 2));
  renderer.shadowMap.enabled = !!opt.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = opt.exposure || 1.05;
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
  container.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opt.fov || 40, 1, 0.1, 200);
  const hooks = [];
  let raf = 0, alive = true, last = performance.now();
  function resize(){
    const w = container.clientWidth || 300, h = container.clientHeight || 260;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  if(ro) ro.observe(container); else window.addEventListener('resize', resize);
  resize();
  function frame(now){
    if(!alive) return;
    if(!container.isConnected){ dispose(); return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for(const h of hooks) h(dt, now / 1000);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function dispose(){
    if(!alive) return; alive = false; cancelAnimationFrame(raf);
    if(ro) ro.disconnect(); else window.removeEventListener('resize', resize);
    disposeScene(scene); renderer.dispose();
    try{ renderer.forceContextLoss(); }catch(e){}
    canvas.remove();
  }
  raf = requestAnimationFrame(frame);
  return { THREE, renderer, scene, camera, canvas, onFrame: (fn) => hooks.push(fn), dispose, resize };
}

function canvasTex(w, h, draw){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function lights(S, o = {}){
  S.scene.add(new THREE.HemisphereLight(0xffffff, 0x334433, o.hemi == null ? 1.1 : o.hemi));
  const d = new THREE.DirectionalLight(0xffffff, o.sun == null ? 2.6 : o.sun);
  d.position.set(o.x || 3, o.y || 9, o.z || 5);
  if(S.renderer.shadowMap.enabled){
    d.castShadow = true; d.shadow.mapSize.set(1024, 1024);
    const s = o.shadowSize || 9; Object.assign(d.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 30 });
    d.shadow.bias = -0.0006; d.shadow.radius = 4;
  }
  S.scene.add(d);
  return d;
}

/* ================= Xúc xắc ================= */
const DICE_SKINS = {   // tên id giữ nguyên để tương thích; màu theo thương hiệu Hiệp Minh Thịnh
  navy:   { base: '#163B6D', ring: '#F2B807', glyph: '#F2B807', num: '#ffffff' },   // Xanh HMT
  gold:   { base: '#F2A900', ring: '#7a3a00', glyph: '#7a3a00', num: '#3a1c00' },   // Vàng nắng
  violet: { base: '#E8710A', ring: '#ffffff', glyph: '#fff3cf', num: '#ffffff' },   // Cam điện lực
  royal:  { base: '#14805A', ring: '#F2B807', glyph: '#F7E08A', num: '#ffffff' },   // Xanh pin
};
const ZOD = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

function roundedBoxGeo(size, r, seg){
  const g = new THREE.BoxGeometry(size, size, size, seg, seg, seg);
  const p = g.attributes.position, n = g.attributes.normal, half = size / 2 - r;
  const v = new THREE.Vector3(), inner = new THREE.Vector3(), d = new THREE.Vector3();
  for(let i = 0; i < p.count; i++){
    v.fromBufferAttribute(p, i);
    inner.set(clamp(v.x, -half, half), clamp(v.y, -half, half), clamp(v.z, -half, half));
    d.copy(v).sub(inner);
    if(d.lengthSq() > 1e-9){ d.normalize(); n.setXYZ(i, d.x, d.y, d.z); v.copy(inner).addScaledVector(d, r); p.setXYZ(i, v.x, v.y, v.z); }
  }
  return g;
}
function diceFaceTex(k, v){
  return canvasTex(256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h / 2, w * 0.75);
    g.addColorStop(0, k.base); g.addColorStop(1, k.base);
    c.fillStyle = k.base; c.fillRect(0, 0, w, h);
    const sh = c.createRadialGradient(w / 2, h * 0.35, 8, w / 2, h / 2, w * 0.7); sh.addColorStop(0, 'rgba(255,255,255,.16)'); sh.addColorStop(1, 'rgba(0,0,0,.28)');
    c.fillStyle = sh; c.fillRect(0, 0, w, h);
    c.strokeStyle = k.ring; c.lineWidth = 6; c.beginPath(); c.arc(w / 2, h / 2, w * 0.43, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.arc(w / 2, h / 2, w * 0.31, 0, Math.PI * 2); c.stroke();
    c.fillStyle = k.glyph; c.strokeStyle = k.glyph; c.lineCap = 'round';
    for(let i = 0; i < 12; i++){   // vòng tia nắng
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2, r1 = w * 0.325, r2 = w * (i % 2 ? 0.385 : 0.41);
      c.lineWidth = i % 2 ? 4 : 6; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1); c.lineTo(w / 2 + Math.cos(a) * r2, h / 2 + Math.sin(a) * r2); c.stroke();
    }
    c.fillStyle = k.num; c.font = '900 120px "Trebuchet MS",Arial,sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 8; c.fillText(String(v), w / 2, h / 2 + 120 * 0.35);
  });
}
// thứ tự mặt của BoxGeometry: +x, -x, +y, -y, +z, -z  →  3, 4, 1, 6, 2, 5 (hai mặt đối nhau cộng bằng 7)
const FACE_VALUES = [3, 4, 1, 6, 2, 5];
const TOP_Q = (() => {
  const q = (ax, ang) => new THREE.Quaternion().setFromAxisAngle(ax, ang);
  const X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1), H = Math.PI / 2;
  return { 1: q(X, 0), 6: q(X, Math.PI), 2: q(X, -H), 5: q(X, H), 3: q(Z, H), 4: q(Z, -H) };
})();

export function dice(container, opt = {}){
  const S = stage(container, { fov: 38, shadows: true, exposure: 1.0 });
  const { scene, camera } = S;
  camera.position.set(0, 8.2, 7.2); camera.lookAt(0, 0, 0.1);
  lights(S, { x: 3, y: 9, z: 4, hemi: 0.9, sun: 2.8, shadowSize: 8 });
  // bàn nỉ xanh có viền gỗ
  const felt = canvasTex(512, 512, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.55); g.addColorStop(0, '#1d5a9e'); g.addColorStop(1, '#0c2850');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for(let i = 0; i < 2600; i++){ c.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  });
  // mặt bàn nỉ trong mờ để ảnh tập thể làm nền phía sau chỉ xuất hiện một lần (liền mạch, không lặp); bóng đổ vẽ riêng bằng ShadowMaterial
  const table = new THREE.Mesh(new THREE.CircleGeometry(6.2, 64), new THREE.MeshStandardMaterial({ map: felt, roughness: 0.95, transparent: true, opacity: 0.5 }));
  table.rotation.x = -Math.PI / 2; scene.add(table);
  const tableShadow = new THREE.Mesh(new THREE.CircleGeometry(6.2, 64), new THREE.ShadowMaterial({ opacity: 0.4 }));
  tableShadow.rotation.x = -Math.PI / 2; tableShadow.position.y = 0.004; tableShadow.receiveShadow = true; scene.add(tableShadow);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(6.25, 0.32, 16, 80), new THREE.MeshStandardMaterial({ color: 0xE8710A, roughness: 0.45, metalness: 0.2 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.05; rim.receiveShadow = true; scene.add(rim);

  let skin = DICE_SKINS[opt.skin] || DICE_SKINS.navy, count = opt.count || 2;
  let items = [], rollT = null;
  const geoCache = {};
  function layout(n){
    const rows = n <= 3 ? [n] : n === 4 ? [2, 2] : n === 5 ? [3, 2] : [3, 3];
    const out = []; const size = n <= 2 ? 1.7 : n <= 4 ? 1.45 : 1.25, gap = size * 1.55;
    rows.forEach((cnt, r) => { for(let i = 0; i < cnt; i++) out.push({ x: (i - (cnt - 1) / 2) * gap, z: (r - (rows.length - 1) / 2) * gap + 0.2 }); });
    return { pos: out, size };
  }
  function build(){
    items.forEach((it) => { scene.remove(it.mesh); it.mats.forEach((m) => { m.map.dispose(); m.dispose(); }); });
    items = [];
    const L = layout(count);
    const key = L.size.toFixed(2); geoCache[key] = geoCache[key] || roundedBoxGeo(L.size, L.size * 0.13, 18);
    for(let i = 0; i < count; i++){
      const mats = FACE_VALUES.map((v) => new THREE.MeshStandardMaterial({ map: diceFaceTex(skin, v), roughness: 0.32, metalness: 0.12 }));
      const mesh = new THREE.Mesh(geoCache[key], mats);
      mesh.castShadow = true; mesh.receiveShadow = false;
      const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(0, Math.PI * 2));
      mesh.quaternion.copy(yaw.multiply(TOP_Q[1 + Math.floor(Math.random() * 6)]));
      mesh.position.set(L.pos[i].x, L.size / 2, L.pos[i].z);
      scene.add(mesh); items.push({ mesh, mats, home: L.pos[i], size: L.size });
    }
  }
  build();

  function startRoll(final, dur){
    const t0 = performance.now() / 1000;
    rollT = items.map((it, i) => {
      const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(0, Math.PI * 2));
      return {
        t0: t0 + i * 0.07, dur: dur + i * 0.05,
        from: new THREE.Vector3(it.home.x + rnd(-1.4, 1.4), 0, it.home.z - 3.2 + rnd(-0.3, 0.3)),
        axis: new THREE.Vector3(rnd(-1, 1), rnd(-0.4, 0.4), rnd(-1, 1)).normalize(),
        spin: rnd(5, 8) * Math.PI * (Math.random() < 0.5 ? 1 : -1),
        q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28))),
        target: yaw.multiply(TOP_Q[final[i]]),
        H: rnd(1.7, 2.3),
      };
    });
  }
  const tmpQ = new THREE.Quaternion(), spinQ = new THREE.Quaternion();
  S.onFrame((dt, now) => {
    if(!rollT) return;
    let allDone = true;
    items.forEach((it, i) => {
      const r = rollT[i]; if(!r) return;
      const t = clamp((now - r.t0) / r.dur, 0, 1);
      if(t < 1) allDone = false;
      const e = 1 - Math.pow(1 - t, 2.2);
      spinQ.setFromAxisAngle(r.axis, r.spin * (1 - e)); tmpQ.copy(r.q0).multiply(spinQ);
      it.mesh.quaternion.copy(tmpQ).slerp(r.target, smooth(0.5, 1, t));
      const hop = r.H * Math.pow(1 - t, 2) * Math.abs(Math.cos(t * Math.PI * 3.2));
      const base = it.size * (0.5 + 0.38 * (1 - smooth(0.62, 0.95, t)) * (1 - t * 0.6));
      const ex = 1 - Math.pow(1 - clamp(t * 1.15, 0, 1), 3);
      it.mesh.position.set(r.from.x + (it.home.x - r.from.x) * ex, base + hop, r.from.z + (it.home.z - r.from.z) * ex);
    });
    if(allDone){ items.forEach((it) => it.mesh.position.set(it.home.x, it.size / 2, it.home.z)); rollT = null; }
  });
  return {
    roll(final, sec){ startRoll(final, Math.max(0.5, sec || 1.1)); },
    setCount(n){ count = n; build(); },
    setSkin(id){ skin = DICE_SKINS[id] || skin; build(); },
    dispose: S.dispose,
  };
}

/* môi trường phản chiếu đơn giản (dải sáng/tối) để kim loại có ánh */
function addEnv(S){
  const tex = canvasTex(512, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#dfe9ff'); g.addColorStop(0.5, '#fff6dc'); g.addColorStop(0.52, '#3a2a14'); g.addColorStop(1, '#120c06');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.9)'; [[60, 40, 90, 30], [250, 30, 110, 26], [400, 50, 80, 28]].forEach(([x, y, a, b]) => c.fillRect(x, y, a, b));
  });
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(S.renderer);
  S.scene.environment = pm.fromEquirectangular(tex).texture; pm.dispose(); tex.dispose();
}
const goldMat = (rough) => new THREE.MeshStandardMaterial({ color: 0xf2b705, metalness: 1, roughness: rough == null ? 0.28 : rough });

/* ================= Vòng quay may mắn ================= */
export function wheel(container){
  const S = stage(container, { fov: 34, exposure: 1.1 });
  const { scene, camera } = S;
  camera.position.set(0, 0.6, 15.5); camera.lookAt(0, 0.1, 0);
  addEnv(S); lights(S, { x: 2, y: 5, z: 8, hemi: 0.8, sun: 2.2 });
  const R = 3.2, group = new THREE.Group(); group.rotation.x = -0.4; scene.add(group);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.3, R + 0.3, 0.6, 72), new THREE.MeshStandardMaterial({ color: 0x163B6D, metalness: 0.5, roughness: 0.35 }));
  body.rotation.x = Math.PI / 2; body.position.z = -0.32; group.add(body);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 3.2, 24), new THREE.MeshStandardMaterial({ color: 0x4a2c0c, metalness: 0.3, roughness: 0.5 }));
  stand.position.set(0, -R - 1.2, -0.6); group.add(stand);
  const spin = new THREE.Group(); group.add(spin);
  const faceMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.05, color: 0xffffff });
  const face = new THREE.Mesh(new THREE.CircleGeometry(R, 96), faceMat); spin.add(face);
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  let hlMesh = null;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.06, 0.22, 24, 120), goldMat(0.22)); rim.position.z = 0.04; group.add(rim);
  const bulbs = [], NB = 28;
  for(let i = 0; i < NB; i++){
    const a = (i / NB) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 10), new THREE.MeshStandardMaterial({ color: 0x8a5a1a, emissive: 0x000000, roughness: 0.3, metalness: 0.2 }));
    m.position.set(Math.cos(a) * (R + 0.32), Math.sin(a) * (R + 0.32), 0.1); group.add(m); bulbs.push(m);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.34, 40), goldMat(0.2)); hub.rotation.x = Math.PI / 2; hub.position.z = 0.2; group.add(hub);
  const star = new THREE.Mesh(new THREE.CircleGeometry(0.46, 40), new THREE.MeshBasicMaterial({ map: logoImg ? badgeTex(256, '#F2B807') : canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#f7d36a'; c.fillRect(0, 0, w, h); c.fillStyle = '#7a1f1f'; c.font = '700 96px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', w / 2, h / 2 + 6); }), transparent: true }));
  star.position.z = 0.385; group.add(star);
  const ptr = new THREE.Group(); ptr.position.set(0, R + 0.5, 0.55); group.add(ptr);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.05, 20), new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.5, roughness: 0.3 }));
  cone.rotation.z = Math.PI; cone.position.y = -0.3; ptr.add(cone);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), goldMat(0.2)); knob.position.y = 0.3; ptr.add(knob);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(R + 1.2, 48), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 }));
  shadow.position.set(0, -R - 2.7, -1.2); shadow.rotation.x = -Math.PI / 2 + 0.2; shadow.scale.set(1, 0.35, 1); scene.add(shadow);
  let tex = null, lastKey = null, flickV = 0, flickA = 0;
  S.onFrame((dt) => {
    if(flickV || flickA){ flickV += (-flickA * 60 - flickV * 9) * dt; flickA += flickV * dt; if(Math.abs(flickA) < 0.002 && Math.abs(flickV) < 0.01){ flickA = 0; flickV = 0; } ptr.rotation.z = flickA; }
  });
  return {
    update(st){
      if(st.face && st.face.key !== lastKey){
        lastKey = st.face.key;
        if(!tex){ tex = new THREE.CanvasTexture(st.face); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; faceMat.map = tex; faceMat.needsUpdate = true; }
        else tex.needsUpdate = true;
        if(hlMesh){ spin.remove(hlMesh); hlMesh.geometry.dispose(); hlMesh = null; }
      }
      spin.rotation.z = -st.angle;
      const n = st.n, s = (Math.PI * 2) / n;
      if(st.hl >= 0 && st.hl < n){
        if(!hlMesh || hlMesh.userData.i !== st.hl || hlMesh.userData.n !== n){
          if(hlMesh){ spin.remove(hlMesh); hlMesh.geometry.dispose(); }
          hlMesh = new THREE.Mesh(new THREE.CircleGeometry(R, 24, -(st.hl + 1) * s, s), hlMat); hlMesh.position.z = 0.02; hlMesh.userData = { i: st.hl, n }; spin.add(hlMesh);
        }
        hlMat.opacity = 0.2 + 0.2 * Math.sin(st.t / 140);
      }else{ hlMat.opacity = 0; }
      for(let i = 0; i < NB; i++){
        const on = (i + st.led) % 3 === 0 || (st.spinning && (i + st.led) % 2 === 0);
        bulbs[i].material.emissive.setHex(on ? 0xffd84a : 0x000000); bulbs[i].material.emissiveIntensity = on ? 2.2 : 0; bulbs[i].material.color.setHex(on ? 0xfffbd0 : 0x8a5a1a);
      }
    },
    flick(){ flickV = 9; flickA = 0.08; },
    dispose: S.dispose,
  };
}

/* ================= Thùng gỗ cướp biển ================= */
function woodTex(base, dark){
  return canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    const planks = 16, pw = w / planks;
    for(let i = 0; i < planks; i++){
      const tone = (i % 2 ? 0.07 : -0.04) + (Math.random() - 0.5) * 0.08;
      c.fillStyle = tone > 0 ? `rgba(255,220,160,${tone})` : `rgba(0,0,0,${-tone})`; c.fillRect(i * pw, 0, pw, h);
      c.strokeStyle = dark; c.lineWidth = 3; c.beginPath(); c.moveTo(i * pw, 0); c.lineTo(i * pw, h); c.stroke();
      for(let k = 0; k < 7; k++){ c.strokeStyle = 'rgba(60,30,8,.18)'; c.lineWidth = 1.2; const x = i * pw + Math.random() * pw; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 4, h * 0.3, x - 4, h * 0.6, x + 2, h); c.stroke(); }
    }
  });
}
function pirateMan(){
  // nhân viên năng lượng mặt trời: đồng phục vàng cam có dải phản quang, mũ bảo hộ, kính, găng tay
  const g = new THREE.Group();
  const uni = new THREE.MeshStandardMaterial({ color: 0xF2680C, roughness: 0.75 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf1b98a, roughness: 0.7 });
  const refl = new THREE.MeshStandardMaterial({ color: 0xe8edf0, metalness: 0.6, roughness: 0.25 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 1.3, 20), uni); body.position.y = 0.65; body.castShadow = true; g.add(body);
  [0.5, 0.78].forEach((y) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.665 + (0.5 - y) * 0.1, 0.665 + (0.5 - y) * 0.1 + 0.02, 0.09, 20), refl); r.position.y = y; g.add(r); });
  if(logoImg){ const pl = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ map: badgeTex(256, '#163B6D'), transparent: true })); pl.position.set(0.22, 1.0, 0.6); pl.rotation.y = 0.35; g.add(pl); }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 18), skin); head.position.y = 1.62; head.castShadow = true; g.add(head);
  [-0.17, 0.17].forEach((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), dark); e.position.set(x, 1.66, 0.45); g.add(e); });
  const gl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.15, 0.1), new THREE.MeshStandardMaterial({ color: 0x66c4ff, transparent: true, opacity: 0.55, roughness: 0.1 })); gl.position.set(0, 1.67, 0.47); g.add(gl);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 8, 16, Math.PI), dark); mouth.position.set(0, 1.46, 0.47); mouth.rotation.z = Math.PI; g.add(mouth);
  const hatM = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.35, metalness: 0.1 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.56, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), hatM); dome.position.y = 1.85; dome.scale.set(1, 0.95, 1); dome.castShadow = true; g.add(dome);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 1.0), hatM); ridge.position.y = 2.38; g.add(ridge);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.06, 28), hatM); brim.position.set(0, 1.84, 0.1); brim.scale.set(1, 1, 1.2); g.add(brim);
  if(logoImg){ const pl = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), new THREE.MeshBasicMaterial({ map: badgeTex(256, '#163B6D'), transparent: true })); pl.position.set(0, 2.1, 0.55); pl.rotation.x = -0.35; g.add(pl); }
  const arm = (sx) => { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.9, 12), uni); a.position.set(sx * 0.85, 1.05, 0); a.rotation.z = -sx * 0.9; a.castShadow = true; g.add(a); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.148, 0.09, 12), refl); band.position.copy(a.position); band.rotation.z = a.rotation.z; g.add(band); const h = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshStandardMaterial({ color: 0xe9d8c4, roughness: 0.8 })); h.position.set(sx * 1.25, 1.42, 0); g.add(h); };
  arm(1); arm(-1);
  return g;
}
function knifeObj(){
  const g = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.2), new THREE.MeshStandardMaterial({ color: 0xdfe6ea, metalness: 1, roughness: 0.18 }));
  blade.position.x = 0.25; g.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), blade.material); tip.rotation.z = Math.PI / 2; tip.rotation.x = Math.PI / 4; tip.position.x = -0.15; g.add(tip);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.34), new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.9, roughness: 0.3 })); guard.position.x = 0.58; g.add(guard);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.6 })); handle.rotation.z = Math.PI / 2; handle.position.x = 0.88; g.add(handle);
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), guard.material); pom.position.x = 1.14; g.add(pom);
  g.traverse((o) => { if(o.isMesh) o.castShadow = true; });
  return g;
}

export function barrel(container, opt = {}){
  const N = opt.N || 12;
  const S = stage(container, { fov: 36, shadows: true, exposure: 1.05 });
  const { scene, camera } = S;
  camera.position.set(0, 3.9, 8.6); camera.lookAt(0, 0.45, 0);
  addEnv(S); lights(S, { x: -3, y: 8, z: 6, hemi: 0.9, sun: 2.6, shadowSize: 6 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(5.2, 48), new THREE.MeshStandardMaterial({ color: 0xe4c47f, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.5; ground.receiveShadow = true; scene.add(ground);
  const H = 3, rAt = (y) => 1.5 * (1 - 0.17 * Math.pow((2 * y) / H, 2));
  const pts = []; for(let i = 0; i <= 24; i++){ const y = -H / 2 + (i / 24) * H; pts.push(new THREE.Vector2(rAt(y), y)); }
  const wood = woodTex('#a8682d', '#4a2a10'); wood.wrapS = THREE.RepeatWrapping;
  const bar = new THREE.Group(); scene.add(bar);
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.78, side: THREE.DoubleSide }));
  body.castShadow = true; body.receiveShadow = true; bar.add(body);
  const steel = new THREE.MeshStandardMaterial({ color: 0x4b525a, metalness: 0.9, roughness: 0.4 });
  [-1.05, 1.05].forEach((y) => { const h = new THREE.Mesh(new THREE.TorusGeometry(rAt(y) + 0.02, 0.07, 10, 64), steel); h.rotation.x = Math.PI / 2; h.position.y = y; bar.add(h); });
  [-H / 2 + 0.02, H / 2 - 0.02].forEach((y) => { const h = new THREE.Mesh(new THREE.TorusGeometry(rAt(y) + 0.01, 0.09, 10, 64), steel); h.rotation.x = Math.PI / 2; h.position.y = y; bar.add(h); });
  const inside = new THREE.Mesh(new THREE.CircleGeometry(rAt(H / 2) - 0.05, 48), new THREE.MeshStandardMaterial({ color: 0x1a0d04, roughness: 1 })); inside.rotation.x = -Math.PI / 2; inside.position.y = H / 2 - 0.12; bar.add(inside);
  // nắp phía trước thùng (che phần thân hải tặc trong thùng) bằng vành miệng
  const pirate = pirateMan(); pirate.position.y = H / 2 - 1.15; pirate.scale.setScalar(0.92); scene.add(pirate);
  const slots = [], hits = [];
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  for(let i = 0; i < N; i++){
    const phi = (i / N) * Math.PI * 2, y = i % 2 ? -0.33 : 0.3, r = rAt(y);
    const holder = new THREE.Group(); holder.position.set(Math.sin(phi) * r, y, Math.cos(phi) * r); holder.rotation.y = phi; bar.add(holder);
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.06), new THREE.MeshBasicMaterial({ color: 0x0b0502 })); slit.position.z = 0.015; holder.add(slit);
    const ring = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.03), new THREE.MeshStandardMaterial({ color: 0x5a3410, roughness: 0.7 })); ring.position.z = 0.0; holder.add(ring);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), hitMat); hit.position.z = 0.1; hit.userData.i = i; holder.add(hit); hits.push(hit);
    slots.push({ holder, knife: null, t: 0 });
  }
  let rot = 0, shake = 0, boomT = -1, idle = 0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), wp = new THREE.Vector3();
  let down = null;
  // games.js bắt con trỏ (pointer capture) ở phần tử thùng cha để xoay bằng vuốt, nên nghe sự kiện ở đó
  const host = container.parentElement || S.canvas;
  const onDown = (e) => { down = { x: e.clientX, y: e.clientY }; };
  const onUp = (e) => {
    if(!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
    if(moved > 6) return;
    const r = S.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hits, false).find((h) => { h.object.getWorldPosition(wp); return wp.z > 0.3 && !slots[h.object.userData.i].knife; });
    if(hit && opt.onPick) opt.onPick(hit.object.userData.i);
  };
  host.addEventListener('pointerdown', onDown); host.addEventListener('pointerup', onUp);
  S.onFrame((dt, now) => {
    bar.rotation.y = rot;
    idle += dt;
    if(shake > 0){ shake = Math.max(0, shake - dt * 1.6); bar.position.x = Math.sin(now * 60) * 0.12 * shake; pirate.position.x = bar.position.x; }
    slots.forEach((sl) => { if(sl.knife && sl.t < 1){ sl.t = Math.min(1, sl.t + dt * 4.5); const e = 1 - Math.pow(1 - sl.t, 3); sl.knife.position.z = 0.1 + (1 - e) * 1.1; } });
    if(boomT >= 0){
      boomT += dt;
      const t = boomT, vy = 9, g = 11;
      pirate.position.y = H / 2 - 1.15 + vy * t - 0.5 * g * t * t * 0.9;
      pirate.position.z = t * 1.8; pirate.rotation.z = t * 5.5; pirate.rotation.x = -t * 1.6;
      if(t > 1.6) pirate.visible = false;
    }else{
      pirate.position.y = H / 2 - 1.15 + Math.sin(idle * 2.2) * 0.04;
    }
  });
  return {
    setRot(r){ rot = r; },
    knife(i){
      const sl = slots[i]; if(!sl || sl.knife) return;
      const k = knifeObj(); k.rotation.y = -Math.PI / 2; k.position.set(0, 0.0, 1.2); sl.holder.add(k); sl.knife = k; sl.t = 0;
    },
    boom(){ shake = 1; boomT = 0; },
    screenOf(i){ scene.updateMatrixWorld(true); hits[i].getWorldPosition(wp); const p = wp.clone().project(camera), r = S.canvas.getBoundingClientRect(); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height, front: wp.z > 0.3 }; },
    dispose(){ host.removeEventListener('pointerdown', onDown); host.removeEventListener('pointerup', onUp); S.dispose(); },
  };
}

/* ================= Khám răng cá sấu ================= */
export function croc(container, opt = {}){
  const N = opt.N || 6, kind = opt.kind || 'croc', hippo = kind === 'hippo', shark = kind === 'shark', C = Object.assign({ skin: '#4caf50', skin2: '#388e3c', skin3: '#1b5e20', in1: '#5d1111', in2: '#b71c1c' }, opt.colors || {});
  const S = stage(container, { fov: 36, shadows: true, exposure: 1.05 });
  const { scene, camera } = S;
  camera.position.set(0, 4.3, 10.6); camera.lookAt(0, 1.45, 0.3);
  addEnv(S); lights(S, { x: 2, y: 8, z: 6, hemi: 0.9, sun: 2.5, shadowSize: 6 });
  const skinM = new THREE.MeshPhysicalMaterial({ color: C.skin, roughness: 0.32, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.18 });   // nhựa bóng như đồ chơi
  const skin2M = new THREE.MeshPhysicalMaterial({ color: C.skin2, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const inM = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.in1).lerp(new THREE.Color(C.in2), 0.7), roughness: 0.85, side: THREE.DoubleSide });   // sàn miệng hồng nhám
  const toothM = () => new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.4, metalness: 0 });
  const bellyM = skinM;
  const toothProf = [[0, 0], [0.27, 0], [0.27, 0.06], [0.245, 0.2], [0.2, 0.36], [0.14, 0.5], [0.07, 0.58], [0.0, 0.6]].map(([x, y]) => new THREE.Vector2(x, y));
  const toothGeo = (h) => {
    if(hippo || shark){ const gg = roundedBoxGeo(1, 0.24, 5); gg.scale(hippo ? 0.54 : 0.46, h * (shark ? 1.12 : 0.98), hippo ? 0.46 : 0.4); return gg; }
    const gg = new THREE.LatheGeometry(toothProf, 20); gg.translate(0, -0.3, 0); gg.scale(1, h / 0.6, 1); return gg;
  };
  const root = new THREE.Group(); root.position.y = -0.6; scene.add(root);
  // hàm dưới: vỏ ngoài + lòng miệng đỏ
  const lower = new THREE.Group(); root.add(lower);
  const shellL = new THREE.Mesh(new THREE.SphereGeometry(2.55, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bellyM); shellL.scale.set(hippo ? 1.12 : shark ? 0.95 : 1, hippo ? 0.8 : shark ? 0.6 : 0.7, hippo ? 1.0 : 1.15); shellL.castShadow = true; shellL.receiveShadow = true; lower.add(shellL);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(2.38, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), inM); inner.scale.set(1, 0.62, 0.86); inner.position.y = 0.05; lower.add(inner);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(1.05, 24, 16), new THREE.MeshStandardMaterial({ color: 0xf6a5c3, roughness: 0.8 })); tongue.scale.set(1.1, 0.35, 1.25); tongue.position.set(0, -0.36, 0.1); lower.add(tongue);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(2.46, 0.14, 12, 64, Math.PI), skin2M); lip.rotation.x = Math.PI / 2; lip.rotation.z = Math.PI; lip.scale.set(1, 0.9, 1); lip.position.y = 0.04; lower.add(lip);
  // răng dưới (bấm được)
  const R = 2.0, Rz = 1.85, teeth = [], hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const ts = Math.min(1.2, Math.max(0.42, 1.45 - N * 0.05));   // ít răng: răng to, nhiều răng: răng nhỏ (chỉ hàm dưới bấm được)   // răng chẵn: hàm dưới, răng lẻ: hàm trên (cả hai hàm đều bấm được)
  for(let i = 0; i < N; i++){
    const f = N === 1 ? 0.5 : i / (N - 1), phi = (f - 0.5) * 2.7;
    const g = new THREE.Group(); g.position.set(Math.sin(phi) * R, 0.05, Math.cos(phi) * Rz); g.rotation.y = phi * 0.35;
    const m = new THREE.Mesh(toothGeo(0.62), toothM()); m.position.y = 0.3; m.castShadow = true; g.add(m);
    g.scale.setScalar(ts); const hit = new THREE.Mesh(new THREE.SphereGeometry(0.46 / ts, 8, 6), hitMat); hit.position.y = 0.25; hit.userData.i = i; g.add(hit);
    lower.add(g); teeth[i] = { g, m, hit, down: 0, target: 0, bad: false };
  }
  // hàm trên: bản lề phía sau
  const hinge = new THREE.Group(); hinge.position.set(0, 0.1, -1.9); root.add(hinge);
  const upper = new THREE.Group(); upper.position.set(0, 0, 1.9); hinge.add(upper);
  const shellU = new THREE.Mesh(new THREE.SphereGeometry(2.55, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), skinM); shellU.scale.set(hippo ? 1.12 : shark ? 0.95 : 1, hippo ? 0.98 : shark ? 0.7 : 0.8, hippo ? 1.0 : 1.15); shellU.castShadow = true; upper.add(shellU);
  const innerU = new THREE.Mesh(new THREE.SphereGeometry(2.38, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: C.skin2, roughness: 0.6, side: THREE.DoubleSide })); innerU.scale.set(1, 0.72, 0.86); innerU.position.y = -0.04; upper.add(innerU);
  const nTop = hippo ? 15 : shark ? 15 : 12;   // hàng răng hàm trên: trang trí, đều và gọn
  for(let j = 0; j < nTop; j++){
    const f = j / (nTop - 1), phi = (f - 0.5) * 2.5, s = (hippo ? 0.58 : shark ? 0.56 : 0.5) * (1 - Math.abs(f - 0.5) * 0.3);
    const g = new THREE.Mesh(toothGeo(0.62), toothM()); g.rotation.order = 'YXZ'; g.rotation.y = phi * 0.35; g.rotation.x = Math.PI;
    g.position.set(Math.sin(phi) * 2.0, -0.02, Math.cos(phi) * 1.86); g.scale.setScalar(s); g.castShadow = true; upper.add(g);
  }
  const topUp = new THREE.Group(); topUp.position.y = 0.32; upper.add(topUp);   // mắt, tai, mũ nằm trên mặt vỏ nhựa
  if(shark){
    [-1, 1].forEach((sx) => {
      const ew = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })); ew.position.set(sx * 1.78, 0.9, 1.2); upper.add(ew);
      const ep = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 })); ep.position.set(sx * 1.9, 0.9, 1.28); upper.add(ep);
      for(let k = 0; k < 3; k++){ const gl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.06), new THREE.MeshStandardMaterial({ color: C.skin3 })); gl.position.set(sx * (2.16 - k * 0.03), 0.62, 0.1 - k * 0.3); gl.rotation.z = sx * 0.12; gl.rotation.y = sx * 0.35; upper.add(gl); }
    });
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.0, 4), skin2M); fin.scale.set(1, 1, 0.14); fin.position.set(0, 2.05, -0.95); fin.rotation.x = -0.45; fin.castShadow = true; upper.add(fin);
    [-1, 1].forEach((sx) => { const pf = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.7, 4), skin2M); pf.scale.set(1, 1, 0.12); pf.position.set(sx * 2.45, -0.05, 0.4); pf.rotation.z = sx * 1.25; pf.rotation.y = sx * 0.4; lower.add(pf); });
  }
  if(hippo){
    [-1, 1].forEach((sx) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), skin2M); ear.scale.set(0.8, 1.05, 0.55); ear.position.set(sx * 2.05, 2.1, -0.5); topUp.add(ear);
      const ei = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf2a6b8, roughness: 0.6 })); ei.scale.set(0.5, 0.85, 0.4); ei.position.set(sx * 2.05, 2.1, -0.33); topUp.add(ei);
      const eb = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 16), skin2M); eb.position.set(sx * 1.45, 1.55, 0.35); topUp.add(eb);
      const ew = new THREE.Mesh(new THREE.SphereGeometry(0.31, 20, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })); ew.position.set(sx * 1.45, 1.66, 0.58); topUp.add(ew);
      const ir = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe86aa0, roughness: 0.3 })); ir.position.set(sx * 1.45, 1.68, 0.8); topUp.add(ir);
      const ep = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), new THREE.MeshStandardMaterial({ color: 0x1a0a14, roughness: 0.2 })); ep.position.set(sx * 1.45, 1.69, 0.95); topUp.add(ep);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(sx * 1.45 + 0.07, 1.78, 0.99); topUp.add(hl);
    });
  }
  if(!shark && !hippo) [-1, 1].forEach((sx) => {
    const eyeBase = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 16), skin2M); eyeBase.position.set(sx * 1.25, 1.75, 0.2); topUp.add(eyeBase);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })); eye.position.set(sx * 1.25, 1.85, 0.42); topUp.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 })); pup.position.set(sx * 1.25, 1.88, 0.72); topUp.add(pup);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.34), skin2M); brow.position.set(sx * 1.2, 2.3, 0.5); brow.rotation.z = sx * 0.4; topUp.add(brow);
  });
  // mũ bảo hộ vàng cam có logo công ty
  const hatM = new THREE.MeshStandardMaterial({ color: 0xF59A00, roughness: 0.35, metalness: 0.1 });
  const hat = new THREE.Group(); hat.position.set(0, 1.78, 0.35); hat.rotation.x = 0.12; topUp.add(hat);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2), hatM); dome.scale.set(1, 0.85, 1.1); dome.castShadow = true; hat.add(dome);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 1.9), hatM); ridge.position.y = 0.78; hat.add(ridge);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 1.05, 0.07, 32, 1, false, -0.9, 1.8 * Math.PI / 1), hatM); brim.position.set(0, 0.02, 0.35); brim.scale.set(1.05, 1, 1.25); hat.add(brim);
  if(logoImg){ const plate = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), new THREE.MeshBasicMaterial({ map: badgeTex(256, '#163B6D'), transparent: true })); plate.position.set(0, 0.42, 1.03); plate.rotation.x = -0.35; hat.add(plate); }
  let nose;
  if(shark){
    nose = new THREE.Mesh(new THREE.ConeGeometry(1.45, 2.3, 32), skinM); nose.rotation.x = Math.PI / 2; nose.scale.set(1, 1, 0.5); nose.position.set(0, 0.45, 2.55); nose.castShadow = true; upper.add(nose);
    [-0.3, 0.3].forEach((sx) => { const n = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: C.skin3 })); n.position.set(sx, 0.78, 3.15); upper.add(n); });
  }else if(hippo){
    nose = new THREE.Mesh(new THREE.SphereGeometry(1.15, 28, 18), skinM); nose.scale.set(1.7, 0.78, 1.0); nose.position.set(0, 0.9, 2.35); nose.castShadow = true; upper.add(nose);
    [-0.7, 0.7].forEach((sx) => { const n = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), skin2M); n.position.set(sx, 1.55, 2.6); n.scale.set(1, 0.7, 1); upper.add(n); const h = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: C.skin3 })); h.position.set(sx, 1.66, 2.7); h.scale.set(1, 0.5, 1); upper.add(h); });
  }else{
    nose = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 16), skinM); nose.scale.set(1.5, 0.7, 1); nose.position.set(0, 0.95, 2.55); nose.castShadow = true; upper.add(nose);
    [-0.42, 0.42].forEach((sx) => { const n = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ color: C.skin3 })); n.position.set(sx, 1.18, 3.05); n.scale.set(1, 0.6, 0.6); upper.add(n); });
  }
  if(!shark && !hippo) for(let k = 1; k < 5; k++){ const b = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 8), skin2M); b.position.set(0, 1.9 - k * 0.2, 0.2 - k * 0.5); b.rotation.x = -0.2; upper.add(b); }
  const OPEN = 0.82;
  let ang = OPEN, angV = 0, mode = 'open', shake = 0, t = 0;
  hinge.rotation.x = -ang;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  S.canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  S.canvas.addEventListener('pointerup', (e) => {
    if(!down) return; const mv = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if(mv > 8) return;
    const r = S.canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(teeth.map((x) => x.hit), false)[0];
    if(h && opt.onPick) opt.onPick(h.object.userData.i);
  });
  S.onFrame((dt, now) => {
    t += dt;
    teeth.forEach((th) => { th.down += (th.target - th.down) * Math.min(1, dt * 18); th.m.position.y = 0.3 - th.down * 0.42; th.m.scale.y = 1 - th.down * 0.35; if(th.bad){ th.m.material.color.setRGB(1, 0.35 + 0.25 * Math.sin(now * 14), 0.35); th.m.material.emissive.setRGB(0.4, 0, 0); } });
    if(mode === 'snap'){
      angV -= dt * 70; ang += angV * dt;
      if(ang <= 0){ ang = 0; angV = -angV * 0.28; if(Math.abs(angV) < 0.6){ angV = 0; mode = 'shut'; } }
      hinge.rotation.x = -ang;
    }else if(mode === 'open'){ hinge.rotation.x = -(OPEN + Math.sin(t * 1.6) * 0.012); }
    if(shake > 0){ shake = Math.max(0, shake - dt * 1.4); root.position.x = Math.sin(now * 55) * 0.14 * shake; root.rotation.z = Math.sin(now * 47) * 0.03 * shake; }
  });
  return {
    toothDown(i){ if(teeth[i]) teeth[i].target = 1; },
    screenOf(i){ scene.updateMatrixWorld(true); const v = new THREE.Vector3(); teeth[i].hit.getWorldPosition(v); const p = v.project(camera), r = S.canvas.getBoundingClientRect(); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }; },
    snap(bad){ (bad || []).forEach((i) => { if(teeth[i]){ teeth[i].bad = true; teeth[i].target = 0; } }); mode = 'snap'; angV = -2; shake = 1; },
    dispose: S.dispose,
  };
}

/* ================= Gà chọi ================= */
function chickTex(p){
  const dk = '#00000055';
  return canvasTex(256, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, p.body); g.addColorStop(1, p.body); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, 0, w, h * 0.35);
    const rn = () => Math.random();
    if(p.pat === 'spots'){ c.fillStyle = dk; for(let i = 0; i < 26; i++){ c.beginPath(); c.ellipse(rn() * w, rn() * h, 6 + rn() * 7, 5 + rn() * 5, rn() * 3, 0, 7); c.fill(); } }
    else if(p.pat === 'stripes'){ c.strokeStyle = dk; c.lineWidth = 9; for(let i = 0; i < 9; i++){ c.beginPath(); c.moveTo(i * 30 - 10, 0); c.quadraticCurveTo(i * 30 + 20, h / 2, i * 30 - 6, h); c.stroke(); } }
    else if(p.pat === 'bolt'){ c.fillStyle = '#ffe14a'; c.strokeStyle = '#f9a825'; c.lineWidth = 3; for(let k = 0; k < 4; k++){ const x = 30 + k * 62; c.beginPath(); c.moveTo(x, 40); c.lineTo(x - 18, 110); c.lineTo(x - 2, 110); c.lineTo(x - 14, 190); c.lineTo(x + 20, 96); c.lineTo(x + 4, 96); c.lineTo(x + 14, 40); c.closePath(); c.fill(); c.stroke(); } }
    else if(p.pat === 'flames'){ c.fillStyle = '#ffb300'; c.strokeStyle = '#e65100'; c.lineWidth = 3; for(let k = 0; k < 6; k++){ const x = k * 46 + 10; c.beginPath(); c.moveTo(x, h); c.quadraticCurveTo(x - 14, h - 80, x + 12, h - 130); c.quadraticCurveTo(x + 8, h - 70, x + 36, h - 100); c.quadraticCurveTo(x + 30, h - 40, x + 40, h); c.closePath(); c.fill(); c.stroke(); } }
    else if(p.pat === 'scales'){ c.strokeStyle = dk; c.lineWidth = 3; for(let y = 0; y < 9; y++) for(let x = 0; x < 10; x++){ c.beginPath(); c.arc(x * 28 + (y % 2) * 14, y * 26, 14, 0, Math.PI); c.stroke(); } }
    else if(p.pat === 'cosmic'){ for(let i = 0; i < 60; i++){ c.fillStyle = ['#fff', '#ffe082', '#80d8ff', '#ff80ab'][i % 4]; c.beginPath(); c.arc(rn() * w, rn() * h, 1 + rn() * 2.6, 0, 7); c.fill(); } }
  });
}
const mk = (geo, color, o = {}) => new THREE.Mesh(geo, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.6, metalness: 0.05 }, o)));

function buildChicken(p){
  const tier = p.tier || 0, root = new THREE.Group(), g = new THREE.Group(); root.add(g);
  const mats = [];
  const reg = (m) => { mats.push(m.material); return m; };
  const bodyTex = chickTex(p);
  const body = reg(new THREE.Mesh(new THREE.SphereGeometry(0.95, 36, 24), new THREE.MeshStandardMaterial({ map: bodyTex, roughness: 0.55 })));
  body.scale.set(1.15, 0.9, 0.85); body.position.set(0, 1.25, 0); body.castShadow = true; g.add(body);
  const breast = reg(mk(new THREE.SphereGeometry(0.62, 24, 18), p.hackle)); breast.scale.set(0.9, 1, 0.9); breast.position.set(0.7, 1.15, 0); g.add(breast);
  const neck = reg(mk(new THREE.CylinderGeometry(0.28, 0.4, 0.9, 16), p.hackle)); neck.position.set(0.72, 1.85, 0); neck.rotation.z = -0.15; neck.castShadow = true; g.add(neck);
  const headG = new THREE.Group(); headG.position.set(0.82, 2.4, 0); g.add(headG);
  const head = reg(mk(new THREE.SphereGeometry(0.4, 24, 18), p.hackle)); head.scale.set(1.05, 1, 0.95); head.castShadow = true; headG.add(head);
  const beakM = new THREE.MeshStandardMaterial({ color: 0xffa000, roughness: 0.4 });
  const beakU = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.55, 12), beakM); beakU.rotation.z = -Math.PI / 2; beakU.position.set(0.55, 0.03, 0); headG.add(beakU);
  const beakL = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.38, 12), beakM); beakL.rotation.z = -Math.PI / 2; beakL.position.set(0.47, -0.1, 0); headG.add(beakL);
  const eyeW = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }), eyeB = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
  [-1, 1].forEach((sz) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), eyeW); e.position.set(0.22, 0.12, sz * 0.31); headG.add(e); const pu = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), eyeB); pu.position.set(0.29, 0.12, sz * 0.35); headG.add(pu); });
  const combM = new THREE.MeshStandardMaterial({ color: p.comb, roughness: 0.45 });
  for(let i = 0; i < 4; i++){ const c = new THREE.Mesh(new THREE.SphereGeometry(0.15 - i * 0.012, 14, 12), combM); c.scale.set(0.8, 1.2, 0.6); c.position.set(0.18 - i * 0.14, 0.45 + (i === 1 || i === 2 ? 0.07 : 0), 0); headG.add(c); }
  const wattle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), combM); wattle.scale.set(0.7, 1.4, 0.7); wattle.position.set(0.42, -0.32, 0); headG.add(wattle);
  const wings = [-1, 1].map((sz) => {
    const pivot = new THREE.Group(); pivot.position.set(0.05, 1.7, sz * 0.72); g.add(pivot);
    const w = reg(mk(new THREE.SphereGeometry(0.7, 20, 14), p.wing)); w.scale.set(0.95, 0.55, 0.14); w.position.set(-0.35, -0.55, 0); w.rotation.z = 0.35; w.castShadow = true; pivot.add(w);
    if(tier >= 2){ const t = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 8, 28, Math.PI), new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 1, roughness: 0.25 })); t.position.set(-0.35, -0.55, sz * 0.1); t.rotation.z = 0.35 + Math.PI; t.scale.set(0.95, 0.55, 1); pivot.add(t); }
    return { pivot, sz };
  });
  const tailG = new THREE.Group(); tailG.position.set(-0.95, 1.5, 0); g.add(tailG);
  const nF = tier >= 4 ? 9 : tier >= 2 ? 7 : 5, cols = [p.t1, p.t2, p.t3];
  for(let i = 0; i < nF; i++){
    const f = nF === 1 ? 0 : i / (nF - 1) - 0.5, len = (tier >= 4 ? 1.6 : tier >= 2 ? 1.4 : 1.1) * (1 - Math.abs(f) * 0.35);
    const pivot = new THREE.Group(); pivot.rotation.z = 0.5 + f * 1.5; pivot.rotation.x = f * 0.45; tailG.add(pivot);
    const fe = reg(mk(new THREE.SphereGeometry(0.4, 14, 10), cols[i % 3], tier >= 4 ? { emissive: cols[i % 3], emissiveIntensity: 0.35 } : {})); fe.scale.set(len * 0.5, 0.2, 0.09 + (i % 2) * 0.03); fe.position.set(-len * 0.45, len * 0.1, 0); fe.castShadow = true; pivot.add(fe);
  }
  const legs = [-1, 1].map((sz) => {
    const lg = new THREE.Group(); lg.position.set(-0.05, 0.62, sz * 0.32); g.add(lg);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.1, 0.82, 10), new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.5 })); leg.position.y = -0.2; leg.castShadow = true; lg.add(leg);
    for(let t = -1; t <= 1; t++){ const toe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.42, 8), leg.material); toe.rotation.z = Math.PI / 2; toe.rotation.y = t * 0.45; toe.position.set(0.18, -0.6, t * 0.12); lg.add(toe); }
    if(tier >= 1){ const band = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.1, 14), new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 1, roughness: 0.25 })); band.position.y = -0.1; lg.add(band); }
    const thigh = reg(mk(new THREE.SphereGeometry(0.34, 14, 10), p.wing)); thigh.scale.set(0.9, 1.1, 0.7); thigh.position.set(0, 0.12, 0); lg.add(thigh);
    return lg;
  });
  // trang sức theo hạng sao
  let halo = null, aura = null, sparks = [], crown = null;
  if(tier >= 3){
    crown = new THREE.Group(); crown.position.y = 0.46; headG.add(crown);
    const gold = new THREE.MeshStandardMaterial({ color: 0xffd54a, metalness: 1, roughness: 0.2 });
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.14, 20, 1, true), gold); ring.material.side = THREE.DoubleSide; crown.add(ring);
    for(let i = 0; i < 6; i++){ const a = (i / 6) * Math.PI * 2, c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 8), gold); c.position.set(Math.cos(a) * 0.3, 0.18, Math.sin(a) * 0.3); crown.add(c); const gm = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xe53935 : 0x1e88e5, emissive: i % 2 ? 0x550000 : 0x002255 })); gm.position.set(Math.cos(a) * 0.3, 0.32, Math.sin(a) * 0.3); crown.add(gm); }
  }
  if(tier >= 4){
    halo = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 10, 40), new THREE.MeshBasicMaterial({ color: 0xfff59d })); halo.rotation.x = Math.PI / 2; halo.position.y = 0.95; headG.add(halo);
  }
  if(tier >= 2){
    aura = new THREE.Mesh(new THREE.SphereGeometry(1.55, 24, 18), new THREE.MeshBasicMaterial({ color: new THREE.Color(p.t1), transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }));
    aura.position.y = 1.5; g.add(aura);
  }
  if(tier >= 3){
    const n = tier >= 4 ? 8 : 4;
    for(let i = 0; i < n; i++){ const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.075), new THREE.MeshBasicMaterial({ color: [0xfff59d, 0xffffff, 0x80d8ff, 0xffd54a][i % 4] })); g.add(sp); sparks.push({ m: sp, a: (i / n) * Math.PI * 2, r: 1.5 + (i % 3) * 0.25, y: 0.9 + (i % 4) * 0.55 }); }
  }
  // sao quay trên đầu khi choáng
  const stun = new THREE.Group(); stun.position.y = 0.75; stun.visible = false; headG.add(stun);
  for(let i = 0; i < 3; i++){ const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xffeb3b })); stun.add(s); }
  const ringFx = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 8, 36), new THREE.MeshBasicMaterial({ color: 0xfff176, transparent: true, opacity: 0 })); ringFx.position.set(1.3, 2.3, 0); ringFx.rotation.y = Math.PI / 2; g.add(ringFx);
  return { root, g, body, headG, beakU, beakL, wings, legs, tailG, halo, aura, sparks, crown, stun, ringFx, mats };
}

export function arena(container, opt = {}){
  const S = stage(container, { fov: 34, shadows: true, exposure: 1.1 });
  const { scene, camera, renderer } = S;
  camera.position.set(0, 4.2, 13.5); camera.lookAt(0, 1.3, 0);
  addEnv(S); lights(S, { x: 3, y: 9, z: 7, hemi: 0.95, sun: 2.4, shadowSize: 9 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.38 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const skins = opt.skins, els = opt.els, arenaEl = opt.arenaEl;
  const decal = null;   // bỏ logo to giữa sân (yêu cầu): chỉ giữ logo nhỏ ở góc
  const cs = skins.map((p, k) => { const c = buildChicken(p); c.dir = k === 0 ? 1 : -1; c.root.scale.x = c.dir; scene.add(c.root); c.prev = {}; c.t0 = {}; return c; });
  const ray = new THREE.Raycaster(), pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), v3 = new THREE.Vector3(), ndc = new THREE.Vector2();
  const CLS = ['atk', 'hurt', 'heal', 'flurry', 'phantom', 'steel', 'thunder', 'stunned', 'crow', 'dead', 'win'];
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x9fb3c8, metalness: 1, roughness: 0.2 });
  function place(c, el){
    // đặt chân gà tại điểm giữa-đáy của phần tử DOM, kích thước theo chiều cao phần tử
    if(!el || !arenaEl) return;
    const a = arenaEl.getBoundingClientRect(), r = el.getBoundingClientRect();
    ndc.set(((r.left + r.width / 2 - a.left) / a.width) * 2 - 1, -(((r.bottom - 4) - a.top) / a.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); if(!ray.ray.intersectPlane(pl, v3)) return;
    c.base = c.base || new THREE.Vector3(); c.base.copy(v3);
    if(decal && c.dir === 1){ decal.position.set(0, 0.01, v3.z); decal.scale.setScalar(clamp((r.height * 0.74) / 150, 0.8, 2)); }
    const top = new THREE.Vector3(v3.x, 3.3, v3.z).project(camera), bot = new THREE.Vector3(v3.x, 0, v3.z).project(camera);
    const px = Math.abs(top.y - bot.y) * a.height / 2;
    c.sc = clamp((r.height * 0.74) / Math.max(px, 1), 0.3, 3);
  }
  S.onFrame((dt, now) => {
    cs.forEach((c, k) => {
      const el = els[k]; place(c, el);
      if(!c.base) return;
      const has = {}; CLS.forEach((n) => { has[n] = !!(el && el.classList.contains(n)); if(has[n] && !c.prev[n]) c.t0[n] = now; c.prev[n] = has[n]; });
      const since = (n) => now - (c.t0[n] || 0);
      const dir = c.dir, g = c.g, ph = (n, d) => clamp(since(n) / d, 0, 1);
      let ox = 0, oy = 0, rz = 0, lean = 0, flap = 0, peck = 0, beak = 0.0, sc = c.sc;
      const bob = Math.sin(now * 4.2 + k) * 0.04;
      if(has.atk){ const p = ph('atk', 0.45); ox = dir * 1.7 * Math.sin(Math.PI * p) * (p < 0.5 ? 1 : 0.9); lean = 0.5 * Math.sin(Math.PI * p); flap = 1.0 * Math.sin(Math.PI * p * 4); peck = 0.6 * Math.sin(Math.PI * Math.min(1, p * 1.5)); beak = Math.sin(Math.PI * p); }
      if(has.hurt){ const p = ph('hurt', 0.35); ox -= dir * 0.5 * Math.sin(Math.PI * p); rz = 0.35 * Math.sin(Math.PI * p) * -dir; }
      if(has.flurry){ const p = now * 22; peck = 0.5 + 0.5 * Math.sin(p); ox += dir * 0.6; lean = 0.35; flap = 0.8 * Math.sin(now * 30); beak = 0.5 + 0.5 * Math.sin(p); }
      if(has.thunder){ const p = ph('thunder', 1.0); oy = 1.6 * Math.sin(Math.PI * Math.min(1, p * 1.3)); ox += dir * 1.5 * smooth(0.2, 0.7, p) * (1 - smooth(0.85, 1, p)); lean = 0.7 * Math.sin(Math.PI * p); flap = Math.sin(now * 28); }
      if(has.crow){ const p = ph('crow', 1.25); lean = -0.5 * Math.sin(Math.PI * Math.min(1, p * 1.2)); beak = 1; flap = 0.7 * Math.sin(now * 18); sc *= 1 + 0.12 * Math.sin(Math.PI * p); }
      if(has.win){ oy += Math.abs(Math.sin(now * 5)) * 0.5; flap = Math.sin(now * 16); beak = 0.5 + 0.5 * Math.sin(now * 9); }
      if(has.stunned){ rz += Math.sin(now * 9) * 0.1; }
      c.root.position.set(c.base.x + ox * c.sc, c.base.y + oy * c.sc, c.base.z);
      c.root.scale.set(c.sc * dir, c.sc, c.sc);
      g.position.y = bob + (has.dead ? 0 : 0);
      g.rotation.z = (-lean * dir * dir) * 0.6 * 1 - 0 + rz * dir;
      c.headG.rotation.z = -peck * 0.7 - lean * 0.3 + (has.stunned ? Math.sin(now * 7) * 0.2 : 0);
      c.beakU.rotation.z = -Math.PI / 2 + beak * 0.25; c.beakL.rotation.z = -Math.PI / 2 - beak * 0.35;
      c.wings.forEach((w) => { w.pivot.rotation.x = -w.sz * (0.15 + 0.9 * Math.max(0, flap)) ; w.pivot.rotation.z = Math.max(0, flap) * 0.5; });
      c.legs.forEach((lg, i) => { lg.rotation.z = Math.sin(now * (has.atk || has.flurry ? 18 : 3) + i * 2) * (has.atk || has.flurry ? 0.5 : 0.04); });
      c.tailG.rotation.z = Math.sin(now * 3 + k) * 0.05 + (has.atk ? 0.15 : 0);
      if(has.dead){ const p = ph('dead', 0.8); c.root.rotation.z = dir * 1.45 * smooth(0, 1, p); c.root.position.y = c.base.y + 0.45 * c.sc * smooth(0, 1, p); c.mats.forEach((m) => { m.color.lerp(new THREE.Color(0x777777), 0.04); }); }
      else{ c.root.rotation.z = 0; }
      // hiệu ứng trạng thái
      const flash = has.hurt ? 0.9 * Math.sin(Math.PI * ph('hurt', 0.35)) : has.thunder ? 0.5 : 0;
      c.mats.forEach((m) => { if(!m.emissive) return; m.emissive.setRGB(flash, flash * (has.thunder ? 0.9 : 0.1), has.heal ? 0.15 : 0.0); if(has.heal) m.emissive.setRGB(0.05, 0.45 + 0.2 * Math.sin(now * 8), 0.15); });
      c.mats.forEach((m) => { m.transparent = has.phantom; m.opacity = has.phantom ? 0.45 + 0.2 * Math.sin(now * 14) : 1; if(has.steel){ m.metalness = 1; m.roughness = 0.25; } else if(m.userData.rough == null){ m.userData.rough = m.roughness; } });
      if(c.aura){ c.aura.material.opacity = (c.tier >= 3 ? 0.1 : 0.06) + 0.03 * Math.sin(now * 2.2) + (has.steel ? 0.15 : 0) + (has.heal ? 0.2 : 0); if(has.heal) c.aura.material.color.setHex(0x55ff88); else if(has.steel) c.aura.material.color.setHex(0x66aaff); else c.aura.material.color.set(skins[k].t1); c.aura.scale.setScalar(1 + 0.04 * Math.sin(now * 3)); }
      c.sparks.forEach((s, i) => { const a = s.a + now * 0.9; s.m.position.set(Math.cos(a) * s.r, s.y + Math.sin(now * 2 + i) * 0.15, Math.sin(a) * s.r * 0.7); s.m.rotation.y = now * 3; });
      if(c.halo){ c.halo.rotation.z = now * 1.3; c.halo.position.y = 0.95 + Math.sin(now * 2) * 0.04; }
      c.stun.visible = has.stunned; if(has.stunned) c.stun.children.forEach((st, i) => { const a = now * 5 + i * 2.1; st.position.set(Math.cos(a) * 0.45, Math.sin(now * 3 + i) * 0.04, Math.sin(a) * 0.45); st.rotation.y = now * 6; });
      if(has.crow){ const p = ph('crow', 1.25), q = (p * 4) % 1; c.ringFx.material.opacity = (1 - q) * 0.9; c.ringFx.scale.setScalar(0.6 + q * 2.4); } else c.ringFx.material.opacity = 0;
    });
  });
  cs.forEach((c, k) => { c.tier = skins[k].tier || 0; });
  return { dispose: S.dispose };
}

export default { supported, stage, dice, wheel, barrel, croc, arena, loadLogo };
