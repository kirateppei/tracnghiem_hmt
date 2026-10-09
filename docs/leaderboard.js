/* ---------- Bảng xếp hạng dùng chung (Firestore) ----------
   Mỗi lượt làm bài là một tài liệu trong collection `results`. Bảng xếp hạng lọc theo
   ngày / tuần / tháng / năm rồi gom theo từng người: số bài, điểm trung bình (%), điểm cao nhất (%). */

let lbRange = 'week';          // 'day' | 'week' | 'month' | 'year'
let lbAnchor = Date.now();     // một thời điểm nằm trong kỳ đang xem
let lbSort = 'avg';            // 'avg' | 'best' | 'n'
let lbRows = [];               // các lượt làm bài của kỳ đang xem
let lbUnsub = null;
let lbSeq = 0;
let lbLive = false;
const lbCache = {};
const LB_CACHE_MS = 5 * 60 * 1000;
const PENDING_KEY = 'quiz-app-pending-results-v1';
const SEND_TIMEOUT_MS = 8000;

/* ---------- Tính kỳ (giờ máy người xem, tuần bắt đầu từ thứ Hai) ---------- */
function periodRange(range, anchorMs){
  const a = new Date(anchorMs);
  let start, end;
  if(range === 'day'){
    start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    end = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1);
  } else if(range === 'week'){
    const back = (a.getDay() + 6) % 7;
    start = new Date(a.getFullYear(), a.getMonth(), a.getDate() - back);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  } else if(range === 'month'){
    start = new Date(a.getFullYear(), a.getMonth(), 1);
    end = new Date(a.getFullYear(), a.getMonth() + 1, 1);
  } else {
    start = new Date(a.getFullYear(), 0, 1);
    end = new Date(a.getFullYear() + 1, 0, 1);
  }
  return { start: start.getTime(), end: end.getTime() };
}

function shiftAnchor(range, anchorMs, delta){
  const a = new Date(anchorMs);
  if(range === 'day') return new Date(a.getFullYear(), a.getMonth(), a.getDate() + delta, 12).getTime();
  if(range === 'week') return new Date(a.getFullYear(), a.getMonth(), a.getDate() + 7 * delta, 12).getTime();
  if(range === 'month') return new Date(a.getFullYear(), a.getMonth() + delta, 15, 12).getTime();
  return new Date(a.getFullYear() + delta, 5, 15, 12).getTime();
}

function pad2(n){ return String(n).padStart(2, '0'); }
function fmtDate(ms){ const d = new Date(ms); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`; }
function fmtDayMonth(ms){ const d = new Date(ms); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`; }
function fmtDateTime(ms){ const d = new Date(ms); return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${fmtDate(ms)}`; }
function fmtPct(x){
  const r = Math.round(x * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',')) + '%';
}
function timeAgoVi(ts){
  if(!ts) return '';
  const mins = Math.floor(Math.max(0, Date.now() - ts) / 60000);
  if(mins < 1) return 'vừa xong';
  if(mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if(hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function periodLabel(range, start, end){
  const now = Date.now();
  const cur = (now >= start && now < end) ? ' · hiện tại' : '';
  const s = new Date(start);
  if(range === 'day') return `Ngày ${fmtDate(start)}${cur}`;
  if(range === 'week') return `Tuần ${fmtDayMonth(start)} – ${fmtDate(end - 1)}${cur}`;
  if(range === 'month') return `Tháng ${pad2(s.getMonth() + 1)}/${s.getFullYear()}${cur}`;
  return `Năm ${s.getFullYear()}${cur}`;
}

/* ---------- Gom theo từng người ---------- */
function aggregateResults(rows, sortKey){
  const by = new Map();
  rows.forEach((r) => {
    const key = r.uid || r.name || '?';
    let a = by.get(key);
    if(!a){
      a = { uid: key, name: r.name || 'Ẩn danh', n: 0, sumPct: 0, best: 0, last: 0, items: [] };
      by.set(key, a);
    }
    a.n++;
    a.sumPct += r.pct;
    a.best = Math.max(a.best, r.pct);
    if(r.ts >= a.last){ a.last = r.ts; a.name = r.name || a.name; }
    a.items.push(r);
  });
  const out = Array.from(by.values()).map((a) => Object.assign(a, { avg: a.sumPct / a.n }));
  const cmp = {
    avg: (x, y) => (y.avg - x.avg) || (y.best - x.best) || (y.n - x.n),
    best: (x, y) => (y.best - x.best) || (y.avg - x.avg) || (y.n - x.n),
    n: (x, y) => (y.n - x.n) || (y.avg - x.avg) || (y.best - x.best),
  }[sortKey] || null;
  out.sort((x, y) => (cmp ? cmp(x, y) : 0) || String(x.name).localeCompare(String(y.name), 'vi'));
  return out;
}

/* ---------- Giao diện ---------- */
function lbSyncControls(){
  document.querySelectorAll('#lb-range-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.range === lbRange));
  document.querySelectorAll('#lb-sort button').forEach((b) => b.classList.toggle('active', b.dataset.sort === lbSort));
  const { start, end } = periodRange(lbRange, lbAnchor);
  document.getElementById('lb-period-label').textContent = periodLabel(lbRange, start, end);
  document.getElementById('lb-next').disabled = end > Date.now();
}

function setLbRange(r){
  if(r === lbRange) lbInvalidate(); // bấm lại đúng nút đang chọn = làm mới
  lbRange = r;
  lbAnchor = Date.now();
  renderLeaderboard();
}
function setLbSort(k){ lbSort = k; lbSyncControls(); drawLeaderboard(); }
function lbShift(delta){
  const next = shiftAnchor(lbRange, lbAnchor, delta);
  if(delta > 0 && periodRange(lbRange, next).start > Date.now()) return;
  lbAnchor = next;
  renderLeaderboard();
}

function renderLeaderboard(){
  lbSyncControls();
  lbLoad();
}

function stopLb(){
  if(lbUnsub){ try{ lbUnsub(); }catch(e){} lbUnsub = null; }
  lbLive = false;
  lbSeq++;
}
function lbInvalidate(){ Object.keys(lbCache).forEach((k) => { delete lbCache[k]; }); }

function docToRow(d){
  const v = d.data({ serverTimestamps: 'estimate' });
  return {
    id: d.id, uid: v.uid, name: v.name, score: v.score, total: v.total, pct: v.pct, level: v.level,
    ts: v.ts && typeof v.ts.toMillis === 'function' ? v.ts.toMillis() : (v.ts || 0),
  };
}

function lbError(err){
  const note = document.getElementById('lb-note');
  if(err && err.code === 'permission-denied'){ note.textContent = 'Không có quyền xem bảng xếp hạng. Hãy đăng nhập lại.'; return; }
  note.textContent = 'Không tải được bảng xếp hạng: ' + ((err && (err.code || err.message)) || 'lỗi không rõ');
}

function lbLoad(){
  stopLb();
  const note = document.getElementById('lb-note');
  if(!fbDb || !session){ note.textContent = 'Hãy đăng nhập để xem bảng xếp hạng.'; return; }
  const { start, end } = periodRange(lbRange, lbAnchor);
  const seq = ++lbSeq;
  const Timestamp = firebase.firestore.Timestamp;
  const query = fbDb.collection('results')
    .where('ts', '>=', Timestamp.fromMillis(start))
    .where('ts', '<', Timestamp.fromMillis(end))
    .orderBy('ts', 'desc');
  const now = Date.now();
  lbLive = now >= start && now < end && lbRange !== 'year';
  note.textContent = 'Đang tải bảng xếp hạng...';
  if(lbLive){
    lbUnsub = query.onSnapshot(
      (snap) => { if(seq !== lbSeq) return; lbRows = snap.docs.map(docToRow); drawLeaderboard(); },
      (err) => { if(seq === lbSeq) lbError(err); }
    );
    return;
  }
  const key = lbRange + ':' + start;
  const hit = lbCache[key];
  if(hit && Date.now() - hit.t < LB_CACHE_MS){ lbRows = hit.rows; drawLeaderboard(); return; }
  query.get().then((snap) => {
    if(seq !== lbSeq) return;
    lbRows = snap.docs.map(docToRow);
    lbCache[key] = { t: Date.now(), rows: lbRows };
    drawLeaderboard();
  }).catch((err) => { if(seq === lbSeq) lbError(err); });
}

function drawLeaderboard(){
  const note = document.getElementById('lb-note');
  const wrap = document.getElementById('lb-list');
  const emptyEl = document.getElementById('lb-empty');
  const list = aggregateResults(lbRows, lbSort);
  const { start, end } = periodRange(lbRange, lbAnchor);
  const isCurrent = Date.now() >= start && Date.now() < end;
  note.textContent = `${lbRows.length} lượt làm bài · ${list.length} người` +
    (lbLive ? ' · cập nhật trực tiếp' : (isCurrent ? ' · bấm lại nút kỳ để làm mới' : ''));
  wrap.innerHTML = '';
  if(list.length === 0){ emptyEl.style.display = 'block'; return; }
  emptyEl.style.display = 'none';
  const me = session && session.uid;
  list.forEach((a, idx) => {
    const isMe = a.uid === me;
    const canOpen = !!session && (session.role === 'admin' || isMe);
    const row = document.createElement('div');
    row.className = 'lb-row' + (idx === 0 ? ' top1' : idx === 1 ? ' top2' : idx === 2 ? ' top3' : '') +
      (isMe ? ' me' : '') + (canOpen ? ' clickable' : '');
    row.dataset.uid = a.uid;
    row.innerHTML = `
      <div class="lb-rank">${idx + 1}</div>
      <div class="lb-info">
        <div class="lb-name">${escapeHtml(a.name)}${isMe ? ' (bạn)' : ''}</div>
        <div class="lb-meta">${a.n} bài · gần nhất ${timeAgoVi(a.last)}</div>
      </div>
      <div class="lb-stats">
        <div class="lb-stat"><b>${fmtPct(a.avg)}</b><span>Trung bình</span></div>
        <div class="lb-stat"><b>${fmtPct(a.best)}</b><span>Cao nhất</span></div>
      </div>`;
    wrap.appendChild(row);
  });
}

/* ---------- Chi tiết từng lượt làm bài (quản trị viên xem mọi người, nhân viên xem của mình) ---------- */
function openLbDetail(uid){
  const items = lbRows.filter((r) => r.uid === uid).sort((a, b) => b.ts - a.ts);
  if(!items.length) return;
  const isAdmin = !!session && session.role === 'admin';
  document.getElementById('lb-detail-title').textContent = items[0].name || 'Chi tiết';
  document.getElementById('lb-detail-body').innerHTML = items.map((r) => `
    <div class="detail-row">
      <div><b>${r.score}/${r.total} câu · ${fmtPct(r.pct)}</b><small>${fmtDateTime(r.ts)} · ${escapeHtml(r.level || '')}</small></div>
      ${isAdmin ? `<button type="button" data-del="${escapeAttr(escapeHtml(r.id))}" title="Xoá lượt này">🗑</button>` : ''}
    </div>`).join('');
  document.getElementById('lb-detail-backdrop').classList.add('show');
}
function closeLbDetail(){ document.getElementById('lb-detail-backdrop').classList.remove('show'); }

async function deleteResult(id){
  const ok = await showConfirm('Xoá lượt làm bài này khỏi bảng xếp hạng?');
  if(!ok) return;
  try{
    await fbDb.collection('results').doc(id).delete();
    lbInvalidate();
    closeLbDetail();
    lbLoad();
    showToast('Đã xoá lượt làm bài.');
  }catch(e){
    showToast('Không xoá được: ' + ((e && (e.code || e.message)) || 'lỗi không rõ'));
  }
}

document.getElementById('lb-list').addEventListener('click', (ev) => {
  const row = ev.target.closest('.lb-row.clickable');
  if(row) openLbDetail(row.dataset.uid);
});
document.getElementById('lb-detail-body').addEventListener('click', (ev) => {
  const btn = ev.target.closest('button[data-del]');
  if(btn) deleteResult(btn.dataset.del);
});
document.getElementById('lb-detail-backdrop').addEventListener('click', (ev) => {
  if(ev.target.id === 'lb-detail-backdrop') closeLbDetail();
});

/* ---------- Ghi kết quả lên máy chủ ---------- */
function withTimeout(promise, ms){
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject({ code: 'app/timeout' }), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
function loadPending(){
  try{
    const list = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    return Array.isArray(list) ? list.filter((r) => r && r.id && r.uid) : [];
  }catch(e){ return []; }
}
function savePending(list){
  try{ localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-50))); }catch(e){}
}
function sendResult(rec){
  const data = {
    uid: rec.uid, name: rec.name, score: rec.score, total: rec.total, pct: rec.pct, level: rec.level,
    ts: firebase.firestore.FieldValue.serverTimestamp(), // giờ do máy chủ ghi, không sửa được từ máy người dùng
  };
  // Dùng id cố định để gửi lại không tạo bản trùng
  return withTimeout(fbDb.collection('results').doc(rec.id).set(data), SEND_TIMEOUT_MS);
}

async function submitLeaderboardEntry(entry){
  if(!session || !fbDb) return;
  const rec = {
    id: `${session.uid}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    uid: session.uid,
    name: session.name,
    score: entry.score,
    total: entry.total,
    pct: entry.pct,
    level: String(entry.category || '').slice(0, 60),
  };
  try{
    await sendResult(rec);
    lbInvalidate();
    showToast('Đã ghi kết quả vào bảng xếp hạng.');
  }catch(e){
    if(e && e.code === 'permission-denied'){
      showToast('Không ghi được điểm: tài khoản không còn quyền.');
      return;
    }
    const p = loadPending(); p.push(rec); savePending(p);
    showToast('Chưa gửi được điểm (mạng yếu?). Điểm sẽ tự gửi lại khi có mạng.');
  }
}

let flushingPending = false;
async function flushPendingResults(){
  if(flushingPending || !session || !fbDb) return;
  flushingPending = true;
  try{
    let list = loadPending();
    for(const rec of list.filter((r) => r.uid === session.uid)){
      try{
        await sendResult(rec);
      }catch(e){
        // Lỗi mạng hoặc quá thời gian: để lần sau. permission-denied: bản gốc đã được ghi hoặc hết quyền → bỏ.
        if(!(e && e.code === 'permission-denied')) break;
      }
      list = list.filter((r) => r.id !== rec.id);
      savePending(list);
    }
    lbInvalidate();
  } finally {
    flushingPending = false;
  }
}
