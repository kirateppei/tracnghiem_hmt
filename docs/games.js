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
  /* cá sấu */
  .gm-croc{ position:relative; margin:0 auto; max-width:340px; }
  .gm-croc .eyes{ text-align:center; font-size:2.6rem; line-height:1; margin-bottom:-8px; position:relative; z-index:2; }
  .gm-jaw{ background:linear-gradient(#3f9a52,#2d7a40); border:3px solid #1d5a2c; border-radius:26px; padding:10px 10px 12px; }
  .gm-gums{ background:#e8728a; border-radius:14px; padding:10px 8px; display:grid; grid-template-columns:repeat(6,1fr); gap:6px; }
  .gm-gums + .gm-gums{ margin-top:12px; }
  .gm-tooth{ height:46px; border:2px solid #cfd8dc; background:#fff; border-radius:8px 8px 18px 18px; cursor:pointer; padding:0; transition:transform .15s, background .15s; }
  .gm-gums.low .gm-tooth{ border-radius:18px 18px 8px 8px; }
  .gm-tooth.down{ transform:translateY(8px) scale(.9); background:#b7c3c9; cursor:default; }
  .gm-gums.low .gm-tooth.down{ transform:translateY(-8px) scale(.9); }
  .gm-tooth.bad{ background:#ff5a5f; border-color:#a4161a; }
  .gm-croc.snap .eyes{ animation:gm-shake .5s 2; }
  .gm-croc.snap .gm-jaw{ animation:gm-snap .45s; }
  @keyframes gm-shake{ 0%,100%{ transform:translateX(0) rotate(0); } 25%{ transform:translateX(-8px) rotate(-6deg); } 75%{ transform:translateX(8px) rotate(6deg); } }
  @keyframes gm-snap{ 0%{ transform:scale(1); } 40%{ transform:scale(.92,.8); } 100%{ transform:scale(1); } }
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
      ? 'Có một chiếc răng "đau" được chọn ngẫu nhiên. Lần lượt mỗi người bấm một chiếc răng, ai bấm trúng răng đau thì cá sấu cạp và người đó thua.'
      : 'Có một khe bí mật được chọn ngẫu nhiên. Lần lượt mỗi người nhét một con dao vào một khe, ai nhét trúng khe bí mật thì hải tặc bật ra và người đó thua.';
    render(`${topBar(title)}
      <div class="gm-panel">
        <p style="margin:0 0 10px;font-size:.85rem;line-height:1.5">${rule}</p>
        <label>Số người chơi (chơi 1 người để thử vận may)</label>
        <div class="gm-seg" id="gm-count">${[1,2,3,4,5,6].map((n) => `<button data-n="${n}" class="${n === players.count ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="gm-names" id="gm-names"></div>
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
    if(players.count < 2) return `Còn ${g.total - g.used.size - 1} ô an toàn · đã qua ${g.safe} lượt`;
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
    if(i === g.trap){
      g.over = true; g.loser = g.turn; onBad();
    }else{
      g.safe++;
      g.turn = (g.turn + 1) % Math.max(players.count, 1);
      onSafe();
    }
  }

  /* ---------- Khám răng cá sấu ---------- */
  function startCroc(){
    clearTimers(); screen = 'croc';
    const g = makeTurnGame(12); g.total = 12;
    const teeth = (row) => Array.from({ length: 6 }, (_, k) => `<button class="gm-tooth" data-i="${row * 6 + k}" aria-label="Răng ${row * 6 + k + 1}"></button>`).join('');
    render(`${topBar('🐊 Khám răng cá sấu')}
      <div class="gm-status" id="gm-status">${statusText(g)}</div>
      <div class="gm-croc" id="gm-croc">
        <div class="eyes">🐊</div>
        <div class="gm-jaw">
          <div class="gm-gums">${teeth(0)}</div>
          <div class="gm-gums low">${teeth(1)}</div>
        </div>
      </div>
      <button class="gm-primary" id="gm-again" style="display:none">Chơi lại</button>`);
    bindBack();
    const st = $('gm-status'), croc = $('gm-croc');
    root.querySelectorAll('.gm-tooth').forEach((t) => t.addEventListener('click', () => {
      const i = +t.dataset.i;
      turnPick(g, i, () => {
        t.classList.add('down'); beep(520 + g.safe * 30, 0.12, 'triangle'); buzz(15);
        st.innerHTML = statusText(g);
        if(g.used.size >= g.total - 1 && !g.over){ /* hết ô an toàn: ép răng đau */ }
      }, () => {
        t.classList.add('bad'); croc.classList.add('snap');
        noise(0.25, 0.25); beep(110, 0.4, 'sawtooth', 0.2); buzz([60, 40, 120]);
        st.classList.add('lose'); st.innerHTML = endText(g);
        const trapBtn = root.querySelector(`.gm-tooth[data-i="${g.trap}"]`); if(trapBtn) trapBtn.classList.add('bad');
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
