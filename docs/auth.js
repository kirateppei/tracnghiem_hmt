/* ---------- Đăng nhập Google (Firebase Auth) ----------
   Mặc định mọi tài khoản Google đều vào được. Quản trị viên (có hồ sơ role "admin" trong collection
   `allowed`) có thể chuyển sang chế độ "chỉ danh sách" hoặc khoá từng email. Việc chặn thật sự nằm ở
   luật Firestore (firestore.rules), giao diện chỉ phản ánh lại kết quả. */

let fbAuth = null;
let fbDb = null;
let accessSeq = 0;           // chống chạy chồng khi trạng thái đăng nhập đổi liên tục
let qUnsubs = [];            // các listener câu hỏi dùng chung
let accountsUnsub = null;
let accountsList = [];       // [{email, name, role, active}]
let accessUnsub = null;
let accessOpenMode = true;  // true = mọi tài khoản Google; false = chỉ email trong danh sách

const gid = (id) => document.getElementById(id);
const attr = (s) => escapeAttr(escapeHtml(s));

function firebaseConfigured(){
  const c = window.FIREBASE_CONFIG;
  return !!(c && c.apiKey && c.projectId && c.appId && !/^DIEN/i.test(c.apiKey) && !/^DIEN/i.test(c.projectId));
}
function isNativeApp(){
  try{ return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()); }
  catch(e){ return false; }
}
function nativeGoogle(){
  try{
    const cap = window.Capacitor;
    if(!cap) return null;
    if(cap.Plugins && cap.Plugins.FirebaseAuthentication) return cap.Plugins.FirebaseAuthentication;
    if(typeof cap.nativePromise === 'function'){
      // Trang HTML đơn lẻ không nạp @capacitor/core nên gọi thẳng cầu nối gốc của app.
      // Nếu app chưa cài plugin, lời gọi bị từ chối và googleErrorText báo cho người dùng.
      const call = (method) => (opts) => cap.nativePromise('FirebaseAuthentication', method, opts || {});
      return { signInWithGoogle: call('signInWithGoogle'), signOut: call('signOut') };
    }
  }catch(e){}
  return null;
}
function inAppBrowser(){
  return /(Zalo|FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\/|MicroMessenger)/i.test(navigator.userAgent || '');
}

/* ---------- Màn hình đăng nhập ---------- */
function showLoginError(msg){
  const el = gid('login-error');
  el.textContent = msg || '';
  el.classList.toggle('show', !!msg);
}

function showLoginState(state, msg){
  const btn = gid('google-btn');
  const txt = gid('google-btn-text');
  const denied = gid('denied-box');
  showLoginError('');
  denied.classList.remove('show');
  btn.style.display = '';
  if(state === 'loading'){ txt.textContent = 'Đang khởi động...'; btn.disabled = true; }
  else if(state === 'checking'){ txt.textContent = 'Đang kiểm tra quyền truy cập...'; btn.disabled = true; }
  else if(state === 'ready'){ txt.textContent = 'Đăng nhập bằng Google'; btn.disabled = false; }
  else if(state === 'fatal'){ txt.textContent = 'Đăng nhập bằng Google'; btn.disabled = true; showLoginError(msg); }
  else if(state === 'denied'){
    btn.style.display = 'none';
    gid('denied-text').textContent = msg || '';
    denied.classList.add('show');
  }
}

function setupLoginNotice(){
  const box = gid('login-notice');
  let text = '';
  if(!isNativeApp() && inAppBrowser()){
    text = 'Bạn đang mở trang trong trình duyệt của một ứng dụng khác (Zalo, Messenger...). Google không cho đăng nhập ở đây. Hãy mở liên kết bằng Chrome hoặc Safari.';
  }
  if(!text) return;
  box.textContent = text;
  if(!isNativeApp()){
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Sao chép liên kết';
    b.onclick = () => {
      if(!navigator.clipboard){ showToast('Không sao chép được, hãy chép liên kết thủ công.'); return; }
      navigator.clipboard.writeText(location.href).then(() => showToast('Đã sao chép liên kết.'), () => showToast('Không sao chép được.'));
    };
    box.appendChild(b);
  }
  box.classList.add('show');
}

function googleErrorText(e){
  const code = String((e && e.code) || '');
  const map = {
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập. Hãy thử lại.',
    'auth/cancelled-popup-request': '',
    'auth/popup-blocked': 'Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép cửa sổ bật lên (pop-up) cho trang này rồi bấm lại.',
    'auth/network-request-failed': 'Không có kết nối mạng. Kiểm tra Wi-Fi hoặc 4G rồi thử lại.',
    'auth/unauthorized-domain': 'Tên miền trang web chưa được thêm vào Firebase (Authentication → Settings → Authorized domains).',
    'auth/operation-not-allowed': 'Chưa bật đăng nhập Google trong Firebase (Authentication → Sign-in method).',
    'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hoá trong Firebase.',
    'app/no-native-google': 'Bản app này chưa hỗ trợ đăng nhập Google. Hãy cài bản app mới hoặc mở trang web bằng Chrome.',
    'app/no-id-token': 'Không lấy được thông tin từ Google. Hãy thử lại.',
  };
  if(code in map) return map[code];
  if(code === 'UNIMPLEMENTED' || /not implemented|not available/i.test((e && e.message) || '')) return map['app/no-native-google'];
  if(/cancel/i.test((e && e.message) || '')) return 'Bạn đã huỷ đăng nhập.';
  return 'Đăng nhập không thành công (' + (code || (e && e.message) || 'lỗi không rõ') + ').';
}

async function signInWithGoogle(){
  if(!fbAuth) return;
  showLoginError('');
  const btn = gid('google-btn');
  const txt = gid('google-btn-text');
  btn.disabled = true;
  txt.textContent = 'Đang đăng nhập...';
  try{
    if(isNativeApp()){
      // Trong app Android: đăng nhập Google bằng thành phần gốc rồi đưa thẻ vào Firebase JS
      const plugin = nativeGoogle();
      if(!plugin) throw { code: 'app/no-native-google' };
      const res = await plugin.signInWithGoogle({ skipNativeAuth: true });
      const idToken = res && res.credential && res.credential.idToken;
      if(!idToken) throw { code: 'app/no-id-token' };
      await fbAuth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(idToken));
    } else {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await fbAuth.signInWithPopup(provider);
    }
  }catch(e){
    showLoginError(googleErrorText(e));
    btn.disabled = false;
    txt.textContent = 'Đăng nhập bằng Google';
  }
}

/* ---------- Khởi tạo Firebase ---------- */
function initFirebase(){
  showLoginState('loading');
  if(!window.firebase){
    showLoginState('fatal', 'Không tải được thư viện Firebase. Kiểm tra kết nối mạng rồi tải lại trang.');
    return;
  }
  if(!firebaseConfigured()){
    showLoginState('fatal', 'Phần mềm chưa được cấu hình Firebase. Quản trị viên điền file firebase-config.js (xem HUONG_DAN.md).');
    return;
  }
  try{
    firebase.initializeApp(window.FIREBASE_CONFIG);
    fbAuth = firebase.auth();
    fbDb = firebase.firestore();
    // Tự chuyển sang long-polling khi mạng hoặc WebView chặn kết nối streaming
    fbDb.settings({ experimentalAutoDetectLongPolling: true, ignoreUndefinedProperties: true });
  }catch(e){
    showLoginState('fatal', 'Cấu hình Firebase không hợp lệ: ' + ((e && e.message) || e));
    return;
  }
  fbAuth.onAuthStateChanged(handleAuthChange);
}

/* ---------- Kiểm tra quyền truy cập ---------- */
async function resolveAccess(user){
  const email = (user.email || '').toLowerCase();
  const [snap, cfg] = await Promise.all([
    fbDb.collection('allowed').doc(email).get(),
    fbDb.collection('config').doc('access').get().catch(() => null),
  ]);
  const open = !cfg || !cfg.exists || cfg.data().open !== false;
  const fallbackName = user.displayName || email.split('@')[0];
  if(snap.exists){
    const d = snap.data();
    if(d.active === false){
      return { ok: false, message: `Tài khoản ${email} đang bị khoá. Hãy liên hệ quản trị viên.` };
    }
    return { ok: true, role: d.role === 'admin' ? 'admin' : 'member', name: String(d.name || fallbackName).slice(0, 60) };
  }
  if(!open){
    return { ok: false, message: `Tài khoản ${email} chưa được cấp quyền. Hãy gửi email này cho quản trị viên để được thêm vào danh sách.` };
  }
  return { ok: true, role: 'member', name: String(fallbackName).slice(0, 60) };
}

function accessErrorText(e){
  const code = e && e.code;
  if(code === 'permission-denied') return 'Không đọc được dữ liệu. Có thể luật Firestore chưa được đăng (xem HUONG_DAN.md, mục 3). Bấm "Dùng tài khoản khác" rồi thử lại sau.';
  if(code === 'unavailable' || code === 'failed-precondition') return 'Không kết nối được tới máy chủ. Kiểm tra mạng rồi thử lại.';
  return 'Không kiểm tra được quyền truy cập (' + (code || (e && e.message) || 'lỗi không rõ') + ').';
}

async function handleAuthChange(user){
  if(!user){
    teardownSession();
    showLoginState('ready');
    return;
  }
  const seq = ++accessSeq;
  showLoginState('checking');
  let res;
  try{
    res = await resolveAccess(user);
  }catch(e){
    if(seq !== accessSeq) return;
    showLoginState('denied', accessErrorText(e));
    return;
  }
  if(seq !== accessSeq) return;
  if(!res.ok){ showLoginState('denied', res.message); return; }
  session = { role: res.role, name: res.name, uid: user.uid, email: (user.email || '').toLowerCase() };
  startSyncListeners();
  enterApp();
  flushPendingResults();
}

function teardownSession(){
  accessSeq++;
  qUnsubs.forEach((u) => { try{ u(); }catch(e){} });
  qUnsubs = [];
  if(accountsUnsub){ try{ accountsUnsub(); }catch(e){} accountsUnsub = null; }
  if(accessUnsub){ try{ accessUnsub(); }catch(e){} accessUnsub = null; }
  accountsList = [];
  stopLb();
  lbRows = [];
  lbInvalidate();
  session = null;
  dbNS = null;
  qSyncMode = 'local';
  qSyncCustom = {}; qSyncEdits = {}; qSyncDeletes = {};
  loadQuestions();
  stopTimer();
  gid('app-main').classList.add('hidden');
  gid('login-screen').classList.remove('hidden');
}

function enterApp(){
  gid('login-screen').classList.add('hidden');
  gid('app-main').classList.remove('hidden');
  gid('session-info').textContent = `Xin chào, ${session.name}`;
  gid('role-badge').textContent = session.role === 'admin' ? 'Quản trị viên' : 'Nhân viên';
  const isAdmin = session.role === 'admin';
  gid('tab-admin').classList.toggle('hidden', !isAdmin);
  switchTab('quiz');
  autoStartMusic();
}

async function logout(){
  try{ const g = isNativeApp() ? nativeGoogle() : null; if(g) await g.signOut(); }catch(e){}
  try{ if(fbAuth) await fbAuth.signOut(); }catch(e){}
  if(!fbAuth) teardownSession();
  // onAuthStateChanged(null) sẽ dọn giao diện và hiện lại màn hình đăng nhập
}

/* ---------- Đồng bộ ngân hàng câu hỏi dùng chung ---------- */
function updateSyncNotes(){
  const msgShared = 'Đồng bộ trực tuyến: BẬT — câu hỏi bạn thêm, sửa, xoá sẽ áp dụng cho mọi nhân viên.';
  const msgLocal = 'Đồng bộ trực tuyến: TẮT — thay đổi chỉ lưu trên thiết bị này (mất kết nối hoặc chưa đăng nhập).';
  const txt = qSyncMode === 'shared' ? msgShared : msgLocal;
  const a = gid('qsync-note-add');
  const m = gid('qsync-note-manage');
  if(a) a.textContent = txt;
  if(m) m.textContent = txt;
}

function onSyncError(err){
  if(err && err.code === 'permission-denied'){
    showToast('Quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.');
    logout();
    return;
  }
  qSyncMode = 'local';
  updateSyncNotes();
}

function startSyncListeners(){
  dbNS = fbDb;
  qSyncMode = 'shared';
  updateSyncNotes();
  const listen = (name, assign) => {
    qUnsubs.push(fbDb.collection(name).onSnapshot(
      (snap) => { assign(snap); recomputeQuestions(); },
      onSyncError
    ));
  };
  listen('custom_questions', (snap) => { qSyncCustom = {}; snap.docs.forEach((d) => { qSyncCustom[d.id] = d.data(); }); });
  listen('question_edits', (snap) => { qSyncEdits = {}; snap.docs.forEach((d) => { qSyncEdits[d.id] = d.data(); }); });
  listen('question_deletes', (snap) => { qSyncDeletes = {}; snap.docs.forEach((d) => { qSyncDeletes[d.id] = true; }); });
}

/* ---------- Tab Tài khoản (quản trị viên) ---------- */
function renderAccounts(){
  if(!fbDb || !session || session.role !== 'admin') return;
  if(!accountsUnsub){
    accountsUnsub = fbDb.collection('allowed').onSnapshot(
      (snap) => { accountsList = snap.docs.map((d) => Object.assign({ email: d.id }, d.data())); drawAccounts(); },
      () => showToast('Không tải được danh sách tài khoản.')
    );
  }
  if(!accessUnsub){
    accessUnsub = fbDb.collection('config').doc('access').onSnapshot(
      (snap) => { accessOpenMode = !snap.exists || snap.data().open !== false; drawAccessMode(); },
      () => {}
    );
  }
  drawAccounts();
  drawAccessMode();
}

function drawAccessMode(){
  const sel = gid('acc-mode');
  if(sel) sel.value = accessOpenMode ? 'open' : 'closed';
  const hint = gid('acc-mode-hint');
  if(hint) hint.textContent = accessOpenMode
    ? 'Ai có tài khoản Google cũng đăng nhập và làm bài được. Người bị khoá trong danh sách bên dưới thì không vào được.'
    : 'Chỉ email có trong danh sách bên dưới (và chưa bị khoá) mới vào được.';
}

async function setAccessMode(value){
  const wantOpen = value !== 'closed';
  if(!wantOpen){
    const ok = await showConfirm('Chỉ những email trong danh sách mới vào được phần mềm. Người đang dùng mà không có trong danh sách sẽ bị đẩy ra khi tải lại trang. Tiếp tục?');
    if(!ok){ drawAccessMode(); return; }
  }
  try{
    await fbDb.collection('config').doc('access').set({ open: wantOpen, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    showToast(wantOpen ? 'Đã mở cho mọi tài khoản Google.' : 'Đã chuyển sang chế độ chỉ danh sách.');
  }catch(e){
    showToast('Không lưu được: ' + ((e && (e.code || e.message)) || 'lỗi không rõ'));
    drawAccessMode();
  }
}

function drawAccounts(){
  const list = accountsList.slice().sort((a, b) =>
    ((b.role === 'admin') - (a.role === 'admin')) ||
    String(a.name || a.email).localeCompare(String(b.name || b.email), 'vi'));
  gid('acc-count').textContent = `${list.length} tài khoản`;
  const me = session ? session.email : '';
  gid('acc-list').innerHTML = list.map((a) => {
    const self = a.email === me;
    const off = a.active === false;
    return `<div class="acc-row" data-email="${attr(a.email)}">
      <div class="acc-top">
        <input type="text" data-field="name" value="${attr(a.name || '')}" placeholder="Tên hiển thị (để trống = tên Google)" maxlength="60">
        <span class="acc-tag${off ? ' off' : ''}">${off ? 'Đã khoá' : (a.role === 'admin' ? 'Quản trị' : 'Nhân viên')}</span>
      </div>
      <div class="acc-email">${escapeHtml(a.email)}${self ? ' (bạn)' : ''}</div>
      <div class="acc-actions">
        <select data-field="role"${self ? ' disabled' : ''}>
          <option value="member"${a.role === 'admin' ? '' : ' selected'}>Nhân viên</option>
          <option value="admin"${a.role === 'admin' ? ' selected' : ''}>Quản trị viên</option>
        </select>
        <button class="secondary" type="button" data-act="toggle"${self ? ' disabled' : ''}>${off ? 'Mở khoá' : 'Khoá'}</button>
        <button class="secondary" type="button" data-act="delete"${self ? ' disabled' : ''}>Xoá</button>
      </div>
    </div>`;
  }).join('') || '<p class="lb-note">Chưa có tài khoản nào trong danh sách.</p>';
}

function accountUpdate(email, patch){
  return fbDb.collection('allowed').doc(email).update(patch)
    .then(() => showToast('Đã lưu.'))
    .catch((e) => showToast('Không lưu được: ' + ((e && (e.code || e.message)) || 'lỗi không rõ')));
}

async function addAccounts(){
  const raw = gid('acc-new').value;
  const found = (raw.match(/[^\s,;<>"']+@[^\s,;<>"']+\.[^\s,;<>"']+/g) || [])
    .map((s) => s.toLowerCase())
    .filter((s) => !s.includes('/'));
  const emails = Array.from(new Set(found));
  if(!emails.length){ showToast('Chưa thấy email hợp lệ nào.'); return; }
  const existing = new Set(accountsList.map((a) => a.email));
  const fresh = emails.filter((e) => !existing.has(e));
  if(!fresh.length){ showToast('Tất cả email này đã có trong danh sách.'); return; }
  const batch = fbDb.batch();
  fresh.forEach((e) => batch.set(fbDb.collection('allowed').doc(e), {
    role: 'member', active: true, name: '',
    addedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }));
  try{
    await batch.commit();
    gid('acc-new').value = '';
    const skipped = emails.length - fresh.length;
    showToast(`Đã thêm ${fresh.length} tài khoản` + (skipped ? `, bỏ qua ${skipped} email đã có.` : '.'));
  }catch(e){
    showToast('Không thêm được: ' + ((e && (e.code || e.message)) || 'lỗi không rõ'));
  }
}

function bindAccountEvents(){
  const wrap = gid('acc-list');
  wrap.addEventListener('change', (ev) => {
    const row = ev.target.closest('.acc-row');
    if(!row) return;
    const email = row.dataset.email;
    const field = ev.target.dataset.field;
    if(field === 'name') accountUpdate(email, { name: ev.target.value.trim().slice(0, 60) });
    if(field === 'role') accountUpdate(email, { role: ev.target.value === 'admin' ? 'admin' : 'member' });
  });
  wrap.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-act]');
    if(!btn) return;
    const email = btn.closest('.acc-row').dataset.email;
    const acc = accountsList.find((a) => a.email === email);
    if(!acc) return;
    if(btn.dataset.act === 'toggle') accountUpdate(email, { active: acc.active === false });
    if(btn.dataset.act === 'delete'){
      const ok = await showConfirm(`Xoá ${email} khỏi danh sách? Người này sẽ không đăng nhập được nữa.`);
      if(!ok) return;
      fbDb.collection('allowed').doc(email).delete()
        .then(() => showToast('Đã xoá.'))
        .catch((e) => showToast('Không xoá được: ' + ((e && (e.code || e.message)) || 'lỗi không rõ')));
    }
  });
}

/* ---------- Khởi động ---------- */
try{
  localStorage.removeItem('quiz-app-session-v1');        // phiên đăng nhập cũ (không cần mật khẩu) không còn dùng
  localStorage.removeItem('quiz-app-leaderboard-local'); // bảng xếp hạng cũ lưu riêng từng máy
}catch(e){}
loadQuestions();
setupAndroidBackButton();
setupLoginNotice();
bindAccountEvents();
window.addEventListener('online', flushPendingResults);
initFirebase();
