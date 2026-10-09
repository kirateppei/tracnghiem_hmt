/* Tab "Trò chơi": 4 mini game giải trí (khám răng cá sấu, nhét dao thùng hải tặc, lắc xí ngầu, vòng quay may mắn).
   Chạy hoàn toàn trên máy, không ghi gì lên Firebase. Dựng giao diện vào #view-games khi mở tab lần đầu. */
(function(){
  'use strict';
  const FAST = !!window.GAMES_FAST;            // dùng cho kiểm thử: rút ngắn hiệu ứng
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rand = (n) => { try{ const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }catch(e){ return Math.floor(Math.random() * n); } };
  const store = (k, v) => {
    try{
      if(v === undefined) return JSON.parse(localStorage.getItem('gm_' + k));
      localStorage.setItem('gm_' + k, JSON.stringify(v));
    }catch(e){}
    return null;
  };

  /* ---------- Âm thanh & rung ---------- */
  let actx = null;
  let muted = !!store('mute');
  function ctx(){
    try{ actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if(actx.state === 'suspended') actx.resume(); }catch(e){}
    return actx;
  }
  function beep(freq, dur, type, vol, delay){
    if(muted) return;
    const c = ctx(); if(!c) return;
    try{
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + (delay || 0);
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol || 0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    }catch(e){}
  }
  function noise(dur, vol){
    if(muted) return;
    const c = ctx(); if(!c) return;
    try{
      const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const s = c.createBufferSource(), g = c.createGain();
      g.gain.value = vol || 0.15; s.buffer = buf; s.connect(g); g.connect(c.destination); s.start();
    }catch(e){}
  }
  const buzz = (p) => { try{ if(!muted && navigator.vibrate) navigator.vibrate(p); }catch(e){} };

  /* ---------- CSS (nhúng một lần) ---------- */
  const CSS = `
  #view-games .gm-menu{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  #view-games .gm-card{ background:var(--card,#fdfaf0); color:var(--card-ink,#1b3a2f); border-radius:16px; padding:18px 10px; text-align:center; cursor:pointer; border:0; font:inherit; box-shadow:0 4px 14px rgba(0,0,0,.18); }
  #view-games .gm-card .ico{ font-size:2.4rem; display:block; margin-bottom:6px; }
  #view-games .gm-card b{ display:block; font-size:.95rem; }
  #view-games .gm-card small{ display:block; color:#5c6a63; margin-top:3px; font-size:.74rem; line-height:1.3; }
  #view-games .gm-top{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
  #view-games .gm-top h2{ margin:0; font-size:1.15rem; flex:1; }
  #view-games .gm-mini{ border:1px solid var(--board-line,#4b6a5c); background:var(--glass,rgba(255,255,255,.08)); color:var(--chalk,#fff); border-radius:10px; padding:7px 11px; font:inherit; font-size:.82rem; cursor:pointer; }
  #view-games .gm-panel{ background:var(--card,#fdfaf0); color:var(--card-ink,#1b3a2f); border-radius:16px; padding:14px; margin-bottom:12px; }
  #view-games .gm-panel label{ font-size:.8rem; font-weight:700; display:block; margin-bottom:6px; }
  #view-games .gm-seg{ display:flex; gap:6px; flex-wrap:wrap; }
  #view-games .gm-seg button{ flex:1 0 38px; padding:9px 0; border-radius:10px; border:1px solid #c5d3cb; background:#fff; color:#1b3a2f; font:inherit; font-weight:700; cursor:pointer; }
  #view-games .gm-seg button.on{ background:var(--accent,#f2b705); border-color:transparent; color:var(--accent-ink,#1b3a2f); }
  #view-games .gm-names{ display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:8px; }
  #view-games .gm-names input, #view-games textarea{ width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid #c5d3cb; border-radius:10px; font:inherit; font-size:.9rem; background:#fff; color:#1b3a2f; }
  #view-games .gm-primary{ width:100%; padding:13px; border:0; border-radius:12px; background:var(--accent,#f2b705); color:var(--accent-ink,#1b3a2f); font:inherit; font-weight:800; font-size:1rem; cursor:pointer; margin-top:10px; }
  #view-games .gm-status{ text-align:center; font-weight:700; margin:8px 0 12px; min-height:2.6em; }
  #view-games .gm-status.lose{ color:#ff8a80; font-size:1.1rem; }
  #view-games .gm-hint{ text-align:center; font-size:.78rem; opacity:.8; margin-top:6px; }
  /* cá sấu (giao diện nền nước, miệng há to) */
  #view-games .gm-water{ position:relative; border-radius:18px; padding:14px 10px 16px; background:linear-gradient(#1aa3c9 0%,#0d6e9c 35%,#0a3d66 100%); box-shadow:inset 0 0 40px rgba(0,0,0,.25); overflow:hidden; }
  #view-games .gm-gear{ position:absolute; right:10px; top:10px; width:42px; height:42px; border-radius:50%; border:0; background:linear-gradient(#ffb347,#e67e22); color:#fff; font-size:1.4rem; cursor:pointer; box-shadow:0 3px 8px rgba(0,0,0,.35); z-index:3; }
  #view-games .gm-banner{ margin:44px -10px 8px; padding:10px 8px; text-align:center; background:rgba(5,25,45,.78); color:#e6ff4a; font-weight:900; font-size:.95rem; letter-spacing:.02em; text-transform:uppercase; min-height:2.4em; display:flex; align-items:center; justify-content:center; }
  #view-games .gm-banner.lose{ color:#ff8a80; }
  #view-games .gm-mouth{ position:relative; width:100%; max-width:320px; margin:0 auto; aspect-ratio:320/360; }
  #view-games .gm-mouthsvg{ width:100%; height:100%; display:block; }
  #view-games .gm-lowteeth{ position:absolute; left:10%; right:10%; bottom:17%; display:flex; gap:3%; align-items:flex-end; justify-content:center; }
  #view-games .gm-tooth{ flex:1 1 0; max-width:54px; height:62px; border:0; padding:0; cursor:pointer; background:linear-gradient(90deg,#d5dde2,#fff 45%,#cfd8dc); border-radius:50% 50% 14% 14% / 78% 78% 10% 10%; box-shadow:0 3px 0 rgba(0,0,0,.3); transition:transform .12s, filter .12s; }
  #view-games .gm-tooth:active{ transform:translateY(3px); }
  #view-games .gm-tooth.down{ transform:translateY(18px) scale(.88); filter:brightness(.6); cursor:default; }
  #view-games .gm-tooth.bad{ background:linear-gradient(90deg,#e57373,#ff8a80 45%,#e57373); }
  #view-games .gm-bang{ position:absolute; left:50%; top:46%; transform:translate(-50%,-50%) scale(.2) rotate(-12deg); font-size:3.6rem; font-weight:900; color:#fff; -webkit-text-stroke:2px #b71c1c; text-shadow:0 4px 0 #b71c1c; opacity:0; pointer-events:none; white-space:nowrap; }
  #view-games .gm-mouth.snap{ animation:gm-shake .5s 2; }
  #view-games .gm-mouth.snap .gm-bang{ animation:gm-bang 1.2s forwards; }
  @keyframes gm-bang{ 0%{ opacity:1; transform:translate(-50%,-50%) scale(.2) rotate(-12deg); } 25%{ opacity:1; transform:translate(-50%,-50%) scale(1.25) rotate(-6deg); } 100%{ opacity:1; transform:translate(-50%,-50%) scale(1) rotate(-6deg); } }
  @keyframes gm-shake{ 0%,100%{ transform:translateX(0) rotate(0); } 25%{ transform:translateX(-8px) rotate(-4deg); } 75%{ transform:translateX(8px) rotate(4deg); } }
  #view-games .gm-pill{ width:min(72%,260px); margin:12px auto 0; padding:10px; text-align:center; font-weight:900; font-size:1.05rem; color:#fff; border-radius:14px; background:linear-gradient(#7cb342,#558b2f); border:2px solid #33691e; text-shadow:0 2px 0 rgba(0,0,0,.35); }
  #view-games .gm-carousel{ display:flex; align-items:center; gap:8px; margin-bottom:10px; }
  #view-games .gm-carousel > button, #view-games .gm-step button{ width:40px; height:40px; border-radius:50%; border:0; font-size:1.4rem; font-weight:900; color:#fff; background:linear-gradient(#8bc34a,#558b2f); cursor:pointer; flex:none; }
  #view-games .gm-charview{ flex:1; text-align:center; background:#eef3ef; border-radius:14px; padding:8px; }
  #view-games .gm-charview .big{ font-size:3rem; line-height:1.1; display:block; }
  #view-games .gm-charview small{ font-weight:700; }
  #view-games .gm-steps{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  #view-games .gm-step{ display:flex; align-items:center; justify-content:space-between; gap:6px; background:#eef3ef; border-radius:24px; padding:3px; }
  #view-games .gm-step b{ flex:1; text-align:center; font-size:.95rem; }
  #view-games .gm-modal{ position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:150; display:flex; align-items:center; justify-content:center; padding:16px; }
  #view-games .gm-modal .gm-panel{ width:100%; max-width:380px; margin:0; max-height:90vh; overflow:auto; }
  /* thùng hải tặc */
  .gm-barrel{ position:relative; width:290px; height:290px; margin:6px auto 0; border-radius:50%; background:
    radial-gradient(circle at 50% 50%, #5b3a1c 0 38%, transparent 39%),
    repeating-conic-gradient(#a8742f 0 15deg, #8a5a22 15deg 30deg); border:6px solid #5b3a1c; box-shadow:0 8px 22px rgba(0,0,0,.35); }
  .gm-slot{ position:absolute; width:44px; height:44px; margin:-22px 0 0 -22px; border-radius:50%; border:3px solid #2c1a08; background:#1d1006; cursor:pointer; padding:0; font-size:1.5rem; line-height:1; display:flex; align-items:center; justify-content:center; transition:transform .12s; }
  .gm-slot:active{ transform:scale(.9); }
  .gm-slot .knife{ display:block; }
  .gm-slot.used{ cursor:default; background:#3a3a3a; }
  .gm-pirate{ position:absolute; left:50%; top:50%; font-size:3rem; transform:translate(-50%,-50%) scale(.1); opacity:0; pointer-events:none; }
  .gm-barrel.boom .gm-pirate{ animation:gm-pop 1.1s forwards; }
  .gm-barrel.boom{ animation:gm-shake .5s 2; }
  @keyframes gm-pop{ 0%{ opacity:1; transform:translate(-50%,-50%) scale(.2); } 55%{ opacity:1; transform:translate(-50%,-190%) scale(1.6) rotate(200deg); } 100%{ opacity:1; transform:translate(-50%,-120%) scale(1.4) rotate(360deg); } }
  /* xí ngầu */
  .gm-dice{ display:flex; flex-wrap:wrap; gap:14px; justify-content:center; margin:14px 0; min-height:84px; }
  .gm-die{ width:76px; height:76px; background:#fff; border-radius:14px; border:2px solid #cfd8dc; box-shadow:0 4px 0 #b7c3c9, 0 8px 14px rgba(0,0,0,.25); display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(3,1fr); padding:9px; gap:2px; }
  .gm-die i{ border-radius:50%; background:transparent; }
  .gm-die i.p{ background:#1b3a2f; }
  .gm-die.red i.p{ background:#c62828; }
  .gm-die.rolling{ animation:gm-roll .35s infinite; }
  @keyframes gm-roll{ 0%{ transform:rotate(0) translateY(0); } 25%{ transform:rotate(18deg) translateY(-8px); } 50%{ transform:rotate(-12deg) translateY(0); } 75%{ transform:rotate(10deg) translateY(-6px); } 100%{ transform:rotate(0) translateY(0); } }
  .gm-sum{ text-align:center; font-size:1.3rem; font-weight:800; }
  .gm-hist{ text-align:center; font-size:.82rem; opacity:.85; margin-top:6px; }
  /* vòng quay */
  .gm-wheelbox{ position:relative; width:300px; max-width:100%; margin:6px auto; }
  .gm-wheelbox canvas{ width:100%; height:auto; display:block; }
  .gm-pointer{ position:absolute; left:50%; top:-6px; transform:translateX(-50%); font-size:2rem; line-height:1; color:#fff; text-shadow:0 2px 4px rgba(0,0,0,.6); }
  .gm-result{ text-align:center; font-size:1.25rem; font-weight:800; margin:10px 0 4px; min-height:1.6em; }
  `;
  function injectCss(){
    if($('gm-style')) return;
    const s = document.createElement('style'); s.id = 'gm-style'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ---------- Trạng thái chung ---------- */
  let root = null;
  let screen = 'menu';
  let players = (function(){ const p = store('players'); return (p && p.count) ? p : { count: 2, names: [] }; })();
  let timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, FAST ? Math.min(ms, 30) : ms); timers.push(id); return id; };
  function clearTimers(){ timers.forEach(clearTimeout); timers = []; stopWheelAnim(); stopShake(); }
  const nameOf = (i) => (players.names[i] || '').trim() || ('Người ' + (i + 1));

  function render(html){ root.innerHTML = html; }

  /* ---------- Menu ---------- */
  function showMenu(){
    clearTimers(); screen = 'menu';
    render(`
      <div class="gm-top"><h2>🎮 Trò chơi</h2><button class="gm-mini" id="gm-mute">${muted ? '🔇 Tắt tiếng' : '🔊 Có tiếng'}</button></div>
      <div class="gm-menu">
        <button class="gm-card" data-g="croc"><span class="ico">🐊</span><b>Khám răng cá sấu</b><small>Bấm răng, ai bấm trúng răng đau thì bị cạp</small></button>
        <button class="gm-card" data-g="pirate"><span class="ico">🏴‍☠️</span><b>Nhét dao thùng hải tặc</b><small>Nhét dao vào khe, coi chừng hải tặc bật ra</small></button>
        <button class="gm-card" data-g="dice"><span class="ico">🎲</span><b>Lắc xí ngầu</b><small>Lắc điện thoại hoặc bấm nút để gieo</small></button>
        <button class="gm-card" data-g="wheel"><span class="ico">🎡</span><b>Vòng quay may mắn</b><small>Tự nhập các ô rồi quay</small></button>
      </div>
      <p class="gm-hint">Chỉ để giải trí, kết quả không tính vào bảng xếp hạng.</p>`);
    root.querySelectorAll('.gm-card').forEach((b) => b.addEventListener('click', () => openGame(b.dataset.g)));
    $('gm-mute').addEventListener('click', () => { muted = !muted; store('mute', muted); showMenu(); });
  }
  function openGame(g){
    clearTimers();
    if(g === 'croc' || g === 'pirate') return showSetup(g);
    if(g === 'dice') return showDice();
    if(g === 'wheel') return showWheel();
  }
  function topBar(title){
    return `<div class="gm-top"><button class="gm-mini" id="gm-back">← Menu</button><h2>${title}</h2><span></span></div>`;
  }
  function bindBack(){ const b = $('gm-back'); if(b) b.addEventListener('click', showMenu); }

  /* ---------- Chọn người chơi (cá sấu, hải tặc) ---------- */
  function showSetup(kind){
    screen = 'setup-' + kind;
    const title = kind === 'croc' ? '🐊 Khám răng cá sấu' : '🏴‍☠️ Nhét dao thùng hải tặc';
    const rule = kind === 'croc'
      ? 'Một số chiếc răng "đau" (răng phạt) được chọn ngẫu nhiên. Lần lượt mỗi người chạm một chiếc răng, ai chạm trúng răng phạt thì bị cạp và thua. Bạn chọn nhân vật, số răng và số răng phạt (tối đa là toàn bộ răng) ở bên dưới.'
      : 'Có một khe bí mật được chọn ngẫu nhiên. Lần lượt mỗi người nhét một con dao vào một khe, ai nhét trúng khe bí mật thì hải tặc bật ra và người đó thua.';
    render(`${topBar(title)}
      <div class="gm-panel">
        <p style="margin:0 0 10px;font-size:.85rem;line-height:1.5">${rule}</p>
        <label>Số người chơi (chơi 1 người để thử vận may)</label>
        <div class="gm-seg" id="gm-count">${[1,2,3,4,5,6].map((n) => `<button data-n="${n}" class="${n === players.count ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="gm-names" id="gm-names"></div>
        ${kind === 'croc' ? '<div id="gm-crocset" style="margin-top:14px">' + crocSettingsHtml() + '</div>' : ''}
        <button class="gm-primary" id="gm-start">Bắt đầu chơi</button>
      </div>`);
    bindBack();
    const names = $('gm-names');
    function drawNames(){
      names.innerHTML = players.count < 2 ? '' : Array.from({ length: players.count }, (_, i) =>
        `<input data-i="${i}" maxlength="16" placeholder="Người ${i + 1}" value="${esc(players.names[i] || '')}">`).join('');
      names.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => { players.names[+inp.dataset.i] = inp.value; }));
    }
    drawNames();
    if(kind === 'croc') bindCrocSettings($('gm-crocset'));
    $('gm-count').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      players.count = +b.dataset.n;
      $('gm-count').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      drawNames();
    }));
    $('gm-start').addEventListener('click', () => { store('players', players); kind === 'croc' ? startCroc() : startPirate(); });
  }

  /* Phần chung của trò chơi theo lượt */
  function makeTurnGame(total){
    return { trap: rand(total), used: new Set(), turn: 0, safe: 0, over: false, loser: -1 };
  }
  function statusText(g){
    if(g.over) return '';
    if(players.count < 2) return `Còn ${g.total - (g.traps ? g.traps.size : 1) - g.safe} ô an toàn · đã qua ${g.safe} lượt`;
    return `Lượt của <span style="color:var(--accent,#f2b705)">${esc(nameOf(g.turn))}</span>`;
  }
  function endText(g){
    return players.count < 2
      ? `💥 Dính rồi! Bạn qua được ${g.safe} lượt.`
      : `💥 ${esc(nameOf(g.loser))} thua rồi!`;
  }
  function turnPick(g, i, onSafe, onBad){
    if(g.over || g.used.has(i)) return;
    g.used.add(i);
    if(g.traps ? g.traps.has(i) : i === g.trap){
      g.over = true; g.loser = g.turn; onBad();
    }else{
      g.safe++;
      g.turn = (g.turn + 1) % Math.max(players.count, 1);
      onSafe();
    }
  }

  /* ---------- Khám răng cá sấu ---------- */
  const CHARS = {
    croc:  { icon: '🐊', name: 'Cá sấu', skin: '#4caf50', skin2: '#388e3c', skin3: '#1b5e20', in1: '#5d1111', in2: '#b71c1c' },
    hippo: { icon: '🦛', name: 'Hà mã', skin: '#9c7b6c', skin2: '#795548', skin3: '#3e2723', in1: '#5a0f35', in2: '#c2185b' },
    shark: { icon: '🦈', name: 'Cá mập', skin: '#5b9bd5', skin2: '#3b7bb5', skin3: '#1a4a7a', in1: '#5d1111', in2: '#d32f2f' }
  };
  const CHAR_KEYS = Object.keys(CHARS);
  let crocCfg = Object.assign({ char: 'croc', teeth: 6, penalty: 1 }, store('croc') || {});
  function normCroc(){
    if(!CHARS[crocCfg.char]) crocCfg.char = 'croc';
    crocCfg.teeth = Math.min(10, Math.max(4, parseInt(crocCfg.teeth, 10) || 6));
    crocCfg.penalty = Math.min(crocCfg.teeth, Math.max(1, parseInt(crocCfg.penalty, 10) || 1));
  }
  const penaltyLabel = () => (crocCfg.penalty >= crocCfg.teeth ? 'Toàn bộ răng' : String(crocCfg.penalty));
  function crocSettingsHtml(){
    return `<label>Nhân vật</label>
      <div class="gm-carousel"><button type="button" data-act="c-">‹</button><div class="gm-charview" id="gm-charview"></div><button type="button" data-act="c+">›</button></div>
      <div class="gm-steps">
        <div><label>Răng</label><div class="gm-step"><button type="button" data-act="t-">‹</button><b id="gm-tv"></b><button type="button" data-act="t+">›</button></div></div>
        <div><label>Răng phạt</label><div class="gm-step"><button type="button" data-act="p-">‹</button><b id="gm-pv"></b><button type="button" data-act="p+">›</button></div></div>
      </div>`;
  }
  function bindCrocSettings(box){
    const draw = () => {
      normCroc();
      const ch = CHARS[crocCfg.char];
      box.querySelector('#gm-charview').innerHTML = `<span class="big">${ch.icon}</span><small>${ch.name}</small>`;
      box.querySelector('#gm-tv').textContent = crocCfg.teeth;
      box.querySelector('#gm-pv').textContent = penaltyLabel();
      store('croc', crocCfg);
    };
    box.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.act;
      if(a === 'c-' || a === 'c+'){
        const i = CHAR_KEYS.indexOf(crocCfg.char); crocCfg.char = CHAR_KEYS[(i + (a === 'c+' ? 1 : CHAR_KEYS.length - 1)) % CHAR_KEYS.length];
      }else if(a === 't-' || a === 't+'){ crocCfg.teeth += a === 't+' ? 1 : -1; }
      else{ crocCfg.penalty += a === 'p+' ? 1 : -1; }
      draw(); beep(480, 0.05, 'triangle', 0.08);
    }));
    draw();
  }
  function mouthSvg(c, nUpper){
    let up = '';
    for(let k = 0; k < nUpper; k++){
      const x = 56 + k * (208 / (nUpper - 1)), y = 64 - Math.sin((k / (nUpper - 1)) * Math.PI) * -6 - 4;
      up += `<path d="M${(x - 15).toFixed(1)} ${y.toFixed(1)} Q${x.toFixed(1)} ${(y + 36).toFixed(1)} ${(x + 15).toFixed(1)} ${y.toFixed(1)} Z" fill="#f4f6f7" stroke="#b0bec5" stroke-width="1.5"/>`;
    }
    return `<svg class="gm-mouthsvg" viewBox="0 0 320 360" aria-hidden="true">
      <defs><radialGradient id="gmIn" cx="50%" cy="58%" r="62%"><stop offset="0" stop-color="${c.in2}"/><stop offset="1" stop-color="${c.in1}"/></radialGradient></defs>
      <circle cx="8" cy="250" r="17" fill="${c.skin2}"/><circle cx="312" cy="250" r="17" fill="${c.skin2}"/>
      <path d="M10 92 Q10 8 160 6 Q310 8 310 92 L314 250 Q314 354 160 354 Q6 354 6 250 Z" fill="${c.skin}" stroke="${c.skin3}" stroke-width="5"/>
      <path d="M36 74 Q160 34 284 74 L296 250 Q296 322 160 324 Q24 322 24 250 Z" fill="url(#gmIn)" stroke="${c.skin3}" stroke-width="4"/>
      <ellipse cx="160" cy="210" rx="62" ry="46" fill="#c62828"/><ellipse cx="160" cy="196" rx="40" ry="22" fill="#e53935" opacity=".8"/>
      <circle cx="78" cy="36" r="15" fill="#fff" stroke="${c.skin3}" stroke-width="3"/><circle cx="242" cy="36" r="15" fill="#fff" stroke="${c.skin3}" stroke-width="3"/>
      <circle cx="82" cy="38" r="7" fill="#1b1b1b"/><circle cx="238" cy="38" r="7" fill="#1b1b1b"/>
      ${up}</svg>`;
  }
  function crocStatus(g){
    if(g.over) return '';
    if(g.used.size === 0) return players.count > 1 ? `Lượt của ${esc(nameOf(0))} · chạm 1 răng bất kỳ` : 'Hãy chạm 1 răng bất kỳ để bắt đầu';
    return statusText(g);
  }
  function openCrocModal(){
    const m = document.createElement('div'); m.className = 'gm-modal';
    m.innerHTML = `<div class="gm-panel"><h3 style="margin:0 0 10px">⚙ Thiết lập</h3><div id="gm-modalset">${crocSettingsHtml()}</div>
      <label style="margin-top:12px"><input type="checkbox" id="gm-mutechk" ${muted ? 'checked' : ''}> Tắt âm thanh và rung</label>
      <button class="gm-primary" id="gm-apply">Áp dụng và chơi lại</button>
      <button class="gm-mini" id="gm-close" style="display:block;margin:10px auto 0;color:#1b3a2f;background:#eef3ef;border-color:#c5d3cb">Đóng</button></div>`;
    root.appendChild(m);
    bindCrocSettings(m.querySelector('#gm-modalset'));
    m.querySelector('#gm-mutechk').addEventListener('change', (e) => { muted = e.target.checked; store('mute', muted); });
    m.querySelector('#gm-close').addEventListener('click', () => m.remove());
    m.querySelector('#gm-apply').addEventListener('click', () => { m.remove(); startCroc(); });
  }
  function startCroc(){
    clearTimers(); screen = 'croc'; normCroc();
    const N = crocCfg.teeth, P = crocCfg.penalty, ch = CHARS[crocCfg.char];
    const g = { total: N, traps: new Set(), used: new Set(), turn: 0, safe: 0, over: false, loser: -1 };
    while(g.traps.size < P) g.traps.add(rand(N));
    const teeth = Array.from({ length: N }, (_, i) => `<button class="gm-tooth" data-i="${i}" aria-label="Răng ${i + 1}"></button>`).join('');
    render(`${topBar(ch.icon + ' Khám răng ' + ch.name.toLowerCase())}
      <div class="gm-water">
        <button class="gm-gear" id="gm-gear" aria-label="Thiết lập">⚙</button>
        <div class="gm-banner" id="gm-status">${crocStatus(g)}</div>
        <div class="gm-mouth" id="gm-croc">${mouthSvg(ch, 9)}<div class="gm-lowteeth">${teeth}</div><div class="gm-bang">CẠP!</div></div>
        <div class="gm-pill">PHẠT: ${penaltyLabel()}</div>
      </div>
      <button class="gm-primary" id="gm-again" style="display:none">Chơi lại</button>`);
    bindBack();
    const st = $('gm-status'), mouth = $('gm-croc');
    $('gm-gear').addEventListener('click', openCrocModal);
    root.querySelectorAll('.gm-tooth').forEach((t) => t.addEventListener('click', () => {
      const i = +t.dataset.i;
      turnPick(g, i, () => {
        t.classList.add('down'); beep(520 + g.safe * 30, 0.12, 'triangle'); buzz(15);
        st.innerHTML = crocStatus(g);
      }, () => {
        mouth.classList.add('snap');
        root.querySelectorAll('.gm-tooth').forEach((x) => { if(g.traps.has(+x.dataset.i)) x.classList.add('bad'); });
        noise(0.25, 0.25); beep(110, 0.4, 'sawtooth', 0.2); buzz([60, 40, 120]);
        st.classList.add('lose'); st.innerHTML = endText(g);
        $('gm-again').style.display = 'block';
      });
    }));
    $('gm-again').addEventListener('click', startCroc);
  }

  /* ---------- Nhét dao thùng hải tặc ---------- */
  function startPirate(){
    clearTimers(); screen = 'pirate';
    const N = 12;
    const g = makeTurnGame(N); g.total = N;
    const R = 112, C = 145;
    const slots = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      return `<button class="gm-slot" data-i="${i}" style="left:${(C + R * Math.cos(a)).toFixed(1)}px;top:${(C + R * Math.sin(a)).toFixed(1)}px" aria-label="Khe ${i + 1}"></button>`;
    }).join('');
    render(`${topBar('🏴‍☠️ Nhét dao thùng hải tặc')}
      <div class="gm-status" id="gm-status">${statusText(g)}</div>
      <div class="gm-barrel" id="gm-barrel">${slots}<div class="gm-pirate">🏴‍☠️</div></div>
      <button class="gm-primary" id="gm-again" style="display:none">Chơi lại</button>`);
    bindBack();
    const st = $('gm-status'), barrel = $('gm-barrel');
    root.querySelectorAll('.gm-slot').forEach((s) => s.addEventListener('click', () => {
      const i = +s.dataset.i;
      turnPick(g, i, () => {
        s.classList.add('used'); s.innerHTML = '<span class="knife">🗡️</span>'; beep(300, 0.08, 'square', 0.1); buzz(15);
        st.innerHTML = statusText(g);
      }, () => {
        s.classList.add('used'); s.innerHTML = '<span class="knife">🗡️</span>';
        barrel.classList.add('boom'); noise(0.3, 0.2); beep(660, 0.12, 'square', 0.15); beep(220, 0.5, 'sawtooth', 0.15, 0.1); buzz([40, 30, 40, 30, 150]);
        st.classList.add('lose'); st.innerHTML = endText(g);
        $('gm-again').style.display = 'block';
      });
    }));
    $('gm-again').addEventListener('click', startPirate);
  }

  /* ---------- Lắc xí ngầu ---------- */
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const dieHtml = (v, cls) => `<div class="gm-die ${cls || ''}" data-v="${v}">${Array.from({ length: 9 }, (_, k) => `<i class="${PIPS[v].indexOf(k) >= 0 ? 'p' : ''}"></i>`).join('')}</div>`;
  let diceCount = +store('dice') || 2;
  let diceHist = [];
  let shakeHandler = null, shakeLast = 0, rolling = false;

  function stopShake(){ if(shakeHandler){ window.removeEventListener('devicemotion', shakeHandler); shakeHandler = null; } }
  function showDice(){
    clearTimers(); screen = 'dice'; diceHist = [];
    render(`${topBar('🎲 Lắc xí ngầu')}
      <div class="gm-panel">
        <label>Số viên xúc xắc</label>
        <div class="gm-seg" id="gm-dcount">${[1,2,3,4,5,6].map((n) => `<button data-n="${n}" class="${n === diceCount ? 'on' : ''}">${n}</button>`).join('')}</div>
      </div>
      <div class="gm-dice" id="gm-dice"></div>
      <div class="gm-sum" id="gm-sum">Bấm nút để gieo</div>
      <button class="gm-primary" id="gm-roll">🎲 Lắc!</button>
      <button class="gm-mini" id="gm-shake" style="display:block;margin:10px auto 0">📳 Bật lắc điện thoại để gieo</button>
      <div class="gm-hist" id="gm-hist"></div>`);
    bindBack();
    drawDice(Array.from({ length: diceCount }, () => 1));
    $('gm-dcount').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      diceCount = +b.dataset.n; store('dice', diceCount);
      $('gm-dcount').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      drawDice(Array.from({ length: diceCount }, () => 1)); $('gm-sum').textContent = 'Bấm nút để gieo';
    }));
    $('gm-roll').addEventListener('click', rollDice);
    $('gm-shake').addEventListener('click', toggleShake);
  }
  function drawDice(vals, cls){ $('gm-dice').innerHTML = vals.map((v, i) => dieHtml(v, (cls || '') + (i % 2 ? ' red' : ''))).join(''); }
  function rollDice(){
    if(rolling) return;
    rolling = true;
    const final = Array.from({ length: diceCount }, () => 1 + rand(6));
    const dur = FAST ? 60 : 900;
    const t0 = Date.now();
    $('gm-sum').textContent = '…';
    const iv = setInterval(() => {
      drawDice(Array.from({ length: diceCount }, () => 1 + rand(6)), 'rolling');
      noise(0.05, 0.1); buzz(10);
      if(Date.now() - t0 >= dur){
        clearInterval(iv); rolling = false;
        drawDice(final);
        const sum = final.reduce((a, b) => a + b, 0);
        $('gm-sum').textContent = diceCount > 1 ? `Tổng: ${sum}  (${final.join(' + ')})` : `Ra mặt ${sum}`;
        diceHist.unshift(diceCount > 1 ? `${final.join('+')}=${sum}` : String(sum)); diceHist = diceHist.slice(0, 6);
        $('gm-hist').textContent = 'Các lượt trước: ' + diceHist.slice(1).join(' · ');
        beep(660, 0.12, 'triangle'); beep(880, 0.15, 'triangle', 0.1, 0.1);
      }
    }, FAST ? 15 : 80);
  }
  async function toggleShake(){
    const btn = $('gm-shake');
    if(shakeHandler){ stopShake(); btn.textContent = '📳 Bật lắc điện thoại để gieo'; return; }
    try{
      if(typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'){
        const r = await DeviceMotionEvent.requestPermission();
        if(r !== 'granted'){ btn.textContent = 'Chưa được phép dùng cảm biến lắc'; return; }
      }
    }catch(e){ btn.textContent = 'Máy này không hỗ trợ lắc'; return; }
    if(typeof DeviceMotionEvent === 'undefined'){ btn.textContent = 'Máy này không hỗ trợ lắc'; return; }
    shakeHandler = (e) => {
      const a = e.accelerationIncludingGravity || e.acceleration; if(!a) return;
      const m = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      const now = Date.now();
      if(m > 24 && now - shakeLast > 1300){ shakeLast = now; rollDice(); }
    };
    window.addEventListener('devicemotion', shakeHandler);
    btn.textContent = '📳 Đang bật: lắc mạnh điện thoại để gieo (bấm để tắt)';
  }

  /* ---------- Vòng quay may mắn ---------- */
  const WHEEL_DEFAULT = ['Giải nhất 🎁', 'Chúc may mắn', 'Hát một bài 🎤', 'Kể chuyện cười 😄', 'Chống đẩy 5 cái 💪', 'Được miễn bài 🙌', 'Đãi trà sữa 🧋', 'Quay lại lượt nữa'];
  const WHEEL_COLORS = ['#f2b705', '#e76f51', '#2a9d8f', '#457b9d', '#9b5de5', '#f15bb5', '#43aa8b', '#f8961e', '#577590', '#90be6d', '#d62828', '#6d6875'];
  let wheelItems = (function(){ const w = store('wheel'); return (Array.isArray(w) && w.length >= 2) ? w : WHEEL_DEFAULT.slice(); })();
  let wheelAngle = 0, wheelRaf = 0, wheelSpinning = false, removeWinner = !!store('wheelRemove');

  function stopWheelAnim(){ if(wheelRaf){ cancelAnimationFrame(wheelRaf); wheelRaf = 0; } wheelSpinning = false; }
  function showWheel(){
    clearTimers(); screen = 'wheel';
    render(`${topBar('🎡 Vòng quay may mắn')}
      <div class="gm-wheelbox"><div class="gm-pointer">▼</div><canvas id="gm-canvas" width="600" height="600"></canvas></div>
      <div class="gm-result" id="gm-result"></div>
      <button class="gm-primary" id="gm-spin">QUAY!</button>
      <div class="gm-panel" style="margin-top:14px">
        <label>Các ô trên vòng quay (mỗi dòng một ô, tối đa 12 ô)</label>
        <textarea id="gm-items" rows="6">${esc(wheelItems.join('\n'))}</textarea>
        <label style="margin-top:10px;font-weight:600"><input type="checkbox" id="gm-remove" ${removeWinner ? 'checked' : ''}> Loại ô vừa trúng khỏi vòng quay</label>
        <button class="gm-mini" id="gm-reset" style="margin-top:8px;color:#1b3a2f;background:#eef3ef;border-color:#c5d3cb">Khôi phục danh sách mẫu</button>
      </div>`);
    bindBack();
    drawWheel();
    $('gm-items').addEventListener('input', () => {
      const v = $('gm-items').value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 12);
      if(v.length >= 2){ wheelItems = v; store('wheel', v); drawWheel(); }
    });
    $('gm-remove').addEventListener('change', (e) => { removeWinner = e.target.checked; store('wheelRemove', removeWinner); });
    $('gm-reset').addEventListener('click', () => { wheelItems = WHEEL_DEFAULT.slice(); store('wheel', wheelItems); $('gm-items').value = wheelItems.join('\n'); drawWheel(); });
    $('gm-spin').addEventListener('click', spinWheel);
  }
  function drawWheel(){
    const cv = $('gm-canvas'); if(!cv) return;
    const c = cv.getContext('2d'), W = cv.width, R = W / 2 - 8, n = wheelItems.length, s = (Math.PI * 2) / n;
    c.clearRect(0, 0, W, W);
    c.save(); c.translate(W / 2, W / 2); c.rotate(wheelAngle);
    for(let i = 0; i < n; i++){
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, i * s, (i + 1) * s); c.closePath();
      c.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]; c.fill();
      c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
      c.save(); c.rotate(i * s + s / 2); c.textAlign = 'right'; c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 4;
      const label = wheelItems[i]; c.font = `700 ${n > 8 ? 26 : 32}px sans-serif`;
      let t = label; while(t.length > 3 && c.measureText(t).width > R - 50) t = t.slice(0, -2);
      c.fillText(t === label ? t : t + '…', R - 22, 10); c.restore();
    }
    c.restore();
    c.beginPath(); c.arc(W / 2, W / 2, 34, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#1b3a2f'; c.stroke();
  }
  function winnerIndex(angle){
    const n = wheelItems.length, s = (Math.PI * 2) / n, two = Math.PI * 2;
    const a = (((Math.PI * 1.5 - angle) % two) + two) % two;
    return Math.min(n - 1, Math.floor(a / s));
  }
  function spinWheel(){
    if(wheelSpinning) return;
    if(wheelItems.length < 2){ $('gm-result').textContent = 'Cần ít nhất 2 ô'; return; }
    wheelSpinning = true; $('gm-result').textContent = '';
    const start = wheelAngle, extra = (5 + rand(4)) * Math.PI * 2 + (rand(1000) / 1000) * Math.PI * 2, dur = FAST ? 120 : 4800;
    const t0 = performance.now();
    let lastIdx = winnerIndex(start);
    (function frame(now){
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      wheelAngle = start + extra * e; drawWheel();
      const idx = winnerIndex(wheelAngle);
      if(idx !== lastIdx){ lastIdx = idx; beep(900, 0.03, 'square', 0.06); }
      if(p < 1){ wheelRaf = requestAnimationFrame(frame); return; }
      wheelRaf = 0; wheelSpinning = false;
      const w = winnerIndex(wheelAngle);
      $('gm-result').textContent = '🎉 ' + wheelItems[w];
      beep(660, 0.15, 'triangle'); beep(880, 0.15, 'triangle', 0.1, 0.12); beep(1100, 0.25, 'triangle', 0.1, 0.24); buzz([80, 40, 80]);
      if(removeWinner && wheelItems.length > 2){
        wheelItems.splice(w, 1); store('wheel', wheelItems);
        later(() => { if(screen === 'wheel'){ $('gm-items').value = wheelItems.join('\n'); drawWheel(); } }, 1400);
      }
    })(t0);
  }

  /* ---------- Cổng vào ---------- */
  window.renderGames = function(){
    root = $('view-games'); if(!root) return;
    injectCss();
    if(!root.dataset.ready){ root.dataset.ready = '1'; showMenu(); }
  };
  window.leaveGames = function(){ clearTimers(); };
  window.__games = { openGame, showMenu, get screen(){ return screen; }, winnerIndex, get wheelItems(){ return wheelItems; } };
})();
