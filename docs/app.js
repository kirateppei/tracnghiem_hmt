
const CATEGORIES = ["Kiến thức cơ bản","Tấm pin quang điện","Biến tần","Pin lưu trữ","Lắp đặt","An toàn điện","Vận hành & bảo trì","Đấu nối lưới điện","Tính toán hệ thống","Dụng cụ đo lường","Giám sát vận hành","Khác"];


let questions = [];
let quizOrder = [];
let currentIndex = 0;
let score = 0;
let answers = [];
let editingId = null;
let session = null; // {role:'member'|'admin', name, uid, email} — auth.js gán sau khi đăng nhập Google
let manageFilteredCache = [];
let manageRenderLimit = 30;

/* ---------- Questions storage (mô hình DELTA) ----------
   Bộ câu hỏi mặc định (DEFAULT_QUESTIONS) đã nằm sẵn trong chính file này rồi, nên KHÔNG lưu
   lại toàn bộ vào localStorage (rất nặng, dễ vượt giới hạn bộ nhớ trình duyệt ~5-10MB).
   Thay vào đó chỉ lưu phần THAY ĐỔI (câu tự thêm / đã sửa / đã xoá) — thường chỉ vài KB. */
const DELTA_KEY = 'quiz-app-questions-delta-v1';
const STORAGE_KEY_LEGACY = ['quiz-app-questions-v3','quiz-app-questions-v2','quiz-app-questions-v1'];

function applyDelta(base, custom, edits, deletes){
  let result = base.slice();
  (custom||[]).forEach(q=>{ if(!result.find(x=>x.id===q.id)) result.push(q); });
  const ed = edits||{};
  result = result.map(q => ed[q.id] ? Object.assign({}, q, ed[q.id]) : q);
  const delSet = new Set(deletes||[]);
  result = result.filter(q => !delSet.has(q.id));
  return result;
}

function loadLocalDelta(){
  try{
    const raw = localStorage.getItem(DELTA_KEY);
    if(!raw) return { custom:[], edits:{}, deletes:[] };
    const d = JSON.parse(raw);
    return { custom: d.custom||[], edits: d.edits||{}, deletes: d.deletes||[] };
  }catch(e){ return { custom:[], edits:{}, deletes:[] }; }
}
function saveLocalDelta(delta){
  try{ localStorage.setItem(DELTA_KEY, JSON.stringify(delta)); return true; }
  catch(e){ return false; }
}

function loadQuestions(){
  try{
    STORAGE_KEY_LEGACY.forEach(k => { try{ localStorage.removeItem(k); }catch(e){} });
    const delta = loadLocalDelta();
    questions = applyDelta(DEFAULT_QUESTIONS, delta.custom, delta.edits, delta.deletes);
  }catch(e){ questions = DEFAULT_QUESTIONS.slice(); }
}

function saveQuestions(){
  const delta = computeLocalDelta(); // so sánh `questions` hiện tại với DEFAULT_QUESTIONS, chỉ lấy phần khác biệt
  const ok = saveLocalDelta(delta);
  if(!ok){ showToast('Không thể lưu thay đổi trên thiết bị này (bộ nhớ đầy). Thử xuất ra file để sao lưu.'); }
}

function uid(){ return 'q' + Date.now() + Math.random().toString(36).slice(2,7); }

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.classList.remove('show'), 2200);
}

/* ---------- Hộp thoại xác nhận riêng của app (thay cho confirm() mặc định của trình duyệt,
   vì confirm() không hiển thị ổn định trong WebView của app Android đóng gói) ---------- */
let _confirmResolve = null;
function showConfirm(message){
  return new Promise((resolve)=>{
    document.getElementById('confirm-modal-text').textContent = message;
    document.getElementById('confirm-modal-backdrop').classList.add('show');
    _confirmResolve = resolve;
  });
}
function resolveConfirm(result){
  document.getElementById('confirm-modal-backdrop').classList.remove('show');
  if(_confirmResolve){ _confirmResolve(result); _confirmResolve = null; }
}

/* ---------- Category dropdowns ---------- */
function populateCategorySelects(){
  const cats = getAllCategoriesInUse();
  const fcat = document.getElementById('f-category');
  fcat.innerHTML = CATEGORIES.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');

  const ecat = document.getElementById('e-category');
  ecat.innerHTML = CATEGORIES.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');

  const mfilter = document.getElementById('manage-cat-filter');
  mfilter.innerHTML = '<option value="__ALL__">Tất cả chủ đề</option>' +
    cats.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
}
function getAllCategoriesInUse(){
  const set = new Set(questions.map(q => q.category || 'Khác'));
  const ordered = CATEGORIES.filter(c => set.has(c));
  set.forEach(c => { if(!ordered.includes(c)) ordered.push(c); });
  return ordered;
}
function countByCat(c){ return questions.filter(q => (q.category||'Khác') === c).length; }

/* ---------- Tabs ---------- */
const ADMIN_VIEWS = ['add', 'manage', 'accounts'];
let lastAdminView = 'manage';
function switchTab(name){
  if((name === 'add' || name === 'manage' || name === 'accounts') && (!session || session.role !== 'admin')) return;
  stopTimer();
  if(name !== 'games' && window.leaveGames) window.leaveGames();
  const isAdminView = ADMIN_VIEWS.indexOf(name) >= 0;
  if(isAdminView) lastAdminView = name;
  const navName = isAdminView ? 'admin' : name;
  document.querySelectorAll('nav.tabs button').forEach(b=>{
    b.classList.toggle('active', b.dataset.tab === navName);
  });
  document.querySelectorAll('.subtabs button').forEach(b=>{
    b.classList.toggle('active', b.dataset.sub === name);
  });
  const tabBtnNow = document.querySelector('nav.tabs button.active');
  if(tabBtnNow && tabBtnNow.scrollIntoView) tabBtnNow.scrollIntoView({ block: 'nearest', inline: 'center' });
  document.querySelectorAll('section.view').forEach(v=>{
    v.classList.toggle('active', v.id === 'view-' + name);
  });
  if(name === 'manage'){ manageRenderLimit = 30; renderManage(); }
  if(name === 'quiz') backToSetup();
  if(name === 'leaderboard') renderLeaderboard();
  if(name === 'accounts'){ renderAccounts(); renderReports(); }
  if(name === 'games' && window.renderGames) window.renderGames();
}
document.querySelectorAll('nav.tabs button').forEach(b=>{
  b.addEventListener('click', ()=> switchTab(b.dataset.tab === 'admin' ? lastAdminView : b.dataset.tab));
});

/* ---------- Quiz flow ---------- */
function backToSetup(){
  stopTimer();
  const chip = document.getElementById('chip-total'); if(chip) chip.textContent = questions.length;
  document.getElementById('quiz-result').style.display='none';
  document.getElementById('quiz-play').style.display='none';
  document.getElementById('quiz-empty').style.display='none';
  if(questions.length === 0){
    document.getElementById('quiz-empty').style.display='block';
    document.getElementById('quiz-setup').style.display='none';
    return;
  }
  populateCategorySelects();
  document.getElementById('quiz-setup').style.display='block';
  updateSetupHint();
  updateWrongButton();
  updateTip();
  renderStatsPanel();
  stopExamTimer(); quizExam = false;
}
document.getElementById('setup-difficulty').addEventListener('change', updateSetupHint);
function updateSetupHint(){
  const diff = document.getElementById('setup-difficulty').value;
  let pool = questions;
  if(diff !== '__ALL__') pool = pool.filter(q => (q.difficulty||'tb') === diff);
  const want = parseInt(document.getElementById('setup-count').value, 10) || 20;
  document.getElementById('setup-total-hint').textContent = pool.length === 0
    ? 'Không có câu hỏi nào phù hợp với lựa chọn này.'
    : (pool.length < want ? `Có ${pool.length} câu phù hợp — sẽ làm hết ${pool.length} câu.` : `Có ${pool.length} câu phù hợp · mỗi lượt ${want} câu.`);
}

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// Chọn câu hỏi theo kiểu round-robin giữa các "nhóm" (group = cùng một chủ đề/dạng câu
// hỏi gốc, chỉ khác cách diễn đạt hoặc số liệu). Nhờ vậy một lượt làm bài sẽ ưu tiên
// lấy đủ các chủ đề khác nhau trước khi lặp lại một nhóm, tránh cảm giác trùng lặp.
function pickQuestions(pool, count){
  const byGroup = {};
  pool.forEach(q=>{
    const g = q.group || q.id;
    (byGroup[g] = byGroup[g] || []).push(q);
  });
  Object.keys(byGroup).forEach(g => { byGroup[g] = shuffle(byGroup[g]); });
  const groupKeys = shuffle(Object.keys(byGroup));
  const result = [];
  let round = 0;
  while(result.length < count){
    let addedAny = false;
    for(const g of groupKeys){
      if(result.length >= count) break;
      const arr = byGroup[g];
      if(arr.length > round){ result.push(arr[round]); addedAny = true; }
    }
    if(!addedAny) break;
    round++;
  }
  return shuffle(result);
}

// Tỉ lệ độ khó áp dụng khi người dùng chọn "Tất cả mức độ" cho lượt làm bài thông thường.
const DIFF_DISTRIBUTION = [['de',0.35], ['tb',0.30], ['kho',0.20], ['cuckho',0.10], ['xuatsac',0.05]];

// Chia đúng `total` câu theo tỉ lệ ở trên, dùng phương pháp "số dư lớn nhất" (largest remainder)
// để tổng các phần luôn khớp chính xác bằng `total`, không bị lệch do làm tròn.
function computeTierCounts(total){
  const raw = DIFF_DISTRIBUTION.map(([key,pct]) => {
    const exact = total*pct;
    const base = Math.floor(exact);
    return { key, base, frac: exact - base };
  });
  let assigned = raw.reduce((s,r)=>s+r.base, 0);
  let remainder = total - assigned;
  raw.sort((a,b)=> b.frac - a.frac);
  for(let i=0; i<remainder; i++){ raw[i % raw.length].base += 1; }
  const result = {};
  raw.forEach(r => { result[r.key] = r.base; });
  return result;
}

function pickWeightedByDifficulty(basePool, count){
  const tierCounts = computeTierCounts(count);
  let combined = [];
  let carry = 0; // số câu còn thiếu dồn từ mức trước sang mức sau (khi 1 mức không đủ câu)
  Object.keys(tierCounts).forEach(tier=>{
    const want = tierCounts[tier] + carry;
    const tierPool = basePool.filter(q => (q.difficulty||'tb') === tier);
    const got = pickQuestions(tierPool, Math.min(want, tierPool.length));
    combined = combined.concat(got);
    carry = want - got.length;
  });
  // Nếu vẫn thiếu do một vài mức độ không đủ ngân hàng câu hỏi, bổ sung nốt từ toàn bộ pool còn lại
  if(combined.length < Math.min(count, basePool.length)){
    const usedIds = new Set(combined.map(q=>q.id));
    const remainingPool = basePool.filter(q=>!usedIds.has(q.id));
    const extra = pickQuestions(remainingPool, Math.min(count-combined.length, remainingPool.length));
    combined = combined.concat(extra);
  }
  return shuffle(combined).slice(0, Math.min(count, basePool.length));
}

/* ---------- Tiến độ cá nhân: thống kê theo chủ đề, chuỗi ngày học, huy hiệu (lưu trên máy) ---------- */
function statsKey(){ return 'hmt-stats-' + ((session && session.uid) || 'guest'); }
function dayStr(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function loadStats(){
  try{ const s = JSON.parse(localStorage.getItem(statsKey()) || 'null'); if(s && s.cats && Array.isArray(s.days)) return s; }catch(e){}
  return { cats: {}, days: [], n: 0, c: 0 };
}
function recordStat(q, ok){
  const s = loadStats(), cat = (q && q.category) || 'Khác';
  const e = s.cats[cat] || (s.cats[cat] = { n: 0, c: 0 });
  e.n++; s.n++; if(ok){ e.c++; s.c++; }
  const d = dayStr(new Date());
  if(!s.days.includes(d)){ s.days.push(d); s.days = s.days.slice(-120); }
  try{ localStorage.setItem(statsKey(), JSON.stringify(s)); }catch(e2){}
}
function streakDays(days){
  const set = new Set(days), d = new Date();
  if(!set.has(dayStr(d))) d.setDate(d.getDate() - 1);   // chưa học hôm nay thì tính tới hôm qua
  let n = 0;
  while(set.has(dayStr(d))){ n++; d.setDate(d.getDate() - 1); }
  return n;
}
const BADGES = [
  { icon: '🌱', name: 'Khởi đầu', desc: 'Trả lời câu hỏi đầu tiên', ok: (s) => s.n >= 1 },
  { icon: '🔥', name: 'Chuỗi 3 ngày', desc: 'Học 3 ngày liên tiếp', ok: (s, k) => k >= 3 },
  { icon: '🔥', name: 'Chuỗi 7 ngày', desc: 'Học 7 ngày liên tiếp', ok: (s, k) => k >= 7 },
  { icon: '🌋', name: 'Chuỗi 30 ngày', desc: 'Học 30 ngày liên tiếp', ok: (s, k) => k >= 30 },
  { icon: '💯', name: '100 câu', desc: 'Đã trả lời 100 câu', ok: (s) => s.n >= 100 },
  { icon: '📚', name: '500 câu', desc: 'Đã trả lời 500 câu', ok: (s) => s.n >= 500 },
  { icon: '🏅', name: '1000 câu', desc: 'Đã trả lời 1000 câu', ok: (s) => s.n >= 1000 },
  { icon: '🎯', name: 'Chính xác', desc: 'Đúng từ 90% khi đã làm 50 câu trở lên', ok: (s) => s.n >= 50 && s.c / s.n >= 0.9 },
];
function weakCategories(s){
  return Object.keys(s.cats).map((c) => ({ c, n: s.cats[c].n, pct: s.cats[c].c / s.cats[c].n * 100 }))
    .filter((x) => x.n >= 5).sort((a, b) => a.pct - b.pct);
}
function renderStatsPanel(){
  const box = document.getElementById('stats-body');
  if(!box) return;
  const s = loadStats(), k = streakDays(s.days);
  if(s.n === 0){ box.innerHTML = '<p class="form-hint">Làm vài câu để bắt đầu theo dõi tiến độ của bạn.</p>'; return; }
  const pct = Math.round(s.c / s.n * 100);
  const cats = Object.keys(s.cats).map((c) => ({ c, n: s.cats[c].n, pct: Math.round(s.cats[c].c / s.cats[c].n * 100) })).sort((a, b) => b.n - a.n).slice(0, 10);
  const weak = weakCategories(s);
  box.innerHTML = `
    <div class="st-top">
      <div class="st-box"><b>${k}</b><span>🔥 ngày liên tiếp</span></div>
      <div class="st-box"><b>${s.n}</b><span>câu đã làm</span></div>
      <div class="st-box"><b>${pct}%</b><span>trả lời đúng</span></div>
    </div>
    <div class="st-title">Theo chủ đề</div>
    ${cats.map((x) => `<div class="st-row"><span class="st-name">${escapeHtml(x.c)}</span><span class="st-bar"><i style="width:${x.pct}%"></i></span><span class="st-pct">${x.pct}%</span></div>`).join('')}
    ${weak.length ? `<button class="secondary st-weak" onclick="startCategoryPractice(decodeURIComponent('${encodeURIComponent(weak[0].c)}'))">🎯 Luyện chủ đề yếu nhất: ${escapeHtml(weak[0].c)} (${Math.round(weak[0].pct)}%)</button>` : ''}
    <div class="st-title">Huy hiệu</div>
    <div class="st-badges">${BADGES.map((b) => `<span class="st-badge ${b.ok(s, k) ? 'on' : ''}" title="${escapeHtml(b.desc)}"><i>${b.icon}</i>${escapeHtml(b.name)}</span>`).join('')}</div>`;
}
function startCategoryPractice(cat){
  const pool = questions.filter((q) => (q.category || 'Khác') === cat);
  if(pool.length === 0){ showToast('Không có câu hỏi cho chủ đề này.'); return; }
  const count = parseInt(document.getElementById('setup-count').value, 10) || 20;
  quizAnon = true; quizReview = true; quizExam = false;
  quizOrder = pickQuestions(pool, Math.min(count, pool.length));
  currentIndex = 0; score = 0; answers = [];
  document.getElementById('quiz-setup').style.display = 'none';
  document.getElementById('quiz-empty').style.display = 'none';
  document.getElementById('quiz-result').style.display = 'none';
  document.getElementById('quiz-play').style.display = 'block';
  renderQuestion();
}

/* ---------- Lưu bài đang làm dở để tiếp tục khi mở lại ---------- */
const RESUME_MAX_AGE = 12 * 3600 * 1000;
function resumeKey(){ return 'hmt-resume-' + ((session && session.uid) || 'guest'); }
function saveProgress(){
  if(!quizOrder || !quizOrder.length) return;
  try{ localStorage.setItem(resumeKey(), JSON.stringify({ ids: quizOrder.map((q) => q.id), answers, score, review: quizReview, exam: quizExam, examLevel, deadline: examDeadline, anon: quizAnon, ts: Date.now() })); }catch(e){}
}
function clearProgress(){ try{ localStorage.removeItem(resumeKey()); }catch(e){} }
function loadProgress(){
  try{
    const p = JSON.parse(localStorage.getItem(resumeKey()) || 'null');
    if(p && Array.isArray(p.ids) && Array.isArray(p.answers) && p.answers.length >= 1 && p.answers.length < p.ids.length && Date.now() - p.ts < RESUME_MAX_AGE) return p;
  }catch(e){}
  return null;
}
function updateResumeBanner(){
  const row = document.getElementById('resume-row'); if(!row) return;
  const p = loadProgress();
  row.style.display = p ? 'block' : 'none';
  if(p) document.getElementById('resume-btn').textContent = `▶ Tiếp tục bài đang làm (${p.answers.length}/${p.ids.length} câu${p.exam ? ' · thi thử' : ''})`;
}
function resumeQuiz(){
  const p = loadProgress(); if(!p) return;
  const byId = new Map(questions.map((q) => [String(q.id), q]));
  const order = p.ids.map((id) => byId.get(String(id))).filter(Boolean);
  if(order.length !== p.ids.length){ showToast('Một số câu hỏi đã bị xoá nên không tiếp tục được bài cũ.'); clearProgress(); updateResumeBanner(); return; }
  quizOrder = order; answers = p.answers; score = p.score || 0;
  quizReview = !!p.review; quizExam = !!p.exam; examLevel = EXAM_LEVELS[p.examLevel] ? p.examLevel : 'de'; quizAnon = !!p.anon; currentIndex = answers.length;
  document.getElementById('quiz-setup').style.display = 'none';
  document.getElementById('quiz-empty').style.display = 'none';
  document.getElementById('quiz-result').style.display = 'none';
  document.getElementById('quiz-play').style.display = 'block';
  if(quizExam){
    examDeadline = p.deadline;
    if(Date.now() >= examDeadline){ showResult(); return; }
    stopExamTimer(); examInterval = setInterval(examTick, 1000);
  }
  renderQuestion(); if(quizExam) examTick();
}

/* ---------- Câu hỏi đánh dấu ⭐ ---------- */
function starKey(){ return 'hmt-star-' + ((session && session.uid) || 'guest'); }
function loadStars(){ try{ const a = JSON.parse(localStorage.getItem(starKey()) || '[]'); return Array.isArray(a) ? a : []; }catch(e){ return []; } }
function toggleStar(){
  const q = quizOrder[currentIndex]; if(!q) return;
  let ids = loadStars();
  if(ids.includes(q.id)) ids = ids.filter((x) => x !== q.id); else ids.push(q.id);
  try{ localStorage.setItem(starKey(), JSON.stringify(ids.slice(-300))); }catch(e){}
  updateStarBtn(q);
}
function updateStarBtn(q){
  const b = document.getElementById('q-star'); if(!b || !q) return;
  const on = loadStars().includes(q.id);
  b.textContent = on ? '★' : '☆'; b.classList.toggle('on', on);
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
}
function starPool(){ const set = new Set(loadStars()); return questions.filter((q) => set.has(q.id)); }
function startStarReview(){
  const pool = starPool();
  if(pool.length === 0){ showToast('Bạn chưa đánh dấu câu nào.'); updateWrongButton(); return; }
  const count = parseInt(document.getElementById('setup-count').value, 10) || 20;
  quizAnon = true; quizReview = true; quizExam = false;
  quizOrder = pickQuestions(pool, Math.min(count, pool.length));
  currentIndex = 0; score = 0; answers = [];
  document.getElementById('quiz-setup').style.display = 'none';
  document.getElementById('quiz-empty').style.display = 'none';
  document.getElementById('quiz-result').style.display = 'none';
  document.getElementById('quiz-play').style.display = 'block';
  renderQuestion();
}

/* ---------- Ôn lại câu đã làm sai (lưu trên máy, theo từng tài khoản) ---------- */
let quizReview = false;
let quizExam = false;
const EXAM_COUNT = 40, EXAM_MINUTES = 45, EXAM_PASS = 80;
// Hai bài thi thử: chỉ lấy câu đúng mức độ, không dùng câu Cực khó / Xuất sắc
const EXAM_LEVELS = { de: 'Dễ', kho: 'Khó' };
let examLevel = 'de';
let examInterval = null, examDeadline = 0;
function stopExamTimer(){ if(examInterval){ clearInterval(examInterval); examInterval = null; } }
function examTick(){
  const left = Math.max(0, Math.ceil((examDeadline - Date.now()) / 1000));
  const label = document.getElementById('q-timer'), bar = document.getElementById('timer-bar-fill');
  if(label){ label.textContent = '⏱ ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); label.classList.toggle('timer-warn', left <= 300); }
  if(bar){ bar.style.width = (left / (EXAM_MINUTES * 60) * 100) + '%'; bar.classList.toggle('warn', left <= 300); }
  if(left <= 0){ stopExamTimer(); showToast('Hết giờ thi thử!'); showResult(); }
}
function startExam(level){
  level = EXAM_LEVELS[level] ? level : 'de';
  const pool = questions.filter((q) => (q.difficulty || 'tb') === level);
  if(pool.length < 10){ showToast(`Chưa đủ câu hỏi mức ${EXAM_LEVELS[level]} để thi thử.`); return; }
  quizAnon = !!document.getElementById('setup-anon').checked;
  quizReview = false; quizExam = true; examLevel = level;
  quizOrder = pickQuestions(pool, Math.min(EXAM_COUNT, pool.length));
  currentIndex = 0; score = 0; answers = [];
  document.getElementById('quiz-setup').style.display = 'none';
  document.getElementById('quiz-empty').style.display = 'none';
  document.getElementById('quiz-result').style.display = 'none';
  document.getElementById('quiz-play').style.display = 'block';
  examDeadline = Date.now() + EXAM_MINUTES * 60 * 1000;
  stopExamTimer(); examInterval = setInterval(examTick, 1000);
  renderQuestion(); examTick();
}
const WRONG_MAX = 300;
function wrongKey(){ return 'hmt-wrong-' + ((session && session.uid) || 'guest'); }
function loadWrongIds(){
  try{ const a = JSON.parse(localStorage.getItem(wrongKey()) || '[]'); return Array.isArray(a) ? a.filter((x) => typeof x === 'string' || typeof x === 'number') : []; }
  catch(e){ return []; }
}
function saveWrongIds(ids){ try{ localStorage.setItem(wrongKey(), JSON.stringify(ids.slice(-WRONG_MAX))); }catch(e){} }
function recordWrongAnswer(id, isCorrect){
  if(id === undefined || id === null) return;
  let ids = loadWrongIds();
  const has = ids.includes(id);
  if(isCorrect && has){ ids = ids.filter((x) => x !== id); saveWrongIds(ids); }
  else if(!isCorrect && !has){ ids.push(id); saveWrongIds(ids); }
}
function wrongPool(){
  const set = new Set(loadWrongIds());
  return questions.filter((q) => set.has(q.id));
}
function updateWrongButton(){
  const btn = document.getElementById('btn-review-wrong');
  if(!btn) return;
  const n = wrongPool().length;
  btn.style.display = n > 0 ? 'block' : 'none';
  btn.textContent = `🔁 Ôn lại câu đã sai (${n})`;
  const sb = document.getElementById('btn-star-review');
  if(sb){ const m = starPool().length; sb.style.display = m > 0 ? 'block' : 'none'; sb.textContent = `⭐ Ôn câu đã đánh dấu (${m})`; }
  updateResumeBanner();
}
function startWrongReview(){
  const pool = wrongPool();
  if(pool.length === 0){ showToast('Bạn chưa có câu sai nào cần ôn.'); updateWrongButton(); return; }
  const count = parseInt(document.getElementById('setup-count').value, 10) || 20;
  quizAnon = true; quizReview = true; quizExam = false;
  quizOrder = pickQuestions(pool, Math.min(count, pool.length));
  currentIndex = 0; score = 0; answers = [];
  document.getElementById('quiz-setup').style.display='none';
  document.getElementById('quiz-empty').style.display='none';
  document.getElementById('quiz-result').style.display='none';
  document.getElementById('quiz-play').style.display='block';
  renderQuestion();
}

function startQuiz(){
  if(questions.length === 0){ backToSetup(); return; }
  const diff = document.getElementById('setup-difficulty').value;
  const count = parseInt(document.getElementById('setup-count').value, 10);
  quizAnon = !!document.getElementById('setup-anon').checked;
  quizReview = false; quizExam = false;
  let basePool = questions;
  if(basePool.length === 0){ showToast('Không có câu hỏi phù hợp với lựa chọn này.'); return; }

  let selected;
  if(diff === '__ALL__'){
    selected = pickWeightedByDifficulty(basePool, count);
  } else {
    const pool = basePool.filter(q => (q.difficulty||'tb') === diff);
    if(pool.length === 0){ showToast('Không có câu hỏi phù hợp với lựa chọn này.'); return; }
    selected = pickQuestions(pool, Math.min(count, pool.length));
  }
  if(selected.length === 0){ showToast('Không có câu hỏi phù hợp với lựa chọn này.'); return; }

  quizOrder = selected;
  currentIndex = 0; score = 0; answers = [];
  document.getElementById('quiz-setup').style.display='none';
  document.getElementById('quiz-empty').style.display='none';
  document.getElementById('quiz-result').style.display='none';
  document.getElementById('quiz-play').style.display='block';
  renderQuestion();
}

const QUESTION_TIME = 30; // giây mỗi câu (mặc định)
const IMAGE_BONUS_TIME = 5; // giây cộng thêm nếu câu hỏi có ảnh
const HARD_QUESTION_TIME = 60; // giây cho câu "Cực khó" và "Xuất sắc" (cần thời gian tính toán nhiều hơn)
function baseDurationFor(q){
  return (q.difficulty === 'cuckho' || q.difficulty === 'xuatsac') ? HARD_QUESTION_TIME : QUESTION_TIME;
}
let timerInterval = null;
let timeLeft = QUESTION_TIME;
let timerDuration = QUESTION_TIME;

function startTimer(duration){
  stopTimer();
  if(quizExam){ examTick(); return; }   // thi thử: chỉ có đồng hồ tổng, không đếm từng câu
  timerDuration = duration || QUESTION_TIME;
  timeLeft = timerDuration;
  updateTimerUI();
  timerInterval = setInterval(()=>{
    timeLeft--;
    updateTimerUI();
    if(timeLeft <= 0){
      stopTimer();
      handleTimeout();
    }
  }, 1000);
}
function stopTimer(){
  if(timerInterval){ clearInterval(timerInterval); timerInterval = null; }
}
function updateTimerUI(){
  const label = document.getElementById('q-timer');
  const bar = document.getElementById('timer-bar-fill');
  if(!label || !bar) return;
  label.textContent = `⏱ ${timeLeft}s`;
  label.classList.toggle('timer-warn', timeLeft <= 5);
  bar.style.width = `${Math.max(0,(timeLeft/timerDuration))*100}%`;
  bar.classList.toggle('warn', timeLeft <= 5);
}
const DOC_QUERY_BY_CAT = { 'Biến tần': 'biến tần', 'Pin lưu trữ': 'pin', 'An toàn điện': 'an toàn', 'Tấm pin quang điện': 'tấm pin', 'Lắp đặt': 'lắp đặt', 'Dụng cụ đo lường': 'đồng hồ', 'Tính toán hệ thống': 'công suất', 'Vận hành & bảo trì': 'bảo trì' };
let relatedDocQ = '';
function relatedDocQuery(q){
  if(typeof docHits !== 'function') return '';
  const cat = q.category || '';
  for(const cand of [DOC_QUERY_BY_CAT[cat], cat.toLowerCase()]){
    if(cand && docHits(cand).length > 0) return cand;
  }
  return '';
}
function openRelatedDoc(){
  if(!relatedDocQ) return;
  switchTab('guide');
  const inp = document.getElementById('doc-search');
  if(inp){ inp.value = relatedDocQ; docSearch(relatedDocQ); inp.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}
function showExplanationBox(q, isCorrect){
  const box = document.getElementById('q-explain-box');
  const text = document.getElementById('q-explain-text');
  const docBtn = document.getElementById('q-doc-btn');
  if(isCorrect || !q.explanation){ box.classList.remove('show'); text.textContent=''; if(docBtn) docBtn.style.display = 'none'; return; }
  text.textContent = ' ' + q.explanation;
  relatedDocQ = relatedDocQuery(q);
  if(docBtn) docBtn.style.display = relatedDocQ ? 'inline-block' : 'none';
  box.classList.add('show');
}

let timeoutAdvance = null;
function handleTimeout(){
  const q = quizOrder[currentIndex];
  const opts = document.querySelectorAll('#options .option');
  if(opts.length && !opts[0].disabled){
    opts.forEach(o=> o.disabled = true);
    opts[q.correct].classList.add('correct');
    answers.push({ id: q.id, question: q.question, options: q.options, chosen: null, correct: q.correct, isCorrect: false, explanation: q.explanation });
    recordWrongAnswer(q.id, false); recordStat(q, false);
    showExplanationBox(q, false);
  }
  // Hết giờ: bật nút "câu tiếp theo"; tự chuyển sau 8 giây nếu người dùng chưa bấm (để kịp đọc giải thích)
  document.getElementById('next-btn').disabled = false;
  try{ navigator.vibrate && navigator.vibrate(60); }catch(e){}
  clearTimeout(timeoutAdvance); timeoutAdvance = setTimeout(()=>{ nextQuestion(); }, 8000);
  saveProgress();
}

function renderQuestion(){
  clearTimeout(timeoutAdvance);
  const q = quizOrder[currentIndex];
  const myIndex = currentIndex; // chụp lại để đối chiếu khi video kết thúc (tránh tính giờ nhầm câu)
  document.getElementById('q-explain-box').classList.remove('show');
  document.getElementById('q-counter').textContent = `Câu ${currentIndex+1}/${quizOrder.length}`;
  document.getElementById('q-score-live').textContent = quizExam ? 'Thi · ' + EXAM_LEVELS[examLevel] : `Điểm: ${score}`;
  { const rb = document.getElementById('report-btn'); if(rb) rb.style.display = 'none'; }
  document.getElementById('progress-fill').style.width = `${(currentIndex/quizOrder.length)*100}%`;
  document.getElementById('q-cat-tag').textContent = q.category || 'Khác';
  const diffMap = { de: ['Dễ','diff-de'], tb: ['Trung bình','diff-tb'], kho: ['Khó','diff-kho'], cuckho: ['Cực khó','diff-cuckho'], xuatsac: ['Xuất sắc','diff-xuatsac'] };
  const dinfo = diffMap[q.difficulty] || diffMap.tb;
  const diffEl = document.getElementById('q-diff-tag');
  diffEl.textContent = dinfo[0];
  diffEl.className = 'diff-tag ' + dinfo[1];
  document.getElementById('q-text').textContent = q.question;
  updateStarBtn(q);

  const mediaWrap = document.getElementById('q-media');
  mediaWrap.innerHTML = '';
  let videoEl = null;
  if(q.mediaType === 'image' && q.mediaData){
    mediaWrap.innerHTML = `<img src="${q.mediaData}" alt="Hình minh hoạ câu hỏi">`;
  } else if(q.mediaType === 'video' && q.mediaData){
    mediaWrap.innerHTML = `<video src="${q.mediaData}" controls playsinline></video>`;
    videoEl = mediaWrap.querySelector('video');
  }

  const optWrap = document.getElementById('options');
  optWrap.innerHTML = '';
  const letters = ['A','B','C','D'];
  q.options.forEach((opt, idx)=>{
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.innerHTML = `<span class="bullet">${letters[idx]}</span><span>${escapeHtml(opt)}</span>`;
    btn.onclick = ()=> selectAnswer(idx);
    optWrap.appendChild(btn);
  });
  document.getElementById('next-btn').disabled = true;
  document.getElementById('next-btn').textContent = (currentIndex === quizOrder.length-1) ? 'Xem kết quả' : 'Câu tiếp theo';

  if(videoEl){
    // Câu hỏi có video: chưa tính giờ, đợi xem xong video mới bắt đầu đếm ngược.
    stopTimer();
    timeLeft = 0; timerDuration = 1;
    const label = document.getElementById('q-timer');
    const bar = document.getElementById('timer-bar-fill');
    if(label) label.textContent = '⏱ Xem video...';
    if(bar){ bar.style.width = '100%'; bar.classList.remove('warn'); }
    videoEl.addEventListener('ended', ()=>{
      const stillSameQuestion = (currentIndex === myIndex);
      const alreadyAnswered = document.querySelectorAll('#options .option')[0]?.disabled;
      if(stillSameQuestion && !alreadyAnswered){ startTimer(baseDurationFor(q)); }
    }, { once: true });
  } else {
    const duration = (q.mediaType === 'image') ? baseDurationFor(q) + IMAGE_BONUS_TIME : baseDurationFor(q);
    startTimer(duration);
  }
}

function selectAnswer(idx){
  const q = quizOrder[currentIndex];
  const opts = document.querySelectorAll('#options .option');
  if(opts[0].disabled) return;
  stopTimer();
  opts.forEach(o=> o.disabled = true);
  const isCorrect = idx === q.correct;
  if(quizExam){ opts[idx].classList.add('picked'); }   // thi thử: không lộ đáp án giữa chừng
  else{ opts[idx].classList.add(isCorrect ? 'correct' : 'wrong'); if(!isCorrect){ opts[q.correct].classList.add('correct'); } }
  if(isCorrect) score++;
  answers.push({ id: q.id, question: q.question, options: q.options, chosen: idx, correct: q.correct, isCorrect, explanation: q.explanation });
  recordWrongAnswer(q.id, isCorrect); recordStat(q, isCorrect); saveProgress();
  try{ navigator.vibrate && navigator.vibrate(isCorrect ? 20 : [40, 40, 40]); }catch(e){}
  document.getElementById('q-score-live').textContent = quizExam ? 'Thi · ' + EXAM_LEVELS[examLevel] : `Điểm: ${score}`;
  document.getElementById('next-btn').disabled = false;
  if(quizExam){ document.getElementById('q-explain-box').classList.remove('show'); } else showExplanationBox(q, isCorrect);
  const rb = document.getElementById('report-btn'); if(rb) rb.style.display = quizExam ? 'none' : 'inline-block';
}

function nextQuestion(){
  stopTimer(); clearTimeout(timeoutAdvance);
  currentIndex++;
  if(currentIndex >= quizOrder.length){ showResult(); }
  else { renderQuestion(); }
}

async function confirmFinishEarly(){
  if(answers.length === 0){
    showToast('Bạn chưa trả lời câu nào để kết thúc sớm.');
    return;
  }
  const ok = await showConfirm(`Kết thúc sớm và xem kết quả với ${answers.length}/${quizOrder.length} câu đã trả lời?\nCác câu chưa làm sẽ không được tính.`);
  if(!ok) return;
  finishEarly();
}
function finishEarly(){
  stopTimer();
  // Cắt bớt danh sách câu hỏi bằng đúng số câu đã trả lời, để phần trăm điểm được
  // tính trên số câu đã thực sự làm (không tính các câu bỏ dở phía sau).
  quizOrder = quizOrder.slice(0, answers.length);
  showResult();
}

let reviewAll = false;
function renderReview(){
  const wrap = document.getElementById('review-list');
  const btn = document.getElementById('review-toggle');
  wrap.innerHTML = '';
  const list = reviewAll ? answers : answers.filter((a) => !a.isCorrect);
  const hasCorrect = answers.some((a) => a.isCorrect);
  if(btn){ btn.style.display = hasCorrect ? 'block' : 'none'; btn.textContent = reviewAll ? 'Chỉ xem câu sai' : 'Xem cả câu đúng'; }
  const letters = ['A','B','C','D'];
  list.forEach((a) => {
    const div = document.createElement('div');
    div.className = 'review-item' + (a.isCorrect ? ' ok' : '');
    const chosenLine = a.isCorrect ? `<div class="a-correct">✓ Bạn chọn đúng: ${letters[a.correct]}. ${escapeHtml(a.options[a.correct])}</div>`
      : (a.chosen === null ? `<div class="a-wrong">Hết giờ — bạn chưa chọn đáp án</div>` : `<div class="a-wrong">Bạn chọn: ${letters[a.chosen]}. ${escapeHtml(a.options[a.chosen])}</div>`)
        + `<div class="a-correct">Đáp án đúng: ${letters[a.correct]}. ${escapeHtml(a.options[a.correct])}</div>`;
    const explainLine = a.explanation ? `<div class="a-explain">💡 ${escapeHtml(a.explanation)}</div>` : '';
    div.innerHTML = `<div class="q">${escapeHtml(a.question)} <button type="button" class="rp-link" data-qid="${escapeHtml(String(a.id))}" title="Báo câu hỏi này sai">⚑</button></div>${chosenLine}${explainLine}`;
    wrap.appendChild(div);
  });
}
function toggleReviewAll(){ reviewAll = !reviewAll; renderReview(); }

function showResult(){
  clearProgress();
  stopTimer(); const wasExam = quizExam; stopExamTimer();
  document.getElementById('quiz-play').style.display = 'none';
  document.getElementById('quiz-result').style.display = 'block';
  document.getElementById('progress-fill').style.width = '100%';
  const total = quizOrder.length;
  document.getElementById('result-fraction').textContent = `${score}/${total}`;
  const pct = Math.round((score/total)*100);
  document.getElementById('result-pct').textContent = `${pct}%`;
  const ring = document.getElementById('ring-fg');
  if(ring){
    ring.style.transition = 'none'; ring.style.strokeDashoffset = 327;
    requestAnimationFrame(()=>{ requestAnimationFrame(()=>{
      ring.style.transition = ''; ring.style.strokeDashoffset = String(327*(1 - pct/100));
    }); });
  }
  if(pct >= 80) launchConfetti();
  let msg;
  if(pct === 100) msg = `Xuất sắc, ${session.name}! Trọn vẹn điểm số 🎉`;
  else if(pct >= 80) msg = `Rất tốt, ${session.name}! Gần như hoàn hảo.`;
  else if(pct >= 50) msg = `Khá ổn, ${session.name}, cố gắng thêm nhé.`;
  else msg = `${session.name} cần ôn lại thêm một chút.`;
  document.getElementById('result-msg').textContent = wasExam
    ? `${pct >= EXAM_PASS ? '✅ ĐẠT' : '❌ CHƯA ĐẠT'} bài thi ${EXAM_LEVELS[examLevel]} (yêu cầu ${EXAM_PASS}%) · ${score}/${total} câu${answers.length < total ? ` · bỏ trống ${total - answers.length}` : ''}`
    : `${msg} (${pct}%)`;

  reviewAll = false; renderReview();

  if(quizReview){ showToast('Lượt ôn câu sai không tính vào bảng xếp hạng.'); }
  else submitLeaderboardEntry({
    name: session.name,
    anon: quizAnon,
    role: session.role,
    score: score,
    total: total,
    pct: pct,
    category: wasExam ? 'Thi thử · ' + EXAM_LEVELS[examLevel] : (function(){
      const dsel = document.getElementById('setup-difficulty');
      const label = dsel.selectedOptions[0] ? dsel.selectedOptions[0].textContent : 'Tất cả mức độ';
      return label;
    })(),
    ts: Date.now(),
  });
}

function escapeHtml(s){ const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

/* ---------- Phóng to ảnh câu hỏi ---------- */
function openZoom(src){
  const z = document.getElementById('img-zoom');
  document.getElementById('img-zoom-img').src = src;
  z.classList.remove('big'); z.classList.add('show');
}
function closeZoom(e){
  const z = document.getElementById('img-zoom');
  if(e && e.target && e.target.id === 'img-zoom-img'){ z.classList.toggle('big'); return; }   // chạm ảnh: phóng to/thu nhỏ
  z.classList.remove('show', 'big');
}
document.getElementById('q-media').addEventListener('click', (e) => { const im = e.target.closest('img'); if(im) openZoom(im.src); });

/* ---------- Thẻ hướng dẫn cho người mới ---------- */
function updateTip(){
  const t = document.getElementById('first-tip'); if(!t) return;
  let seen = false; try{ seen = localStorage.getItem('hmt-tip-seen') === '1'; }catch(e){}
  t.style.display = seen ? 'none' : 'block';
}
function dismissTip(){ try{ localStorage.setItem('hmt-tip-seen', '1'); }catch(e){} updateTip(); }

/* ---------- Báo câu hỏi sai ---------- */
const REPORT_EMAIL = 'kirateppei@gmail.com';   // nơi nhận báo lỗi dự phòng khi Firestore chưa cho ghi
let reportQ = null;
function openReport(q){
  if(!q || !session){ return; }
  reportQ = q;
  document.getElementById('report-q').textContent = q.question;
  document.getElementById('report-note').value = '';
  document.getElementById('report-backdrop').classList.add('show');
}
function closeReport(){ document.getElementById('report-backdrop').classList.remove('show'); reportQ = null; }
async function sendReport(){
  const q = reportQ, note = document.getElementById('report-note').value.trim();
  if(!q) return;
  if(note.length < 3){ showToast('Hãy ghi ngắn gọn câu này sai ở đâu.'); return; }
  if(typeof fbDb === 'undefined' || !fbDb){ showToast('Chưa kết nối máy chủ.'); return; }
  const btn = document.getElementById('report-send'); btn.disabled = true;
  try{
    await fbDb.collection('reports').add({
      qid: String(q.id).slice(0, 60), q: String(q.question).slice(0, 200), note: note.slice(0, 300),
      uid: session.uid, name: String(session.name).slice(0, 80),
      ts: firebase.firestore.FieldValue.serverTimestamp(),
    });
    showToast('Đã gửi báo lỗi. Cảm ơn bạn!');
    closeReport();
  }catch(e){
    if(e && e.code === 'permission-denied'){
      // Luật Firestore chưa có phần báo lỗi: chuyển sang gửi bằng chia sẻ/email để vẫn báo được cho quản trị viên
      const text = `Báo câu hỏi sai (mã ${q.id}) từ ${session.name}\n\nCâu hỏi: ${q.question}\n\nGhi chú: ${note}`;
      closeReport();
      if(navigator.share){ navigator.share({ title: 'Báo câu hỏi sai', text }).catch(() => {}); }
      else{ location.href = 'mailto:' + REPORT_EMAIL + '?subject=' + encodeURIComponent('Báo câu hỏi sai ' + q.id) + '&body=' + encodeURIComponent(text); }
      showToast('Chọn ứng dụng để gửi báo lỗi cho quản trị viên.');
    }else{
      showToast('Không gửi được, kiểm tra mạng rồi thử lại.');
    }
  }finally{ btn.disabled = false; }
}
document.getElementById('review-list').addEventListener('click', (e) => {
  const b = e.target.closest('.rp-link'); if(!b) return;
  const q = questions.find((x) => String(x.id) === b.dataset.qid);
  if(q) openReport(q);
});
async function renderReports(){
  const box = document.getElementById('rp-list');
  if(!box || !fbDb || !session || session.role !== 'admin') return;
  box.innerHTML = '<p class="form-hint">Đang tải…</p>';
  try{
    const snap = await fbDb.collection('reports').orderBy('ts', 'desc').limit(50).get();
    if(snap.empty){ box.innerHTML = '<p class="form-hint">Chưa có báo lỗi nào.</p>'; return; }
    box.innerHTML = snap.docs.map((d) => {
      const v = d.data({ serverTimestamps: 'estimate' });
      const ts = v.ts && v.ts.toMillis ? v.ts.toMillis() : 0;
      return `<div class="rp-item"><div class="rp-q">${escapeHtml(v.q || '')}</div><div class="rp-note">${escapeHtml(v.note || '')}</div>
        <div class="rp-meta">${escapeHtml(v.name || '')} · ${ts ? timeAgoVi(ts) : ''} · mã câu ${escapeHtml(String(v.qid || ''))}
        <button type="button" class="rp-del" onclick="deleteReport('${d.id}')">Xoá</button></div></div>`;
    }).join('');
  }catch(e){
    box.innerHTML = '<p class="form-hint">Không tải được báo lỗi' + (e && e.code === 'permission-denied' ? ' (cần dán luật Firestore mới).' : '.') + '</p>';
  }
}
async function deleteReport(id){
  try{ await fbDb.collection('reports').doc(id).delete(); renderReports(); }catch(e){ showToast('Không xoá được.'); }
}

/* ---------- Ảnh đại diện (ảnh Google của tài khoản; không có thì hiện chữ cái đầu) ---------- */
const PHOTO_RE = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.googleusercontent\.com\/[^\s"'<>]{1,280}$/i;
function safePhotoUrl(u){ return (typeof u === 'string' && u.length <= 300 && PHOTO_RE.test(u)) ? u : ''; }
function avatarHtml(name, photo, size){
  const nm = String(name || '?').trim();
  const ch = escapeHtml((Array.from(nm)[0] || '?').toUpperCase());
  let h = 0; for(const c of nm) h = (h * 31 + c.codePointAt(0)) % 360;
  const url = safePhotoUrl(photo);
  const img = url ? `<img src="${escapeHtml(url)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.remove()">` : '';
  return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px;background:hsl(${h},55%,42%);">${ch}${img}</span>`;
}
function escapeAttr(s){ return String(s).replace(/"/g,'&quot;'); }

/* ---------- Đồng bộ ngân hàng câu hỏi trực tuyến ---------- */
// Chỉ đồng bộ PHẦN THAY ĐỔI (câu tự thêm / sửa / xoá) qua 3 collection nhỏ,
// gộp lại với bộ câu hỏi gốc (DEFAULT_QUESTIONS) đã có sẵn trong app.
let qSyncMode = 'local'; // 'shared' hoặc 'local'
let qSyncCustom = {};    // id -> câu hỏi mới do admin thêm
let qSyncEdits = {};     // id -> các trường đã chỉnh sửa
let qSyncDeletes = {};   // id -> true (đã xoá)

function recomputeQuestions(){
  if(qSyncMode !== 'shared') return; // chế độ local dùng questions từ loadQuestions()/saveQuestions()
  questions = applyDelta(DEFAULT_QUESTIONS, Object.values(qSyncCustom), qSyncEdits, Object.keys(qSyncDeletes));
  if(document.getElementById('view-manage').classList.contains('active')){ renderManage(); }
  const chipTotal = document.getElementById('chip-total'); if(chipTotal) chipTotal.textContent = questions.length;
  if(document.getElementById('view-quiz').classList.contains('active')){ updateSetupHint(); }
}

/* ---------- Xuất / Nhập dữ liệu bằng file .json (đồng bộ thủ công, không cần đăng nhập) ---------- */
function computeLocalDelta(){
  const baseMap = {};
  DEFAULT_QUESTIONS.forEach(q => baseMap[q.id] = q);
  const custom = [];
  const edits = {};
  const currentIds = new Set();
  const fieldsOf = (q)=>({ category:q.category, difficulty:q.difficulty, question:q.question, options:q.options, correct:q.correct, mediaType:q.mediaType||null, mediaData:q.mediaData||null, explanation:q.explanation||'' });
  questions.forEach(q=>{
    currentIds.add(q.id);
    const base = baseMap[q.id];
    if(!base){ custom.push(q); }
    else if(JSON.stringify(fieldsOf(q)) !== JSON.stringify(fieldsOf(base))){ edits[q.id] = fieldsOf(q); }
  });
  const deletes = [];
  DEFAULT_QUESTIONS.forEach(q => { if(!currentIds.has(q.id)) deletes.push(q.id); });
  return { custom, edits, deletes };
}

async function exportQuestionsDelta(){
  const delta = (qSyncMode === 'shared')
    ? { custom: Object.values(qSyncCustom), edits: qSyncEdits, deletes: Object.keys(qSyncDeletes) }
    : computeLocalDelta();

  if(delta.custom.length === 0 && Object.keys(delta.edits).length === 0 && delta.deletes.length === 0){
    showToast('Chưa có câu hỏi tự thêm/sửa/xoá nào để xuất (bộ mặc định đã có sẵn trong app rồi).');
    return;
  }

  const payload = { type: 'hmt-quiz-delta', exportedAt: Date.now(), ...delta };
  const jsonStr = JSON.stringify(payload);
  const filename = `hmt-quiz-cauhoi-${new Date().toISOString().slice(0,10)}.json`;

  try{
    if(window.claude && typeof window.claude.use === 'function'){
      const downloads = await window.claude.use('downloads');
      if(downloads){
        const res = await downloads.save({ filename, data: jsonStr });
        showToast(res.status === 'saved' ? 'Đã lưu file xuất dữ liệu.' : 'Đã gửi file xuất dữ liệu.');
        return;
      }
    }
  }catch(e){ /* rơi xuống phương án dự phòng bên dưới */ }
  showExportFallback(jsonStr);
}

function showExportFallback(jsonStr){
  document.getElementById('export-textarea').value = jsonStr;
  document.getElementById('export-backdrop').classList.add('show');
}
function closeExportModal(){ document.getElementById('export-backdrop').classList.remove('show'); }
function copyExportText(){
  const ta = document.getElementById('export-textarea');
  ta.select();
  ta.setSelectionRange(0, 999999);
  let ok = false;
  try{ ok = document.execCommand('copy'); }catch(e){}
  if(!ok && navigator.clipboard){
    navigator.clipboard.writeText(ta.value).then(()=> showToast('Đã sao chép vào bộ nhớ tạm.'));
  } else if(ok){
    showToast('Đã sao chép vào bộ nhớ tạm.');
  } else {
    showToast('Vui lòng chọn thủ công và sao chép (Ctrl/Cmd+C).');
  }
}
document.getElementById('export-backdrop').addEventListener('click', (e)=>{
  if(e.target.id === 'export-backdrop') closeExportModal();
});
document.getElementById('confirm-modal-backdrop').addEventListener('click', (e)=>{
  if(e.target.id === 'confirm-modal-backdrop') resolveConfirm(false);
});

function handleImportFile(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ()=>{
    let payload;
    try{ payload = JSON.parse(reader.result); }
    catch(e){ showToast('File không đúng định dạng JSON.'); event.target.value=''; return; }

    const custom = Array.isArray(payload.custom) ? payload.custom : [];
    const edits = (payload.edits && typeof payload.edits === 'object') ? payload.edits : {};
    const deletes = Array.isArray(payload.deletes) ? payload.deletes : [];

    if(custom.length === 0 && Object.keys(edits).length === 0 && deletes.length === 0){
      showToast('File không có dữ liệu để nhập.'); event.target.value=''; return;
    }
    const okConfirm = await showConfirm(`Nhập ${custom.length} câu mới, ${Object.keys(edits).length} câu đã sửa, ${deletes.length} câu đã xoá từ file này?`);
    if(!okConfirm){ event.target.value=''; return; }

    if(qSyncMode === 'shared' && dbNS){
      try{
        for(const q of custom){ await dbNS.collection('custom_questions').doc(q.id).set(q); }
        for(const id of Object.keys(edits)){ await dbNS.collection('question_edits').doc(id).set(edits[id]); }
        for(const id of deletes){ await dbNS.collection('question_deletes').doc(id).set({ deleted:true, ts: Date.now() }); }
        showToast('Đã nhập dữ liệu và đồng bộ trực tuyến cho mọi người.');
      }catch(e){
        applyDeltaLocally(custom, edits, deletes);
        showToast('Đồng bộ trực tuyến lỗi — đã áp dụng trên thiết bị này.');
      }
    } else {
      applyDeltaLocally(custom, edits, deletes);
      showToast('Đã nhập dữ liệu vào thiết bị này.');
    }
    event.target.value = '';
  };
  reader.readAsText(file, 'utf-8');
}

function applyDeltaLocally(custom, edits, deletes){
  custom.forEach(q=>{
    const idx = questions.findIndex(x => x.id === q.id);
    if(idx >= 0) questions[idx] = q; else questions.push(q);
  });
  Object.keys(edits).forEach(id=>{
    const q = questions.find(x => x.id === id);
    if(q) Object.assign(q, edits[id]);
  });
  const delSet = new Set(deletes);
  questions = questions.filter(q => !delSet.has(q.id));
  saveQuestions();
  manageRenderLimit = 30;
  renderManage();
}

/* ---------- Đính kèm ảnh / video ngắn cho câu hỏi ---------- */
let pendingMedia = { f: null, e: null }; // {type:'image'|'video', data: dataURI} hoặc null
const MAX_VIDEO_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_IMAGE_WIDTH = 900;

function handleMediaSelect(event, prefix){
  const file = event.target.files[0];
  if(!file) return;
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if(!isImage && !isVideo){
    showToast('Chỉ chọn được file ảnh hoặc video.');
    event.target.value = '';
    return;
  }

  if(isVideo){
    if(file.size > MAX_VIDEO_BYTES){
      showToast('Video quá lớn (tối đa 8MB). Hãy chọn video ngắn/nhẹ hơn.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = ()=>{
      pendingMedia[prefix] = { type: 'video', data: reader.result };
      renderMediaPreview(prefix);
    };
    reader.onerror = ()=>{ showToast('Không đọc được file video.'); };
    reader.readAsDataURL(file);
  } else {
    const reader = new FileReader();
    reader.onload = ()=>{
      const img = new Image();
      img.onload = ()=>{
        const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        pendingMedia[prefix] = { type: 'image', data: dataUrl };
        renderMediaPreview(prefix);
      };
      img.onerror = ()=>{ showToast('Không đọc được file ảnh.'); };
      img.src = reader.result;
    };
    reader.onerror = ()=>{ showToast('Không đọc được file ảnh.'); };
    reader.readAsDataURL(file);
  }
}

function renderMediaPreview(prefix){
  const wrap = document.getElementById(prefix + '-media-preview');
  const m = pendingMedia[prefix];
  if(!m){ wrap.innerHTML = ''; return; }
  const tag = m.type === 'image'
    ? `<img src="${m.data}" class="media-thumb" alt="preview">`
    : `<video src="${m.data}" class="media-thumb" controls></video>`;
  wrap.innerHTML = `${tag}<button type="button" class="icon-btn danger" title="Bỏ ảnh/video" onclick="clearMedia('${prefix}')">🗑</button>`;
}

function clearMedia(prefix){
  pendingMedia[prefix] = null;
  const input = document.getElementById(prefix + '-media');
  if(input) input.value = '';
  renderMediaPreview(prefix);
}

/* ---------- Add question (admin) ---------- */
function saveQuestion(){
  const cat = document.getElementById('f-category').value;
  const diff = document.getElementById('f-difficulty').value;
  const text = document.getElementById('f-question').value.trim();
  const opts = [0,1,2,3].map(i => document.getElementById('f-opt-'+i).value.trim());
  const correctRadio = document.querySelector('input[name="f-correct"]:checked');
  const correctIdx = correctRadio ? parseInt(correctRadio.value,10) : 0;

  if(!text){ showToast('Vui lòng nhập nội dung câu hỏi.'); return; }
  if(opts.some(o => !o)){ showToast('Vui lòng điền đủ 4 đáp án.'); return; }

  const media = pendingMedia.f;
  const explanation = document.getElementById('f-explanation').value.trim();
  const newQ = {
    id: uid(), category: cat, difficulty: diff, question: text, options: opts, correct: correctIdx, group: uid(),
    mediaType: media ? media.type : null, mediaData: media ? media.data : null, explanation: explanation,
  };

  const clearForm = ()=>{
    document.getElementById('f-question').value = '';
    [0,1,2,3].forEach(i => document.getElementById('f-opt-'+i).value = '');
    document.querySelector('input[name="f-correct"][value="0"]').checked = true;
    document.getElementById('f-explanation').value = '';
    clearMedia('f');
  };

  if(qSyncMode === 'shared' && dbNS){
    dbNS.collection('custom_questions').doc(newQ.id).set(newQ)
      .then(()=>{ showToast('Đã lưu câu hỏi mới (đồng bộ trực tuyến)!'); clearForm(); })
      .catch(()=>{
        questions.push(newQ); saveQuestions();
        showToast('Không đồng bộ được — đã lưu câu hỏi mới trên thiết bị này.');
        clearForm();
      });
  } else {
    questions.push(newQ);
    saveQuestions();
    showToast('Đã lưu câu hỏi mới!');
    clearForm();
  }
}

/* ---------- Manage (admin) ---------- */
function onManageFilterChange(){ manageRenderLimit = 30; renderManage(); }

function renderManage(){
  const search = document.getElementById('manage-search').value.trim().toLowerCase();
  const cat = document.getElementById('manage-cat-filter').value;
  let list = questions;
  if(cat !== '__ALL__') list = list.filter(q => (q.category||'Khác') === cat);
  if(search) list = list.filter(q => q.question.toLowerCase().includes(search) || q.options.some(o=>o.toLowerCase().includes(search)));
  manageFilteredCache = list;

  document.getElementById('manage-count').textContent = `${list.length} câu hỏi (tổng ${questions.length})`;
  const wrap = document.getElementById('manage-list');
  const emptyEl = document.getElementById('manage-empty');
  const loadMoreBtn = document.getElementById('manage-load-more');
  wrap.innerHTML = '';

  if(list.length === 0){ emptyEl.style.display='block'; loadMoreBtn.classList.add('hidden'); return; }
  emptyEl.style.display='none';

  const shown = list.slice(0, manageRenderLimit);
  const letters = ['A','B','C','D'];
  shown.forEach(q=>{
    const card = document.createElement('div');
    card.className = 'q-card';
    const optsHtml = q.options.map((o,i)=> `<div class="${i===q.correct?'is-correct':''}">${letters[i]}. ${escapeHtml(o)}${i===q.correct?' ✓':''}</div>`).join('');
    const mediaBadge = q.mediaType === 'image' ? ' <span class="media-badge">📷 có ảnh</span>' : (q.mediaType === 'video' ? ' <span class="media-badge">🎬 có video</span>' : '');
    card.innerHTML = `
      <div class="q-head">
        <p>${escapeHtml(q.question)}<br><span style="font-weight:400;font-size:0.75rem;color:#8a9089;">${escapeHtml(q.category||'Khác')}${mediaBadge}</span></p>
        <div class="actions">
          <button class="icon-btn" title="Sửa" onclick="openEdit('${q.id}')">✎</button>
          <button class="icon-btn danger" title="Xoá" onclick="deleteQuestion('${q.id}')">🗑</button>
        </div>
      </div>
      <div class="opts-mini">${optsHtml}</div>
    `;
    wrap.appendChild(card);
  });
  loadMoreBtn.classList.toggle('hidden', list.length <= manageRenderLimit);
}
function manageShowMore(){ manageRenderLimit += 30; renderManage(); }

async function deleteQuestion(id){
  const ok = await showConfirm('Xoá câu hỏi này?');
  if(!ok) return;
  if(qSyncMode === 'shared' && dbNS){
    dbNS.collection('question_deletes').doc(id).set({ deleted:true, ts: Date.now() })
      .then(()=> showToast('Đã xoá câu hỏi (đồng bộ trực tuyến).'))
      .catch(()=>{
        questions = questions.filter(q => q.id !== id);
        saveQuestions(); renderManage();
        showToast('Không đồng bộ được — đã xoá trên thiết bị này.');
      });
  } else {
    questions = questions.filter(q => q.id !== id);
    saveQuestions();
    renderManage();
    showToast('Đã xoá câu hỏi.');
  }
}

async function confirmResetDefault(){
  const warnExtra = qSyncMode === 'shared' ? ' cho TẤT CẢ mọi người đang dùng chung liên kết này' : ' trên thiết bị này';
  const ok = await showConfirm(`Khôi phục về bộ câu hỏi mặc định (~1500 câu)? Các câu tự thêm/sửa/xoá sẽ mất${warnExtra}.`);
  if(!ok) return;
  if(qSyncMode === 'shared' && dbNS){
    try{
      const cols = ['custom_questions','question_edits','question_deletes'];
      for(const c of cols){
        const snap = await dbNS.collection(c).limit(1000).get();
        for(const d of snap.docs){ await dbNS.collection(c).doc(d.id).delete(); }
      }
      showToast('Đã khôi phục bộ mặc định cho mọi người dùng chung.');
    }catch(e){
      showToast('Không thể khôi phục trực tuyến, vui lòng thử lại.');
    }
  } else {
    questions = DEFAULT_QUESTIONS.map(q => ({...q}));
    saveQuestions();
    manageRenderLimit = 30;
    renderManage();
    showToast('Đã khôi phục bộ mặc định.');
  }
}

function openEdit(id){
  const q = questions.find(x => x.id === id);
  if(!q) return;
  editingId = id;
  document.getElementById('e-category').value = q.category || 'Khác';
  document.getElementById('e-difficulty').value = q.difficulty || 'tb';
  document.getElementById('e-question').value = q.question;
  [0,1,2,3].forEach(i => document.getElementById('e-opt-'+i).value = q.options[i]);
  document.querySelector(`input[name="e-correct"][value="${q.correct}"]`).checked = true;
  document.getElementById('e-media').value = '';
  pendingMedia.e = (q.mediaType && q.mediaData) ? { type: q.mediaType, data: q.mediaData } : null;
  renderMediaPreview('e');
  document.getElementById('e-explanation').value = q.explanation || '';
  document.getElementById('edit-backdrop').classList.add('show');
}
function closeEdit(){ document.getElementById('edit-backdrop').classList.remove('show'); editingId = null; }
function saveEdit(){
  const q = questions.find(x => x.id === editingId);
  if(!q) return;
  const text = document.getElementById('e-question').value.trim();
  const opts = [0,1,2,3].map(i => document.getElementById('e-opt-'+i).value.trim());
  const correctRadio = document.querySelector('input[name="e-correct"]:checked');
  if(!text || opts.some(o=>!o)){ showToast('Vui lòng điền đầy đủ thông tin.'); return; }
  const media = pendingMedia.e;
  const updated = {
    category: document.getElementById('e-category').value,
    difficulty: document.getElementById('e-difficulty').value,
    question: text,
    options: opts,
    correct: correctRadio ? parseInt(correctRadio.value,10) : q.correct,
    mediaType: media ? media.type : null,
    mediaData: media ? media.data : null,
    explanation: document.getElementById('e-explanation').value.trim(),
  };
  if(qSyncMode === 'shared' && dbNS){
    dbNS.collection('question_edits').doc(editingId).set(updated)
      .then(()=>{ closeEdit(); showToast('Đã cập nhật (đồng bộ trực tuyến).'); })
      .catch(()=>{
        Object.assign(q, updated);
        saveQuestions(); closeEdit(); renderManage();
        showToast('Không đồng bộ được — đã cập nhật trên thiết bị này.');
      });
  } else {
    Object.assign(q, updated);
    saveQuestions();
    closeEdit();
    renderManage();
    showToast('Đã cập nhật câu hỏi.');
  }
}
document.getElementById('edit-backdrop').addEventListener('click', (e)=>{
  if(e.target.id === 'edit-backdrop') closeEdit();
});

let dbNS = null; // Firestore (firebase.firestore()) sau khi đăng nhập; null = chưa đồng bộ

/* ---------- Giao diện (theme) ---------- */
const APP_THEMES = [
  { id:'nangmoi', name:'Nắng mới (mặc định)', swatch:'linear-gradient(135deg,#6B3FD8,#FF4F8B 60%,#FFC93C)' },
  { id:'chalk',   name:'Bảng đen',       swatch:'linear-gradient(135deg,#1B3A2F,#2F7A5A)' },
  { id:'sunrise', name:'Bình minh',      swatch:'linear-gradient(135deg,#FFB347,#FF5E62)' },
  { id:'ocean',   name:'Đại dương',      swatch:'linear-gradient(135deg,#062858,#3DDCFF)' },
  { id:'sunset',  name:'Hoàng hôn tím',  swatch:'linear-gradient(135deg,#3A106E,#FF7EB6)' },
  { id:'forest',  name:'Rừng xanh',      swatch:'linear-gradient(135deg,#0E3B2A,#7CE38B)' },
  { id:'minimal', name:'Tối giản sáng',  swatch:'linear-gradient(135deg,#F6F8FC,#9DBBFF)' },
];
let currentThemeId = (function(){ try{ return localStorage.getItem('quiz-app-theme'); }catch(e){ return null; } })() || 'nangmoi';

function applyTheme(id){
  currentThemeId = id;
  if(id === 'chalk'){ document.documentElement.removeAttribute('data-app-theme'); }
  else { document.documentElement.setAttribute('data-app-theme', id); }
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta){
    const colors = { nangmoi:'#1A1550', chalk:'#1B3A2F', sunrise:'#FF7A4A', ocean:'#062858', sunset:'#2A0E55', forest:'#0E3B2A', minimal:'#EEF2F7' };
    meta.setAttribute('content', colors[id] || '#1B3A2F');
  }
  try{ localStorage.setItem('quiz-app-theme', id); }catch(e){}
}
function openThemePicker(){
  renderThemeList();
  document.getElementById('theme-modal-backdrop').classList.add('show');
}
function closeThemePicker(){ document.getElementById('theme-modal-backdrop').classList.remove('show'); }
function renderThemeList(){
  document.getElementById('theme-list').innerHTML = APP_THEMES.map(t => `
    <button class="theme-row ${t.id === currentThemeId ? 'active' : ''}" onclick="selectTheme('${t.id}')">
      <span class="theme-swatch" style="background:${t.swatch};"></span>
      <span style="flex:1;">${escapeHtml(t.name)}</span>
      <span style="font-size:0.75rem; color:#8a9089;">${t.id === currentThemeId ? 'Đang dùng' : ''}</span>
    </button>`).join('');
}
function selectTheme(id){ applyTheme(id); renderThemeList(); }
document.getElementById('theme-modal-backdrop').addEventListener('click', (e)=>{
  if(e.target.id === 'theme-modal-backdrop') closeThemePicker();
});
applyTheme(currentThemeId);

/* ---------- Hướng dẫn cài đặt WiFi / cấu hình logger theo từng hãng biến tần ---------- */
const GUIDE_BRANDS = [
  {
    id: 'huawei', name: 'Huawei (SUN2000)', color: '#C7000B', badge: 'HW',
    app: 'App: FusionSolar · Web: SmartPVMS (intl.fusionsolar.huawei.com)',
    steps: [
      'Cắm Smart Dongle (WLAN-FE hoặc 4G) vào biến tần SUN2000, cấp điện cho biến tần hoạt động.',
      'Mở app <b>FusionSolar</b> → mục <b>"Commissioning" (Nghiệm thu thiết bị)</b> → bấm quét mã QR trên biến tần/dongle để app tự nối vào WLAN của thiết bị. Nối tay: vào Cài đặt WiFi điện thoại, chọn mạng có tên dạng <b>"SUN2000-&lt;số serial&gt;"</b> (tên = tên thiết bị + số serial).',
      'Mật khẩu WLAN của thiết bị (lần đầu) <b>in trên nhãn thiết bị</b>; một số đời cũ dùng <b>Changeme</b>. Đây là mật khẩu mạng WiFi của thiết bị, <b>khác</b> mật khẩu đăng nhập installer bên dưới.',
      'Đăng nhập cục bộ bằng tài khoản <b>installer</b>, mật khẩu khởi tạo thường là <b>00000a</b> — bắt buộc đặt mật khẩu mới ở lần đăng nhập đầu và ghi lại cẩn thận.',
      'Trong trình hướng dẫn (Quick Settings/Deployment wizard), vào phần cấu hình <b>kết nối router (WLAN)</b> → chọn tên WiFi nhà → nhập mật khẩu wifi → Lưu. Tên mục có thể khác chút tuỳ phiên bản app.',
      'Tạo hoặc chọn "Nhà máy điện" (Plant) trên FusionSolar bằng tài khoản installer để gắn thiết bị vào đúng công trình, rồi hoàn tất commissioning.',
      'Đợi vài phút, kiểm tra trạng thái thiết bị chuyển từ "Ngoại tuyến" sang <b>"Trực tuyến"</b> trên app/SmartPVMS.',
    ],
    note: 'Cần tài khoản <b>installer</b> (không phải tài khoản chủ nhà) để vào Commissioning. Router phải phát <b>2.4GHz</b>, nên dùng bảo mật WPA2; chế độ Enterprise không được hỗ trợ.',
  },
  {
    id: 'huawei-dongle', name: 'Huawei — Smart Dongle (WLAN-FE / 4G)', color: '#C7000B', badge: 'HW',
    app: 'Dongle: SDongleA-05 (WLAN hoặc cáp mạng FE) · SDongleB-06 (4G) · Cấu hình bằng app FusionSolar',
    steps: [
      '<b>Chọn loại dongle:</b> <b>SDongleA-05</b> nối internet qua WiFi router (WLAN) hoặc cáp mạng (FE); <b>SDongleB-06</b> dùng SIM 4G, phù hợp nơi không có WiFi/mạng dây. Lắp đúng loại, đúng cổng giao tiếp của biến tần SUN2000 theo hình trong sách.',
      '<b>Lắp dongle</b> vào cổng giao tiếp ở đáy biến tần (khi biến tần đã ngắt điện hoặc theo hướng dẫn lắp trong sách), siết/khớp chắc chắn. Với bản 4G, lắp SIM theo hướng dẫn trong sách trước khi cắm dongle.',
      '<b>Cấp điện</b> cho biến tần: đóng cả phía <b>AC và DC</b> rồi mới cài thông số (theo sách, phải có điện cả hai phía). Đèn LED trên dongle sẽ sáng, đợi dongle khởi động xong.',
      'Mở app <b>FusionSolar</b> → <b>Commissioning (Nghiệm thu thiết bị)</b>, đăng nhập tài khoản <b>installer</b>, nối vào WLAN của thiết bị (tên có số serial, mật khẩu in trên nhãn) hoặc quét mã QR rồi vào phần cài đặt dongle.',
      '<b>Nếu không thấy WLAN của dongle:</b> theo sách, WLAN của dongle mặc định <b>tắt</b> khi biến tần đã có WLAN tích hợp, và <b>bật</b> khi biến tần không có. Có thể bật trong app: vào nhà máy → Thiết bị → chọn SDongleA-05 → <b>O&amp;M Authorization → WLAN wakeup → Confirm</b> (tên mục có thể khác theo bản app).',
      '<b>Kết nối router (SDongleA-05):</b> trong phần <b>Router connection settings</b> chọn WiFi nhà (chỉ <b>2.4GHz</b>, WPA2) và nhập mật khẩu; nếu dùng cáp mạng FE thì cắm cáp từ dongle vào router/switch và chọn kiểu kết nối tương ứng. Với bản 4G: kiểm tra SIM có dữ liệu, cài APN theo nhà mạng nếu app yêu cầu.',
      'Xem đèn LED để biết trạng thái: <b>xanh lá nháy chậm</b> (khoảng 0,5 giây sáng/0,5 giây tắt) là đang kết nối router (bình thường); <b>đỏ nháy nhanh</b> là kết nối router thất bại hoặc chưa cài thông số, cần kiểm tra lại SSID/mật khẩu; <b>đỏ sáng liên tục</b> là dongle lỗi, cần thay. Ý nghĩa đầy đủ các màu khác xem bảng LED trong sách của đúng đời dongle.',
      'Gắn thiết bị vào <b>nhà máy điện (Plant)</b> trên FusionSolar, hoàn tất nghiệm thu rồi đợi vài phút để trạng thái chuyển sang <b>"Trực tuyến"</b>.',
    ],
    note: 'Nội dung tổng hợp từ sách hướng dẫn nhanh của Huawei qua nguồn thứ ba (trang chính hãng không truy cập được từ đây). <b>Tên menu và màu/chu kỳ đèn LED có thể khác theo đời dongle và phiên bản app</b>, nên đối chiếu Smart Dongle Quick Guide của đúng model (SDongleA-05 hoặc SDongleB-06).',
  },
  {
    id: 'sungrow', name: 'Sungrow', color: '#FF6A00', badge: 'SG',
    app: 'App: iSolarCloud · Web: web.isolarcloud.com',
    steps: [
      'Cắm dongle <b>WiNet-S</b> (hoặc WiNet-S2) vào cổng COM của biến tần Sungrow.',
      'Bật chế độ cấu hình: bấm <b>nút trên dongle 1 lần</b> (EasyConnect, app tự dò) — nếu không được thì <b>bấm nút 3 lần</b> để dongle phát WiFi riêng (WLAN direct). Tên mạng đặt theo số serial của dongle (ví dụ dạng <b>"SG-xxxxxxxxxx"</b> hoặc "WINET-...").',
      'Mở app <b>iSolarCloud</b>, đăng nhập → vào mục <b>"Device Commissioning"</b> hoặc quét mã QR dán trên dongle.',
      'Chọn <b>"WLAN Configuration"</b>, app sẽ quét danh sách wifi xung quanh — chọn wifi nhà bạn và nhập mật khẩu.',
      'Nhấn Kết nối, đợi dongle khởi động lại (đèn tín hiệu chuyển từ nhấp nháy sang sáng ổn định).',
      'Tạo trạm điện mới (New Plant) trong iSolarCloud, gán serial biến tần/dongle vào đúng trạm.',
      'Kiểm tra lại trạng thái Online trong danh sách thiết bị.',
    ],
    note: 'Nếu không tìm thấy mạng của dongle, bấm nút trên dongle 3 lần để bật lại chế độ phát WiFi (WLAN direct). Tên mạng đặt theo số serial dongle; mật khẩu và tên chính xác tuỳ đời (WiNet-S, WiNet-S2), xem tem trên dongle.',
  },
  {
    id: 'goodwe', name: 'GoodWe', color: '#0072BC', badge: 'GW',
    app: 'Cấu hình WiFi: app SolarGo · Giám sát: SEMS Portal (đang chuyển dần sang SEMS+) · Web: semsportal.com',
    steps: [
      'Cắm module WiFi (hoặc USB WiFi stick) vào cổng giao tiếp của biến tần GoodWe.',
      'Kết nối điện thoại vào mạng phát ra từ module, tên dạng <b>"Solar-WiFi########"</b> (8 số cuối là số serial), mật khẩu mặc định <b>12345678</b>.',
      'Mở app <b>SolarGo</b> (app cấu hình của GoodWe) và kết nối với biến tần/module; mã truy cập mặc định của SolarGo thường là <b>1234</b> (nên đổi riêng cho installer và chủ nhà). Nếu app báo cấu hình WiFi không có, vào mục cấu hình mạng/Wi-Fi tuỳ phiên bản.',
      'Chọn mạng wifi nhà bạn từ danh sách → nhập mật khẩu wifi → xác nhận (Connect). Router cần phát <b>2.4GHz</b> và sóng đủ mạnh.',
      'Cách khác — dùng trình duyệt: khi đang nối vào mạng <b>Solar-WiFi########</b>, mở trình duyệt vào <b>10.10.100.253</b> (gõ vào thanh địa chỉ), chọn wifi nhà, nhập mật khẩu rồi lưu. Tuỳ đời module, trang cấu hình có thể yêu cầu đăng nhập; nếu không vào được thì dùng SolarGo.',
      'Đợi module khởi động lại và kết nối vào wifi nhà (đèn LED chuyển trạng thái ổn định).',
      'Đăng nhập app <b>SEMS Portal</b> để thêm nhà máy điện mới (Add Plant/Station) nếu là lần đầu cấu hình, nhập serial biến tần để gắn vào.',
      'Kiểm tra trạng thái "Online" trong danh sách thiết bị trên app.',
    ],
    note: 'Nếu quên đổi mật khẩu module WiFi, ai trong tầm sóng cũng có thể dò được — nên đổi mật khẩu mặc định 12345678 sau khi cấu hình xong.',
  },
  {
    id: 'solis', name: 'Solis (Ginlong)', color: '#00A651', badge: 'SL',
    app: 'App: SolisCloud · Web: soliscloud.com',
    steps: [
      'Cắm WiFi stick (logger) vào cổng của biến tần Solis.',
      'Kết nối điện thoại vào mạng phát ra từ stick, tên dạng <b>"AP_xxxxxxxxxxx"</b> hoặc <b>"Solis_xxxxxxxxxx"</b> (theo số serial logger).',
      'Cách 1 — Dùng App: mở <b>SolisCloud</b> → bấm "+" thêm thiết bị → chọn "Cấu hình WiFi" → app tự dò wifi nhà → nhập mật khẩu → Kết nối.',
      'Cách 2 — Dùng trình duyệt: mở trình duyệt, truy cập địa chỉ <b>10.10.100.254</b> (gõ vào thanh địa chỉ, không phải ô tìm kiếm), đăng nhập <b>admin/admin</b> (một số đời dùng <b>admin/123456789</b>; từ cuối 2024 stick mới có thể bắt đặt mật khẩu riêng 6–15 ký tự, có chữ và số) → chạy "Quick Set/Setup Wizard" → chọn wifi nhà → nhập mật khẩu → Lưu.',
      'Đợi logger khởi động lại, đèn WiFi trên logger chuyển sang sáng ổn định (không nhấp nháy).',
      'Trong SolisCloud, tạo "Nhà máy" (Plant) mới rồi quét mã vạch/nhập serial logger để gắn thiết bị vào.',
      'Làm mới danh sách thiết bị, kiểm tra trạng thái chuyển sang Online.',
    ],
    note: 'Bắt buộc phải nhập đúng <b>số serial của LOGGER</b> (không phải số serial biến tần) khi thêm thiết bị trong SolisCloud. Stick chỉ hỗ trợ wifi <b>2.4GHz</b>; nếu cấu hình hỏng nhiều lần, giữ nút Reset trên stick khoảng 10 giây để khôi phục rồi làm lại.',
  },
  {
    id: 'deye', name: 'Deye', color: '#005BAC', badge: 'DY',
    app: 'App: DeyeCloud (hoặc Solarman Smart tuỳ loại logger) · Web: deyecloud.com / home.solarmanpv.com',
    steps: [
      'Cắm datalogger WiFi vào <b>cổng datalogger/WiFi</b> riêng của biến tần Deye (không phải cổng RS485 thông thường).',
      'Kết nối điện thoại vào mạng phát ra từ logger, tên dạng <b>"AP_xxxxxxxx"</b> (mật khẩu ghi trên tem logger; một số loại dùng 12345678 — theo tem là chính xác nhất).',
      'Mở app <b>DeyeCloud</b> (hoặc <b>Solarman Smart</b> nếu logger thuộc nền tảng SOLARMAN), đăng nhập → vào danh sách thiết bị (Devices) → chọn logger cần cấu hình.',
      'App tự nhận diện wifi điện thoại đang dùng → xác nhận wifi nhà đúng → bấm "Start".',
      'App yêu cầu sang Cài đặt WiFi của điện thoại để kết nối vào mạng AP_xxxxxxxx → quay lại app Solarman.',
      'App tự động cấu hình (Auto Configuration), đợi khoảng 3-5 phút để hoàn tất.',
      'Tạo trạm điện mới (Add Plant/Station) trong app nếu là lần đầu, gắn logger vào đúng trạm.',
      'Trạng thái logger vẫn hiện "Ngoại tuyến" ngay sau đó là bình thường — dữ liệu thường cập nhật sau khoảng 10 phút.',
      'Cách dự phòng: khi đang kết nối vào mạng AP_xxxxxxxx, mở trình duyệt vào <b>10.10.100.254</b> (tài khoản/mật khẩu mặc định <b>admin/admin</b> nếu logger chưa đổi), chọn wifi nhà và nhập mật khẩu trong trang cấu hình.',
    ],
    note: 'Chỉ dùng được mạng WiFi <b>2.4GHz</b>. Tên/mật khẩu wifi nhà không được chứa ký tự đặc biệt như , ; \' " ` =',
  },
  {
    id: 'luxpower', name: 'LuxPower', color: '#7A1FA2', badge: 'LX',
    app: 'App: LuxPowerView (nền tảng LuxCloud) · Web: server.luxpowertek.com',
    steps: [
      'Cắm dongle WiFi vào cổng giao tiếp của biến tần LuxPower, bật nguồn biến tần và chờ đèn <b>INV</b> trên dongle sáng ổn định rồi mới kết nối.',
      'Tải app <b>LuxPowerView</b> (Android thường phải tải trực tiếp từ trang chủ hãng, không có trên Google Play).',
      'Đăng ký tài khoản trên app (nhập mã installer/customer code nếu được cấp).',
      'Kết nối điện thoại vào mạng WiFi do dongle phát ra, tên bắt đầu bằng <b>"BA..."</b>.',
      'Mở app LuxPowerView → bấm <b>"DONGLE CONNECT"</b>.',
      'Chọn mạng WiFi nhà bạn từ danh sách, nhập mật khẩu wifi → bấm <b>"HomeWiFi Connect"</b>.',
      'Dongle sẽ tự khởi động lại — đợi cả 3 đèn LED trên dongle sáng ổn định (không nhấp nháy) là đã kết nối thành công.',
      'Vào app kiểm tra trạm điện đã hiện dữ liệu, đặt tên trạm để dễ quản lý.',
    ],
    note: 'Nếu đổi wifi/router mới, phải lặp lại đúng quy trình trên (không tự động chuyển mạng) — vào lại "DONGLE CONNECT" để cấu hình wifi mới. Sau khi khôi phục cài đặt gốc, tên mạng dongle có thể không còn dạng "BA…". Nên đổi tên/mật khẩu mạng hotspot của dongle nếu hãng cho phép, tránh người lạ dò vào.',
  },
  {
    id: 'sma', name: 'SMA (Đức)', color: '#E2001A', badge: 'SMA',
    app: 'Web/App: Sunny Portal (cổ điển, sunnyportal.com) hoặc Sunny Portal powered by ennexOS (ennexos.sunnyportal.com) · Webserver nội bộ trên biến tần',
    steps: [
      'Hầu hết biến tần SMA (dòng Sunny Boy...) có sẵn <b>WLAN tích hợp</b> — kết nối điện thoại vào mạng wifi do chính biến tần phát ra, tên dạng <b>"SMA&lt;số serial&gt;"</b>; mật khẩu WLAN (WPA2-PSK) in trên <b>nhãn máy</b> hoặc mặt sau sách hướng dẫn.',
      'Đang nối trực tiếp vào biến tần thì mở trình duyệt vào <b>https://192.168.12.3</b> để vào webserver của biến tần và chọn wifi nhà. Lưu ý: dải <b>192.168.12.x</b> SMA dành riêng cho kết nối trực tiếp, đừng đặt mạng LAN nhà/công trình trùng dải này.',
      'Nhiều dòng hỗ trợ thêm <b>WPS</b> hoặc "tìm mạng WLAN" ngay trong giao diện cấu hình: có thể tự kết nối vào router mà không cần nhập tay mật khẩu (cách kích hoạt WPS tuỳ đời máy, xem hướng dẫn của model).',
      'Đăng ký/đăng nhập tài khoản trên <b>Sunny Portal</b>: bản cổ điển (sunnyportal.com) hoặc bản <b>powered by ennexOS</b> (ennexos.sunnyportal.com) tuỳ thiết bị/phần mềm của biến tần.',
      'Bật chức năng <b>Webconnect</b> trên biến tần để tự gửi dữ liệu thẳng lên Sunny Portal — không cần thêm datalogger riêng (hợp với hệ dân dụng có ít biến tần, thường tối đa khoảng 4 máy cho một hệ thống).',
      'Tạo hệ thống mới (New System/Plant) trên Sunny Portal, nhập số serial biến tần để gắn thiết bị vào đúng công trình.',
      'Kiểm tra trạng thái dữ liệu đã cập nhật trên Sunny Portal (thường trong vài phút).',
    ],
    note: 'Hệ trên 4 biến tần hoặc quy mô thương mại nên dùng thêm <b>SMA Data Manager M</b> (xem mục Smart Logger) thay vì Webconnect trực tiếp từng máy.',
  },
];

const GUIDE_BASICS = [{"term": "Hiệu ứng quang điện (photovoltaic effect)", "def": "hiện tượng vật liệu bán dẫn sinh ra dòng điện khi hấp thụ ánh sáng", "cat": "Kiến thức cơ bản"}, {"term": "Điều kiện thử nghiệm tiêu chuẩn STC (Standard Test Conditions)", "def": "bức xạ 1000 W/m², nhiệt độ tế bào 25°C, khối lượng khí quyển AM 1.5", "cat": "Kiến thức cơ bản"}, {"term": "Công suất đỉnh Wp (Watt-peak)", "def": "công suất tối đa tấm pin tạo ra trong điều kiện thử nghiệm chuẩn STC", "cat": "Kiến thức cơ bản"}, {"term": "Hệ số hiệu suất hệ thống PR (Performance Ratio)", "def": "tỷ lệ giữa sản lượng điện thực tế và sản lượng điện lý thuyết trong cùng điều kiện bức xạ", "cat": "Kiến thức cơ bản"}, {"term": "Giờ nắng đỉnh PSH (Peak Sun Hours)", "def": "số giờ tương đương bức xạ 1000 W/m² trong một ngày tại một địa điểm", "cat": "Kiến thức cơ bản"}, {"term": "Hệ thống điện mặt trời hòa lưới (on-grid/grid-tied)", "def": "hệ thống kết nối trực tiếp với lưới điện, không có pin lưu trữ, ngừng hoạt động khi mất điện lưới", "cat": "Kiến thức cơ bản"}, {"term": "Hệ thống điện mặt trời độc lập (off-grid)", "def": "hệ thống hoạt động độc lập không kết nối lưới điện, thường có pin lưu trữ", "cat": "Kiến thức cơ bản"}, {"term": "Hệ thống hybrid (lai)", "def": "hệ thống vừa kết nối lưới điện vừa có pin lưu trữ, có thể chuyển đổi linh hoạt", "cat": "Kiến thức cơ bản"}, {"term": "Tế bào quang điện đơn tinh thể (mono-crystalline)", "def": "được cắt từ một thỏi silic đơn tinh thể, hiệu suất cao, màu đen đồng nhất", "cat": "Tấm pin quang điện"}, {"term": "Tế bào quang điện đa tinh thể (poly-crystalline)", "def": "được đúc từ nhiều tinh thể silic, chi phí thấp hơn mono, hiệu suất thấp hơn", "cat": "Tấm pin quang điện"}, {"term": "Công nghệ tấm pin PERC", "def": "công nghệ thêm lớp phản xạ mặt sau giúp tăng hiệu suất hấp thụ ánh sáng", "cat": "Tấm pin quang điện"}, {"term": "Tấm pin hai mặt (bifacial)", "def": "có thể hấp thụ ánh sáng phản xạ ở cả mặt trước và mặt sau, tăng sản lượng", "cat": "Tấm pin quang điện"}, {"term": "Hệ số nhiệt độ công suất (temperature coefficient of power)", "def": "mức suy giảm công suất của tấm pin khi nhiệt độ tăng, thường khoảng -0.25% đến -0.45%/°C (tuỳ công nghệ; xem datasheet)", "cat": "Tấm pin quang điện"}, {"term": "Suy hao LID (Light Induced Degradation)", "def": "hiện tượng công suất tấm pin giảm nhẹ trong thời gian đầu tiếp xúc ánh sáng", "cat": "Tấm pin quang điện"}, {"term": "Bức xạ mặt trời trực xạ và tán xạ", "def": "trực xạ là ánh sáng chiếu thẳng, tán xạ là ánh sáng bị khuếch tán qua mây/khí quyển", "cat": "Tấm pin quang điện"}, {"term": "Diode bypass trong tấm pin", "def": "giúp dòng điện đi vòng qua chuỗi tế bào bị che bóng, giảm nguy cơ hotspot", "cat": "Tấm pin quang điện"}, {"term": "Hiện tượng hotspot trên tấm pin", "def": "điểm nóng cục bộ hình thành khi một phần tế bào bị che bóng và tiêu thụ ngược công suất, có thể gây cháy", "cat": "Tấm pin quang điện"}, {"term": "Hiện tượng PID (Potential Induced Degradation)", "def": "suy giảm hiệu suất tấm pin do chênh lệch điện thế giữa tế bào và khung/đất gây rò rỉ dòng điện", "cat": "Tấm pin quang điện"}, {"term": "Biến tần chuỗi (string inverter)", "def": "chuyển đổi DC-AC cho một hoặc vài chuỗi tấm pin, dùng phổ biến cho hệ dân dụng và thương mại vừa", "cat": "Biến tần"}, {"term": "Biến tần trung tâm (central inverter)", "def": "công suất lớn, dùng cho nhà máy điện mặt trời quy mô lớn, gom nhiều chuỗi pin về một biến tần", "cat": "Biến tần"}, {"term": "Biến tần vi mô (microinverter)", "def": "lắp gắn liền hoặc gần mỗi tấm pin, chuyển đổi DC-AC ngay tại tấm pin, tối ưu hiệu suất khi bị che bóng cục bộ", "cat": "Biến tần"}, {"term": "Biến tần hybrid (hybrid inverter)", "def": "tích hợp khả năng kết nối cả tấm pin, pin lưu trữ và lưới điện trong một thiết bị", "cat": "Biến tần"}, {"term": "Công nghệ MPPT (Maximum Power Point Tracking)", "def": "thuật toán dò điểm công suất cực đại để biến tần khai thác tối đa công suất từ tấm pin theo điều kiện thực tế", "cat": "Biến tần"}, {"term": "Nhiều bộ điều khiển MPPT độc lập trên một biến tần", "def": "cho phép đấu các chuỗi pin có hướng/góc nghiêng khác nhau mà không ảnh hưởng lẫn nhau", "cat": "Biến tần"}, {"term": "Hiệu suất Euro (Euro efficiency) của biến tần", "def": "chỉ số hiệu suất trung bình có trọng số theo các mức tải khác nhau, phản ánh hiệu suất thực tế tốt hơn hiệu suất đỉnh", "cat": "Biến tần"}, {"term": "Tổng độ méo hài dòng điện THD (Total Harmonic Distortion) của biến tần", "def": "chỉ số đánh giá chất lượng sóng điện AC đầu ra, càng thấp càng tốt, tiêu chuẩn thường yêu cầu dưới 5%", "cat": "Biến tần"}, {"term": "Chức năng chống đảo lưới (anti-islanding) của biến tần hòa lưới", "def": "tự động ngắt kết nối biến tần khỏi lưới khi mất điện lưới để đảm bảo an toàn cho người sửa chữa", "cat": "Biến tần"}, {"term": "Cấp bảo vệ IP65 trên biến tần", "def": "chống bụi hoàn toàn và chống tia nước áp lực thấp từ mọi hướng, phù hợp lắp ngoài trời", "cat": "Biến tần"}, {"term": "Tỉ lệ DC/AC (DC oversizing ratio) khi thiết kế hệ thống", "def": "tỉ lệ công suất DC tấm pin so với công suất AC định mức biến tần, thường thiết kế khoảng 1.1–1.3 (giới hạn tối đa theo datasheet của biến tần)", "cat": "Biến tần"}, {"term": "Hiện tượng clipping (cắt công suất) ở biến tần", "def": "xảy ra khi công suất DC vượt quá công suất AC định mức, phần vượt bị giới hạn không sử dụng được", "cat": "Biến tần"}, {"term": "Điện áp đầu vào DC tối đa cho phép của biến tần (Max DC input voltage)", "def": "giới hạn điện áp hở mạch tổng của chuỗi pin không được vượt qua, đặc biệt quan trọng khi trời lạnh", "cat": "Biến tần"}, {"term": "Chế độ chờ đêm (night mode / standby) của biến tần", "def": "biến tần ngừng chuyển đổi công suất khi không có bức xạ nhưng vẫn có thể tiêu thụ điện tự dùng rất nhỏ", "cat": "Biến tần"}, {"term": "Giám sát biến tần qua ứng dụng/nền tảng online", "def": "cho phép theo dõi sản lượng, cảnh báo lỗi và hiệu suất từng chuỗi pin theo thời gian thực", "cat": "Biến tần"}, {"term": "Tuổi thọ trung bình của biến tần chuỗi", "def": "thường khoảng 10–15 năm, ngắn hơn tuổi thọ tấm pin (khoảng 25 năm)", "cat": "Biến tần"}, {"term": "Pin lithium sắt phốt phát LiFePO4 (LFP)", "def": "có độ ổn định nhiệt cao, an toàn hơn, tuổi thọ chu kỳ dài, thường 3000-6000 chu kỳ", "cat": "Pin lưu trữ"}, {"term": "Pin NMC (Nickel Manganese Cobalt)", "def": "mật độ năng lượng cao hơn LFP nhưng độ ổn định nhiệt thấp hơn, thường dùng trong xe điện", "cat": "Pin lưu trữ"}, {"term": "Độ sâu xả pin DoD (Depth of Discharge)", "def": "tỷ lệ phần trăm dung lượng pin đã sử dụng so với dung lượng định mức", "cat": "Pin lưu trữ"}, {"term": "Trạng thái sạc SOC (State of Charge)", "def": "phần trăm dung lượng hiện tại còn lại trong pin so với dung lượng đầy", "cat": "Pin lưu trữ"}, {"term": "Trạng thái sức khỏe pin SOH (State of Health)", "def": "chỉ số phản ánh dung lượng thực tế còn lại so với dung lượng ban đầu khi pin mới, đánh giá mức độ suy hao", "cat": "Pin lưu trữ"}, {"term": "Hệ thống quản lý pin BMS (Battery Management System)", "def": "giám sát và bảo vệ pin khỏi sạc/xả quá mức, quá nhiệt, cân bằng điện áp giữa các cell", "cat": "Pin lưu trữ"}, {"term": "Cân bằng cell (cell balancing) trong BMS", "def": "quá trình điều chỉnh để các cell trong pack có điện áp đồng đều, tránh cell yếu bị quá tải", "cat": "Pin lưu trữ"}, {"term": "Chu kỳ sạc-xả (cycle life) của pin lưu trữ", "def": "số lần sạc-xả pin có thể chịu được trước khi dung lượng suy giảm xuống mức quy định (thường 80%)", "cat": "Pin lưu trữ"}, {"term": "Tốc độ sạc/xả C-rate của pin", "def": "tỷ lệ dòng điện sạc/xả so với dung lượng danh định pin, ví dụ 1C nghĩa là xả hết dung lượng trong 1 giờ", "cat": "Pin lưu trữ"}, {"term": "Pin chì-axit (lead-acid) dùng trong lưu trữ năng lượng mặt trời", "def": "chi phí đầu tư thấp nhưng tuổi thọ ngắn hơn, DoD khuyến nghị thường chỉ khoảng 50% để kéo dài tuổi thọ", "cat": "Pin lưu trữ"}, {"term": "Pin lưu trữ ghép nối tiếp", "def": "tăng điện áp tổng của hệ thống pin lưu trữ trong khi dung lượng Ah giữ nguyên", "cat": "Pin lưu trữ"}, {"term": "Pin lưu trữ ghép song song", "def": "tăng dung lượng Ah tổng trong khi điện áp giữ nguyên", "cat": "Pin lưu trữ"}, {"term": "Nhiệt độ vận hành khuyến nghị của pin lithium", "def": "thường trong khoảng 0°C đến 45°C khi sạc, cần có hệ thống quản lý nhiệt phù hợp", "cat": "Pin lưu trữ"}, {"term": "Hiện tượng thoát nhiệt mất kiểm soát (thermal runaway) ở pin lithium", "def": "phản ứng dây chuyền sinh nhiệt mất kiểm soát có thể dẫn đến cháy nổ, thường do quá nhiệt, quá sạc hoặc hư hỏng cơ học", "cat": "Pin lưu trữ"}, {"term": "Công suất định mức (kW) so với dung lượng (kWh) của hệ thống lưu trữ", "def": "kW thể hiện công suất tức thời có thể xuất/nạp, kWh thể hiện tổng năng lượng lưu trữ được", "cat": "Pin lưu trữ"}, {"term": "Vị trí lắp đặt pin lưu trữ lithium trong nhà", "def": "nên đặt nơi thông thoáng, tránh ánh nắng trực tiếp, xa vật liệu dễ cháy và tuân thủ khoảng cách an toàn theo hướng dẫn nhà sản xuất", "cat": "Pin lưu trữ"}, {"term": "Hệ thống chữa cháy cho phòng đặt pin lưu trữ quy mô lớn", "def": "cần thiết kế riêng do đám cháy pin lithium khó dập bằng phương pháp thông thường và có thể tái cháy", "cat": "Pin lưu trữ"}, {"term": "Góc nghiêng tối ưu lắp đặt tấm pin", "def": "thường được chọn gần bằng vĩ độ địa lý để tối ưu sản lượng cả năm; với mái nhà tại Việt Nam thường chọn góc nhỏ khoảng 10–15° để vừa đủ sản lượng vừa tự làm sạch bụi và hạn chế tải gió", "cat": "Lắp đặt"}, {"term": "Hướng lắp đặt tấm pin ở Bắc bán cầu", "def": "thường hướng về phía Nam để tối ưu hấp thụ bức xạ mặt trời trong ngày", "cat": "Lắp đặt"}, {"term": "Khoảng cách hàng tấm pin để tránh che bóng lẫn nhau", "def": "tính toán dựa trên góc cao mặt trời thấp nhất trong năm và chiều cao tấm pin", "cat": "Lắp đặt"}, {"term": "Hệ khung giá đỡ (mounting structure) cho mái tôn", "def": "cần dùng kẹp/bát chuyên dụng phù hợp với loại tôn để đảm bảo chống thấm và chịu tải gió", "cat": "Lắp đặt"}, {"term": "Hệ khung giá đỡ cho mái bê tông", "def": "thường dùng đế bê tông đối trọng (ballast) hoặc bắt vít neo tùy theo tải gió và kết cấu mái", "cat": "Lắp đặt"}, {"term": "Hệ thống điện mặt trời nổi trên mặt nước (floating solar)", "def": "sử dụng phao nổi chuyên dụng, tận dụng mặt nước hồ/hồ chứa, giúp giảm nhiệt độ vận hành tấm pin", "cat": "Lắp đặt"}, {"term": "Tiếp địa (grounding) hệ thống điện mặt trời", "def": "kết nối khung giá đỡ, vỏ biến tần và các bộ phận kim loại xuống đất nhằm bảo vệ chống điện giật và sét", "cat": "Lắp đặt"}, {"term": "Thiết bị chống sét lan truyền SPD (Surge Protection Device)", "def": "bảo vệ hệ thống khỏi xung điện áp đột biến do sét đánh gần hoặc do lưới điện, thường lắp cả phía DC và AC", "cat": "Lắp đặt"}, {"term": "Tủ điện DC combiner box", "def": "gom các chuỗi tấm pin lại trước khi đưa vào biến tần, thường tích hợp cầu chì/CB và chống sét DC", "cat": "Lắp đặt"}, {"term": "Dây cáp DC chuyên dụng cho điện mặt trời (PV cable)", "def": "chống chịu tia UV, chịu nhiệt độ cao, cách điện kép, phù hợp lắp đặt ngoài trời lâu dài", "cat": "Lắp đặt"}, {"term": "Đầu nối MC4 trong hệ thống điện mặt trời", "def": "đầu nối chuẩn cho cáp DC, chống nước, khóa chặt để tránh hồ quang điện và rò rỉ", "cat": "Lắp đặt"}, {"term": "Kích thước dây dẫn (tiết diện cáp) trong hệ thống điện mặt trời", "def": "chọn dựa trên dòng điện tối đa, chiều dài dây và giới hạn sụt áp cho phép", "cat": "Lắp đặt"}, {"term": "Sụt áp (voltage drop) trên đường dây DC dài", "def": "gây tổn hao công suất, cần tính toán tiết diện dây phù hợp để giữ sụt áp trong giới hạn cho phép", "cat": "Lắp đặt"}, {"term": "Biển cảnh báo và nhãn dán an toàn trên hệ thống điện mặt trời", "def": "bắt buộc dán tại tủ điện, điểm ngắt kết nối để cảnh báo nguy hiểm điện và hướng dẫn ngắt khẩn cấp", "cat": "Lắp đặt"}, {"term": "Khoảng cách lối đi an toàn trên mái cho lính cứu hỏa (fire setback)", "def": "chừa lối đi quanh rìa mái và giữa các dãy pin theo quy định PCCC để lính cứu hỏa tiếp cận khi cần", "cat": "Lắp đặt"}, {"term": "Công tắc ngắt nhanh (rapid shutdown) theo tiêu chuẩn an toàn", "def": "cho phép hạ điện áp dây DC xuống mức an toàn nhanh chóng khi có sự cố hoặc để lính cứu hỏa thao tác", "cat": "Lắp đặt"}, {"term": "Kiểm tra cách điện (insulation resistance test) trước khi nghiệm thu hệ thống", "def": "đo điện trở cách điện giữa dây dẫn và đất để phát hiện rò rỉ điện trước khi đưa vào vận hành", "cat": "Lắp đặt"}, {"term": "Chứng nhận nghiệm thu và hòa lưới với công ty điện lực", "def": "cần hồ sơ kỹ thuật, kiểm tra bảo vệ chống đảo lưới và thỏa thuận đấu nối trước khi chính thức hòa lưới", "cat": "Lắp đặt"}, {"term": "Cơ chế bù trừ điện năng (net metering)", "def": "điện dư phát lên lưới được ghi nhận và bù trừ với điện tiêu thụ từ lưới theo chu kỳ thanh toán; cơ chế này tuỳ quốc gia và quy định từng thời kỳ, không phải nơi nào cũng áp dụng — cần xem quy định hiện hành tại địa phương", "cat": "Đấu nối lưới điện"}, {"term": "Tiêu chuẩn an toàn IEC 62109 cho biến tần điện mặt trời", "def": "quy định các yêu cầu an toàn điện đối với bộ chuyển đổi công suất dùng trong hệ thống quang điện", "cat": "Đấu nối lưới điện"}, {"term": "Chứng nhận UL 1741 cho biến tần tại thị trường Mỹ", "def": "chứng nhận về an toàn và khả năng tương tác lưới điện của thiết bị chuyển đổi năng lượng phân tán", "cat": "Đấu nối lưới điện"}, {"term": "Tiêu chuẩn IEC 61730 cho tấm pin quang điện", "def": "quy định về an toàn kết cấu và điện của module quang điện", "cat": "Đấu nối lưới điện"}, {"term": "Thỏa thuận đấu nối (interconnection agreement) với đơn vị điện lực", "def": "văn bản quy định điều kiện kỹ thuật và thương mại để hệ thống điện mặt trời được phép hòa vào lưới điện", "cat": "Đấu nối lưới điện"}, {"term": "Công tơ hai chiều (bidirectional meter)", "def": "đo được cả điện năng tiêu thụ từ lưới và điện năng phát ngược lên lưới", "cat": "Đấu nối lưới điện"}, {"term": "Đơn vị kWp và kWh trong điện mặt trời", "def": "kWp đo công suất lắp đặt của hệ thống, kWh đo lượng điện năng tạo ra theo thời gian", "cat": "Kiến thức cơ bản"}, {"term": "Hệ thống điện mặt trời quy mô hộ gia đình (dân dụng)", "def": "thường có công suất từ vài kWp đến khoảng 10-20 kWp, lắp trên mái nhà ở", "cat": "Kiến thức cơ bản"}, {"term": "Hệ thống điện 1 pha và 3 pha khi lắp điện mặt trời", "def": "hệ 1 pha dùng cho tải sinh hoạt nhỏ, hệ 3 pha dùng cho tải công suất lớn hoặc cân bằng pha tốt hơn", "cat": "Kiến thức cơ bản"}, {"term": "Tủ điện tổng (AC distribution board) trong hệ thống điện mặt trời", "def": "nơi tập trung đấu nối giữa biến tần, tải tiêu thụ và lưới điện, có CB bảo vệ tổng", "cat": "Kiến thức cơ bản"}, {"term": "Thời gian hoàn vốn (payback period) của hệ thống điện mặt trời", "def": "khoảng thời gian để tiền tiết kiệm/bán điện bù lại chi phí đầu tư ban đầu, thường vài năm tùy quy mô và giá điện", "cat": "Kiến thức cơ bản"}, {"term": "Tổn hao hệ thống (system losses) trong thiết kế điện mặt trời", "def": "bao gồm tổn hao do dây dẫn, nhiệt độ, bụi bẩn, hiệu suất biến tần... khiến sản lượng thực tế thấp hơn lý thuyết", "cat": "Kiến thức cơ bản"}, {"term": "Sản lượng điện theo mùa trong năm tại Việt Nam", "def": "ở miền Nam thường cao hơn vào mùa khô (nắng nhiều) và thấp hơn vào mùa mưa do bức xạ giảm; ở miền Bắc sản lượng thường cao vào mùa hè và thấp vào mùa đông/âm u", "cat": "Kiến thức cơ bản"}, {"term": "Bức xạ mặt trời trung bình tại các tỉnh miền Nam Việt Nam", "def": "thuộc nhóm khá cao so với cả nước, thuận lợi cho phát triển điện mặt trời", "cat": "Kiến thức cơ bản"}, {"term": "Vai trò của bản vẽ thiết kế (single line diagram) hệ thống điện mặt trời", "def": "thể hiện sơ đồ đấu nối tổng thể từ tấm pin, biến tần đến tủ điện và lưới điện, phục vụ thi công và nghiệm thu", "cat": "Kiến thức cơ bản"}, {"term": "Khung nhôm (aluminum frame) của tấm pin", "def": "tạo độ cứng vững, chống chịu thời tiết và là điểm để bắt kẹp cố định vào khung giá đỡ", "cat": "Tấm pin quang điện"}, {"term": "Lớp kính cường lực mặt trước tấm pin", "def": "bảo vệ lớp tế bào quang điện bên trong, cho ánh sáng xuyên qua với độ truyền quang cao", "cat": "Tấm pin quang điện"}, {"term": "Số lượng tế bào (cell) phổ biến trên một tấm pin dân dụng", "def": "thường là 60 hoặc 72 tế bào (loại nguyên tế bào), hoặc 120/132/144 (loại half-cut) tuỳ dòng sản phẩm", "cat": "Tấm pin quang điện"}, {"term": "Công nghệ half-cut cell (cắt đôi tế bào)", "def": "giảm tổn hao điện trở, tăng hiệu suất nhẹ và giảm ảnh hưởng khi bị che bóng một phần", "cat": "Tấm pin quang điện"}, {"term": "Tiêu chuẩn IEC 61215 đối với tấm pin quang điện", "def": "quy định về độ bền và hiệu năng thiết kế của module quang điện mặt đất, kiểm tra qua các bài test khắc nghiệt", "cat": "Tấm pin quang điện"}, {"term": "Biến tần 1 pha và biến tần 3 pha", "def": "biến tần 1 pha phù hợp công suất nhỏ, biến tần 3 pha phù hợp công suất lớn và giúp cân bằng tải giữa các pha", "cat": "Biến tần"}, {"term": "Màn hình hiển thị (LCD/LED) trên biến tần", "def": "cho phép xem nhanh thông số vận hành như công suất, điện áp, mã lỗi ngay tại chỗ", "cat": "Biến tần"}, {"term": "Kết nối Wifi/4G/Ethernet trên biến tần hiện đại", "def": "cho phép truyền dữ liệu vận hành lên nền tảng giám sát từ xa qua internet", "cat": "Biến tần"}, {"term": "Quạt tản nhiệt trên biến tần công suất lớn", "def": "giúp làm mát linh kiện bên trong, kéo dài tuổi thọ và duy trì hiệu suất khi tải cao", "cat": "Biến tần"}, {"term": "Cập nhật firmware (phần mềm điều khiển) cho biến tần", "def": "giúp cải thiện hiệu suất, sửa lỗi và bổ sung tính năng mới theo khuyến nghị nhà sản xuất", "cat": "Biến tần"}, {"term": "Pin AGM (Absorbent Glass Mat)", "def": "một dạng pin chì-axit kín khí, ít bảo trì hơn pin chì-axit nước thông thường", "cat": "Pin lưu trữ"}, {"term": "Pin Gel (Gel Cell)", "def": "dùng chất điện phân dạng gel, chịu rung động tốt và ít rò rỉ hơn pin nước thông thường", "cat": "Pin lưu trữ"}, {"term": "Đơn vị Ah (Ampere-hour) trên pin lưu trữ", "def": "thể hiện dung lượng pin theo dòng điện xả trong một giờ, kết hợp với điện áp để tính ra Wh", "cat": "Pin lưu trữ"}, {"term": "Kết nối nhiều pack pin lưu trữ song song an toàn", "def": "cần các pack có cùng điện áp, cùng SOC và lý tưởng là cùng model để tránh dòng cân bằng lớn gây hư hỏng", "cat": "Pin lưu trữ"}, {"term": "Tủ rack lắp đặt pin lưu trữ dạng module", "def": "giúp sắp xếp gọn gàng, dễ bảo trì và mở rộng dung lượng khi cần trong tương lai", "cat": "Pin lưu trữ"}, {"term": "Khoan mái khi lắp hệ khung giá đỡ", "def": "cần chống thấm kỹ tại điểm khoan bằng keo/silicone chuyên dụng để tránh dột về sau", "cat": "Lắp đặt"}, {"term": "Ống luồn dây (conduit) bảo vệ cáp điện mặt trời", "def": "bảo vệ dây cáp khỏi tác động cơ học, tia UV và động vật gặm nhấm khi đi ngoài trời hoặc âm tường", "cat": "Lắp đặt"}, {"term": "Biển hiệu công trình đang thi công điện mặt trời", "def": "cảnh báo người xung quanh về khu vực nguy hiểm, hạn chế người không phận sự vào công trường", "cat": "Lắp đặt"}, {"term": "Giấy phép/thủ tục pháp lý khi lắp đặt điện mặt trời mái nhà", "def": "tùy quy định địa phương có thể cần thông báo hoặc xin phép trước khi thi công và trước khi đấu nối lưới", "cat": "Lắp đặt"}, {"term": "Kiểm tra tải trọng mái trước khi lắp hệ thống điện mặt trời", "def": "cần đánh giá khả năng chịu lực của kết cấu mái để đảm bảo an toàn khi thêm tải trọng tấm pin và khung giá đỡ", "cat": "Lắp đặt"}, {"term": "Giá FIT (Feed-in Tariff) trong điện mặt trời", "def": "mức giá ưu đãi mua điện từ các dự án năng lượng tái tạo do cơ quan có thẩm quyền quy định theo từng giai đoạn", "cat": "Đấu nối lưới điện"}, {"term": "Hợp đồng mua bán điện PPA (Power Purchase Agreement)", "def": "thỏa thuận giữa bên bán điện (chủ đầu tư) và bên mua điện về giá, sản lượng và điều kiện mua bán điện", "cat": "Đấu nối lưới điện"}, {"term": "Quy định giới hạn công suất lắp đặt theo diện tích/kết cấu mái", "def": "một số quy định giới hạn công suất lắp đặt điện mặt trời mái nhà theo khả năng chịu tải hoặc công suất tiêu thụ để đảm bảo an toàn lưới điện", "cat": "Đấu nối lưới điện"}];
const GUIDE_SAFETY = [{"term": "Trang bị bảo hộ cá nhân (PPE) khi lắp đặt điện mặt trời trên mái", "def": "bao gồm dây đai an toàn chống rơi ngã, giày cách điện, găng tay cách điện, mũ bảo hộ"}, {"term": "Nguy cơ hồ quang điện DC (DC arc flash)", "def": "hồ quang điện một chiều khó dập tắt hơn AC do không có điểm qua zero, nguy hiểm cao khi đấu nối/tháo dỡ có tải"}, {"term": "Quy trình khóa/gắn thẻ cách ly LOTO (Lockout-Tagout)", "def": "cách ly và gắn thẻ cảnh báo nguồn điện trước khi bảo trì để tránh cấp điện bất ngờ gây tai nạn"}, {"term": "Đặc điểm nguy hiểm của tấm pin quang điện khi có ánh sáng", "def": "tấm pin vẫn sinh ra điện áp DC ngay khi có ánh sáng chiếu vào, kể cả khi biến tần đã tắt, nên vẫn có nguy cơ điện giật"}, {"term": "Che phủ tấm pin trong quá trình thi công/bảo trì", "def": "dùng vải/bạt tối màu che kín tấm pin để giảm mạnh dòng và điện áp, nhưng không đảm bảo về 0V (ánh sáng lọt qua vẫn sinh điện) — vẫn phải coi tấm pin và dây DC là đang mang điện"}, {"term": "Nguy cơ khi làm việc trên mái dốc, mái cao", "def": "nguy cơ rơi ngã là mối nguy hàng đầu, cần lan can, dây đai an toàn và điểm neo chắc chắn"}, {"term": "Đo kiểm bằng đồng hồ vạn năng trước khi thao tác trên hệ thống DC", "def": "dùng đồng hồ đúng cấp đo lường (CAT) và dải điện áp DC của hệ thống để xác nhận không còn điện áp nguy hiểm trước khi chạm vào dây dẫn hoặc đầu nối"}, {"term": "Khoảng cách an toàn với đường dây điện cao thế khi thi công", "def": "phải tuân thủ khoảng cách tối thiểu theo quy định để tránh phóng điện, đặc biệt khi dùng thang, giàn giáo kim loại"}, {"term": "Rủi ro khi đấu nối tấm pin có cực tính (phân cực) sai", "def": "có thể gây hỏng biến tần, hồ quang điện hoặc cháy nổ do dòng điện ngược"}, {"term": "Sử dụng thang và giàn giáo khi thi công điện mặt trời", "def": "phải đảm bảo chắc chắn, đúng tải trọng cho phép và có người hỗ trợ giám sát an toàn"}, {"term": "Biện pháp phòng ngừa điện giật khi trời mưa/ẩm ướt", "def": "nên tạm dừng thi công phần điện khi trời mưa hoặc bề mặt ẩm ướt để giảm nguy cơ điện giật và trơn trượt"}, {"term": "Kiểm tra định kỳ hệ thống chống sét và tiếp địa", "def": "cần đo điện trở tiếp địa định kỳ để đảm bảo giá trị đạt yêu cầu theo quy định"}, {"term": "An toàn khi làm việc gần tủ điện AC đang mang điện", "def": "cần cách ly nguồn hoặc sử dụng công cụ cách điện chuyên dụng, tuân thủ khoảng cách an toàn"}, {"term": "Quy tắc làm việc theo cặp (buddy system) khi thi công trên cao", "def": "luôn có ít nhất hai người khi làm việc trên mái hoặc gần điện áp cao để hỗ trợ trong tình huống khẩn cấp"}, {"term": "Biện pháp phòng cháy khi lắp đặt gần vật liệu dễ cháy trên mái", "def": "giữ khoảng cách an toàn, tránh phát sinh tia lửa hàn/cắt gần vật liệu dễ cháy như lớp cách nhiệt trên mái"}, {"term": "Bình chữa cháy phù hợp cho sự cố điện", "def": "nên dùng loại CO2 hoặc bột khô (không dẫn điện), tránh dùng bình chữa cháy gốc nước khi thiết bị còn mang điện"}, {"term": "Huấn luyện an toàn điện định kỳ cho đội thi công", "def": "giúp cập nhật quy trình, nhắc lại kỹ năng xử lý tình huống và giảm nguy cơ tai nạn lao động"}, {"term": "Nguyên tắc cơ bản khi xử lý nạn nhân bị điện giật", "def": "nhanh chóng ngắt nguồn điện trước khi tiếp cận; nếu không ngắt được thì dùng vật cách điện khô (gậy gỗ, nhựa) gạt dây ra, không chạm trực tiếp vào nạn nhân; sau đó sơ cứu và gọi cấp cứu"}, {"term": "Biển báo nguy hiểm điện cao thế gần khu vực thi công", "def": "cảnh báo khoảng cách nguy hiểm để công nhân và thiết bị thi công giữ khoảng cách an toàn"}, {"term": "Kiểm tra tình trạng dây đai an toàn trước mỗi lần sử dụng", "def": "phát hiện sớm dấu hiệu sờn, rách, hư hỏng móc khóa để tránh rủi ro khi làm việc trên cao"}, {"term": "Thứ tự ngắt điện khi bảo trì biến tần hòa lưới", "def": "ngắt CB phía AC trước, sau đó ngắt công tắc DC, rồi chờ thời gian xả tụ theo sách hướng dẫn của biến tần (thường vài phút) trước khi mở nắp; vì tấm pin vẫn sinh điện nên vẫn kiểm tra điện áp trước khi chạm"}, {"term": "Không cắm/rút đầu nối MC4 khi đang có tải", "def": "rút đầu nối DC khi biến tần đang chạy có thể gây hồ quang; phải ngắt công tắc DC của biến tần trước khi cắm hoặc rút MC4"}, {"term": "Mất điện lưới không có nghĩa hệ thống đã an toàn", "def": "tấm pin vẫn phát điện khi có nắng, hệ có pin/hybrid hoặc máy phát có thể vẫn cấp điện ngược; luôn cách ly mọi nguồn (lưới, DC, pin, máy phát) và kiểm tra không điện trước khi thao tác"}];

const GUIDE_LOGGER_BRANDS = [
  {
    id: 'huawei', name: 'Huawei — SmartLogger3000', color: '#C7000B', badge: 'HW',
    app: 'Cấu hình qua trình duyệt (IP nội bộ của SmartLogger) + app FusionSolar để nghiệm thu',
    steps: [
      '<b>Đấu nối:</b> Đấu chuỗi RS485 (COM1–COM3 hoặc COM1–COM6 tuỳ đời) nối tiếp (daisy-chain) từ SmartLogger đến các inverter SUN2000 — cực <b>RS485A (+)</b> nối A, <b>RS485B (–)</b> nối B. Mỗi tuyến RS485 nên đi khoảng <b>30 thiết bị trở xuống</b> để tín hiệu ổn định (xem giới hạn chính xác theo tài liệu từng đời).',
      'Theo thông số của Huawei: SmartLogger3000A quản lý tối đa <b>80 thiết bị</b>; SmartLogger3000B quản lý tối đa <b>150 inverter</b> (tổng 200 thiết bị, tính cả trạm khí tượng, công tơ…).',
      '<b>Cấp nguồn</b> cho SmartLogger, kết nối cổng WAN/LAN vào mạng internet (hoặc dùng SIM 4G nếu là bản có modem).',
      '<b>Cấu hình:</b> Dùng trình duyệt truy cập vào địa chỉ IP của SmartLogger (mặc định: cổng <b>WAN</b> là <b>192.168.0.10</b>, cổng LAN là 192.168.8.10; đặt IP máy tính cùng dải, ví dụ 192.168.0.x), mở bằng <b>https://</b>, đăng nhập tài khoản <b>admin</b> với mật khẩu ban đầu <b>"Changeme"</b> — hệ thống bắt đổi mật khẩu ngay lần đăng nhập đầu, nên ghi lại cẩn thận.',
      'Vào mục "Cài đặt nhanh"/"Quick Settings": cấu hình từng cổng RS485 đang dùng (giao thức Modbus-RTU, tốc độ baud khớp với inverter — thường là 9600) rồi dùng chức năng <b>dò tìm thiết bị (Auto search)</b> để thêm inverter.',
      'Gán <b>địa chỉ Modbus riêng biệt</b> (không trùng) cho từng inverter trong chuỗi — đây là bước hay bị bỏ sót gây lỗi "mất thiết bị" trên hệ thống.',
      '<b>Sử dụng:</b> Đăng nhập app FusionSolar → Commissioning → quét mã QR/nhập serial SmartLogger để đưa vào "Nhà máy điện" trên FusionSolar, theo dõi tất cả inverter qua cùng 1 SmartLogger.',
    ],
    note: 'Nếu một inverter "biến mất" khỏi danh sách sau khi thêm inverter mới, khả năng cao là bị trùng địa chỉ Modbus — kiểm tra lại từng địa chỉ trong chuỗi RS485.',
  },
  {
    id: 'sungrow', name: 'Sungrow — Logger1000A/B', color: '#FF6A00', badge: 'SG',
    app: 'Có Web server tích hợp sẵn — cấu hình trực tiếp qua trình duyệt, không bắt buộc cài app',
    steps: [
      '<b>Đấu nối:</b> Đấu RS485 nối tiếp (daisy-chain) từ Logger (có 3 cổng RS485) đến tối đa <b>30 thiết bị</b> tính chung (inverter, combiner box, công tơ điện, trạm khí tượng).',
      'Chỉ bật <b>điện trở đầu cuối 120Ω (termination resistor)</b> ở thiết bị CUỐI CÙNG trong chuỗi — các thiết bị ở giữa phải tắt để tránh nhiễu tín hiệu.',
      '<b>Cấp nguồn</b> cho Logger, chọn cách đưa lên mạng tuỳ bản: cổng Ethernet (LAN), WiFi, hoặc 4G (chỉ một số bản có SIM — xem model bạn đang dùng).',
      '<b>Cấu hình:</b> Kết nối máy tính/điện thoại vào cùng mạng LAN với Logger (hoặc vào WiFi do Logger phát ra), mở trình duyệt truy cập địa chỉ IP của Logger.',
      'Đăng nhập vào giao diện web tích hợp sẵn, hệ thống sẽ <b>tự động dò và gán địa chỉ Modbus</b> cho các thiết bị trong chuỗi RS485 (Automatic Modbus Address Distribution) — không cần gán thủ công như một số hãng khác.',
      'Chọn phương thức kết nối internet (Ethernet/WiFi/4G), nhập thông tin mạng nếu dùng WiFi.',
      '<b>Sử dụng:</b> Vào app iSolarCloud, tạo trạm điện mới và gắn Logger vào trạm để theo dõi toàn bộ thiết bị qua 1 điểm quản lý duy nhất.',
    ],
    note: 'Ưu điểm của Sungrow Logger là tự động gán địa chỉ Modbus, đỡ mất công cấu hình thủ công từng inverter như một số hãng khác.',
  },
  {
    id: 'goodwe', name: 'GoodWe — EzLogger3000C', color: '#0072BC', badge: 'GW',
    app: 'Cấu hình qua app SolarGo + giao diện web nhúng trên logger',
    steps: [
      '<b>Đấu nối:</b> EzLogger3000C có <b>4 cổng RS485</b>, đấu nối tiếp nhiều inverter GoodWe (có thể trộn lẫn đời cũ và mới) — tổng cộng quản lý được tối đa <b>100 thiết bị</b>.',
      '<b>Cấp nguồn</b> cho Logger (nguồn 100–240V AC qua adapter), nối mạng qua <b>2 cổng LAN (Ethernet)</b> — nên dùng cáp LAN; có bản hỗ trợ thêm 4G. WiFi của Logger chủ yếu dùng để cấu hình/bảo trì tại chỗ.',
      '<b>Cấu hình lần đầu:</b> Kết nối điện thoại vào mạng WiFi bảo trì do Logger phát ra, mở app <b>SolarGo</b> (hoặc giao diện web nhúng) để dò và kết nối thiết bị.',
      'Trong SolarGo/giao diện web, đặt cấu hình mạng cho Logger (IP, kết nối LAN hoặc 4G) và dò thêm các inverter trên 4 cổng RS485.',
      'Có thể mở giao diện web nhúng của Logger (qua địa chỉ IP nội bộ) để xem/chỉnh thông số nâng cao nếu cần.',
      '<b>Sử dụng:</b> Logger gửi dữ liệu lên <b>SEMS Portal/SEMS+</b>, đồng thời hỗ trợ các giao thức Modbus-TCP, IEC 60870-5-104 để tích hợp với hệ thống giám sát/SCADA bên thứ ba khi chủ đầu tư yêu cầu.',
    ],
    note: 'EzLogger3000C là dòng phù hợp cho hệ thống thương mại có nhiều inverter GoodWe đời khác nhau trong cùng một công trình.',
  },
  {
    id: 'sma', name: 'SMA — Data Manager M', color: '#E2001A', badge: 'SMA',
    app: 'Cấu hình qua webserver nội bộ + Sunny Portal powered by ennexOS',
    steps: [
      '<b>Đấu nối:</b> SMA Data Manager M (EDMM-20) kết nối các biến tần qua chuẩn <b>Speedwire (Ethernet)</b> — khác với RS485 của Huawei/Sungrow/GoodWe. Có thể đấu qua switch mạng thông thường, hỗ trợ tối đa <b>50 thiết bị SMA</b> (bản EDMM-20; bản EDMM-10 giới hạn thấp hơn, xem sách hướng dẫn).',
      'Có cổng RS485 (Modbus RTU/SMA Data1) để đọc thêm công tơ điện/cảm biến môi trường, và có thể đọc thiết bị SunSpec Modbus của hãng khác.',
      '<b>Cấp nguồn</b> cho Data Manager M, nối cổng mạng vào cùng mạng LAN với các biến tần SMA và vào internet. Máy có WiFi (access point) để chạy trình hướng dẫn cấu hình tại chỗ.',
      'Data Manager M có khả năng <b>tự động dò tìm (auto-detect)</b> mọi biến tần SMA tương thích đang có trong cùng mạng Speedwire — không cần khai báo địa chỉ thủ công từng máy.',
      '<b>Cấu hình:</b> Truy cập webserver nội bộ của Data Manager M qua trình duyệt để đặt tên hệ thống, kiểm tra danh sách thiết bị đã nhận diện.',
      '<b>Sử dụng:</b> Đăng ký hệ thống trên <b>Sunny Portal powered by ennexOS</b>, gắn Data Manager M vào để giám sát tập trung toàn bộ biến tần trong công trình qua 1 điểm quản lý.',
    ],
    note: 'Vì dùng Speedwire (Ethernet) thay vì RS485, SMA Data Manager M thường dễ mở rộng và ít lỗi nhiễu tín hiệu hơn so với kiểu đấu nối tiếp RS485 truyền thống — nhưng cần hạ tầng mạng LAN/switch đi kèm.',
  },
];

function accordionListHtml(brands, prefix){
  return brands.map(b => `
    <div class="guide-brand" id="${prefix}-${b.id}">
      <div class="guide-brand-head" onclick="toggleGuideBrand('${prefix}-${b.id}')">
        <span class="logo-badge" style="background:${b.color};">${b.badge}</span>
        <span>${escapeHtml(b.name)}</span>
        <span class="chev">▾</span>
      </div>
      <div class="guide-brand-body">
        <div class="guide-brand-inner">
          <p class="guide-app">${escapeHtml(b.app)}</p>
          <ol class="guide-steps">${b.steps.map(s => `<li>${s}</li>`).join('')}</ol>
          <div class="guide-note">💡 ${b.note}</div>
        </div>
      </div>
    </div>`).join('');
}
const INV_TYPES = [['grid','⚡ Hòa lưới (on-grid)'],['hybrid','🔋 Lưu trữ (hybrid)'],['offgrid','🏝️ Độc lập (off-grid)']];
function inverterListHtml(){
  return GUIDE_INVERTERS.map(b => {
    const blocks = INV_TYPES.map(([k,label]) => {
      const t = b.types[k];
      if(!t) return `<details class="inv-type"><summary>${label}<small>Chưa có nội dung</small></summary><p class="inv-miss">${k==='offgrid'||k==='hybrid'||k==='grid' ? 'Hãng này chưa có dòng/tài liệu xác minh được cho loại này. Xem sách hướng dẫn đi kèm máy.' : ''}</p></details>`;
      return `<details class="inv-type"><summary>${label}<small>${escapeHtml(t.model)}</small></summary>
        <ol class="guide-steps">${t.steps.map(([x,v]) => `<li>${x}${v?'':' <span class="inv-unv">⚠ tuỳ model</span>'}</li>`).join('')}</ol>
        ${(t.tables||[]).map(tb => `<div class="inv-sub">📊 ${escapeHtml(tb.t)}</div><div class="inv-tbl"><table><thead><tr>${tb.c.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${tb.r.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}
        ${t.check ? `<div class="inv-sub">✅ Quy trình nghiệm thu</div>` + [['truoc_khi_bat','Trước khi bật nguồn'],['sau_khi_bat','Sau khi bật nguồn'],['ban_giao','Bàn giao']].filter(([k]) => t.check[k]).map(([k,l]) => `<div class="inv-chk"><b>${l}</b><ul>${t.check[k].map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('') : ''}
        ${t.errors ? `<div class="inv-sub">🚨 Mã lỗi hay gặp</div>` + t.errors.map(e => `<div class="inv-err"><b>${e.c}</b>${e.v?'':' <span class="inv-unv">⚠ tuỳ model</span>'}<div>${e.m}</div><div class="inv-fix">→ ${e.x}</div></div>`).join('') : ''}
        ${t.tips.length ? `<div class="guide-note">💡 ${t.tips.join('<br>💡 ')}</div>` : ''}</details>`;
    }).join('');
    return `
    <div class="guide-brand" id="inv-${b.id}">
      <div class="guide-brand-head" onclick="toggleGuideBrand('inv-${b.id}')">
        <span class="logo-badge" style="background:${b.color};">${b.badge}</span>
        <span>${escapeHtml(b.name)}</span><span class="chev">▾</span>
      </div>
      <div class="guide-brand-body"><div class="guide-brand-inner">
        ${b.app ? `<p class="guide-app">${escapeHtml(b.app)}</p>` : ''}
        ${blocks}
        ${b.missing ? `<p class="inv-miss">ℹ️ ${escapeHtml(b.missing)}</p>` : ''}
      </div></div>
    </div>`;
  }).join('');
}
function recalcAncestorTocHeight(el){
  // Dùng 'none' thay vì tính scrollHeight bằng px: vì khung con (guide-brand-body) đang
  // trong lúc chuyển động (CSS transition .3s) nên đo scrollHeight lúc này dễ bị sai số
  // (đo giữa chừng lúc khung con chưa giãn hết) — set thẳng 'không giới hạn' là cách chắc
  // chắn nhất, không phụ thuộc thời điểm đo.
  const tocItem = el.closest('.toc-item');
  if(tocItem && tocItem.classList.contains('open')){
    const tocBody = tocItem.querySelector('.toc-body');
    if(tocBody) tocBody.style.maxHeight = 'none';
  }
}
function toggleGuideBrand(id){
  const el = document.getElementById(id);
  if(!el) return;
  const willOpen = !el.classList.contains('open');
  document.querySelectorAll('.guide-brand.open').forEach(x => {
    x.classList.remove('open');
    const b = x.querySelector('.guide-brand-body'); if(b) b.style.maxHeight = '';
  });
  if(willOpen){
    el.classList.add('open');
    const body = el.querySelector('.guide-brand-body');
    requestAnimationFrame(()=>{
      body.style.maxHeight = body.scrollHeight + 'px';
      recalcAncestorTocHeight(el);
    });
  } else {
    recalcAncestorTocHeight(el);
  }
}

function glossaryHtml(items, groupByCat){
  if(!groupByCat){
    return items.map(it => `
      <div class="gl-item">
        <div class="gl-term">${escapeHtml(it.term)}</div>
        <div class="gl-def">${escapeHtml(it.def)}.</div>
      </div>`).join('');
  }
  const groups = {};
  items.forEach(it => { (groups[it.cat] = groups[it.cat] || []).push(it); });
  return Object.keys(groups).map(cat => `
    <div class="gl-group-title">${escapeHtml(cat)}</div>
    ${groups[cat].map(it => `
      <div class="gl-item">
        <div class="gl-term">${escapeHtml(it.term)}</div>
        <div class="gl-def">${escapeHtml(it.def)}.</div>
      </div>`).join('')}
  `).join('');
}

function drawingKey(d){
  return (d.title + ' ' + d.file).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}
function filterDrawings(q){
  const key = (q || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
  let n = 0;
  document.querySelectorAll('#drawing-grid .drawing-item').forEach((el) => {
    const show = !key || el.dataset.q.includes(key);
    el.style.display = show ? '' : 'none';
    if(show) n++;
  });
  const c = document.getElementById('drawing-count');
  if(c) c.textContent = key ? `Tìm thấy ${n} / ${GUIDE_DRAWINGS.length} bản vẽ` : `${GUIDE_DRAWINGS.length} bản vẽ · bấm vào hình để xem toàn màn hình và phóng to`;
}
let drawingZoom = 1;
function openDrawing(i){
  const d = GUIDE_DRAWINGS[i]; if(!d) return;
  document.getElementById('drawing-title').textContent = d.title;
  const img = document.getElementById('drawing-img');
  img.src = 'banve/' + d.file + '.png';
  document.getElementById('drawing-pdf').href = 'banve/' + d.file + '.pdf';
  setDrawingZoom(d.landscape && window.innerWidth < 700 ? 2 : 1);
  document.getElementById('drawing-scroll').scrollTo(0, 0);
  document.getElementById('drawing-backdrop').classList.add('show');
}
function closeDrawing(){ document.getElementById('drawing-backdrop').classList.remove('show'); }
function setDrawingZoom(z){
  drawingZoom = Math.max(1, Math.min(5, z));
  document.getElementById('drawing-img').style.width = (drawingZoom * 100) + '%';
  document.getElementById('drawing-zoom-label').textContent = Math.round(drawingZoom * 100) + '%';
}

/* ---------- Công cụ tính nhanh ---------- */
function numVal(id){ const v = parseFloat(String(document.getElementById(id).value).replace(',', '.')); return isFinite(v) ? v : NaN; }
function fmtN(x, d){ return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('vi-VN'); }
function calcString(){
  const voc = numVal('cs-voc'), vmp = numVal('cs-vmp'), k = numVal('cs-k'), tmin = numVal('cs-tmin'), tmax = numVal('cs-tmax'), vmax = numVal('cs-vmax'), mppt = numVal('cs-mppt');
  const out = document.getElementById('cs-out');
  if([voc, vmp, k, tmin, tmax, vmax, mppt].some(isNaN)){ out.innerHTML = '<p class="form-hint">Nhập đủ các giá trị để tính.</p>'; return; }
  const vocCold = voc * (1 + (k / 100) * (tmin - 25));
  const vmpHot = vmp * (1 + (k / 100) * (tmax - 25));
  const nMax = Math.floor(vmax / vocCold), nMin = Math.ceil(mppt / vmpHot);
  const ok = nMin <= nMax && nMax >= 1;
  out.innerHTML = `
    <div class="calc-line">Voc ở nhiệt độ thấp nhất (${fmtN(tmin, 0)}°C): <b>${fmtN(vocCold, 1)} V</b> / tấm</div>
    <div class="calc-line">Vmp ở nhiệt độ cao nhất (${fmtN(tmax, 0)}°C, ước tính): <b>${fmtN(vmpHot, 1)} V</b> / tấm</div>
    <div class="calc-res ${ok ? 'ok' : 'bad'}">${ok ? `Số tấm mỗi chuỗi: từ <b>${nMin}</b> đến <b>${nMax}</b> tấm` : 'Không có số tấm phù hợp với giới hạn này, kiểm tra lại thông số.'}</div>
    ${ok ? `<div class="calc-line">Với ${nMax} tấm: Voc lạnh ≈ ${fmtN(nMax * vocCold, 0)} V (giới hạn ${fmtN(vmax, 0)} V). Nên chừa dư thêm khoảng 2–3% và theo sách hướng dẫn của biến tần.</div>` : ''}`;
}
function calcDcAc(){
  const n = numVal('cd-n'), wp = numVal('cd-wp'), ac = numVal('cd-ac');
  const out = document.getElementById('cd-out');
  if([n, wp, ac].some(isNaN) || ac <= 0){ out.innerHTML = '<p class="form-hint">Nhập đủ các giá trị để tính.</p>'; return; }
  const dc = n * wp / 1000, r = dc / ac;
  let note = r < 1 ? 'Thấp: biến tần chưa được tận dụng hết.' : r <= 1.1 ? 'Hợp lý, ít cắt đỉnh.' : r <= 1.3 ? 'Thường dùng: cắt đỉnh rất ít, tận dụng biến tần tốt.' : r <= 1.5 ? 'Cao: có cắt đỉnh (clipping) vào trưa nắng, kiểm tra giới hạn công suất DC tối đa của biến tần.' : 'Rất cao: thường vượt mức cho phép của biến tần, cần đối chiếu sách hướng dẫn.';
  out.innerHTML = `<div class="calc-line">Công suất DC: <b>${fmtN(dc, 2)} kWp</b></div><div class="calc-res ${r >= 1 && r <= 1.3 ? 'ok' : 'warn'}">Tỉ lệ DC/AC = <b>${fmtN(r, 2)}</b></div><div class="calc-line">${note}</div>`;
}
const CB_STD = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630];
const CABLE_STD = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];
function calcCable(){
  const type = document.getElementById('cc-type').value, p = numVal('cc-p'), u = numVal('cc-u'), pf = numVal('cc-pf') || 1, len = numVal('cc-len'), s = numVal('cc-s'), lim = numVal('cc-lim');
  const mat = document.getElementById('cc-mat').value, rho = mat === 'al' ? 0.036 : 0.0225;   // Ω·mm²/m ở khoảng 70°C
  const out = document.getElementById('cc-out');
  if([p, u, len, s, lim].some(isNaN) || p <= 0 || u <= 0 || len <= 0 || s <= 0){ out.innerHTML = '<p class="form-hint">Nhập đủ các giá trị để tính.</p>'; return; }
  const three = type === '3p';
  const cosf = type === 'dc' ? 1 : Math.min(1, Math.max(0.1, pf));
  const I = three ? p * 1000 / (Math.sqrt(3) * u * cosf) : p * 1000 / (u * cosf);
  const factor = three ? Math.sqrt(3) : 2;
  const du = factor * rho * len * I / s, dup = du / u * 100;
  const sMin = factor * rho * len * I / (lim / 100 * u);
  const sSug = CABLE_STD.find((x) => x >= sMin) || '>' + CABLE_STD[CABLE_STD.length - 1];
  const cb = CB_STD.find((x) => x >= 1.25 * I) || '>' + CB_STD[CB_STD.length - 1];
  out.innerHTML = `
    <div class="calc-line">Dòng điện: <b>${fmtN(I, 1)} A</b></div>
    <div class="calc-line">CB gợi ý (≥ 1,25 × dòng): <b>${cb} A</b></div>
    <div class="calc-res ${dup <= lim ? 'ok' : 'bad'}">Sụt áp với cáp ${fmtN(s, 1)} mm²: <b>${fmtN(du, 1)} V (${fmtN(dup, 2)}%)</b> ${dup <= lim ? '(đạt)' : '(vượt ' + fmtN(lim, 1) + '%)'}</div>
    <div class="calc-line">Tiết diện tối thiểu theo sụt áp ${fmtN(lim, 1)}%: <b>≥ ${fmtN(sMin, 1)} mm²</b> → chọn ${sSug} mm²</div>
    <p class="form-hint">Chỉ tính theo sụt áp. Cần kiểm tra thêm khả năng chịu dòng của cáp (cách lắp, nhiệt độ) và quy định điện lực. Chiều dài là một chiều.</p>`;
}
function ccTypeChange(){
  const t = document.getElementById('cc-type').value, u = document.getElementById('cc-u');
  u.value = t === '1p' ? 230 : t === '3p' ? 400 : 600;
  document.getElementById('cc-lim').value = t === 'dc' ? 1 : 3;
  document.getElementById('cc-pf-row').style.display = t === 'dc' ? 'none' : '';
  calcCable();
}
function calcField(id, label, val, step){ return `<label class="calc-f"><span>${label}</span><input id="${id}" type="number" inputmode="decimal" step="${step || 'any'}" value="${val}"></label>`; }
function toolsHtml(){
  return `
  <div class="card calc-card">
    <div class="st-title" style="margin-top:0;">🔌 Số tấm pin tối đa / tối thiểu trên một chuỗi</div>
    <div class="calc-grid" oninput="calcString()">
      ${calcField('cs-voc', 'Voc tấm (V)', 49.5)}${calcField('cs-vmp', 'Vmp tấm (V)', 41.5)}
      ${calcField('cs-k', 'Hệ số nhiệt Voc (%/°C)', -0.27)}${calcField('cs-tmin', 'Nhiệt độ thấp nhất (°C)', 15)}
      ${calcField('cs-tmax', 'Nhiệt độ tế bào cao nhất (°C)', 70)}${calcField('cs-vmax', 'Vmax biến tần (V)', 1100)}
      ${calcField('cs-mppt', 'Điện áp MPPT thấp nhất (V)', 200)}
    </div>
    <div id="cs-out" class="calc-out"></div>
  </div>
  <div class="card calc-card">
    <div class="st-title" style="margin-top:0;">⚖️ Tỉ lệ công suất DC/AC</div>
    <div class="calc-grid" oninput="calcDcAc()">${calcField('cd-n', 'Số tấm pin', 20)}${calcField('cd-wp', 'Công suất mỗi tấm (Wp)', 600)}${calcField('cd-ac', 'Biến tần AC (kW)', 10)}</div>
    <div id="cd-out" class="calc-out"></div>
  </div>
  <div class="card calc-card">
    <div class="st-title" style="margin-top:0;">🧵 Dòng điện, CB và sụt áp dây dẫn</div>
    <div class="calc-grid" oninput="calcCable()">
      <label class="calc-f"><span>Loại mạch</span><select id="cc-type" onchange="ccTypeChange()"><option value="1p">AC 1 pha</option><option value="3p">AC 3 pha</option><option value="dc">DC</option></select></label>
      <label class="calc-f"><span>Chất liệu dây</span><select id="cc-mat"><option value="cu">Đồng</option><option value="al">Nhôm</option></select></label>
      ${calcField('cc-p', 'Công suất (kW)', 5)}${calcField('cc-u', 'Điện áp (V)', 230)}
      <span id="cc-pf-row" style="display:contents;">${calcField('cc-pf', 'Hệ số công suất', 1)}</span>
      ${calcField('cc-len', 'Chiều dài một chiều (m)', 30)}
      <label class="calc-f"><span>Tiết diện dây (mm²)</span><select id="cc-s">${CABLE_STD.map((x) => `<option value="${x}"${x === 6 ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
      ${calcField('cc-lim', 'Sụt áp cho phép (%)', 3)}
    </div>
    <div id="cc-out" class="calc-out"></div>
  </div>
  <p class="form-hint" style="color:var(--chalk-dim);">Công cụ chỉ để tham khảo nhanh. Luôn đối chiếu sách hướng dẫn của thiết bị, tiêu chuẩn và quy định điện lực địa phương.</p>`;
}

/* ---------- Danh sách kiểm tra lắp đặt (tích ô, lưu trên máy) ---------- */
const CHECKLIST = [
  { t: 'Trước khi lắp', items: ['Kiểm tra hàng: đúng model, số serial, không hư hỏng', 'Vị trí lắp biến tần thông thoáng, đúng yêu cầu bảo vệ (IP), chắc chắn', 'Đối chiếu Voc ở nhiệt độ thấp nhất nhỏ hơn điện áp tối đa của biến tần', 'Ngắt nguồn, khoá/gắn thẻ cách ly, đủ đồ bảo hộ và đai an toàn', 'Có người hỗ trợ khi làm việc trên mái'] },
  { t: 'Đấu nối DC', items: ['Đúng cực tính từng chuỗi (+ và −)', 'Đo Voc từng chuỗi trước khi cắm vào biến tần, ghi lại', 'Dùng đúng đầu nối MC4 cùng hãng, bấm chắc, không để hở', 'Đo điện trở cách điện chuỗi so với đất', 'Dán nhãn từng chuỗi và từng đầu vào MPPT'] },
  { t: 'Đấu nối AC và tiếp địa', items: ['CB AC riêng cho từng biến tần, đúng dòng định mức', 'Đúng thứ tự L1, L2, L3, N, PE theo chữ in trên đầu cốt', 'Siết đúng mô-men theo sách, cáp cắm ngập hết lõi', 'Tiếp địa khung pin, giá đỡ và vỏ biến tần', 'Lắp chống sét lan truyền (SPD) và RCD nếu yêu cầu'] },
  { t: 'Cấu hình', items: ['Chọn đúng mã lưới (grid code) theo quy định', 'Đặt ngày giờ, múi giờ', 'Cài giới hạn công suất/zero export nếu cần (CT đúng chiều)', 'Kết nối giám sát, tạo nhà máy trên nền tảng của hãng', 'Đổi mật khẩu mặc định của installer'] },
  { t: 'Nghiệm thu và bàn giao', items: ['Bật theo đúng thứ tự trong sách hướng dẫn của hãng', 'Kiểm tra không báo lỗi, công suất và điện áp hợp lý', 'Chụp ảnh tem máy, đấu nối, nhãn chuỗi', 'Hướng dẫn chủ nhà xem sản lượng và số liên hệ bảo hành', 'Lập biên bản nghiệm thu và bàn giao tài khoản'] },
];
const CHECK_KEY = 'hmt-checklist';
function loadCheck(){ try{ const c = JSON.parse(localStorage.getItem(CHECK_KEY) || '{}'); return c && typeof c === 'object' ? c : {}; }catch(e){ return {}; } }
function saveCheck(c){ try{ localStorage.setItem(CHECK_KEY, JSON.stringify(c)); }catch(e){} }
function checklistHtml(){
  const c = loadCheck(); const done = c.done || {}, notes = c.notes || {};
  return `<div class="card">
    <label class="calc-f" style="margin-bottom:10px;"><span>Tên công trình</span><input id="ck-name" type="text" maxlength="80" placeholder="Ví dụ: Nhà anh Nam, 5kW" value="${escapeHtml(c.name || '')}" oninput="ckSaveName(this.value)"></label>
    ${CHECKLIST.map((g, gi) => `<div class="st-title">${escapeHtml(g.t)}</div>${g.items.map((it, ii) => { const k = gi + '-' + ii, note = notes[k] || ''; return `<div class="ck-row"><label class="ck-item"><input type="checkbox" ${done[k] ? 'checked' : ''} onchange="ckToggle('${k}', this.checked)"><span>${escapeHtml(it)}</span></label><button type="button" class="ck-note-btn ${note ? 'has' : ''}" id="ck-nb-${k}" onclick="ckNoteToggle('${k}')" aria-label="Ghi chú cho mục này" title="Ghi chú">📝</button></div><textarea class="ck-note" id="ck-note-${k}" rows="2" maxlength="300" placeholder="Ghi chú: số đo, vấn đề gặp phải…" oninput="ckSaveNote('${k}', this.value)" ${note ? '' : 'hidden'}>${escapeHtml(note)}</textarea>`; }).join('')}`).join('')}
    <label class="calc-f" style="margin-top:12px;"><span>📝 Ghi chú chung cho công trình</span><textarea id="ck-gnote" class="ck-note" rows="3" maxlength="1000" placeholder="Ví dụ: mái tôn cũ cần gia cố, chủ nhà hẹn bàn giao thứ 7…" oninput="ckSaveNote('_', this.value)">${escapeHtml(notes._ || '')}</textarea></label>
    <div id="ck-progress" class="form-hint" style="margin-top:10px;"></div>
    <div style="display:flex; gap:8px; margin-top:8px;"><button class="secondary" type="button" style="flex:1;" onclick="ckReset()">Bỏ chọn hết</button><button class="primary" type="button" style="flex:1;" onclick="ckShare()">Chia sẻ</button></div>
    <p class="form-hint">Danh sách chung để tham khảo; theo sách hướng dẫn của từng model và quy định tại công trình.</p>
  </div>`;
}
function ckCount(){ const done = loadCheck().done || {}; const total = CHECKLIST.reduce((n, g) => n + g.items.length, 0); return { n: Object.keys(done).filter((k) => done[k]).length, total }; }
function ckUpdate(){ const el = document.getElementById('ck-progress'); if(el){ const { n, total } = ckCount(); el.textContent = `Đã hoàn thành ${n}/${total} mục`; } }
function ckToggle(key, on){ const c = loadCheck(); c.done = c.done || {}; if(on) c.done[key] = 1; else delete c.done[key]; saveCheck(c); ckUpdate(); }
function ckSaveNote(key, v){ const c = loadCheck(); c.notes = c.notes || {}; v = String(v || '').slice(0, key === '_' ? 1000 : 300); if(v.trim()) c.notes[key] = v; else delete c.notes[key]; saveCheck(c); const b = document.getElementById('ck-nb-' + key); if(b) b.classList.toggle('has', !!v.trim()); }
function ckNoteToggle(key){ const a = document.getElementById('ck-note-' + key); if(!a) return; a.hidden = !a.hidden; if(!a.hidden) a.focus(); }
function ckSaveName(v){ const c = loadCheck(); c.name = v.slice(0, 80); saveCheck(c); }
function ckReset(){ const c = loadCheck(); c.done = {}; saveCheck(c); document.querySelectorAll('.ck-item input').forEach((i) => { i.checked = false; }); ckUpdate(); }
function ckText(){
  const c = loadCheck(), done = c.done || {};
  const lines = [`Checklist lắp đặt${c.name ? ' · ' + c.name : ''}`];
  const notes = c.notes || {};
  CHECKLIST.forEach((g, gi) => { lines.push('', g.t); g.items.forEach((it, ii) => { const k = gi + '-' + ii; lines.push((done[k] ? '☑ ' : '☐ ') + it); if(notes[k]) lines.push('   📝 ' + notes[k].replace(/\s*\n\s*/g, ' / ')); }); });
  if(notes._) lines.push('', '📝 Ghi chú chung: ' + notes._);
  const { n, total } = ckCount(); lines.push('', `Hoàn thành ${n}/${total} mục`);
  return lines.join('\n');
}
async function ckShare(){
  const text = ckText();
  if(navigator.share){ try{ await navigator.share({ title: 'Checklist lắp đặt', text }); return; }catch(e){ if(e && e.name === 'AbortError') return; } }
  try{ await navigator.clipboard.writeText(text); showToast('Đã sao chép danh sách vào bộ nhớ tạm.'); }
  catch(e){ showToast('Không chia sẻ được trên thiết bị này.'); }
}

/* ---------- Tải trước bản vẽ để xem khi mất mạng ---------- */
async function predownloadDrawings(btn){
  const files = GUIDE_DRAWINGS.map((d) => `banve/${d.file}.png`);
  btn.disabled = true; let done = 0, fail = 0, idx = 0;
  const upd = () => { btn.textContent = `Đang tải… ${done + fail}/${files.length}`; };
  upd();
  const worker = async () => { while(idx < files.length){ const f = files[idx++]; try{ const r = await fetch(f); if(!r.ok) throw 0; await r.blob(); done++; }catch(e){ fail++; } upd(); } };
  await Promise.all([worker(), worker(), worker()]);
  btn.disabled = false;
  btn.textContent = fail ? `Đã tải ${done}/${files.length} (lỗi ${fail}), bấm để thử lại` : `✅ Đã tải ${done} bản vẽ, xem được khi mất mạng`;
  showToast(fail ? 'Một số bản vẽ chưa tải được.' : 'Đã tải trước toàn bộ bản vẽ.');
}

const TOC_SECTIONS = [
  {
    id: 'wifi', title: 'Cấu hình WiFi', sub: '7 hãng biến tần · dongle/WiFi stick',
    body: () => `
      <div class="card" style="margin-bottom:14px;">
        <p style="margin:0 0 8px; font-weight:700; color:var(--card-ink);">⚠️ Lưu ý chung trước khi cấu hình (áp dụng cho mọi hãng)</p>
        <ul class="guide-tips">
          <li>Router nhà phải phát sóng <b>2.4GHz</b> — hầu hết logger/dongle KHÔNG kết nối được mạng 5GHz.</li>
          <li>Tắt <b>dữ liệu di động (mobile data)</b> trên điện thoại trong lúc cấu hình, tránh app bị "đi nhầm mạng".</li>
          <li>Đứng gần biến tần/dongle (trong vòng 2-3m) để bắt sóng AP phát ra từ thiết bị cho ổn định.</li>
          <li>Tên wifi & mật khẩu nhà không nên chứa ký tự đặc biệt ( , ; ' " \` = ) — dễ gây lỗi cấu hình.</li>
          <li>Sau khi cấu hình xong, hệ thống có thể mất <b>5-10 phút</b> mới hiện trạng thái Online trên app — đừng vội cấu hình lại.</li>
        </ul>
      </div>
      ${accordionListHtml(GUIDE_BRANDS, 'wifi')}`,
  },
  {
    id: 'logger', title: 'Smart Logger', sub: 'Đấu nối & sử dụng · Huawei, Sungrow, GoodWe, SMA',
    body: () => `
      <div class="card" style="margin-bottom:14px;">
        <p style="margin:0 0 8px; font-weight:700; color:var(--card-ink);">ℹ️ Smart Logger dùng để làm gì?</p>
        <p style="margin:0; font-size:0.87rem; color:#5c6a63; line-height:1.55;">
          Smart Logger là thiết bị trung tâm dùng cho các hệ thống <b>nhiều inverter</b> (thương mại/công nghiệp) — gom dữ liệu từ
          nhiều inverter qua <b>RS485 (Modbus)</b> hoặc <b>Speedwire/Ethernet</b> tuỳ hãng, rồi gửi lên nền tảng giám sát qua
          Ethernet/WiFi/4G, thay vì mỗi inverter phải tự có 1 dongle riêng như hệ dân dụng nhỏ.
        </p>
      </div>
      ${accordionListHtml(GUIDE_LOGGER_BRANDS, 'logger')}`,
  },
  {
    id: 'basics', title: 'Kiến thức cơ bản', sub: `${GUIDE_BASICS.length} khái niệm · điện mặt trời`,
    body: () => `<div class="card">${glossaryHtml(GUIDE_BASICS, true)}</div>`,
  },
  {
    id: 'inverters', title: 'Cài đặt biến tần', sub: 'Hòa lưới · Lưu trữ · Độc lập · 9 hãng',
    body: () => `
      <div class="card" style="margin-bottom:14px;">
        <p style="margin:0; font-size:0.85rem; color:#5c6a63; line-height:1.55;">
          ⚠️ Đây là <b>quy trình chung</b> tổng hợp để tham khảo. Tên menu, giá trị, mật khẩu mặc định thay đổi theo model và firmware;
          bước có nhãn <b>"tuỳ model"</b> chưa đối chiếu được với tài liệu hãng. Với Huawei, Sungrow, GoodWe, Solis, Deye, SMA, nhiều chi tiết (tên menu, mã lỗi, mẹo hiện trường) lấy thêm từ <b>nguồn không chính thức</b> (diễn đàn, nhà phân phối, bên thứ ba) — hãy đối chiếu lại với sách hướng dẫn của đúng model trước khi áp dụng. Luôn làm theo <b>sách hướng dẫn của đúng model</b>
          và quy định của điện lực địa phương.
        </p>
      </div>
      ${inverterListHtml()}`
  },
  {
    id: 'tools', title: 'Công cụ tính nhanh', sub: 'Số tấm mỗi chuỗi · tỉ lệ DC/AC · CB và sụt áp dây',
    body: () => toolsHtml(),
  },
  {
    id: 'checklist', title: 'Checklist lắp đặt', sub: 'Tích từng bước · lưu trên máy · chia sẻ',
    body: () => checklistHtml(),
  },
  {
    id: 'drawings', title: 'Bản vẽ NLMT', sub: `${GUIDE_DRAWINGS.length} bản vẽ · phân vùng inverter, sơ đồ mái pin`,
    body: () => `
      <input type="search" id="drawing-search" class="drawing-search" placeholder="Tìm bản vẽ theo tên (ví dụ: Hoàng Viên, 999)" oninput="filterDrawings(this.value)" autocomplete="off">
      <button class="secondary" type="button" style="width:100%; margin-bottom:10px; color:var(--chalk); border-color:var(--board-line); background:var(--glass);" onclick="predownloadDrawings(this)">⬇ Tải trước tất cả bản vẽ (xem khi mất mạng)</button>
      <p class="drawing-count" id="drawing-count"></p>
      <div class="drawing-grid" id="drawing-grid">${GUIDE_DRAWINGS.map((d, i) => `
        <div class="drawing-item" data-q="${escapeHtml(drawingKey(d))}">
          <img class="drawing-thumb" src="banve/${d.file}.png" alt="${escapeHtml(d.title)}" loading="lazy" onclick="openDrawing(${i})">
          <div class="drawing-title">${escapeHtml(d.title)}</div>
          ${d.note ? `<div class="drawing-note">${escapeHtml(d.note)}</div>` : ''}
          <div class="drawing-actions"><button class="secondary" type="button" onclick="openDrawing(${i})">🔍 Xem</button><a class="btn-link" href="banve/${d.file}.pdf" target="_blank" rel="noopener" download>⬇ PDF</a></div>
        </div>`).join('')}</div>`,
  },
  {
    id: 'safety', title: 'An toàn điện mặt trời', sub: `${GUIDE_SAFETY.length} nguyên tắc an toàn`,
    body: () => `<div class="card">${glossaryHtml(GUIDE_SAFETY, false)}</div>`,
  },
];

function renderTOC(){
  const wrap = document.getElementById('toc-list');
  if(!wrap) return;
  wrap.innerHTML = TOC_SECTIONS.map((s, i) => `
    <div class="toc-item" id="toc-${s.id}">
      <div class="toc-head" onclick="toggleTocSection('${s.id}')">
        <span class="toc-num">${i+1}</span>
        <span class="toc-titles">
          <div class="toc-title">${escapeHtml(s.title)}</div>
          <div class="toc-sub">${escapeHtml(s.sub)}</div>
        </span>
        <span class="toc-chev">▾</span>
      </div>
      <div class="toc-body" id="toc-body-${s.id}"><div class="toc-inner"></div></div>
    </div>`).join('');
}
function toggleTocSection(id){
  const el = document.getElementById('toc-' + id);
  if(!el) return;
  const willOpen = !el.classList.contains('open');
  document.querySelectorAll('.toc-item.open').forEach(x => {
    x.classList.remove('open');
    const b = x.querySelector('.toc-body'); if(b) b.style.maxHeight = '';
  });
  if(willOpen){
    el.classList.add('open');
    const inner = document.querySelector(`#toc-body-${id} .toc-inner`);
    if(inner && !inner.dataset.rendered){
      const section = TOC_SECTIONS.find(s => s.id === id);
      inner.innerHTML = section.body();
      inner.dataset.rendered = '1';
      if(id === 'drawings') filterDrawings('');
      if(id === 'tools'){ calcString(); calcDcAc(); calcCable(); }
      if(id === 'checklist') ckUpdate();
    }
    const body = document.getElementById('toc-body-' + id);
    body.style.maxHeight = 'none';
  }
}
renderTOC();

/* ---------- Tìm kiếm trong tab Tài liệu ---------- */
let docIndex = null;
function dsNorm(s){
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}
function dsPlain(s){ return String(s || '').replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(); }
function buildDocIndex(){
  const out = [];
  const add = (e) => { e.plain = dsPlain(e.text); e.norm = dsNorm(e.title + ' ' + e.text); out.push(e); };
  GUIDE_BRANDS.forEach(b => add({ sec: 'wifi', dom: 'wifi-' + b.id, title: 'WiFi · ' + b.name, text: [b.app].concat(b.steps, [b.note]).join(' ') }));
  GUIDE_LOGGER_BRANDS.forEach(b => add({ sec: 'logger', dom: 'logger-' + b.id, title: 'Smart Logger · ' + b.name, text: [b.app].concat(b.steps, [b.note]).join(' ') }));
  GUIDE_INVERTERS.forEach(b => INV_TYPES.forEach(([k, label], ti) => {
    const t = b.types[k]; if(!t) return;
    const parts = [t.model].concat(t.steps.map(s => s[0]), t.tips || []);
    (t.tables || []).forEach(tb => { parts.push(tb.t); tb.r.forEach(r => parts.push(r.join(' '))); });
    (t.errors || []).forEach(e => parts.push(e.c + ' ' + e.m + ' ' + e.x));
    if(t.check) Object.values(t.check).forEach(l => parts.push(l.join(' ')));
    add({ sec: 'inverters', dom: 'inv-' + b.id, type: ti, title: 'Cài đặt biến tần · ' + b.name + ' · ' + label.replace(/^\S+\s/, ''), text: parts.join(' ') });
  }));
  add({ sec: 'tools', title: 'Công cụ · Số tấm pin trên một chuỗi (Voc lạnh)', text: 'tính số tấm tối đa tối thiểu chuỗi voc nhiệt độ thấp vmax mppt' });
  add({ sec: 'tools', title: 'Công cụ · Tỉ lệ DC/AC', text: 'tỉ lệ công suất dc ac clipping cắt đỉnh' });
  add({ sec: 'tools', title: 'Công cụ · Dòng điện, CB và sụt áp dây', text: 'tính dòng điện cb aptomat tiết diện dây sụt áp cáp đồng nhôm' });
  add({ sec: 'checklist', title: 'Checklist lắp đặt', text: 'danh sách kiểm tra lắp đặt nghiệm thu bàn giao trước khi lắp đấu nối dc ac tiếp địa cấu hình' });
  GUIDE_BASICS.forEach(g => add({ sec: 'basics', term: g.term, title: 'Kiến thức · ' + g.term, text: g.def }));
  GUIDE_SAFETY.forEach(g => add({ sec: 'safety', term: g.term, title: 'An toàn · ' + g.term, text: g.def }));
  if(typeof GUIDE_DRAWINGS !== 'undefined') GUIDE_DRAWINGS.forEach(d => add({ sec: 'drawings', term: d.title, title: 'Bản vẽ · ' + d.title, text: d.note || '' }));
  return out;
}
function dsSnippet(e, terms){
  const low = dsNorm(e.plain); // dsNorm giữ nguyên độ dài (chỉ bỏ dấu thanh/đổi chữ), dùng để định vị
  let pos = -1;
  for(const t of terms){ const p = low.indexOf(t); if(p >= 0 && (pos < 0 || p < pos)) pos = p; }
  const plain = e.plain;
  if(pos < 0) return escapeHtml(plain.slice(0, 110)) + (plain.length > 110 ? '…' : '');
  const from = Math.max(0, pos - 40), to = Math.min(plain.length, pos + 90);
  let s = escapeHtml(plain.slice(from, to));
  return (from > 0 ? '…' : '') + s + (to < plain.length ? '…' : '');
}
function docHits(q){
  const terms = dsNorm(q).split(/\s+/).filter(t => t.length >= 2);
  if(!terms.length) return [];
  if(!docIndex) docIndex = buildDocIndex();
  return docIndex.filter(e => terms.every(t => e.norm.includes(t)));
}
function docSearch(q){
  const box = document.getElementById('doc-search-results');
  const terms = dsNorm(q).split(/\s+/).filter(t => t.length >= 2);
  if(!terms.length){ box.innerHTML = ''; return; }
  if(!docIndex) docIndex = buildDocIndex();
  const hits = docIndex.filter(e => terms.every(t => e.norm.includes(t)));
  window.__docHits = hits.slice(0, 30);
  if(!hits.length){ box.innerHTML = '<div class="ds-none">Không tìm thấy. Thử từ khoá khác (ví dụ: tên hãng, mã lỗi, RS485).</div>'; return; }
  box.innerHTML = window.__docHits.map((e, i) => `<div class="ds-hit" onclick="openDocHit(${i})"><b>${escapeHtml(e.title)}</b><span>${dsSnippet(e, terms)}</span></div>`).join('')
    + (hits.length > 30 ? `<div class="ds-none">Còn ${hits.length - 30} kết quả nữa, hãy gõ cụ thể hơn.</div>` : '');
}
function openDocHit(i){
  const e = (window.__docHits || [])[i]; if(!e) return;
  const sec = document.getElementById('toc-' + e.sec);
  if(sec && !sec.classList.contains('open')) toggleTocSection(e.sec);
  setTimeout(() => {
    let target = null;
    if(e.dom){
      const br = document.getElementById(e.dom);
      if(br && !br.classList.contains('open')) toggleGuideBrand(e.dom);
      if(e.type !== undefined && br){
        const d = br.querySelectorAll('details.inv-type')[e.type];
        if(d){ d.open = true; target = d; }
      }
      target = target || br;
    } else if(e.sec === 'drawings'){
      if(typeof filterDrawings === 'function') filterDrawings(e.term);
      target = document.getElementById('toc-drawings');
    } else {
      const items = document.querySelectorAll(`#toc-body-${e.sec} .gl-item`);
      target = Array.from(items).find(x => x.textContent.includes(e.term)) || sec;
      if(target && target.classList) target.style.outline = '2px solid #F2B807';
    }
    if(target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

/* ---------- Pháo giấy chúc mừng khi điểm cao ---------- */
function launchConfetti(){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
  const colors = ['#FFD24D','#FF5E62','#3DDCFF','#7CE38B','#FF7EB6','#FFFFFF'];
  const parts = Array.from({length:130}, ()=>({
    x: Math.random()*W, y: -20 - Math.random()*H*0.5,
    w: 6+Math.random()*6, h: 8+Math.random()*8,
    vx: -1.5+Math.random()*3, vy: 2+Math.random()*3.5,
    rot: Math.random()*Math.PI, vr: -0.2+Math.random()*0.4,
    c: colors[Math.floor(Math.random()*colors.length)]
  }));
  const start = performance.now();
  (function frame(now){
    const t = now - start;
    ctx.clearRect(0,0,W,H);
    parts.forEach(p=>{
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.03;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
    });
    if(t < 3200){ requestAnimationFrame(frame); } else { canvas.remove(); }
  })(start);
}

/* ---------- Background music (5 bài, chọn được) ---------- */
const MUSIC_ICONS = { quiz_master:'🏆', quiz_countdown:'⏳', thinking_timer:'🤔', flash_quiz:'⚡', thinking_news:'📰' };
let musicOn = false;
let currentTrackId = (function(){ try{ return localStorage.getItem('quiz-app-music-track'); }catch(e){ return null; } })() || 'quiz_master';

/* Nhạc của người dùng: chọn file trên máy, lưu trong IndexedDB của máy đó (không tải lên máy chủ) */
let MY_TRACKS = [];
const MY_MUSIC_MAX = 30 * 1024 * 1024;
function myMusicDb(){
  return new Promise((ok, no) => {
    if(!window.indexedDB){ no(new Error('no idb')); return; }
    const rq = indexedDB.open('hmt-my-music', 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore('tracks', { keyPath: 'id' });
    rq.onsuccess = () => ok(rq.result); rq.onerror = () => no(rq.error);
  });
}
async function myMusicTx(mode, fn){
  const db = await myMusicDb();
  return new Promise((ok, no) => {
    const tx = db.transaction('tracks', mode), st = tx.objectStore('tracks');
    let out; const r = fn(st); if(r) r.onsuccess = () => { out = r.result; };
    tx.oncomplete = () => { db.close(); ok(out); }; tx.onerror = tx.onabort = () => { db.close(); no(tx.error); };
  });
}
const myTracksReady = myMusicTx('readonly', (st) => st.getAll())
  .then((rows) => { MY_TRACKS = (rows || []).sort((a, b) => a.added - b.added); })
  .catch(() => { MY_TRACKS = []; });
function trackSrc(t){
  if(t.blob){ if(!t.url) t.url = URL.createObjectURL(t.blob); return t.url; }
  return t.src || ('data:audio/mpeg;base64,' + t.b64);
}
function niceTrackName(file){
  return file.name.replace(/\.[^.]+$/, '')
    .replace(/^[0-9a-f]{8}-/i, '')                                   // tiền tố khi tải lên
    .replace(/YTSave\.to_?|YouTube_Media_?|y2mate\.com\s*-?/gi, '')    // tên web tải nhạc
    .replace(/^[A-Za-z0-9_-]{11}_{2,}-?/, '')                         // mã video YouTube
    .replace(/_\d+_vbr$|_\d{2,3}kbps$|\(\d{2,3}kbps\)/gi, '')
    .replace(/\s+-\s+/g, ' – ').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Bài của tôi';
}
async function addMyTracks(files){
  let n = 0;
  for(const f of files){
    if(!/^audio\//.test(f.type) && !/\.(mp3|m4a|aac|ogg|wav|opus|flac)$/i.test(f.name)){ showToast(`"${f.name}" không phải file nhạc.`); continue; }
    if(f.size > MY_MUSIC_MAX){ showToast(`"${f.name}" quá lớn (tối đa 30 MB).`); continue; }
    const t = { id: 'my_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: niceTrackName(f), blob: f, added: Date.now() };
    try{ await myMusicTx('readwrite', (st) => st.put(t)); MY_TRACKS.push(t); n++; }
    catch(e){ showToast('Không lưu được nhạc trên máy này (bộ nhớ đầy hoặc chế độ ẩn danh).'); }
  }
  if(n){ showToast(`Đã thêm ${n} bài vào Nhạc của bạn.`); selectTrack(MY_TRACKS[MY_TRACKS.length - 1].id); }
  else renderMusicTrackList();
}
async function renameMyTrack(id){
  const t = MY_TRACKS.find(x => x.id === id); if(!t) return;
  const name = prompt('Tên bài nhạc:', t.name); if(!name || !name.trim()) return;
  t.name = name.trim().slice(0, 60);
  try{ await myMusicTx('readwrite', (st) => st.put({ id: t.id, name: t.name, blob: t.blob, added: t.added })); }catch(e){}
  renderMusicTrackList();
}
async function deleteMyTrack(id){
  const t = MY_TRACKS.find(x => x.id === id); if(!t || !confirm(`Xoá "${t.name}" khỏi máy này?`)) return;
  try{ await myMusicTx('readwrite', (st) => st.delete(id)); }catch(e){}
  if(t.url) URL.revokeObjectURL(t.url);
  MY_TRACKS = MY_TRACKS.filter(x => x.id !== id);
  if(currentTrackId === id){
    const audio = document.getElementById('bg-music'), wasOn = musicOn;
    audio.pause(); delete audio.dataset.trackId;
    currentTrackId = MUSIC_TRACKS[0].id; try{ localStorage.setItem('quiz-app-music-track', currentTrackId); }catch(e){}
    if(wasOn) selectTrack(currentTrackId);
  }
  renderMusicTrackList();
}

function getTrackById(id){ return MUSIC_TRACKS.find(t => t.id === id) || MY_TRACKS.find(t => t.id === id) || MUSIC_TRACKS[0]; }

function loadCurrentTrackIntoAudio(){
  const audio = document.getElementById('bg-music');
  const track = getTrackById(currentTrackId);
  if(audio.dataset.trackId !== track.id){
    audio.src = trackSrc(track);
    audio.dataset.trackId = track.id;
  }
}

function toggleMusic(){
  const audio = document.getElementById('bg-music');
  const btn = document.getElementById('music-toggle');
  musicOn = !musicOn;
  if(musicOn){
    loadCurrentTrackIntoAudio();
    audio.volume = 0.35;
    audio.play().catch(()=>{ showToast('Không thể phát nhạc trên thiết bị này.'); musicOn=false; btn.textContent='🔇'; });
    btn.textContent = '🎵';
  } else {
    audio.pause();
    btn.textContent = '🔇';
  }
  try{ localStorage.setItem('quiz-app-music', musicOn ? '1':'0'); }catch(e){}
}

// Tự bật nhạc nền ngay sau khi người dùng đăng nhập (bấm nút đăng nhập đã tính
// là một thao tác chạm của người dùng, nên trình duyệt cho phép phát âm thanh).
function autoStartMusic(){
  if(/^my_/.test(currentTrackId) && !MY_TRACKS.find(x => x.id === currentTrackId)){ myTracksReady.then(autoStartMusic2); return; }
  autoStartMusic2();
}
function autoStartMusic2(){
  // Mặc định luôn BẬT nhạc nền mỗi lần đăng nhập. Người dùng vẫn có thể tắt bằng nút 🎵
  // trong lúc dùng; lần đăng nhập sau nhạc lại tự bật.
  const audio = document.getElementById('bg-music');
  const btn = document.getElementById('music-toggle');
  loadCurrentTrackIntoAudio();
  audio.volume = 0.35;
  try{ localStorage.setItem('quiz-app-music','1'); }catch(e){}
  const onOk = ()=>{ musicOn = true; btn.textContent = '🎵'; };
  audio.play().then(onOk).catch(()=>{
    // Bị chặn tự phát: thử lại ở lần chạm đầu tiên
    musicOn = false; btn.textContent = '🔇';
    const retry = ()=>{
      document.removeEventListener('pointerdown', retry, true);
      if(musicOn) return;
      audio.play().then(onOk).catch(()=>{});
    };
    document.addEventListener('pointerdown', retry, true);
  });
}

function openMusicPicker(){
  renderMusicTrackList();
  document.getElementById('music-modal-backdrop').classList.add('show');
}
function closeMusicPicker(){ document.getElementById('music-modal-backdrop').classList.remove('show'); }
function renderMusicTrackList(){
  const wrap = document.getElementById('music-track-list');
  const row = (t, mine) => `
    <div class="track-line">
    <button class="track-row ${t.id === currentTrackId ? 'active' : ''}" onclick="selectTrack('${t.id}')">
      <span class="track-icon">${mine ? '💿' : (MUSIC_ICONS[t.id] || '🎵')}</span>
      <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(t.name)}</span>
      <span style="font-size:0.75rem; color:#8a9089;">${t.id === currentTrackId ? (musicOn ? 'Đang phát' : 'Đã chọn') : ''}</span>
    </button>${mine ? `<button class="track-mini" title="Đổi tên" onclick="renameMyTrack('${t.id}')">✏️</button><button class="track-mini" title="Xoá" onclick="deleteMyTrack('${t.id}')">🗑</button>` : ''}
    </div>`;
  wrap.innerHTML = MUSIC_TRACKS.map(t => row(t, false)).join('') +
    `<div class="track-my-title">💿 Nhạc của bạn</div>` +
    (MY_TRACKS.length ? MY_TRACKS.map(t => row(t, true)).join('') : '') +
    `<label class="track-add">➕ Thêm nhạc từ máy<input type="file" accept="audio/*,.mp3,.m4a" multiple hidden onchange="addMyTracks([...this.files]); this.value='';"></label>` +
    `<p class="form-hint" style="margin-top:6px;">Chạm vào bài để nghe ngay. Bấm nút 🎵 để bật/tắt nhạc. Nhạc của bạn chỉ lưu trên máy này, không tải lên mạng.</p>`;
}
function selectTrack(id){
  currentTrackId = id;
  try{ localStorage.setItem('quiz-app-music-track', id); }catch(e){}
  const audio = document.getElementById('bg-music');
  const btn = document.getElementById('music-toggle');
  loadCurrentTrackIntoAudio();
  audio.currentTime = 0;
  audio.volume = 0.35;
  audio.play().then(()=>{
    musicOn = true; btn.textContent = '🎵';
    try{ localStorage.setItem('quiz-app-music','1'); }catch(e){}
  }).catch(()=>{ showToast('Không thể phát nhạc trên thiết bị này.'); });
  renderMusicTrackList();
}
document.getElementById('music-modal-backdrop').addEventListener('click', (e)=>{
  if(e.target.id === 'music-modal-backdrop') closeMusicPicker();
});

/* ---------- Nút Back vật lý trên Android (khi đóng gói bằng Capacitor) ---------- */
function setupAndroidBackButton(){
  try{
    const AppPlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if(!AppPlugin) return; // đang chạy trên trình duyệt / web bình thường thì bỏ qua, không cần xử lý
    AppPlugin.addListener('backButton', ()=>{
      const editBackdrop = document.getElementById('edit-backdrop');
      const exportBackdrop = document.getElementById('export-backdrop');
      if(editBackdrop && editBackdrop.classList.contains('show')){ closeEdit(); return; }
      if(exportBackdrop && exportBackdrop.classList.contains('show')){ closeExportModal(); return; }
      const lbDetail = document.getElementById('lb-detail-backdrop');
      if(lbDetail && lbDetail.classList.contains('show')){ closeLbDetail(); return; }

      const loginScreen = document.getElementById('login-screen');
      if(loginScreen && !loginScreen.classList.contains('hidden')){ AppPlugin.exitApp(); return; }

      const activeTabBtn = document.querySelector('nav.tabs button.active');
      const activeTab = activeTabBtn ? activeTabBtn.dataset.tab : 'quiz';
      if(activeTab === 'games' && window.gamesBack && window.gamesBack()) return;
      if(activeTab !== 'quiz'){ switchTab('quiz'); return; }

      const quizPlay = document.getElementById('quiz-play');
      const quizResult = document.getElementById('quiz-result');
      const midQuiz = (quizPlay && quizPlay.style.display === 'block') || (quizResult && quizResult.style.display === 'block');
      if(midQuiz){ backToSetup(); return; }

      AppPlugin.exitApp();
    });
  }catch(e){ /* không chạy trong app Android đóng gói thì bỏ qua, không lỗi gì cả */ }
}

/* ---------- Màn hình bắt đầu làm bài: nút chọn nhanh, nhớ lựa chọn, ẩn danh ---------- */
const SETUP_PREFS_KEY = 'quiz-app-setup-v1';
let quizAnon = false;
function saveSetupPrefs(){
  try{
    localStorage.setItem(SETUP_PREFS_KEY, JSON.stringify({
      diff: document.getElementById('setup-difficulty').value,
      count: document.getElementById('setup-count').value,
      anon: document.getElementById('setup-anon').checked,
    }));
  }catch(e){}
}
function syncSegmented(){
  [['seg-difficulty', 'setup-difficulty'], ['seg-count', 'setup-count']].forEach(([segId, selId]) => {
    const v = document.getElementById(selId).value;
    document.querySelectorAll('#' + segId + ' button').forEach((b) => b.classList.toggle('active', b.dataset.v === v));
  });
}
function initSetupControls(){
  try{
    const p = JSON.parse(localStorage.getItem(SETUP_PREFS_KEY) || 'null');
    if(p){
      const setSel = (id, v) => {
        const el = document.getElementById(id);
        if(Array.from(el.options).some((o) => o.value === String(v))) el.value = String(v);
      };
      setSel('setup-difficulty', p.diff);
      setSel('setup-count', p.count);
      document.getElementById('setup-anon').checked = !!p.anon;
    }
  }catch(e){}
  [['seg-difficulty', 'setup-difficulty'], ['seg-count', 'setup-count']].forEach(([segId, selId]) => {
    document.getElementById(segId).addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-v]');
      if(!b) return;
      document.getElementById(selId).value = b.dataset.v;
      syncSegmented(); updateSetupHint(); saveSetupPrefs();
    });
  });
  ['setup-anon'].forEach((id) => {
    document.getElementById(id).addEventListener('change', () => { updateSetupHint(); saveSetupPrefs(); });
  });
  syncSegmented();
  updateSetupHint();
}
initSetupControls();


/* ---------- Làm trắc nghiệm toàn màn hình ---------- */
function exitQuiz(){
  if(!confirm('Thoát bài làm? Bài đang làm dở được lưu để làm tiếp lần sau.')) return;
  backToSetup();
}
(function quizFullscreen(){   // Fullscreen API chỉ dùng trên điện thoại/máy tính bảng; máy tính tránh dùng vì trình duyệt hiện thanh "Nhấn Esc" che mất nút Thoát
  const view = document.getElementById('view-quiz'), play = document.getElementById('quiz-play'), res = document.getElementById('quiz-result');
  if(!view || !play || !res) return;
  let on = false;
  function sync(){
    const want = view.classList.contains('active') && (play.style.display === 'block' || res.style.display === 'block');
    if(want === on) return; on = want;
    view.classList.toggle('qz-fs', on); document.body.style.overflow = on ? 'hidden' : '';
    try{
      if(on){ const de = document.documentElement, rf = (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? (de.requestFullscreen || de.webkitRequestFullscreen) : null; if(rf){ const p = rf.call(de, { navigationUI: 'hide' }); if(p && p.catch) p.catch(() => {}); } }
      else if(document.fullscreenElement && document.exitFullscreen){ document.exitFullscreen().catch(() => {}); }
      else if(document.webkitFullscreenElement && document.webkitExitFullscreen){ document.webkitExitFullscreen(); }
    }catch(e){}
    view.scrollTop = 0;
  }
  const mo = new MutationObserver(sync);
  mo.observe(play, { attributes: true, attributeFilter: ['style'] });
  mo.observe(res, { attributes: true, attributeFilter: ['style'] });
  mo.observe(view, { attributes: true, attributeFilter: ['class'] });
  sync();
})();
