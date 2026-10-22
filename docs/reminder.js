/* ==========================================================================
   Nhắc học mỗi ngày
   - App Android (Capacitor, có plugin LocalNotifications): đặt sẵn thông báo cho
     14 ngày tới vào giờ người dùng chọn. Mỗi lần mở app hoặc học xong trong ngày
     thì xếp lại, nên hôm nay đã học sẽ không bị nhắc nữa.
   - Trình duyệt: không tự hẹn giờ được, nên cho tải file lịch (.ics) lặp mỗi ngày
     để điện thoại/máy tính tự nhắc.
   - Trong app: Nắng nhắc khi hôm nay chưa học mà chuỗi ngày học sắp đứt.
   Cài đặt lưu trên máy (localStorage 'hmt-remind-v1').
   ========================================================================== */
(function(){
  const KEY = 'hmt-remind-v1';
  const DAYS = 14, BASE_ID = 7001, CHANNEL = 'nhac-hoc';
  const DEF = { on: false, time: '20:00', asked: false };
  let pref = load();

  function load(){
    try{ return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); }catch(e){ return Object.assign({}, DEF); }
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(pref)); }catch(e){} }

  function plugin(){
    const cap = window.Capacitor;
    try{
      if(!cap || !(typeof cap.isNativePlatform === 'function' && cap.isNativePlatform())) return null;
      if(typeof cap.isPluginAvailable === 'function' && !cap.isPluginAvailable('LocalNotifications')) return null;
      return (cap.Plugins && cap.Plugins.LocalNotifications) || null;
    }catch(e){ return null; }
  }
  const isNative = () => { try{ return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }catch(e){ return false; } };

  function stats(){ try{ return typeof loadStats === 'function' ? loadStats() : { days: [], n: 0 }; }catch(e){ return { days: [], n: 0 }; } }
  const today = () => (typeof dayStr === 'function' ? dayStr(new Date()) : new Date().toISOString().slice(0, 10));
  function studiedToday(){ return stats().days.includes(today()); }
  function streak(){ try{ return typeof streakDays === 'function' ? streakDays(stats().days) : 0; }catch(e){ return 0; } }
  function hm(){ const m = /^(\d{1,2}):(\d{2})$/.exec(pref.time || '') || [0, 20, 0]; return [Math.min(23, +m[1]), Math.min(59, +m[2])]; }

  const TIPS = [
    'Ôn 10 câu chỉ mất 5 phút thôi ☀️',
    'Làm một bài nhanh để giữ phong độ nhé!',
    'Hôm nay thử chủ đề bạn hay sai xem sao 🎯',
    'Kiến thức an toàn điện cần nhắc lại thường xuyên ⚡',
    'Vào làm vài câu rồi chơi Run now: HMT xả hơi 🏃',
    'Câu hỏi đang chờ bạn đó! 📋',
    'Mỗi ngày một ít, thi là chắc 💪',
  ];
  function message(i, k){
    // k: chuỗi ngày nếu người dùng học đều đến hôm trước ngày nhắc
    const tip = TIPS[(new Date().getDate() + i) % TIPS.length];
    if(k >= 2) return { title: `🔥 Giữ chuỗi ${k} ngày học!`, body: tip };
    if(i >= DAYS - 1) return { title: '☀️ Lâu rồi không gặp!', body: 'Nắng nhớ bạn. Vào ôn vài câu trắc nghiệm nhé.' };
    return { title: '☀️ Nắng nhắc: đến giờ ôn bài', body: tip };
  }

  async function cancelAll(LN){
    const ids = []; for(let i = 0; i < DAYS; i++) ids.push({ id: BASE_ID + i });
    try{ await LN.cancel({ notifications: ids }); }catch(e){}
  }

  let busy = null;
  async function reschedule(){
    const LN = plugin(); if(!LN) return false;
    if(busy) return busy;
    busy = (async () => {
      await cancelAll(LN);
      if(!pref.on) return true;
      try{ await LN.createChannel({ id: CHANNEL, name: 'Nhắc học mỗi ngày', description: 'Thông báo nhắc ôn trắc nghiệm', importance: 4, visibility: 1, vibration: true }); }catch(e){}
      const [h, m] = hm(), now = new Date(), done = studiedToday(), k0 = streak();
      const list = [];
      for(let d = 0, i = 0; i < DAYS; d++){
        const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, h, m, 0);
        if(d === 0 && (done || at <= now)) continue;          // hôm nay đã học hoặc đã qua giờ
        // chuỗi ngày trước ngày nhắc, giả sử người dùng học đều từ nay tới đó
        const k = d === 0 ? k0 : (done ? k0 + d - 1 : 0);
        const msg = message(i, k);
        list.push({ id: BASE_ID + i, title: msg.title, body: msg.body, channelId: CHANNEL, schedule: { at, allowWhileIdle: true }, extra: { tab: 'quiz' }, autoCancel: true });
        i++;
      }
      await LN.schedule({ notifications: list });
      return true;
    })().finally(() => { busy = null; });
    return busy;
  }

  async function enable(on){
    const LN = plugin();
    if(on && LN){
      let p = {};
      try{ p = await LN.checkPermissions(); }catch(e){}
      if(p.display !== 'granted'){ try{ p = await LN.requestPermissions(); }catch(e){} }
      if(p.display !== 'granted'){
        pref.on = false; save(); render();
        toast('Chưa được cấp quyền thông báo. Vào Cài đặt điện thoại → Ứng dụng → Trắc Nghiệm ĐMT → Thông báo → Bật.');
        return;
      }
    }
    pref.on = !!on; pref.asked = true; save();
    if(LN){
      try{ await reschedule(); toast(on ? `Đã bật nhắc học lúc ${pref.time} mỗi ngày 🔔` : 'Đã tắt nhắc học.'); }
      catch(e){ toast('Không đặt được thông báo: ' + (e && e.message || e)); }
    }
    render();
  }

  function toast(t){ if(typeof showToast === 'function') showToast(t); }

  // File lịch lặp hằng ngày có báo nhắc, dùng cho trình duyệt / iPhone
  function icsFile(){
    const [h, m] = hm(), d = new Date(), p2 = (n) => String(n).padStart(2, '0');
    const start = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}T${p2(h)}${p2(m)}00`;
    const url = location.origin + location.pathname;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HMT//Trac Nghiem DMT//VI', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', `UID:nhac-hoc-hmt-${Date.now()}@tracnghiem`, `DTSTAMP:${stamp}`,
      `DTSTART:${start}`, 'DURATION:PT15M', 'RRULE:FREQ=DAILY',
      'SUMMARY:☀️ Ôn trắc nghiệm ĐMT', `DESCRIPTION:Mở app ôn 10 câu: ${url}`, `URL:${url}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Đến giờ ôn trắc nghiệm ĐMT', 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  function downloadIcs(){
    const blob = new Blob([icsFile()], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'nhac-hoc-trac-nghiem.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Đã tải file lịch. Mở file để thêm vào Lịch điện thoại/Google Calendar.');
  }

  function render(){
    const box = document.getElementById('remind-body'); if(!box) return;
    const LN = plugin(), native = isNative();
    const timeRow = `<label class="rm-time">⏰ Giờ nhắc <input type="time" id="rm-time" value="${pref.time}"></label>`;
    if(LN){
      box.innerHTML = `
        <label class="rm-switch"><input type="checkbox" id="rm-on" ${pref.on ? 'checked' : ''}><span class="rm-slider"></span><b>Thông báo nhắc ôn bài mỗi ngày</b></label>
        ${timeRow}
        <p class="form-hint">${pref.on ? `🔔 Nắng sẽ nhắc lúc ${pref.time} hằng ngày. Hôm nào đã làm bài thì không nhắc.` : 'Bật để nhận thông báo trên điện thoại, kể cả khi không mở app.'}</p>
        ${pref.on ? '<button type="button" class="secondary rm-test" id="rm-test">Gửi thử 1 thông báo</button>' : ''}`;
    } else {
      box.innerHTML = `
        ${timeRow}
        <button type="button" class="secondary" id="rm-ics" style="width:100%;">📅 Thêm nhắc học vào Lịch (mỗi ngày)</button>
        <p class="form-hint">${native
          ? 'Bản app đang cài chưa hỗ trợ thông báo. Cập nhật app Android mới nhất để bật nhắc tự động.'
          : 'Trên trình duyệt, tải file lịch rồi mở để Lịch điện thoại tự nhắc mỗi ngày. Cài app Android để nhận thông báo tự động.'}</p>`;
    }
    const on = box.querySelector('#rm-on'); if(on) on.onchange = () => enable(on.checked);
    const t = box.querySelector('#rm-time');
    if(t) t.onchange = () => { if(!/^\d{1,2}:\d{2}$/.test(t.value)) return; pref.time = t.value; save(); if(pref.on && plugin()) reschedule().then(() => toast(`Đã đổi giờ nhắc: ${pref.time}`)); render(); };
    const ics = box.querySelector('#rm-ics'); if(ics) ics.onclick = downloadIcs;
    const tb = box.querySelector('#rm-test');
    if(tb) tb.onclick = async () => {
      try{ await plugin().schedule({ notifications: [{ id: BASE_ID + 99, title: '☀️ Nắng gửi thử', body: 'Thông báo nhắc học đã hoạt động!', channelId: CHANNEL, schedule: { at: new Date(Date.now() + 3000) }, extra: { tab: 'quiz' } }] }); toast('Thông báo thử sẽ hiện sau 3 giây.'); }
      catch(e){ toast('Lỗi: ' + (e && e.message || e)); }
    };
  }

  // Nắng nhắc trong app khi hôm nay chưa học và chuỗi ngày sắp đứt
  let nudged = false;
  function nudge(){
    if(nudged || studiedToday()) return;
    const k = streak(); nudged = true;
    const say = window.Mascot && window.Mascot.say;
    if(!say) return;
    if(k >= 1) say(`🔥 Bạn đang có chuỗi ${k} ngày học! Hôm nay làm vài câu để giữ chuỗi nhé.`, { mood: 'wow', ms: 7000 });
    else if(stats().n > 0) say('Hôm qua bạn nghỉ học rồi đó 😴 Làm 10 câu lấy lại phong độ nha!', { mood: 'think', ms: 7000 });
  }

  function afterLogin(){
    render();
    if(plugin() && pref.on) reschedule().catch(() => {});
    setTimeout(nudge, 9000);
    // Gợi ý bật nhắc 1 lần trong app Android
    if(plugin() && !pref.asked && !pref.on && window.Mascot){
      setTimeout(() => { pref.asked = true; save(); window.Mascot.say('Muốn Nắng nhắc bạn ôn bài mỗi ngày không? Bật ở mục 🔔 Nhắc học mỗi ngày bên dưới nhé!', { mood: 'happy', ms: 8000 }); }, 20000);
    }
  }

  // Học xong trong ngày → xếp lại để không nhắc hôm nay nữa
  let lastDay = '';
  if(typeof window.recordStat === 'function'){
    const orig = window.recordStat;
    window.recordStat = function(){
      const r = orig.apply(this, arguments);
      const d = today();
      if(d !== lastDay){ lastDay = d; if(pref.on && plugin()) reschedule().catch(() => {}); }
      return r;
    };
  }

  // Bấm vào thông báo → mở tab làm bài
  try{
    const LN = plugin();
    if(LN && LN.addListener) LN.addListener('localNotificationActionPerformed', () => { try{ if(typeof switchTab === 'function') switchTab('quiz'); }catch(e){} });
  }catch(e){}

  if(typeof window.enterApp === 'function'){
    const origEnter = window.enterApp;
    window.enterApp = function(){ const r = origEnter.apply(this, arguments); try{ afterLogin(); }catch(e){} return r; };
  }
  document.addEventListener('DOMContentLoaded', render);
  if(document.readyState !== 'loading') render();

  window.Reminder = { reschedule, enable, render, ics: icsFile, pref: () => Object.assign({}, pref) };
})();
