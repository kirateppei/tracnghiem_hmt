
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
  if(name === 'accounts') renderAccounts();
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
}
document.getElementById('setup-difficulty').addEventListener('change', updateSetupHint);
function updateSetupHint(){
  const diff = document.getElementById('setup-difficulty').value;
  const mediaOnly = document.getElementById('setup-media-only').checked;
  let pool = questions;
  if(diff !== '__ALL__') pool = pool.filter(q => (q.difficulty||'tb') === diff);
  if(mediaOnly) pool = pool.filter(q => q.mediaType);
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

function startQuiz(){
  if(questions.length === 0){ backToSetup(); return; }
  const diff = document.getElementById('setup-difficulty').value;
  const mediaOnly = document.getElementById('setup-media-only').checked;
  const count = parseInt(document.getElementById('setup-count').value, 10);
  quizAnon = !!document.getElementById('setup-anon').checked;
  let basePool = questions;
  if(mediaOnly) basePool = basePool.filter(q => q.mediaType);
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
function showExplanationBox(q, isCorrect){
  const box = document.getElementById('q-explain-box');
  const text = document.getElementById('q-explain-text');
  if(isCorrect || !q.explanation){ box.classList.remove('show'); text.textContent=''; return; }
  text.textContent = ' ' + q.explanation;
  box.classList.add('show');
}

function handleTimeout(){
  const q = quizOrder[currentIndex];
  const opts = document.querySelectorAll('#options .option');
  if(opts.length && !opts[0].disabled){
    opts.forEach(o=> o.disabled = true);
    opts[q.correct].classList.add('correct');
    answers.push({ question: q.question, options: q.options, chosen: null, correct: q.correct, isCorrect: false, explanation: q.explanation });
    showExplanationBox(q, false);
  }
  // Hết giờ: tự động chuyển sang câu tiếp theo, chờ lâu hơn một chút để kịp đọc giải thích
  setTimeout(()=>{ nextQuestion(); }, 2500);
}

function renderQuestion(){
  const q = quizOrder[currentIndex];
  const myIndex = currentIndex; // chụp lại để đối chiếu khi video kết thúc (tránh tính giờ nhầm câu)
  document.getElementById('q-explain-box').classList.remove('show');
  document.getElementById('q-counter').textContent = `Câu ${currentIndex+1}/${quizOrder.length}`;
  document.getElementById('q-score-live').textContent = `Điểm: ${score}`;
  document.getElementById('progress-fill').style.width = `${(currentIndex/quizOrder.length)*100}%`;
  document.getElementById('q-cat-tag').textContent = q.category || 'Khác';
  const diffMap = { de: ['Dễ','diff-de'], tb: ['Trung bình','diff-tb'], kho: ['Khó','diff-kho'], cuckho: ['Cực khó','diff-cuckho'], xuatsac: ['Xuất sắc','diff-xuatsac'] };
  const dinfo = diffMap[q.difficulty] || diffMap.tb;
  const diffEl = document.getElementById('q-diff-tag');
  diffEl.textContent = dinfo[0];
  diffEl.className = 'diff-tag ' + dinfo[1];
  document.getElementById('q-text').textContent = q.question;

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
  opts[idx].classList.add(isCorrect ? 'correct' : 'wrong');
  if(!isCorrect){ opts[q.correct].classList.add('correct'); }
  if(isCorrect) score++;
  answers.push({ question: q.question, options: q.options, chosen: idx, correct: q.correct, isCorrect, explanation: q.explanation });
  document.getElementById('q-score-live').textContent = `Điểm: ${score}`;
  document.getElementById('next-btn').disabled = false;
  showExplanationBox(q, isCorrect);
}

function nextQuestion(){
  stopTimer();
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

function showResult(){
  stopTimer();
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
  document.getElementById('result-msg').textContent = `${msg} (${pct}%)`;

  const reviewWrap = document.getElementById('review-list');
  reviewWrap.innerHTML = '';
  const wrongOnes = answers.filter(a=>!a.isCorrect);
  if(wrongOnes.length > 0){
    const letters = ['A','B','C','D'];
    wrongOnes.forEach(a=>{
      const div = document.createElement('div');
      div.className = 'review-item';
      const chosenLine = a.chosen === null
        ? `<div class="a-wrong">Hết giờ — bạn chưa chọn đáp án</div>`
        : `<div class="a-wrong">Bạn chọn: ${letters[a.chosen]}. ${escapeHtml(a.options[a.chosen])}</div>`;
      const explainLine = a.explanation ? `<div class="a-explain">💡 ${escapeHtml(a.explanation)}</div>` : '';
      div.innerHTML = `
        <div class="q">${escapeHtml(a.question)}</div>
        ${chosenLine}
        <div class="a-correct">Đáp án đúng: ${letters[a.correct]}. ${escapeHtml(a.options[a.correct])}</div>
        ${explainLine}
      `;
      reviewWrap.appendChild(div);
    });
  }

  submitLeaderboardEntry({
    name: session.name,
    anon: quizAnon,
    role: session.role,
    score: score,
    total: total,
    pct: pct,
    category: (function(){
      const dsel = document.getElementById('setup-difficulty');
      const label = dsel.selectedOptions[0] ? dsel.selectedOptions[0].textContent : 'Tất cả mức độ';
      return label;
    })(),
    ts: Date.now(),
  });
}

function escapeHtml(s){ const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
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
  { id:'chalk',   name:'Bảng đen',       swatch:'linear-gradient(135deg,#1B3A2F,#2F7A5A)' },
  { id:'sunrise', name:'Bình minh',      swatch:'linear-gradient(135deg,#FFB347,#FF5E62)' },
  { id:'ocean',   name:'Đại dương',      swatch:'linear-gradient(135deg,#062858,#3DDCFF)' },
  { id:'sunset',  name:'Hoàng hôn tím',  swatch:'linear-gradient(135deg,#3A106E,#FF7EB6)' },
  { id:'forest',  name:'Rừng xanh',      swatch:'linear-gradient(135deg,#0E3B2A,#7CE38B)' },
  { id:'minimal', name:'Tối giản sáng',  swatch:'linear-gradient(135deg,#F6F8FC,#9DBBFF)' },
];
let currentThemeId = (function(){ try{ return localStorage.getItem('quiz-app-theme'); }catch(e){ return null; } })() || 'chalk';

function applyTheme(id){
  currentThemeId = id;
  if(id === 'chalk'){ document.documentElement.removeAttribute('data-app-theme'); }
  else { document.documentElement.setAttribute('data-app-theme', id); }
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta){
    const colors = { chalk:'#1B3A2F', sunrise:'#FF7A4A', ocean:'#062858', sunset:'#2A0E55', forest:'#0E3B2A', minimal:'#EEF2F7' };
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
      'Trên điện thoại, vào Cài đặt WiFi, tìm và kết nối mạng có tên dạng <b>"SUN2000-xxxxxxxx"</b> (mật khẩu in trên nhãn dongle, mặc định thường là <b>Changeme</b> cho lần đầu).',
      'Mở app <b>FusionSolar</b>, đăng nhập bằng tài khoản installer (hoặc tạo tài khoản nếu chưa có).',
      'Vào mục <b>"Commissioning" (Nghiệm thu)</b> → quét mã QR trên thân dongle hoặc nhập số serial để kết nối cục bộ.',
      'Trong trình hướng dẫn (wizard), chọn <b>"Cấu hình WLAN"</b> → chọn tên WiFi nhà bạn → nhập mật khẩu wifi → Lưu.',
      'Tạo/chọn "Nhà máy điện" (Plant) trong FusionSolar để gắn thiết bị vào đúng công trình, rồi hoàn tất commissioning.',
      'Đợi vài phút, kiểm tra trạng thái thiết bị chuyển từ "Ngoại tuyến" sang <b>"Trực tuyến"</b> trên app/SmartPVMS.',
    ],
    note: 'Lần đầu bắt buộc phải đăng nhập bằng tài khoản <b>installer</b> (không phải tài khoản chủ nhà) mới thấy được mục Commissioning để cấu hình WiFi.',
  },
  {
    id: 'sungrow', name: 'Sungrow', color: '#FF6A00', badge: 'SG',
    app: 'App: iSolarCloud · Web: web.isolarcloud.com',
    steps: [
      'Cắm dongle <b>WiNet-S</b> (hoặc WiNet-S2) vào cổng COM của biến tần Sungrow.',
      'Kết nối điện thoại vào mạng WiFi do dongle phát ra, tên dạng <b>"WINET-xxxxxxxx"</b> hoặc <b>"SG-xxxxxxxx"</b>.',
      'Mở app <b>iSolarCloud</b>, đăng nhập → vào mục <b>"Device Commissioning"</b> hoặc quét mã QR dán trên dongle.',
      'Chọn <b>"WLAN Configuration"</b>, app sẽ quét danh sách wifi xung quanh — chọn wifi nhà bạn và nhập mật khẩu.',
      'Nhấn Kết nối, đợi dongle khởi động lại (đèn tín hiệu chuyển từ nhấp nháy sang sáng ổn định).',
      'Tạo trạm điện mới (New Plant) trong iSolarCloud, gán serial biến tần/dongle vào đúng trạm.',
      'Kiểm tra lại trạng thái Online trong danh sách thiết bị.',
    ],
    note: 'Nếu không tìm thấy mạng WINET-xxxx, thử ấn giữ nút nhỏ trên dongle vài giây để reset về chế độ phát WiFi (AP mode).',
  },
  {
    id: 'goodwe', name: 'GoodWe', color: '#0072BC', badge: 'GW',
    app: 'App: SEMS Portal (đang chuyển dần sang SEMS+) · Web: semsportal.com',
    steps: [
      'Cắm module WiFi (hoặc USB WiFi stick) vào cổng giao tiếp của biến tần GoodWe.',
      'Kết nối điện thoại vào mạng phát ra từ module, tên dạng <b>"Solar-WiFi########"</b> (8 số cuối là số serial), mật khẩu mặc định <b>12345678</b>.',
      'Mở app <b>SEMS Portal</b>, đăng nhập tài khoản (hoặc đăng ký mới) → chọn <b>"Wi-Fi Configuration"</b>.',
      'App tự nhận diện module → chọn mạng wifi nhà bạn từ danh sách → nhập mật khẩu wifi → nhấn Connect.',
      'Đợi module khởi động lại và kết nối vào wifi nhà (đèn LED chuyển trạng thái ổn định).',
      'Thêm nhà máy điện mới (Add Plant/Station) trong SEMS Portal nếu là lần đầu cấu hình, nhập serial biến tần để gắn vào.',
      'Kiểm tra trạng thái "Online" trong danh sách thiết bị trên app.',
    ],
    note: 'Nếu quên đổi mật khẩu module WiFi, ai trong tầm sóng cũng có thể dò được — nên đổi mật khẩu mặc định 12345678 sau khi cấu hình xong.',
  },
  {
    id: 'solis', name: 'Solis (Ginlong)', color: '#00A651', badge: 'SL',
    app: 'App: SolisCloud · Web: soliscloud.com',
    steps: [
      'Cắm WiFi stick (logger) vào cổng của biến tần Solis.',
      'Kết nối điện thoại vào mạng phát ra từ stick, tên dạng <b>"AP_xxxxxxxxxxx"</b> (theo số serial logger).',
      'Cách 1 — Dùng App: mở <b>SolisCloud</b> → bấm "+" thêm thiết bị → chọn "Cấu hình WiFi" → app tự dò wifi nhà → nhập mật khẩu → Kết nối.',
      'Cách 2 — Dùng trình duyệt: mở trình duyệt, truy cập địa chỉ <b>10.10.100.254</b>, đăng nhập <b>admin/admin</b> → chạy "Quick Set/Setup Wizard" → chọn wifi nhà → nhập mật khẩu → Lưu.',
      'Đợi logger khởi động lại, đèn WiFi trên logger chuyển sang sáng ổn định (không nhấp nháy).',
      'Trong SolisCloud, tạo "Nhà máy" (Plant) mới rồi quét mã vạch/nhập serial logger để gắn thiết bị vào.',
      'Làm mới danh sách thiết bị, kiểm tra trạng thái chuyển sang Online.',
    ],
    note: 'Bắt buộc phải nhập đúng <b>số serial của LOGGER</b> (không phải số serial biến tần) khi thêm thiết bị trong SolisCloud.',
  },
  {
    id: 'deye', name: 'Deye', color: '#005BAC', badge: 'DY',
    app: 'App: Solarman Smart (nền tảng DeyeCloud) · Web: pro.solarman.cn',
    steps: [
      'Cắm datalogger WiFi vào cổng RS485/WiFi của biến tần Deye.',
      'Kết nối điện thoại vào mạng phát ra từ logger, tên dạng <b>"AP_xxxxxxxx"</b> (mật khẩu ghi trên tem logger).',
      'Mở app <b>Solarman Smart</b>, đăng nhập → vào danh sách thiết bị (Devices) → chọn logger cần cấu hình.',
      'App tự nhận diện wifi điện thoại đang dùng → xác nhận wifi nhà đúng → bấm "Start".',
      'App yêu cầu sang Cài đặt WiFi của điện thoại để kết nối vào mạng AP_xxxxxxxx → quay lại app Solarman.',
      'App tự động cấu hình (Auto Configuration), đợi khoảng 3-5 phút để hoàn tất.',
      'Tạo trạm điện mới (Add Plant/Station) trong app nếu là lần đầu, gắn logger vào đúng trạm.',
      'Trạng thái logger vẫn hiện "Ngoại tuyến" ngay sau đó là bình thường — dữ liệu thường cập nhật sau khoảng 10 phút.',
    ],
    note: 'Chỉ dùng được mạng WiFi <b>2.4GHz</b>. Tên/mật khẩu wifi nhà không được chứa ký tự đặc biệt như , ; \' " ` =',
  },
  {
    id: 'luxpower', name: 'LuxPower', color: '#7A1FA2', badge: 'LX',
    app: 'App: LuxPowerView (nền tảng LuxCloud) · Web: server.luxpowertek.com',
    steps: [
      'Cắm dongle WiFi vào cổng giao tiếp của biến tần LuxPower, bật nguồn biến tần.',
      'Tải app <b>LuxPowerView</b> (Android thường phải tải trực tiếp từ trang chủ hãng, không có trên Google Play).',
      'Đăng ký tài khoản trên app (nhập mã installer/customer code nếu được cấp).',
      'Kết nối điện thoại vào mạng WiFi do dongle phát ra, tên bắt đầu bằng <b>"BA..."</b>.',
      'Mở app LuxPowerView → bấm <b>"DONGLE CONNECT"</b>.',
      'Chọn mạng WiFi nhà bạn từ danh sách, nhập mật khẩu wifi → bấm <b>"HomeWiFi Connect"</b>.',
      'Dongle sẽ tự khởi động lại — đợi cả 3 đèn LED trên dongle sáng ổn định (không nhấp nháy) là đã kết nối thành công.',
      'Vào app kiểm tra trạm điện đã hiện dữ liệu, đặt tên trạm để dễ quản lý.',
    ],
    note: 'Nếu đổi wifi/router mới, phải lặp lại đúng quy trình trên (không tự động chuyển mạng) — vào lại "DONGLE CONNECT" để cấu hình wifi mới.',
  },
  {
    id: 'sma', name: 'SMA (Đức)', color: '#E2001A', badge: 'SMA',
    app: 'App/Web: Sunny Portal (cổ điển) hoặc Sunny Portal powered by ennexOS · Webserver nội bộ trên biến tần',
    steps: [
      'Hầu hết biến tần SMA (dòng Sunny Boy...) có sẵn <b>WLAN tích hợp</b> — kết nối điện thoại vào mạng wifi do chính biến tần phát ra (tên dạng "SMA..." in trên nhãn máy).',
      'Nhiều dòng hỗ trợ <b>WPS</b>: chỉ cần bấm nút WPS trên router nhà rồi bấm nút tương ứng trên biến tần để tự kết nối, không cần nhập tay tên/mật khẩu wifi.',
      'Mở trình duyệt, truy cập webserver nội bộ của biến tần (địa chỉ IP hiện trên màn hình LCD hoặc theo tài liệu máy) để cấu hình thủ công nếu không dùng WPS.',
      'Đăng ký/đăng nhập tài khoản trên <b>Sunny Portal</b> (sunnyportal.com cho hệ kết nối Ethernet/WLAN nội bộ, hoặc ennexOS.sunnyportal.com cho hệ dùng SIM 4G).',
      'Bật chức năng <b>Webconnect</b> trên biến tần để tự gửi dữ liệu thẳng lên Sunny Portal — không cần thêm datalogger riêng (áp dụng tốt cho hệ dân dụng tối đa 4 biến tần).',
      'Tạo hệ thống mới (New System/Plant) trên Sunny Portal, nhập số serial biến tần để gắn thiết bị vào đúng công trình.',
      'Kiểm tra trạng thái dữ liệu đã cập nhật trên Sunny Portal (thường trong vài phút).',
    ],
    note: 'Hệ trên 4 biến tần hoặc quy mô thương mại nên dùng thêm <b>SMA Data Manager M</b> (xem mục Smart Logger) thay vì Webconnect trực tiếp từng máy.',
  },
];

const GUIDE_BASICS = [{"term": "Hiệu ứng quang điện (photovoltaic effect)", "def": "hiện tượng vật liệu bán dẫn sinh ra dòng điện khi hấp thụ ánh sáng", "cat": "Kiến thức cơ bản"}, {"term": "Điều kiện thử nghiệm tiêu chuẩn STC (Standard Test Conditions)", "def": "bức xạ 1000 W/m², nhiệt độ tế bào 25°C, khối lượng khí quyển AM 1.5", "cat": "Kiến thức cơ bản"}, {"term": "Công suất đỉnh Wp (Watt-peak)", "def": "công suất tối đa tấm pin tạo ra trong điều kiện thử nghiệm chuẩn STC", "cat": "Kiến thức cơ bản"}, {"term": "Hệ số hiệu suất hệ thống PR (Performance Ratio)", "def": "tỷ lệ giữa sản lượng điện thực tế và sản lượng điện lý thuyết trong cùng điều kiện bức xạ", "cat": "Kiến thức cơ bản"}, {"term": "Giờ nắng đỉnh PSH (Peak Sun Hours)", "def": "số giờ tương đương bức xạ 1000 W/m² trong một ngày tại một địa điểm", "cat": "Kiến thức cơ bản"}, {"term": "Hệ thống điện mặt trời hòa lưới (on-grid/grid-tied)", "def": "hệ thống kết nối trực tiếp với lưới điện, không có pin lưu trữ, ngừng hoạt động khi mất điện lưới", "cat": "Kiến thức cơ bản"}, {"term": "Hệ thống điện mặt trời độc lập (off-grid)", "def": "hệ thống hoạt động độc lập không kết nối lưới điện, thường có pin lưu trữ", "cat": "Kiến thức cơ bản"}, {"term": "Hệ thống hybrid (lai)", "def": "hệ thống vừa kết nối lưới điện vừa có pin lưu trữ, có thể chuyển đổi linh hoạt", "cat": "Kiến thức cơ bản"}, {"term": "Tế bào quang điện đơn tinh thể (mono-crystalline)", "def": "được cắt từ một thỏi silic đơn tinh thể, hiệu suất cao, màu đen đồng nhất", "cat": "Tấm pin quang điện"}, {"term": "Tế bào quang điện đa tinh thể (poly-crystalline)", "def": "được đúc từ nhiều tinh thể silic, chi phí thấp hơn mono, hiệu suất thấp hơn", "cat": "Tấm pin quang điện"}, {"term": "Công nghệ tấm pin PERC", "def": "công nghệ thêm lớp phản xạ mặt sau giúp tăng hiệu suất hấp thụ ánh sáng", "cat": "Tấm pin quang điện"}, {"term": "Tấm pin hai mặt (bifacial)", "def": "có thể hấp thụ ánh sáng phản xạ ở cả mặt trước và mặt sau, tăng sản lượng", "cat": "Tấm pin quang điện"}, {"term": "Hệ số nhiệt độ công suất (temperature coefficient of power)", "def": "mức suy giảm công suất của tấm pin khi nhiệt độ tăng, thường khoảng -0.3% đến -0.45%/°C", "cat": "Tấm pin quang điện"}, {"term": "Suy hao LID (Light Induced Degradation)", "def": "hiện tượng công suất tấm pin giảm nhẹ trong thời gian đầu tiếp xúc ánh sáng", "cat": "Tấm pin quang điện"}, {"term": "Bức xạ mặt trời trực xạ và tán xạ", "def": "trực xạ là ánh sáng chiếu thẳng, tán xạ là ánh sáng bị khuếch tán qua mây/khí quyển", "cat": "Tấm pin quang điện"}, {"term": "Diode bypass trong tấm pin", "def": "giúp dòng điện đi vòng qua chuỗi tế bào bị che bóng, giảm nguy cơ hotspot", "cat": "Tấm pin quang điện"}, {"term": "Hiện tượng hotspot trên tấm pin", "def": "điểm nóng cục bộ hình thành khi một phần tế bào bị che bóng và tiêu thụ ngược công suất, có thể gây cháy", "cat": "Tấm pin quang điện"}, {"term": "Hiện tượng PID (Potential Induced Degradation)", "def": "suy giảm hiệu suất tấm pin do chênh lệch điện thế giữa tế bào và khung/đất gây rò rỉ dòng điện", "cat": "Tấm pin quang điện"}, {"term": "Biến tần chuỗi (string inverter)", "def": "chuyển đổi DC-AC cho một hoặc vài chuỗi tấm pin, dùng phổ biến cho hệ dân dụng và thương mại vừa", "cat": "Biến tần"}, {"term": "Biến tần trung tâm (central inverter)", "def": "công suất lớn, dùng cho nhà máy điện mặt trời quy mô lớn, gom nhiều chuỗi pin về một biến tần", "cat": "Biến tần"}, {"term": "Biến tần vi mô (microinverter)", "def": "lắp gắn liền hoặc gần mỗi tấm pin, chuyển đổi DC-AC ngay tại tấm pin, tối ưu hiệu suất khi bị che bóng cục bộ", "cat": "Biến tần"}, {"term": "Biến tần hybrid (hybrid inverter)", "def": "tích hợp khả năng kết nối cả tấm pin, pin lưu trữ và lưới điện trong một thiết bị", "cat": "Biến tần"}, {"term": "Công nghệ MPPT (Maximum Power Point Tracking)", "def": "thuật toán dò điểm công suất cực đại để biến tần khai thác tối đa công suất từ tấm pin theo điều kiện thực tế", "cat": "Biến tần"}, {"term": "Nhiều bộ điều khiển MPPT độc lập trên một biến tần", "def": "cho phép đấu các chuỗi pin có hướng/góc nghiêng khác nhau mà không ảnh hưởng lẫn nhau", "cat": "Biến tần"}, {"term": "Hiệu suất Euro (Euro efficiency) của biến tần", "def": "chỉ số hiệu suất trung bình có trọng số theo các mức tải khác nhau, phản ánh hiệu suất thực tế tốt hơn hiệu suất đỉnh", "cat": "Biến tần"}, {"term": "Tổng độ méo hài dòng điện THD (Total Harmonic Distortion) của biến tần", "def": "chỉ số đánh giá chất lượng sóng điện AC đầu ra, càng thấp càng tốt, tiêu chuẩn thường yêu cầu dưới 5%", "cat": "Biến tần"}, {"term": "Chức năng chống đảo lưới (anti-islanding) của biến tần hòa lưới", "def": "tự động ngắt kết nối biến tần khỏi lưới khi mất điện lưới để đảm bảo an toàn cho người sửa chữa", "cat": "Biến tần"}, {"term": "Cấp bảo vệ IP65 trên biến tần", "def": "chống bụi hoàn toàn và chống tia nước áp lực thấp từ mọi hướng, phù hợp lắp ngoài trời", "cat": "Biến tần"}, {"term": "Tỉ lệ DC/AC (DC oversizing ratio) khi thiết kế hệ thống", "def": "tỉ lệ công suất DC tấm pin so với công suất AC định mức biến tần, thường thiết kế trong khoảng 1.1–1.3", "cat": "Biến tần"}, {"term": "Hiện tượng clipping (cắt công suất) ở biến tần", "def": "xảy ra khi công suất DC vượt quá công suất AC định mức, phần vượt bị giới hạn không sử dụng được", "cat": "Biến tần"}, {"term": "Điện áp đầu vào DC tối đa cho phép của biến tần (Max DC input voltage)", "def": "giới hạn điện áp hở mạch tổng của chuỗi pin không được vượt qua, đặc biệt quan trọng khi trời lạnh", "cat": "Biến tần"}, {"term": "Chế độ chờ đêm (night mode / standby) của biến tần", "def": "biến tần ngừng chuyển đổi công suất khi không có bức xạ nhưng vẫn có thể tiêu thụ điện tự dùng rất nhỏ", "cat": "Biến tần"}, {"term": "Giám sát biến tần qua ứng dụng/nền tảng online", "def": "cho phép theo dõi sản lượng, cảnh báo lỗi và hiệu suất từng chuỗi pin theo thời gian thực", "cat": "Biến tần"}, {"term": "Tuổi thọ trung bình của biến tần chuỗi", "def": "thường khoảng 10–15 năm, ngắn hơn tuổi thọ tấm pin (khoảng 25 năm)", "cat": "Biến tần"}, {"term": "Pin lithium sắt phốt phát LiFePO4 (LFP)", "def": "có độ ổn định nhiệt cao, an toàn hơn, tuổi thọ chu kỳ dài, thường 3000-6000 chu kỳ", "cat": "Pin lưu trữ"}, {"term": "Pin NMC (Nickel Manganese Cobalt)", "def": "mật độ năng lượng cao hơn LFP nhưng độ ổn định nhiệt thấp hơn, thường dùng trong xe điện", "cat": "Pin lưu trữ"}, {"term": "Độ sâu xả pin DoD (Depth of Discharge)", "def": "tỷ lệ phần trăm dung lượng pin đã sử dụng so với dung lượng định mức", "cat": "Pin lưu trữ"}, {"term": "Trạng thái sạc SOC (State of Charge)", "def": "phần trăm dung lượng hiện tại còn lại trong pin so với dung lượng đầy", "cat": "Pin lưu trữ"}, {"term": "Trạng thái sức khỏe pin SOH (State of Health)", "def": "chỉ số phản ánh dung lượng thực tế còn lại so với dung lượng ban đầu khi pin mới, đánh giá mức độ suy hao", "cat": "Pin lưu trữ"}, {"term": "Hệ thống quản lý pin BMS (Battery Management System)", "def": "giám sát và bảo vệ pin khỏi sạc/xả quá mức, quá nhiệt, cân bằng điện áp giữa các cell", "cat": "Pin lưu trữ"}, {"term": "Cân bằng cell (cell balancing) trong BMS", "def": "quá trình điều chỉnh để các cell trong pack có điện áp đồng đều, tránh cell yếu bị quá tải", "cat": "Pin lưu trữ"}, {"term": "Chu kỳ sạc-xả (cycle life) của pin lưu trữ", "def": "số lần sạc-xả pin có thể chịu được trước khi dung lượng suy giảm xuống mức quy định (thường 80%)", "cat": "Pin lưu trữ"}, {"term": "Tốc độ sạc/xả C-rate của pin", "def": "tỷ lệ dòng điện sạc/xả so với dung lượng danh định pin, ví dụ 1C nghĩa là xả hết dung lượng trong 1 giờ", "cat": "Pin lưu trữ"}, {"term": "Pin chì-axit (lead-acid) dùng trong lưu trữ năng lượng mặt trời", "def": "chi phí đầu tư thấp nhưng tuổi thọ ngắn hơn, DoD khuyến nghị thường chỉ khoảng 50% để kéo dài tuổi thọ", "cat": "Pin lưu trữ"}, {"term": "Pin lưu trữ ghép nối tiếp", "def": "tăng điện áp tổng của hệ thống pin lưu trữ trong khi dung lượng Ah giữ nguyên", "cat": "Pin lưu trữ"}, {"term": "Pin lưu trữ ghép song song", "def": "tăng dung lượng Ah tổng trong khi điện áp giữ nguyên", "cat": "Pin lưu trữ"}, {"term": "Nhiệt độ vận hành khuyến nghị của pin lithium", "def": "thường trong khoảng 0°C đến 45°C khi sạc, cần có hệ thống quản lý nhiệt phù hợp", "cat": "Pin lưu trữ"}, {"term": "Hiện tượng thoát nhiệt mất kiểm soát (thermal runaway) ở pin lithium", "def": "phản ứng dây chuyền sinh nhiệt mất kiểm soát có thể dẫn đến cháy nổ, thường do quá nhiệt, quá sạc hoặc hư hỏng cơ học", "cat": "Pin lưu trữ"}, {"term": "Công suất định mức (kW) so với dung lượng (kWh) của hệ thống lưu trữ", "def": "kW thể hiện công suất tức thời có thể xuất/nạp, kWh thể hiện tổng năng lượng lưu trữ được", "cat": "Pin lưu trữ"}, {"term": "Vị trí lắp đặt pin lưu trữ lithium trong nhà", "def": "nên đặt nơi thông thoáng, tránh ánh nắng trực tiếp, xa vật liệu dễ cháy và tuân thủ khoảng cách an toàn theo hướng dẫn nhà sản xuất", "cat": "Pin lưu trữ"}, {"term": "Hệ thống chữa cháy cho phòng đặt pin lưu trữ quy mô lớn", "def": "cần thiết kế riêng do đám cháy pin lithium khó dập bằng phương pháp thông thường và có thể tái cháy", "cat": "Pin lưu trữ"}, {"term": "Góc nghiêng tối ưu lắp đặt tấm pin", "def": "thường được chọn gần bằng vĩ độ địa lý của khu vực lắp đặt để tối ưu sản lượng cả năm", "cat": "Lắp đặt"}, {"term": "Hướng lắp đặt tấm pin ở Bắc bán cầu", "def": "thường hướng về phía Nam để tối ưu hấp thụ bức xạ mặt trời trong ngày", "cat": "Lắp đặt"}, {"term": "Khoảng cách hàng tấm pin để tránh che bóng lẫn nhau", "def": "tính toán dựa trên góc cao mặt trời thấp nhất trong năm và chiều cao tấm pin", "cat": "Lắp đặt"}, {"term": "Hệ khung giá đỡ (mounting structure) cho mái tôn", "def": "cần dùng kẹp/bát chuyên dụng phù hợp với loại tôn để đảm bảo chống thấm và chịu tải gió", "cat": "Lắp đặt"}, {"term": "Hệ khung giá đỡ cho mái bê tông", "def": "thường dùng đế bê tông đối trọng (ballast) hoặc bắt vít neo tùy theo tải gió và kết cấu mái", "cat": "Lắp đặt"}, {"term": "Hệ thống điện mặt trời nổi trên mặt nước (floating solar)", "def": "sử dụng phao nổi chuyên dụng, tận dụng mặt nước hồ/hồ chứa, giúp giảm nhiệt độ vận hành tấm pin", "cat": "Lắp đặt"}, {"term": "Tiếp địa (grounding) hệ thống điện mặt trời", "def": "kết nối khung giá đỡ, vỏ biến tần và các bộ phận kim loại xuống đất nhằm bảo vệ chống điện giật và sét", "cat": "Lắp đặt"}, {"term": "Thiết bị chống sét lan truyền SPD (Surge Protection Device)", "def": "bảo vệ hệ thống khỏi xung điện áp đột biến do sét đánh gần hoặc do lưới điện, thường lắp cả phía DC và AC", "cat": "Lắp đặt"}, {"term": "Tủ điện DC combiner box", "def": "gom các chuỗi tấm pin lại trước khi đưa vào biến tần, thường tích hợp cầu chì/CB và chống sét DC", "cat": "Lắp đặt"}, {"term": "Dây cáp DC chuyên dụng cho điện mặt trời (PV cable)", "def": "chống chịu tia UV, chịu nhiệt độ cao, cách điện kép, phù hợp lắp đặt ngoài trời lâu dài", "cat": "Lắp đặt"}, {"term": "Đầu nối MC4 trong hệ thống điện mặt trời", "def": "đầu nối chuẩn cho cáp DC, chống nước, khóa chặt để tránh hồ quang điện và rò rỉ", "cat": "Lắp đặt"}, {"term": "Kích thước dây dẫn (tiết diện cáp) trong hệ thống điện mặt trời", "def": "chọn dựa trên dòng điện tối đa, chiều dài dây và giới hạn sụt áp cho phép", "cat": "Lắp đặt"}, {"term": "Sụt áp (voltage drop) trên đường dây DC dài", "def": "gây tổn hao công suất, cần tính toán tiết diện dây phù hợp để giữ sụt áp trong giới hạn cho phép", "cat": "Lắp đặt"}, {"term": "Biển cảnh báo và nhãn dán an toàn trên hệ thống điện mặt trời", "def": "bắt buộc dán tại tủ điện, điểm ngắt kết nối để cảnh báo nguy hiểm điện và hướng dẫn ngắt khẩn cấp", "cat": "Lắp đặt"}, {"term": "Khoảng cách lối đi an toàn trên mái cho lính cứu hỏa (fire setback)", "def": "chừa lối đi quanh rìa mái và giữa các dãy pin theo quy định PCCC để lính cứu hỏa tiếp cận khi cần", "cat": "Lắp đặt"}, {"term": "Công tắc ngắt nhanh (rapid shutdown) theo tiêu chuẩn an toàn", "def": "cho phép hạ điện áp dây DC xuống mức an toàn nhanh chóng khi có sự cố hoặc để lính cứu hỏa thao tác", "cat": "Lắp đặt"}, {"term": "Kiểm tra cách điện (insulation resistance test) trước khi nghiệm thu hệ thống", "def": "đo điện trở cách điện giữa dây dẫn và đất để phát hiện rò rỉ điện trước khi đưa vào vận hành", "cat": "Lắp đặt"}, {"term": "Chứng nhận nghiệm thu và hòa lưới với công ty điện lực", "def": "cần hồ sơ kỹ thuật, kiểm tra bảo vệ chống đảo lưới và thỏa thuận đấu nối trước khi chính thức hòa lưới", "cat": "Lắp đặt"}, {"term": "Cơ chế bù trừ điện năng (net metering)", "def": "điện dư phát lên lưới được ghi nhận và bù trừ với điện tiêu thụ từ lưới theo chu kỳ thanh toán", "cat": "Đấu nối lưới điện"}, {"term": "Tiêu chuẩn an toàn IEC 62109 cho biến tần điện mặt trời", "def": "quy định các yêu cầu an toàn điện đối với bộ chuyển đổi công suất dùng trong hệ thống quang điện", "cat": "Đấu nối lưới điện"}, {"term": "Chứng nhận UL 1741 cho biến tần tại thị trường Mỹ", "def": "chứng nhận về an toàn và khả năng tương tác lưới điện của thiết bị chuyển đổi năng lượng phân tán", "cat": "Đấu nối lưới điện"}, {"term": "Tiêu chuẩn IEC 61730 cho tấm pin quang điện", "def": "quy định về an toàn kết cấu và điện của module quang điện", "cat": "Đấu nối lưới điện"}, {"term": "Thỏa thuận đấu nối (interconnection agreement) với đơn vị điện lực", "def": "văn bản quy định điều kiện kỹ thuật và thương mại để hệ thống điện mặt trời được phép hòa vào lưới điện", "cat": "Đấu nối lưới điện"}, {"term": "Công tơ hai chiều (bidirectional meter)", "def": "đo được cả điện năng tiêu thụ từ lưới và điện năng phát ngược lên lưới", "cat": "Đấu nối lưới điện"}, {"term": "Đơn vị kWp và kWh trong điện mặt trời", "def": "kWp đo công suất lắp đặt của hệ thống, kWh đo lượng điện năng tạo ra theo thời gian", "cat": "Kiến thức cơ bản"}, {"term": "Hệ thống điện mặt trời quy mô hộ gia đình (dân dụng)", "def": "thường có công suất từ vài kWp đến khoảng 10-20 kWp, lắp trên mái nhà ở", "cat": "Kiến thức cơ bản"}, {"term": "Công tơ điện hai chiều dùng để làm gì trong hệ thống hòa lưới", "def": "ghi nhận cả điện tiêu thụ từ lưới và điện phát dư lên lưới", "cat": "Kiến thức cơ bản"}, {"term": "Hệ thống điện 1 pha và 3 pha khi lắp điện mặt trời", "def": "hệ 1 pha dùng cho tải sinh hoạt nhỏ, hệ 3 pha dùng cho tải công suất lớn hoặc cân bằng pha tốt hơn", "cat": "Kiến thức cơ bản"}, {"term": "Tủ điện tổng (AC distribution board) trong hệ thống điện mặt trời", "def": "nơi tập trung đấu nối giữa biến tần, tải tiêu thụ và lưới điện, có CB bảo vệ tổng", "cat": "Kiến thức cơ bản"}, {"term": "Thời gian hoàn vốn (payback period) của hệ thống điện mặt trời", "def": "khoảng thời gian để tiền tiết kiệm/bán điện bù lại chi phí đầu tư ban đầu, thường vài năm tùy quy mô và giá điện", "cat": "Kiến thức cơ bản"}, {"term": "Tổn hao hệ thống (system losses) trong thiết kế điện mặt trời", "def": "bao gồm tổn hao do dây dẫn, nhiệt độ, bụi bẩn, hiệu suất biến tần... khiến sản lượng thực tế thấp hơn lý thuyết", "cat": "Kiến thức cơ bản"}, {"term": "Sản lượng điện theo mùa trong năm tại Việt Nam", "def": "thường cao hơn vào mùa khô, nắng nhiều và thấp hơn vào mùa mưa do bức xạ giảm", "cat": "Kiến thức cơ bản"}, {"term": "Bức xạ mặt trời trung bình tại các tỉnh miền Nam Việt Nam", "def": "thuộc nhóm khá cao so với cả nước, thuận lợi cho phát triển điện mặt trời", "cat": "Kiến thức cơ bản"}, {"term": "Vai trò của bản vẽ thiết kế (single line diagram) hệ thống điện mặt trời", "def": "thể hiện sơ đồ đấu nối tổng thể từ tấm pin, biến tần đến tủ điện và lưới điện, phục vụ thi công và nghiệm thu", "cat": "Kiến thức cơ bản"}, {"term": "Khung nhôm (aluminum frame) của tấm pin", "def": "tạo độ cứng vững, chống chịu thời tiết và là điểm để bắt kẹp cố định vào khung giá đỡ", "cat": "Tấm pin quang điện"}, {"term": "Lớp kính cường lực mặt trước tấm pin", "def": "bảo vệ lớp tế bào quang điện bên trong, cho ánh sáng xuyên qua với độ truyền quang cao", "cat": "Tấm pin quang điện"}, {"term": "Số lượng tế bào (cell) phổ biến trên một tấm pin dân dụng", "def": "thường là 60, 66, 72 hoặc 144 (half-cut) tế bào tùy dòng sản phẩm", "cat": "Tấm pin quang điện"}, {"term": "Công nghệ half-cut cell (cắt đôi tế bào)", "def": "giảm tổn hao điện trở, tăng hiệu suất nhẹ và giảm ảnh hưởng khi bị che bóng một phần", "cat": "Tấm pin quang điện"}, {"term": "Tiêu chuẩn IEC 61215 đối với tấm pin quang điện", "def": "quy định về độ bền và hiệu năng thiết kế của module quang điện mặt đất, kiểm tra qua các bài test khắc nghiệt", "cat": "Tấm pin quang điện"}, {"term": "Biến tần 1 pha và biến tần 3 pha", "def": "biến tần 1 pha phù hợp công suất nhỏ, biến tần 3 pha phù hợp công suất lớn và giúp cân bằng tải giữa các pha", "cat": "Biến tần"}, {"term": "Màn hình hiển thị (LCD/LED) trên biến tần", "def": "cho phép xem nhanh thông số vận hành như công suất, điện áp, mã lỗi ngay tại chỗ", "cat": "Biến tần"}, {"term": "Kết nối Wifi/4G/Ethernet trên biến tần hiện đại", "def": "cho phép truyền dữ liệu vận hành lên nền tảng giám sát từ xa qua internet", "cat": "Biến tần"}, {"term": "Quạt tản nhiệt trên biến tần công suất lớn", "def": "giúp làm mát linh kiện bên trong, kéo dài tuổi thọ và duy trì hiệu suất khi tải cao", "cat": "Biến tần"}, {"term": "Cập nhật firmware (phần mềm điều khiển) cho biến tần", "def": "giúp cải thiện hiệu suất, sửa lỗi và bổ sung tính năng mới theo khuyến nghị nhà sản xuất", "cat": "Biến tần"}, {"term": "Pin AGM (Absorbent Glass Mat)", "def": "một dạng pin chì-axit kín khí, ít bảo trì hơn pin chì-axit nước thông thường", "cat": "Pin lưu trữ"}, {"term": "Pin Gel (Gel Cell)", "def": "dùng chất điện phân dạng gel, chịu rung động tốt và ít rò rỉ hơn pin nước thông thường", "cat": "Pin lưu trữ"}, {"term": "Đơn vị Ah (Ampere-hour) trên pin lưu trữ", "def": "thể hiện dung lượng pin theo dòng điện xả trong một giờ, kết hợp với điện áp để tính ra Wh", "cat": "Pin lưu trữ"}, {"term": "Kết nối nhiều pack pin lưu trữ song song an toàn", "def": "cần các pack có cùng điện áp, cùng SOC và lý tưởng là cùng model để tránh dòng cân bằng lớn gây hư hỏng", "cat": "Pin lưu trữ"}, {"term": "Tủ rack lắp đặt pin lưu trữ dạng module", "def": "giúp sắp xếp gọn gàng, dễ bảo trì và mở rộng dung lượng khi cần trong tương lai", "cat": "Pin lưu trữ"}, {"term": "Khoan mái khi lắp hệ khung giá đỡ", "def": "cần chống thấm kỹ tại điểm khoan bằng keo/silicone chuyên dụng để tránh dột về sau", "cat": "Lắp đặt"}, {"term": "Ống luồn dây (conduit) bảo vệ cáp điện mặt trời", "def": "bảo vệ dây cáp khỏi tác động cơ học, tia UV và động vật gặm nhấm khi đi ngoài trời hoặc âm tường", "cat": "Lắp đặt"}, {"term": "Biển hiệu công trình đang thi công điện mặt trời", "def": "cảnh báo người xung quanh về khu vực nguy hiểm, hạn chế người không phận sự vào công trường", "cat": "Lắp đặt"}, {"term": "Giấy phép/thủ tục pháp lý khi lắp đặt điện mặt trời mái nhà", "def": "tùy quy định địa phương có thể cần thông báo hoặc xin phép trước khi thi công và trước khi đấu nối lưới", "cat": "Lắp đặt"}, {"term": "Kiểm tra tải trọng mái trước khi lắp hệ thống điện mặt trời", "def": "cần đánh giá khả năng chịu lực của kết cấu mái để đảm bảo an toàn khi thêm tải trọng tấm pin và khung giá đỡ", "cat": "Lắp đặt"}, {"term": "Giá FIT (Feed-in Tariff) trong điện mặt trời", "def": "mức giá ưu đãi mua điện từ các dự án năng lượng tái tạo do cơ quan có thẩm quyền quy định theo từng giai đoạn", "cat": "Đấu nối lưới điện"}, {"term": "Hợp đồng mua bán điện PPA (Power Purchase Agreement)", "def": "thỏa thuận giữa bên bán điện (chủ đầu tư) và bên mua điện về giá, sản lượng và điều kiện mua bán điện", "cat": "Đấu nối lưới điện"}, {"term": "Quy định giới hạn công suất lắp đặt theo diện tích/kết cấu mái", "def": "một số quy định giới hạn công suất lắp đặt điện mặt trời mái nhà theo khả năng chịu tải hoặc công suất tiêu thụ để đảm bảo an toàn lưới điện", "cat": "Đấu nối lưới điện"}];
const GUIDE_SAFETY = [{"term": "Trang bị bảo hộ cá nhân (PPE) khi lắp đặt điện mặt trời trên mái", "def": "bao gồm dây đai an toàn chống rơi ngã, giày cách điện, găng tay cách điện, mũ bảo hộ"}, {"term": "Nguy cơ hồ quang điện DC (DC arc flash)", "def": "hồ quang điện một chiều khó dập tắt hơn AC do không có điểm qua zero, nguy hiểm cao khi đấu nối/tháo dỡ có tải"}, {"term": "Quy trình khóa/gắn thẻ cách ly LOTO (Lockout-Tagout)", "def": "cách ly và gắn thẻ cảnh báo nguồn điện trước khi bảo trì để tránh cấp điện bất ngờ gây tai nạn"}, {"term": "Đặc điểm nguy hiểm của tấm pin quang điện khi có ánh sáng", "def": "tấm pin vẫn sinh ra điện áp DC ngay khi có ánh sáng chiếu vào, kể cả khi biến tần đã tắt, nên vẫn có nguy cơ điện giật"}, {"term": "Che phủ tấm pin trong quá trình thi công/bảo trì", "def": "dùng vải/bạt tối màu che kín tấm pin để giảm điện áp về gần 0V, tăng an toàn khi thao tác"}, {"term": "Nguy cơ khi làm việc trên mái dốc, mái cao", "def": "nguy cơ rơi ngã là mối nguy hàng đầu, cần lan can, dây đai an toàn và điểm neo chắc chắn"}, {"term": "Đo kiểm bằng đồng hồ vạn năng trước khi thao tác trên hệ thống DC", "def": "cần xác nhận không còn điện áp nguy hiểm trước khi chạm vào dây dẫn hoặc đầu nối"}, {"term": "Khoảng cách an toàn với đường dây điện cao thế khi thi công", "def": "phải tuân thủ khoảng cách tối thiểu theo quy định để tránh phóng điện, đặc biệt khi dùng thang, giàn giáo kim loại"}, {"term": "Rủi ro khi đấu nối tấm pin có cực tính (phân cực) sai", "def": "có thể gây hỏng biến tần, hồ quang điện hoặc cháy nổ do dòng điện ngược"}, {"term": "Sử dụng thang và giàn giáo khi thi công điện mặt trời", "def": "phải đảm bảo chắc chắn, đúng tải trọng cho phép và có người hỗ trợ giám sát an toàn"}, {"term": "Biện pháp phòng ngừa điện giật khi trời mưa/ẩm ướt", "def": "nên tạm dừng thi công phần điện khi trời mưa hoặc bề mặt ẩm ướt để giảm nguy cơ điện giật và trơn trượt"}, {"term": "Kiểm tra định kỳ hệ thống chống sét và tiếp địa", "def": "cần đo điện trở tiếp địa định kỳ để đảm bảo giá trị đạt yêu cầu theo quy định"}, {"term": "An toàn khi làm việc gần tủ điện AC đang mang điện", "def": "cần cách ly nguồn hoặc sử dụng công cụ cách điện chuyên dụng, tuân thủ khoảng cách an toàn"}, {"term": "Quy tắc làm việc theo cặp (buddy system) khi thi công trên cao", "def": "luôn có ít nhất hai người khi làm việc trên mái hoặc gần điện áp cao để hỗ trợ trong tình huống khẩn cấp"}, {"term": "Biện pháp phòng cháy khi lắp đặt gần vật liệu dễ cháy trên mái", "def": "giữ khoảng cách an toàn, tránh phát sinh tia lửa hàn/cắt gần vật liệu dễ cháy như lớp cách nhiệt trên mái"}, {"term": "Bình chữa cháy phù hợp cho sự cố điện", "def": "nên dùng loại CO2 hoặc bột khô (không dẫn điện), tránh dùng bình chữa cháy gốc nước khi thiết bị còn mang điện"}, {"term": "Huấn luyện an toàn điện định kỳ cho đội thi công", "def": "giúp cập nhật quy trình, nhắc lại kỹ năng xử lý tình huống và giảm nguy cơ tai nạn lao động"}, {"term": "Nguyên tắc cơ bản khi xử lý nạn nhân bị điện giật", "def": "nhanh chóng ngắt nguồn điện trước khi tiếp cận nạn nhân, sau đó sơ cứu và gọi cấp cứu"}, {"term": "Biển báo nguy hiểm điện cao thế gần khu vực thi công", "def": "cảnh báo khoảng cách nguy hiểm để công nhân và thiết bị thi công giữ khoảng cách an toàn"}, {"term": "Kiểm tra tình trạng dây đai an toàn trước mỗi lần sử dụng", "def": "phát hiện sớm dấu hiệu sờn, rách, hư hỏng móc khóa để tránh rủi ro khi làm việc trên cao"}];

const GUIDE_LOGGER_BRANDS = [
  {
    id: 'huawei', name: 'Huawei — SmartLogger3000', color: '#C7000B', badge: 'HW',
    app: 'Cấu hình qua trình duyệt (IP nội bộ của SmartLogger) + app FusionSolar để nghiệm thu',
    steps: [
      '<b>Đấu nối:</b> Đấu chuỗi RS485 (COM1–COM3 hoặc COM1–COM6 tuỳ đời) nối tiếp (daisy-chain) từ SmartLogger đến các inverter SUN2000 — cực <b>RS485A (+)</b> nối A, <b>RS485B (–)</b> nối B. Mỗi tuyến RS485 nên đi <b>tối đa ~30 inverter</b> để tín hiệu ổn định.',
      'SmartLogger3000A quản lý tối đa 80 thiết bị, bản 3000B quản lý tối đa 150 thiết bị (gồm cả inverter, trạm khí tượng, công tơ điện qua MBUS).',
      '<b>Cấp nguồn</b> cho SmartLogger, kết nối cổng WAN/LAN vào mạng internet (hoặc dùng SIM 4G nếu là bản có modem).',
      '<b>Cấu hình:</b> Dùng trình duyệt truy cập vào địa chỉ IP của SmartLogger (mặc định thường là 192.168.0.10), đăng nhập với mật khẩu mặc định <b>"Changeme"</b> (bắt buộc đổi ngay sau lần đăng nhập đầu).',
      'Vào mục "Cài đặt nhanh"/"Quick Settings" → bật <b>Link Setting = Enable</b> cho từng cổng RS485 đang sử dụng.',
      'Gán <b>địa chỉ Modbus riêng biệt</b> (không trùng) cho từng inverter trong chuỗi — đây là bước hay bị bỏ sót gây lỗi "mất thiết bị" trên hệ thống.',
      '<b>Sử dụng:</b> Đăng nhập app FusionSolar → Commissioning → quét mã QR/nhập serial SmartLogger để đưa vào "Nhà máy điện" trên FusionSolar, theo dõi tất cả inverter qua cùng 1 SmartLogger.',
    ],
    note: 'Nếu một inverter "biến mất" khỏi danh sách sau khi thêm inverter mới, khả năng cao là bị trùng địa chỉ Modbus — kiểm tra lại từng địa chỉ trong chuỗi RS485.',
  },
  {
    id: 'sungrow', name: 'Sungrow — Logger1000/3000', color: '#FF6A00', badge: 'SG',
    app: 'Có Web server tích hợp sẵn — cấu hình trực tiếp qua trình duyệt, không bắt buộc cài app',
    steps: [
      '<b>Đấu nối:</b> Đấu RS485 nối tiếp (daisy-chain) từ Logger đến tối đa <b>30 thiết bị</b> (inverter, combiner box, công tơ điện, trạm khí tượng).',
      'Chỉ bật <b>điện trở đầu cuối 120Ω (termination resistor)</b> ở thiết bị CUỐI CÙNG trong chuỗi — các thiết bị ở giữa phải tắt để tránh nhiễu tín hiệu.',
      '<b>Cấp nguồn</b> cho Logger, chọn 1 trong các cách đưa lên mạng: cổng Ethernet (LAN), WiFi tích hợp, hoặc 4G (bản có SIM).',
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
      '<b>Cấp nguồn</b> cho Logger, chọn phương thức mạng: WiFi tích hợp, 2 cổng LAN (Ethernet), hoặc 4G tuỳ bản.',
      '<b>Cấu hình lần đầu:</b> Kết nối điện thoại vào mạng WiFi do chính Logger/inverter phát ra, mở app <b>SolarGo</b> để dò và kết nối thiết bị.',
      'Trong app SolarGo, chọn cấu hình mạng cho Logger: nhập wifi nhà (nếu dùng WiFi) hoặc xác nhận đã cắm dây LAN.',
      'Có thể mở giao diện web nhúng của Logger (qua địa chỉ IP nội bộ) để xem/chỉnh thông số nâng cao nếu cần.',
      '<b>Sử dụng:</b> Logger hỗ trợ gửi dữ liệu đồng thời lên <b>SEMS Portal/SEMS+</b> và một nền tảng giám sát bên thứ ba (nếu chủ đầu tư yêu cầu tích hợp hệ thống riêng).',
    ],
    note: 'EzLogger3000C là dòng phù hợp cho hệ thống thương mại có nhiều inverter GoodWe đời khác nhau trong cùng một công trình.',
  },
  {
    id: 'sma', name: 'SMA — Data Manager M', color: '#E2001A', badge: 'SMA',
    app: 'Cấu hình qua webserver nội bộ + Sunny Portal powered by ennexOS',
    steps: [
      '<b>Đấu nối:</b> SMA Data Manager M (EDMM-20) kết nối các biến tần qua chuẩn <b>Speedwire (Ethernet)</b> — khác với RS485 của Huawei/Sungrow/GoodWe. Có thể đấu qua switch mạng thông thường, hỗ trợ tối đa <b>50 thiết bị</b>.',
      'Một số bản còn hỗ trợ thêm cổng RS485 để đọc thêm công tơ điện/cảm biến môi trường của hãng khác.',
      '<b>Cấp nguồn</b> cho Data Manager M, nối cổng mạng (3 cổng RJ45) vào cùng mạng LAN với các biến tần SMA và vào internet.',
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
    }
    const body = document.getElementById('toc-body-' + id);
    body.style.maxHeight = 'none';
  }
}
renderTOC();

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
const MUSIC_ICONS = { soi_dong:'🔥', bolero_nhe:'🌙', edm_manh:'⚡', lofi_thu_gian:'☕', dan_gian_dien_tu:'🥁' };
let musicOn = false;
let currentTrackId = (function(){ try{ return localStorage.getItem('quiz-app-music-track'); }catch(e){ return null; } })() || 'soi_dong';

function getTrackById(id){ return MUSIC_TRACKS.find(t => t.id === id) || MUSIC_TRACKS[0]; }

function loadCurrentTrackIntoAudio(){
  const audio = document.getElementById('bg-music');
  const track = getTrackById(currentTrackId);
  if(audio.dataset.trackId !== track.id){
    audio.src = 'data:audio/mpeg;base64,' + track.b64;
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
  wrap.innerHTML = MUSIC_TRACKS.map(t => `
    <button class="track-row ${t.id === currentTrackId ? 'active' : ''}" onclick="selectTrack('${t.id}')">
      <span class="track-icon">${MUSIC_ICONS[t.id] || '🎵'}</span>
      <span style="flex:1;">${escapeHtml(t.name)}</span>
      <span style="font-size:0.75rem; color:#8a9089;">${t.id === currentTrackId ? (musicOn ? 'Đang phát' : 'Đã chọn') : ''}</span>
    </button>`).join('') +
    `<p class="form-hint" style="margin-top:6px;">Chạm vào bài để nghe ngay. Bấm nút 🎵 để bật/tắt nhạc.</p>`;
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
      media: document.getElementById('setup-media-only').checked,
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
      document.getElementById('setup-media-only').checked = !!p.media;
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
  ['setup-media-only', 'setup-anon'].forEach((id) => {
    document.getElementById(id).addEventListener('change', () => { updateSetupHint(); saveSetupPrefs(); });
  });
  syncSegmented();
  updateSetupHint();
}
initSetupControls();
