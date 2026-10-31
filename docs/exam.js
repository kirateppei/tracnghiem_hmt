/* ==========================================================================
   Phần THI (tách khỏi luyện trắc nghiệm)
   - Khung chọn đề ở màn Làm bài: Bài thi mức Dễ / mức Khó, mỗi đề trộn 3 mức
     Dễ / Trung bình / Khó theo tỉ lệ trong EXAMS (app.js), chấm thang 10.
   - Điểm thi lưu ở Firestore `exam_results` (riêng với bảng luyện trắc nghiệm),
     mạng yếu thì giữ lại trên máy và tự gửi lại.
   - Bảng điểm thi trong tab Xếp hạng: theo từng đề, tháng / năm / tất cả,
     mỗi người lấy điểm cao nhất (bằng điểm thì ai làm nhanh hơn xếp trên).
   ========================================================================== */
(function(){
  const COL = 'exam_results', PEND = 'hmt-exam-pending';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (t) => { if(typeof showToast === 'function') showToast(t); };
  const db = () => (typeof fbDb !== 'undefined' && fbDb) ? fbDb : null;
  const me = () => (typeof session !== 'undefined' && session) ? session : null;
  const pct = (v) => Math.round(v * 100) + '%';
  const mm = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /* ---------- Khung chọn đề ---------- */
  function renderBox(){
    const box = document.getElementById('exam-box'); if(!box || typeof EXAMS === 'undefined') return;
    const opt = (k) => { const m = EXAMS[k].mix; return `<button type="button" class="exam-opt" onclick="startExam('${k}')">
      <b>🎓 Bài thi mức ${EXAMS[k].name}</b>
      <span class="exam-mix" aria-hidden="true"><i class="mx-de" style="width:${pct(m.de)}"></i><i class="mx-tb" style="width:${pct(m.tb)}"></i><i class="mx-kho" style="width:${pct(m.kho)}"></i></span>
      <small>Dễ ${pct(m.de)} · TB ${pct(m.tb)} · Khó ${pct(m.kho)}</small></button>`; };
    box.innerHTML = `<h3>🎓 Thi</h3>
      <p>Mỗi đề ${EXAM_COUNT} câu · ${EXAM_MINUTES} phút · trộn 3 mức độ, đi từ dễ đến khó. Chấm thang điểm 10: câu Dễ 1 điểm, Trung bình 1,5, Khó 2 (quy đổi về 10). Không lộ đáp án khi đang thi. Từ 5 điểm là Đạt, 8 điểm Giỏi, 9 điểm Xuất sắc.</p>
      <div class="exam-opts">${opt('de')}${opt('kho')}</div>
      <button type="button" class="exam-link" onclick="switchTab('leaderboard'); Exam.lbMode('exam')">🏆 Xem bảng điểm thi →</button>`;
  }

  /* ---------- Gửi điểm ---------- */
  function loadPend(){ try{ const a = JSON.parse(localStorage.getItem(PEND) || '[]'); return Array.isArray(a) ? a : []; }catch(e){ return []; } }
  function savePend(a){ try{ localStorage.setItem(PEND, JSON.stringify(a.slice(-20))); }catch(e){} }
  function send(rec){
    const d = db(); if(!d) return Promise.reject(new Error('offline'));
    const data = { uid: rec.uid, name: rec.name, exam: rec.exam, score: rec.score, correct: rec.correct, total: rec.total, dur: rec.dur, ts: firebase.firestore.FieldValue.serverTimestamp() };
    if(rec.photo) data.photo = rec.photo;
    return Promise.race([d.collection(COL).doc(rec.id).set(data), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 15000))]);
  }
  async function submit(r){
    const s = me(); if(!s) return;
    const rec = { id: `${s.uid}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, uid: s.uid,
      name: r.anon ? (typeof ANON_NAME !== 'undefined' ? ANON_NAME : 'Ẩn danh') : String(s.name || '').slice(0, 80),
      photo: r.anon ? '' : (s.photo || ''), exam: r.exam, score: r.score, correct: r.correct, total: r.total, dur: Math.min(r.dur, 7200) };
    try{ await send(rec); cache = {}; toast('Đã ghi điểm thi vào bảng điểm.'); }
    catch(e){
      if(e && e.code === 'permission-denied'){ toast('Chưa ghi được điểm thi: cần dán lại luật Firestore mới (xem HUONG_DAN.md).'); return; }
      const p = loadPend(); p.push(rec); savePend(p); toast('Chưa gửi được điểm thi (mạng yếu?). Sẽ tự gửi lại khi có mạng.');
    }
  }
  let flushing = false;
  async function flush(){
    if(flushing) return; const p = loadPend(); if(!p.length || !db()) return; flushing = true;
    const left = [];
    for(const r of p){ try{ await send(r); }catch(e){ if(!(e && e.code === 'permission-denied')) left.push(r); } }
    savePend(left); flushing = false; if(left.length < p.length) cache = {};
  }

  /* ---------- Bảng điểm thi ---------- */
  let mode = 'quiz', exam = 'de', range = 'month', cache = {};
  function rangeStart(){
    const d = new Date();
    if(range === 'month') return new Date(d.getFullYear(), d.getMonth(), 1);
    if(range === 'year') return new Date(d.getFullYear(), 0, 1);
    return new Date(2020, 0, 1);
  }
  async function fetchRows(){
    const key = range, hit = cache[key];
    if(hit && Date.now() - hit.at < 120000) return hit.rows;
    const d = db(); if(!d) throw new Error('offline');
    const snap = await d.collection(COL).where('ts', '>=', firebase.firestore.Timestamp.fromDate(rangeStart())).orderBy('ts', 'desc').limit(1000).get();
    const rows = snap.docs.map((x) => { const v = x.data({ serverTimestamps: 'estimate' }) || {}; return { id: x.id, uid: v.uid, name: v.name, photo: v.photo || '', exam: v.exam, score: +v.score || 0, correct: v.correct, total: v.total, dur: v.dur || 0, ts: v.ts && v.ts.toMillis ? v.ts.toMillis() : 0 }; });
    cache[key] = { at: Date.now(), rows };
    return rows;
  }
  function best(rows){
    const by = new Map();
    rows.filter((r) => r.exam === exam).forEach((r) => {
      const k = (r.name === (typeof ANON_NAME !== 'undefined' ? ANON_NAME : 'Ẩn danh') ? 'anon:' : '') + r.uid;
      const o = by.get(k); if(!o){ by.set(k, Object.assign({ n: 1 }, r)); return; }
      o.n++; if(r.score > o.score || (r.score === o.score && r.dur < o.dur)) Object.assign(o, r, { n: o.n });
    });
    return [...by.values()].sort((a, b) => (b.score - a.score) || (a.dur - b.dur) || (a.ts - b.ts)).slice(0, 100);
  }
  async function drawBoard(){
    const el = document.getElementById('exam-board'); if(!el) return;
    const tabs = (arr, cur, fn) => `<div class="eb-tabs">${arr.map(([k, t]) => `<button type="button" class="${k === cur ? 'on' : ''}" onclick="Exam.${fn}('${k}')">${t}</button>`).join('')}</div>`;
    el.innerHTML = tabs([['de', '🎓 Bài thi Dễ'], ['kho', '🎓 Bài thi Khó']], exam, 'setExam') + tabs([['month', 'Tháng này'], ['year', 'Năm nay'], ['all', 'Tất cả']], range, 'setRange') + '<p class="ex-note">Đang tải…</p>';
    let rows;
    try{ rows = best(await fetchRows()); }
    catch(e){
      el.querySelector('.ex-note').innerHTML = /permission/i.test(e && (e.code || e.message)) ? '⚠ Firestore chưa cho đọc bảng điểm thi. Dán lại toàn bộ <b>firestore.rules</b> vào Firebase rồi tải lại.' : '⚠ Không tải được bảng điểm (mạng). Thử lại sau.';
      return;
    }
    const uid = me() && me().uid;
    const g = (s) => (typeof examGrade === 'function' ? examGrade(s) : { t: '', e: '' });
    const medal = (i) => ['🥇', '🥈', '🥉'][i] || (i + 1);
    el.querySelector('.ex-note').outerHTML = rows.length
      ? `<p class="ex-note">Mỗi người lấy điểm cao nhất · bằng điểm thì ai làm nhanh hơn xếp trên · ${rows.length} người</p><div class="ex-list">${rows.map((r, i) => `
        <div class="ex-row ${r.uid === uid ? 'me' : ''}"><span class="ex-rank">${medal(i)}</span>
        <span class="ex-name"><b>${esc(r.name || 'Ẩn danh')}</b><small>${g(r.score).e} ${g(r.score).t} · đúng ${r.correct}/${r.total} · ${mm(r.dur)} · ${r.n} lần thi</small></span>
        <span class="ex-score"><b>${typeof fmtScore === 'function' ? fmtScore(r.score) : r.score}</b><small>/10</small></span></div>`).join('')}</div>`
      : '<p class="ex-note">Chưa có ai thi đề này trong khoảng thời gian này. Vào tab Làm bài → 🎓 Thi để mở màn!</p>';
  }
  function lbMode(m){
    mode = m === 'exam' ? 'exam' : 'quiz';
    const q = document.getElementById('lb-quiz-wrap'), e = document.getElementById('exam-board');
    if(q) q.hidden = mode === 'exam'; if(e) e.hidden = mode !== 'exam';
    const bq = document.getElementById('lbm-quiz'), be = document.getElementById('lbm-exam');
    if(bq) bq.classList.toggle('on', mode === 'quiz'); if(be) be.classList.toggle('on', mode === 'exam');
    if(mode === 'exam'){ flush().finally(drawBoard); }
  }

  if(typeof window.enterApp === 'function'){
    const orig = window.enterApp;
    window.enterApp = function(){ const r = orig.apply(this, arguments); try{ renderBox(); cache = {}; setTimeout(flush, 3000); }catch(e){} return r; };
  }
  window.addEventListener('online', () => { flush(); });
  if(document.readyState !== 'loading') renderBox(); else document.addEventListener('DOMContentLoaded', renderBox);

  window.Exam = { submit, lbMode, render: renderBox, setExam: (k) => { exam = k; drawBoard(); }, setRange: (k) => { range = k; drawBoard(); } };
})();
