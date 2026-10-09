/* ---------- Thông báo và cập nhật bản mới ----------
   Trang đọc version.json (luôn lấy mới từ máy chủ) rồi so với phiên bản đang chạy (version.js).
   Khác nhau thì hiện thanh thông báo; bấm "Cập nhật ngay" để tải lại bản mới nhất.
   Với app Android: version.json còn có thể báo bản app mới (apk) để tải về cài đặt.
   Không bao giờ tự tải lại, để khỏi mất bài đang làm dở. */

const UPDATE_CHECK_MS = 5 * 60 * 1000;
const UPDATE_THROTTLE_MS = 30 * 1000;
let updateDismissed = '';   // phiên bản web đã bấm "Để sau" (chỉ nhắc lại khi có bản mới hơn)
let apkDismissed = '';      // phiên bản app đã bấm "Để sau"
let lastUpdateCheck = 0;

// So sánh số phiên bản dạng 1.2.3 (trả về 1, 0 hoặc -1)
function cmpVersion(a, b){
  const pa = String(a || '').split('.').map((x) => parseInt(x, 10) || 0);
  const pb = String(b || '').split('.').map((x) => parseInt(x, 10) || 0);
  for(let i = 0; i < Math.max(pa.length, pb.length); i++){
    const d = (pa[i] || 0) - (pb[i] || 0);
    if(d) return d > 0 ? 1 : -1;
  }
  return 0;
}

async function fetchLatestVersion(){
  const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
  if(!r.ok) throw new Error('http ' + r.status);
  return r.json();
}

// Phiên bản app Android đang cài (chỉ có khi chạy trong app); rỗng nếu không lấy được
async function installedApkVersion(){
  try{
    const cap = window.Capacitor;
    if(!cap || !(typeof cap.isNativePlatform === 'function' && cap.isNativePlatform())) return '';
    const info = (cap.Plugins && cap.Plugins.App && typeof cap.Plugins.App.getInfo === 'function')
      ? await cap.Plugins.App.getInfo()
      : await cap.nativePromise('App', 'getInfo', {});
    return (info && info.version) || '';
  }catch(e){ return ''; }
}

function hideUpdateBanner(){
  const b = document.getElementById('update-banner');
  if(b) b.remove();
}

function showUpdateBanner(opts){
  hideUpdateBanner();
  const bar = document.createElement('div');
  bar.id = 'update-banner';
  bar.className = 'update-banner';
  bar.setAttribute('role', 'status');
  const msg = document.createElement('span');
  msg.textContent = opts.text;
  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'update-primary';
  go.textContent = opts.primary;
  go.onclick = opts.onPrimary;
  const later = document.createElement('button');
  later.type = 'button';
  later.className = 'update-later';
  later.textContent = 'Để sau';
  later.onclick = () => { hideUpdateBanner(); if(opts.onLater) opts.onLater(); };
  bar.append(msg, go, later);
  document.body.appendChild(bar);
}

// Tải lại bản mới nhất. Đổi địa chỉ (?v=...) để chắc chắn không dùng bản lưu tạm cũ.
async function applyUpdate(v){
  const playing = document.getElementById('quiz-play') && document.getElementById('quiz-play').style.display === 'block';
  if(playing){
    const ok = await showConfirm('Bạn đang làm bài dở. Cập nhật sẽ tải lại trang và mất bài đang làm. Vẫn cập nhật?');
    if(!ok) return;
  }
  const url = new URL(location.href);
  url.searchParams.set('v', v.version);
  location.replace(url.toString());
}

async function checkForUpdate(manual){
  lastUpdateCheck = Date.now();
  let v;
  try{
    v = await fetchLatestVersion();
  }catch(e){
    if(manual) showToast('Không kiểm tra được bản mới (mất mạng?).');
    return false;
  }
  const current = window.APP_VERSION || '';
  if(v && v.version && current && v.version !== current){
    if(manual || updateDismissed !== v.version){
      showUpdateBanner({
        text: 'Có bản cập nhật mới' + (v.notes ? ' — ' + v.notes : '') + '.',
        primary: 'Cập nhật ngay',
        onPrimary: () => applyUpdate(v),
        onLater: () => { updateDismissed = v.version; },
      });
    }
    return true;
  }
  const apk = v && v.apk;
  if(apk && apk.version && apk.url){
    const installed = await installedApkVersion();
    if(installed && cmpVersion(apk.version, installed) > 0 && (manual || apkDismissed !== apk.version)){
      showUpdateBanner({
        text: `Có bản app Android mới ${apk.version}` + (apk.notes ? ' — ' + apk.notes : '') + '.',
        primary: 'Tải về',
        onPrimary: () => { location.href = apk.url; }, // app Android mở liên kết ngoài bằng trình duyệt hệ thống
        onLater: () => { apkDismissed = apk.version; },
      });
      return true;
    }
  }
  if(manual) showToast('Bạn đang dùng bản mới nhất.');
  return false;
}

function maybeCheckForUpdate(){
  if(Date.now() - lastUpdateCheck >= UPDATE_THROTTLE_MS) checkForUpdate(false);
}

function startUpdateChecks(){
  const line = document.getElementById('app-version-line');
  if(line && window.APP_VERSION){
    line.textContent = 'Phiên bản ' + String(window.APP_DATE || '').slice(0, 10) + ' · ' + String(window.APP_VERSION).slice(0, 6);
  }
  setTimeout(maybeCheckForUpdate, 4000);
  setInterval(() => { if(document.visibilityState === 'visible') maybeCheckForUpdate(); }, UPDATE_CHECK_MS);
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') maybeCheckForUpdate(); });
  window.addEventListener('online', maybeCheckForUpdate);
}
startUpdateChecks();
