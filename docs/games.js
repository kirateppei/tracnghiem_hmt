/* Tab "Trò chơi": 4 mini game giải trí (khám răng cá sấu, thùng gỗ cướp biển, lắc xí ngầu, vòng quay may mắn, đá gà mini).
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
  /* thùng hải tặc (cảnh bãi biển, thùng gỗ xoay được, hải tặc nhảy ra) */
  #view-games .gm-beach{ position:relative; border-radius:18px; padding:12px 8px 14px; overflow:hidden; background:linear-gradient(#ffb74d 0%,#ff8a65 14%,#6ec6f0 38%,#2aa7dd 52%,#ecc980 53%,#d8a65a 100%); box-shadow:inset 0 0 40px rgba(0,0,0,.2); }
  #view-games .gm-beach .deco{ position:absolute; font-size:3rem; line-height:1; pointer-events:none; }
  #view-games .gm-restart{ position:absolute; right:10px; top:10px; width:42px; height:42px; border-radius:8px; border:2px solid #4b2e12; background:linear-gradient(#a8742f,#7a4d1b); color:#fff; font-size:1.3rem; cursor:pointer; z-index:5; }
  #view-games .gm-pbarrel{ position:relative; width:260px; max-width:92%; aspect-ratio:260/330; margin:46px auto 0; touch-action:pan-y; user-select:none; -webkit-user-select:none; }
  #view-games .gm-pbarrel .layer{ position:absolute; inset:0; width:100%; height:100%; }
  #view-games .gm-pbarrel .pirate{ position:absolute; left:0; top:0; width:100%; height:100%; transform-origin:50% 40%; }
  #view-games .gm-pbarrel.boom .pirate{ animation:gm-rocket 1.3s cubic-bezier(.2,.7,.3,1) forwards; }
  @keyframes gm-rocket{ 0%{ transform:translateY(0) rotate(0) scale(1); opacity:1; } 35%{ transform:translateY(-120px) rotate(300deg) scale(1.15); opacity:1; } 100%{ transform:translateY(-70px) rotate(720deg) scale(1.3); opacity:1; } }
  #view-games .gm-pbarrel.boom{ animation:gm-shake .4s 2; }
  #view-games .gm-pslot{ position:absolute; width:11px; height:40px; margin:-20px 0 0 -5.5px; border-radius:6px; background:#1a0e05; border:2px solid #4b2e12; padding:0; cursor:pointer; box-shadow:inset 0 0 4px #000; }
  #view-games .gm-pslot.used{ cursor:default; }
  #view-games .gm-pknife{ position:absolute; height:8px; margin-top:-4px; pointer-events:none; filter:drop-shadow(0 2px 2px rgba(0,0,0,.5)); }
  #view-games .gm-pknife i{ display:block; height:100%; border-radius:4px; background:linear-gradient(#eceff1,#90a4ae); }
  #view-games .gm-pknife b{ position:absolute; top:-3px; width:12px; height:14px; border-radius:3px; background:#6d4c41; }
  #view-games .gm-rot{ display:flex; justify-content:center; gap:16px; margin-top:8px; }
  #view-games .gm-rot button{ width:48px; height:40px; border-radius:20px; border:2px solid #4b2e12; background:linear-gradient(#e7b562,#b9812f); font-size:1.3rem; font-weight:900; color:#3b2410; cursor:pointer; }
  /* xí ngầu 3D */
  #view-games .gm-dicestage{ border-radius:18px; padding:14px 8px 10px; background:radial-gradient(circle at 50% 30%,#3b2a9a,#1a1050 70%); box-shadow:inset 0 0 40px rgba(0,0,0,.35); }
  #view-games .gm-dice{ display:flex; flex-wrap:wrap; gap:26px 22px; justify-content:center; margin:6px 0 4px; min-height:150px; align-items:center; }
  #view-games .gm-scene{ width:var(--s); height:var(--s); perspective:520px; margin:18px 12px; }
  #view-games .gm-camera{ width:100%; height:100%; transform-style:preserve-3d; transform:rotateX(-26deg) rotateY(-32deg); }
  #view-games .gm-hop{ width:100%; height:100%; transform-style:preserve-3d; }
  #view-games .gm-hop.go{ animation:gm-hop .95s ease-out; }
  @keyframes gm-hop{ 0%{ transform:translateY(0); } 25%{ transform:translateY(-34px); } 55%{ transform:translateY(0); } 70%{ transform:translateY(-10px); } 100%{ transform:translateY(0); } }
  #view-games .gm-cube{ position:relative; width:100%; height:100%; transform-style:preserve-3d; transition:transform 1.05s cubic-bezier(.2,.8,.25,1); }
  #view-games .gm-face{ position:absolute; inset:0; border-radius:calc(var(--s) * .16); background:var(--bg); display:flex; align-items:center; justify-content:center; box-shadow:inset 0 0 calc(var(--s) * .16) rgba(0,0,0,.45); backface-visibility:hidden; overflow:hidden; }
  #view-games .gm-face.f1{ transform:rotateX(90deg) translateZ(calc(var(--s) / 2)); }
  #view-games .gm-face.f2{ transform:translateZ(calc(var(--s) / 2)); }
  #view-games .gm-face.f3{ transform:rotateY(90deg) translateZ(calc(var(--s) / 2)); }
  #view-games .gm-face.f4{ transform:rotateY(-90deg) translateZ(calc(var(--s) / 2)); }
  #view-games .gm-face.f5{ transform:rotateY(180deg) translateZ(calc(var(--s) / 2)); }
  #view-games .gm-face.f6{ transform:rotateX(-90deg) translateZ(calc(var(--s) / 2)); }
  #view-games .gm-ring{ position:absolute; left:6%; top:6%; width:88%; height:88%; border-radius:50%; border:calc(var(--s) * .028) solid var(--ring); box-shadow:0 0 calc(var(--s) * .08) var(--glow), inset 0 0 calc(var(--s) * .08) var(--glow); }
  #view-games .gm-ring::after{ content:''; position:absolute; left:19%; top:19%; width:62%; height:62%; border-radius:50%; border:calc(var(--s) * .02) solid var(--ring); }
  #view-games .gm-ring i{ position:absolute; left:50%; top:50%; width:0; height:0; font-style:normal; color:var(--glyph); font-size:calc(var(--s) * .115); line-height:0; text-align:center; }
  #view-games .gm-ring i span{ position:absolute; left:-.5em; top:-.5em; width:1em; height:1em; line-height:1em; }
  #view-games .gm-num{ position:relative; font-weight:900; font-size:calc(var(--s) * .46); color:var(--num); font-family:'Trebuchet MS',Arial,sans-serif; text-shadow:0 2px 6px rgba(0,0,0,.45); }
  #view-games .gm-skins{ display:flex; gap:8px; justify-content:center; margin:6px 0 10px; }
  #view-games .gm-skins button{ width:44px; height:44px; border-radius:12px; border:3px solid transparent; cursor:pointer; padding:0; }
  #view-games .gm-skins button.on{ border-color:#fff; box-shadow:0 0 10px rgba(255,255,255,.6); }
  #view-games .gm-sum{ text-align:center; font-size:1.3rem; font-weight:800; }
  #view-games .gm-hist{ text-align:center; font-size:.82rem; opacity:.85; margin-top:6px; }
  /* vòng quay */
  #view-games .gm-wheelstage{ position:relative; border-radius:18px; padding:26px 8px 10px; background:radial-gradient(circle at 50% 25%,#7a3bd0 0%,#35176f 45%,#150836 100%); box-shadow:inset 0 0 50px rgba(0,0,0,.4); overflow:hidden; }
  #view-games .gm-wheelstage::before{ content:''; position:absolute; left:50%; top:-40px; width:340px; height:340px; margin-left:-170px; background:radial-gradient(circle,rgba(255,236,160,.35),transparent 65%); pointer-events:none; }
  #view-games .gm-wheelbox{ position:relative; width:310px; max-width:100%; margin:4px auto; }
  #view-games .gm-wheelbox canvas{ width:100%; height:auto; display:block; filter:drop-shadow(0 10px 14px rgba(0,0,0,.55)); }
  #view-games .gm-pointer{ position:absolute; left:50%; top:-14px; width:34px; height:46px; margin-left:-17px; z-index:2; transform-origin:50% 12%; filter:drop-shadow(0 3px 3px rgba(0,0,0,.6)); }
  #view-games .gm-pointer::before{ content:''; position:absolute; left:0; top:0; width:34px; height:34px; border-radius:50%; background:radial-gradient(circle at 35% 30%,#fff3b0,#f2b705 55%,#b8860b); }
  #view-games .gm-pointer::after{ content:''; position:absolute; left:6px; top:22px; border-left:11px solid transparent; border-right:11px solid transparent; border-top:24px solid #d62828; }
  #view-games .gm-pointer.flick{ animation:gm-flick .16s ease-out; }
  @keyframes gm-flick{ 0%{ transform:rotate(0); } 35%{ transform:rotate(-26deg); } 100%{ transform:rotate(0); } }
  #view-games .gm-result{ text-align:center; font-size:1.45rem; font-weight:900; margin:12px 0 4px; min-height:1.9em; color:#ffe27a; text-shadow:0 2px 0 #7a4b00,0 0 14px rgba(255,200,60,.7); }
  #view-games .gm-result.pop{ animation:gm-resultpop .7s cubic-bezier(.2,1.6,.4,1); }
  @keyframes gm-resultpop{ 0%{ transform:scale(.3); opacity:0; } 100%{ transform:scale(1); opacity:1; } }
  #view-games .gm-spinbtn{ width:100%; padding:14px; border:0; border-radius:14px; background:linear-gradient(#ffd54a,#f2a100); color:#3b2400; font:inherit; font-weight:900; font-size:1.1rem; letter-spacing:.06em; cursor:pointer; box-shadow:0 4px 0 #9a6200, 0 8px 16px rgba(0,0,0,.35); animation:gm-glow 1.6s ease-in-out infinite; }
  #view-games .gm-spinbtn:disabled{ opacity:.6; animation:none; }
  @keyframes gm-glow{ 0%,100%{ box-shadow:0 4px 0 #9a6200, 0 8px 16px rgba(0,0,0,.35); } 50%{ box-shadow:0 4px 0 #9a6200, 0 0 24px rgba(255,214,74,.85); } }
  /* đá gà mini */
  #view-games .gm-chk{ display:flex; gap:10px; align-items:center; background:#fff; border-radius:14px; padding:10px; margin-bottom:8px; border:3px solid transparent; }
  #view-games .gm-chk.sel{ border-color:var(--accent,#f2b705); }
  #view-games .gm-chk .em{ font-size:2.6rem; line-height:1; filter:hue-rotate(var(--hue)); flex:none; width:54px; text-align:center; cursor:pointer; }
  #view-games .gm-chk .info{ flex:1; min-width:0; }
  #view-games .gm-chk input.nm{ width:100%; box-sizing:border-box; border:1px solid #c5d3cb; border-radius:8px; padding:5px 8px; font:inherit; font-weight:800; font-size:.92rem; margin-bottom:5px; color:#1b3a2f; background:#fff; }
  #view-games .gm-stat{ display:flex; align-items:center; gap:6px; font-size:.7rem; font-weight:700; color:#33493d; margin:2px 0; }
  #view-games .gm-stat span{ width:62px; flex:none; }
  #view-games .gm-stat u{ flex:1; height:8px; border-radius:4px; background:#e3eae5; text-decoration:none; overflow:hidden; display:block; }
  #view-games .gm-stat u i{ display:block; height:100%; border-radius:4px; }
  #view-games .gm-stat b{ width:26px; text-align:right; flex:none; }
  #view-games .gm-secret{ font-size:.7rem; color:#7a5c00; font-weight:800; margin-top:3px; }
  #view-games .gm-chk .re{ border:0; background:#eef3ef; border-radius:10px; width:36px; height:36px; font-size:1.1rem; cursor:pointer; flex:none; }
  #view-games .gm-arena{ position:relative; border-radius:18px; padding:14px 8px 10px; background:linear-gradient(#2b1d12 0%,#4a3320 55%,#8a6236 56%,#a97c45 100%); display:flex; align-items:flex-end; justify-content:space-between; min-height:250px; overflow:hidden; box-shadow:inset 0 0 40px rgba(0,0,0,.5); }
  #view-games .gm-arena::before{ content:''; position:absolute; left:6%; right:6%; bottom:14px; height:60px; border-radius:50%; background:radial-gradient(ellipse,rgba(0,0,0,.25),transparent 70%); }
  #view-games .gm-cside{ position:relative; width:42%; text-align:center; z-index:1; }
  #view-games .gm-cside .nm{ color:#fff; font-weight:900; font-size:.82rem; text-shadow:0 2px 3px #000; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  #view-games .gm-cside .bar{ height:10px; background:rgba(0,0,0,.55); border-radius:6px; overflow:hidden; margin:2px 0; border:1px solid rgba(255,255,255,.25); }
  #view-games .gm-cside .bar i{ display:block; height:100%; width:100%; transition:width .35s; }
  #view-games .gm-cside .bar.hp i{ background:linear-gradient(#ff6b6b,#d62828); }
  #view-games .gm-cside .bar.en i{ background:linear-gradient(#6ec6ff,#1e88e5); }
  #view-games .gm-cside .hpnum{ color:#fff; font-size:.68rem; font-weight:700; text-shadow:0 1px 2px #000; }
  #view-games .gm-cside .chick{ font-size:4.4rem; line-height:1.1; margin-top:6px; filter:hue-rotate(var(--hue)); display:inline-block; transition:transform .12s; }
  #view-games .gm-cside.left .chick{ transform:scaleX(-1); }
  #view-games .gm-cside.left .chick.atk{ animation:gm-atkL .45s; }
  #view-games .gm-cside.right .chick.atk{ animation:gm-atkR .45s; }
  @keyframes gm-atkL{ 0%{ transform:scaleX(-1) translateX(0); } 40%{ transform:scaleX(-1) translateX(-70px) rotate(-8deg); } 100%{ transform:scaleX(-1) translateX(0); } }
  @keyframes gm-atkR{ 0%{ transform:translateX(0); } 40%{ transform:translateX(-70px) rotate(-8deg); } 100%{ transform:translateX(0); } }
  #view-games .gm-cside .chick.hurt{ animation:gm-hurt .35s; }
  @keyframes gm-hurt{ 0%,100%{ opacity:1; } 25%{ opacity:.35; margin-left:-8px; } 50%{ opacity:1; margin-left:8px; } 75%{ opacity:.5; margin-left:-4px; } }
  #view-games .gm-cside .chick.dead{ transform:rotate(90deg) translateX(10px); opacity:.7; }
  #view-games .gm-cside.left .chick.dead{ transform:scaleX(-1) rotate(90deg) translateX(10px); }
  #view-games .gm-cside .chick.win{ animation:gm-win .6s infinite alternate; }
  @keyframes gm-win{ from{ margin-top:6px; } to{ margin-top:-8px; } }
  #view-games .gm-dmg{ position:absolute; left:50%; top:40px; font-weight:900; font-size:1.5rem; color:#fff176; text-shadow:0 2px 0 #b71c1c,0 0 8px #000; pointer-events:none; animation:gm-float 1s forwards; z-index:3; }
  #view-games .gm-dmg.crit{ color:#ff5252; font-size:2rem; }
  #view-games .gm-dmg.miss{ color:#b3e5fc; font-size:1.1rem; }
  @keyframes gm-float{ 0%{ transform:translate(-50%,0) scale(.6); opacity:0; } 20%{ opacity:1; transform:translate(-50%,-10px) scale(1.2); } 100%{ transform:translate(-50%,-60px) scale(1); opacity:0; } }
  #view-games .gm-sp{ position:absolute; left:0; right:0; top:10px; text-align:center; font-weight:900; font-size:1.25rem; color:#fff; text-shadow:0 0 12px #ff9800,0 2px 0 #b71c1c; opacity:0; pointer-events:none; z-index:4; }
  #view-games .gm-sp.show{ animation:gm-spshow 1.4s forwards; }
  @keyframes gm-spshow{ 0%{ opacity:0; transform:scale(.4); } 20%{ opacity:1; transform:scale(1.15); } 80%{ opacity:1; transform:scale(1); } 100%{ opacity:0; } }
  #view-games .gm-vs{ position:absolute; left:50%; top:46%; transform:translate(-50%,-50%); font-weight:900; color:rgba(255,255,255,.35); font-size:1.6rem; }
  #view-games .gm-log{ background:rgba(0,0,0,.35); border-radius:12px; padding:8px 10px; margin-top:10px; font-size:.78rem; line-height:1.5; min-height:5.4em; max-height:9.5em; overflow:auto; }
  #view-games .gm-log div{ opacity:.85; } #view-games .gm-log div:last-child{ opacity:1; font-weight:700; }
  #view-games .gm-ctl{ display:flex; gap:8px; margin-top:10px; }
  #view-games .gm-ctl button{ flex:1; padding:11px 6px; border-radius:12px; border:0; font:inherit; font-weight:800; cursor:pointer; background:#eef3ef; color:#1b3a2f; }
  #view-games .gm-ctl button.pri{ background:var(--accent,#f2b705); color:var(--accent-ink,#1b3a2f); }
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
        <button class="gm-card" data-g="pirate"><span class="ico">🏴‍☠️</span><b>Thùng gỗ cướp biển</b><small>Nhét dao vào khe, coi chừng hải tặc bật ra</small></button>
        <button class="gm-card" data-g="dice"><span class="ico">🎲</span><b>Lắc xí ngầu</b><small>Lắc điện thoại hoặc bấm nút để gieo</small></button>
        <button class="gm-card" data-g="chicken"><span class="ico">🐓</span><b>Đá gà mini</b><small>Gà có chỉ số và tuyệt chiêu ẩn, xem con nào thắng</small></button>
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
    if(g === 'chicken') return showChickens();
  }
  function topBar(title){
    return `<div class="gm-top"><button class="gm-mini" id="gm-back">← Menu</button><h2>${title}</h2><span></span></div>`;
  }
  function bindBack(){ const b = $('gm-back'); if(b) b.addEventListener('click', showMenu); }

  /* ---------- Chọn người chơi (cá sấu, hải tặc) ---------- */
  function showSetup(kind){
    screen = 'setup-' + kind;
    const title = kind === 'croc' ? '🐊 Khám răng cá sấu' : '🏴‍☠️ Thùng gỗ cướp biển';
    const rule = kind === 'croc'
      ? 'Một số chiếc răng "đau" (răng phạt) được chọn ngẫu nhiên. Lần lượt mỗi người chạm một chiếc răng, ai chạm trúng răng phạt thì bị cạp và thua. Bạn chọn nhân vật, số răng và số răng phạt (tối đa là toàn bộ răng) ở bên dưới.'
      : 'Thùng có một khe bí mật được chọn ngẫu nhiên. Vuốt thùng để xoay, lần lượt mỗi người nhét một con dao vào một khe, ai nhét trúng khe bí mật thì hải tặc bật ra và người đó thua.';
    render(`${topBar(title)}
      <div class="gm-panel">
        <p style="margin:0 0 10px;font-size:.85rem;line-height:1.5">${rule}</p>
        <label>Số người chơi (chơi 1 người để thử vận may)</label>
        <div class="gm-seg" id="gm-count">${[1,2,3,4,5,6].map((n) => `<button data-n="${n}" class="${n === players.count ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="gm-names" id="gm-names"></div>
        ${kind === 'croc' ? '<div id="gm-crocset" style="margin-top:14px">' + crocSettingsHtml() + '</div>' : '<div id="gm-pirset" style="margin-top:14px">' + pirateSettingsHtml() + '</div>'}
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
    if(kind === 'croc') bindCrocSettings($('gm-crocset')); else bindPirateSettings($('gm-pirset'));
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
        if(N - g.used.size === P){
          // hết răng an toàn: lượt kế tiếp chắc chắn trúng răng phạt
          st.innerHTML = players.count < 2 ? 'Chỉ còn răng phạt!' : `Chỉ còn răng phạt, <span style="color:var(--accent,#f2b705)">${esc(nameOf(g.turn))}</span> bị cạp!`;
          later(() => { if(!g.over && screen === 'croc'){ const rest = [...g.traps].filter((x) => !g.used.has(x)); if(rest.length){ const x = root.querySelector(`.gm-tooth[data-i="${rest[0]}"]`); if(x) x.click(); } } }, 1100);
        }
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

  /* ---------- Thùng gỗ cướp biển ---------- */
  let pirateCfg = Object.assign({ slots: 12 }, store('pirate') || {});
  const normPirate = () => { pirateCfg.slots = Math.min(16, Math.max(6, parseInt(pirateCfg.slots, 10) || 12)); };
  function pirateSettingsHtml(){
    return `<label>Số khe trên thùng</label>
      <div class="gm-step"><button type="button" data-act="s-">‹</button><b id="gm-sv"></b><button type="button" data-act="s+">›</button></div>`;
  }
  function bindPirateSettings(box){
    const draw = () => { normPirate(); box.querySelector('#gm-sv').textContent = pirateCfg.slots; store('pirate', pirateCfg); };
    box.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => { pirateCfg.slots += b.dataset.act === 's+' ? 1 : -1; draw(); beep(480, 0.05, 'triangle', 0.08); }));
    draw();
  }
  const PIRATE_BG = `<svg class="layer" viewBox="0 0 260 330" aria-hidden="true"><ellipse cx="130" cy="112" rx="92" ry="26" fill="#2b1608" stroke="#4b2e12" stroke-width="5"/></svg>`;
  const PIRATE_MAN = `<svg viewBox="0 0 260 330" aria-hidden="true">
      <ellipse cx="130" cy="150" rx="46" ry="30" fill="#2a5db0"/>
      <circle cx="130" cy="96" r="38" fill="#c98b5a" stroke="#7a4a25" stroke-width="3"/>
      <path d="M92 90 Q130 40 168 90 Q150 70 130 70 Q110 70 92 90Z" fill="#ec407a" stroke="#ad1457" stroke-width="2.5"/>
      <path d="M162 84 L196 70 L176 100Z" fill="#ec407a" stroke="#ad1457" stroke-width="2.5"/>
      <circle cx="146" cy="98" r="8" fill="#fff"/><circle cx="148" cy="99" r="4" fill="#1b1b1b"/>
      <ellipse cx="112" cy="97" rx="12" ry="10" fill="#1b1b1b"/><path d="M98 88 L146 80" stroke="#1b1b1b" stroke-width="3"/>
      <path d="M110 118 Q130 134 152 118" fill="none" stroke="#4a2511" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  const PIRATE_FRONT = `<svg class="layer" viewBox="0 0 260 330" aria-hidden="true">
      <defs><pattern id="gmStave" width="26" height="10" patternUnits="userSpaceOnUse"><rect width="26" height="10" fill="#a2672b"/><rect width="3" height="10" fill="#6b4119"/><rect x="13" width="1.2" height="10" fill="#c58a4a"/></pattern>
      <linearGradient id="gmShade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient></defs>
      <path id="gmBody" d="M38 112 Q130 158 222 112 Q256 205 222 292 Q130 322 38 292 Q4 205 38 112Z" fill="url(#gmStave)" stroke="#4b2e12" stroke-width="5"/>
      <path d="M38 112 Q130 158 222 112 Q256 205 222 292 Q130 322 38 292 Q4 205 38 112Z" fill="url(#gmShade)"/>
      <path d="M26 160 Q130 204 234 160" fill="none" stroke="#3a2a1a" stroke-width="9"/><path d="M12 250 Q130 296 248 250" fill="none" stroke="#3a2a1a" stroke-width="9"/>
      <circle cx="130" cy="214" r="21" fill="#f3e5c8" stroke="#4b2e12" stroke-width="3"/><text x="130" y="224" text-anchor="middle" font-size="26" fill="#1b1b1b">☠</text>
      <path d="M38 112 Q130 158 222 112" fill="none" stroke="#d29a55" stroke-width="4"/>
    </svg>`;
  function startPirate(){
    clearTimers(); screen = 'pirate'; normPirate();
    const N = pirateCfg.slots;
    const g = makeTurnGame(N); g.total = N;
    let rot = 0;
    render(`${topBar('🏴‍☠️ Thùng gỗ cướp biển')}
      <div class="gm-beach">
        <span class="deco" style="left:4px;top:78px">🌴</span><span class="deco" style="right:6px;top:92px;font-size:2.4rem">🌴</span>
        <button class="gm-restart" id="gm-again2" aria-label="Chơi lại">⟲</button>
        <div class="gm-banner" id="gm-status" style="margin-top:44px">${players.count > 1 ? 'Lượt của ' + esc(nameOf(0)) + ' · rút dao vào một khe' : 'Nhét dao vào một khe bất kỳ'}</div>
        <div class="gm-pbarrel" id="gm-barrel">${PIRATE_BG}<div class="pirate">${PIRATE_MAN}</div>${PIRATE_FRONT}<div id="gm-pslots"></div></div>
        <div class="gm-rot"><button id="gm-rl" aria-label="Xoay trái">⟲</button><button id="gm-rr" aria-label="Xoay phải">⟳</button></div>
      </div>
      <button class="gm-primary" id="gm-again" style="display:none">Chơi lại</button>
      <p class="gm-hint">Vuốt ngang trên thùng hoặc bấm nút xoay để tìm khe.</p>`);
    bindBack();
    const st = $('gm-status'), barrel = $('gm-barrel'), box = $('gm-pslots');
    const pat = barrel.querySelector('#gmStave');
    const pos = [];
    for(let i = 0; i < N; i++){
      const b = document.createElement('button'); b.className = 'gm-pslot'; b.setAttribute('aria-label', 'Khe ' + (i + 1)); b.dataset.i = i;
      const k = document.createElement('div'); k.className = 'gm-pknife'; k.style.display = 'none'; k.innerHTML = '<i></i><b></b>';
      box.appendChild(b); box.appendChild(k); pos.push({ b, k });
      b.addEventListener('click', () => pick(i));
    }
    function layout(){
      for(let i = 0; i < N; i++){
        const th = rot + (i / N) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
        const { b, k } = pos[i];
        const vis = c > 0.14;
        b.style.display = vis ? '' : 'none';
        const x = 130 + 86 * sn, y = 208 + (i % 2 ? 26 : -22) + (1 - c) * 10;
        b.style.left = (x / 260 * 100) + '%'; b.style.top = (y / 330 * 100) + '%';
        b.style.transform = `scaleX(${(0.35 + 0.65 * c).toFixed(2)})`;
        if(g.used.has(i)){
          k.style.display = vis ? '' : 'none';
          const len = 44 * (0.4 + 0.6 * c), dir = sn >= 0 ? 1 : -1;
          k.style.width = len + 'px'; k.style.top = (y / 330 * 100) + '%';
          k.style.left = (dir > 0 ? (x / 260 * 100) + '%' : 'auto'); k.style.right = (dir > 0 ? 'auto' : (100 - x / 260 * 100) + '%');
          k.style.marginLeft = dir > 0 ? '-4px' : '0'; k.style.marginRight = dir > 0 ? '0' : '-4px';
          k.querySelector('b').style.cssText = dir > 0 ? 'right:-8px' : 'left:-8px';
        }
      }
      if(pat) pat.setAttribute('patternTransform', `translate(${(rot * 60).toFixed(1)} 0)`);
    }
    layout();
    function pick(i){
      turnPick(g, i, () => {
        pos[i].b.classList.add('used'); layout(); beep(300, 0.08, 'square', 0.1); buzz(15);
        const left = N - g.used.size;   // số khe còn trống (gồm cả khe bí mật)
        st.innerHTML = players.count < 2 ? `Còn ${left - 1} khe an toàn · đã qua ${g.safe} lượt` : `Lượt của <span style="color:var(--accent,#f2b705)">${esc(nameOf(g.turn))}</span> · còn ${left} khe trống`;
        if(left === 1){
          // mọi khe khác đã cắm dao: khe cuối chắc chắn là khe bí mật
          st.innerHTML = players.count < 2 ? 'Chỉ còn đúng 1 khe: khe bí mật!' : `Chỉ còn 1 khe, <span style="color:var(--accent,#f2b705)">${esc(nameOf(g.turn))}</span> phải nhét vào khe bí mật!`;
          later(() => { if(!g.over && screen === 'pirate') pick(g.trap); }, 1100);
        }else{
          const anyFront = pos.some((p, k) => !g.used.has(k) && p.b.style.display !== 'none');
          if(!anyFront) bringFront();
        }
      }, () => {
        pos[i].b.classList.add('used'); layout();
        barrel.classList.add('boom'); noise(0.3, 0.2); beep(660, 0.12, 'square', 0.15); beep(220, 0.5, 'sawtooth', 0.15, 0.1); buzz([40, 30, 40, 30, 150]);
        st.classList.add('lose'); st.innerHTML = '🏴‍☠️ Hải tặc bật ra! ' + endText(g).replace('💥 ', '');
        $('gm-again').style.display = 'block';
      });
    }
    // xoay thùng: vuốt ngang hoặc bấm nút
    let drag = null;
    barrel.addEventListener('pointerdown', (e) => { if(e.target.closest('.gm-pslot')) return; drag = { x: e.clientX, r: rot }; barrel.setPointerCapture && barrel.setPointerCapture(e.pointerId); });
    barrel.addEventListener('pointermove', (e) => { if(!drag) return; rot = drag.r + (e.clientX - drag.x) * 0.012; layout(); });
    const endDrag = () => { drag = null; };
    barrel.addEventListener('pointerup', endDrag); barrel.addEventListener('pointercancel', endDrag);
    let spinRaf = 0;
    function turnBy(delta){
      cancelAnimationFrame(spinRaf);
      const from = rot, to = rot + delta, t0 = performance.now(), dur = FAST ? 20 : 260;
      (function f(now){ const p = Math.min(1, (now - t0) / dur); rot = from + (to - from) * (1 - Math.pow(1 - p, 3)); layout(); if(p < 1) spinRaf = requestAnimationFrame(f); })(t0);
      beep(200, 0.04, 'triangle', 0.05);
    }
    function bringFront(){
      // xoay thùng tới khe trống gần nhất để người chơi thấy
      let best = null;
      for(let i = 0; i < N; i++){
        if(g.used.has(i)) continue;
        const th = rot + (i / N) * Math.PI * 2, d = -(((th + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
        if(best === null || Math.abs(d) < Math.abs(best)) best = d;
      }
      if(best !== null) later(() => turnBy(best), 250);
    }
    $('gm-rl').addEventListener('click', () => turnBy((Math.PI * 2) / N * 1.5));
    $('gm-rr').addEventListener('click', () => turnBy(-(Math.PI * 2) / N * 1.5));
    $('gm-again').addEventListener('click', startPirate);
    $('gm-again2').addEventListener('click', startPirate);
  }

  /* ---------- Lắc xí ngầu (khối 3D) ---------- */
  const SKINS = [
    { id: 'navy',   name: 'Xanh hoàng đạo', bg: 'radial-gradient(circle at 50% 40%,#25388f,#0d1650 75%)', ring: '#e8b04a', glow: 'rgba(232,176,74,.55)', glyph: '#fff', num: '#fff' },
    { id: 'gold',   name: 'Vàng đen',       bg: 'radial-gradient(circle at 50% 40%,#2a1c0c,#0c0703 80%)', ring: '#d9ac52', glow: 'rgba(217,172,82,.5)', glyph: '#e6c06a', num: '#f1cf7a' },
    { id: 'violet', name: 'Tím phát sáng',  bg: 'radial-gradient(circle at 50% 40%,#6a4bd0,#3a2790 80%)', ring: '#ffffff', glow: 'rgba(255,255,255,.7)', glyph: '#fff', num: '#fff' },
    { id: 'royal',  name: 'Xanh vàng',      bg: 'radial-gradient(circle at 50% 40%,#103070,#050f2e 80%)', ring: '#2f86f0', glow: 'rgba(47,134,240,.7)', glyph: '#f2c14e', num: '#f7cf55' }
  ];
  const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  // mặt trên = 1, đáy = 6, trước = 2, sau = 5, phải = 3, trái = 4. Phép xoay đưa mặt có giá trị v lên trên:
  const TOP_ROT = { 1: [0, 0, 0], 2: [90, 0, 0], 5: [-90, 0, 0], 6: [180, 0, 0], 3: [0, 0, -90], 4: [0, 0, 90] };
  let diceCount = +store('dice') || 2;
  let skinIdx = Math.max(0, SKINS.findIndex((k) => k.id === store('dskin')));
  let diceHist = [];
  let shakeHandler = null, shakeLast = 0, rolling = false;

  function faceHtml(n, r){
    const gl = ZODIAC.map((z, k) => `<i style="transform:rotate(${k * 30}deg) translateY(calc(var(--s) * -.355))"><span style="transform:rotate(${-k * 30}deg)">${z}︎</span></i>`).join('');
    return `<div class="gm-face f${n}"><div class="gm-ring">${gl}</div><span class="gm-num">${n}</span></div>`;
  }
  function cubeHtml(i){
    return `<div class="gm-scene"><div class="gm-camera"><div class="gm-hop"><div class="gm-cube" data-v="1" data-i="${i}">${[1, 2, 3, 4, 5, 6].map(faceHtml).join('')}</div></div></div></div>`;
  }
  const rotCss = (r, k) => `rotateX(${r[0] + 360 * k[0]}deg) rotateY(${r[1] + 360 * k[1]}deg) rotateZ(${r[2] + 360 * k[2]}deg)`;
  function applySkin(){
    const k = SKINS[skinIdx], st = $('gm-dice');
    if(!st) return;
    st.style.setProperty('--bg', k.bg); st.style.setProperty('--ring', k.ring); st.style.setProperty('--glow', k.glow);
    st.style.setProperty('--glyph', k.glyph); st.style.setProperty('--num', k.num);
  }
  function stopShake(){ if(shakeHandler){ window.removeEventListener('devicemotion', shakeHandler); shakeHandler = null; } }
  function showDice(){
    clearTimers(); screen = 'dice'; diceHist = []; rolling = false;
    render(`${topBar('🎲 Lắc xí ngầu')}
      <div class="gm-panel">
        <label>Số viên xúc xắc</label>
        <div class="gm-seg" id="gm-dcount">${[1, 2, 3, 4, 5, 6].map((n) => `<button data-n="${n}" class="${n === diceCount ? 'on' : ''}">${n}</button>`).join('')}</div>
        <label style="margin-top:12px">Kiểu xúc xắc</label>
        <div class="gm-skins" id="gm-skins">${SKINS.map((k, i) => `<button data-i="${i}" class="${i === skinIdx ? 'on' : ''}" title="${esc(k.name)}" aria-label="${esc(k.name)}" style="background:${k.bg}"></button>`).join('')}</div>
      </div>
      <div class="gm-dicestage"><div class="gm-dice" id="gm-dice"></div></div>
      <div class="gm-sum" id="gm-sum" style="margin-top:12px">Bấm nút để gieo</div>
      <button class="gm-primary" id="gm-roll">🎲 Lắc!</button>
      <button class="gm-mini" id="gm-shake" style="display:block;margin:10px auto 0">📳 Bật lắc điện thoại để gieo</button>
      <div class="gm-hist" id="gm-hist"></div>`);
    bindBack();
    drawDice();
    $('gm-dcount').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      diceCount = +b.dataset.n; store('dice', diceCount);
      $('gm-dcount').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      drawDice(); $('gm-sum').textContent = 'Bấm nút để gieo';
    }));
    $('gm-skins').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      skinIdx = +b.dataset.i; store('dskin', SKINS[skinIdx].id);
      $('gm-skins').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); applySkin();
    }));
    $('gm-roll').addEventListener('click', rollDice);
    $('gm-shake').addEventListener('click', toggleShake);
  }
  function drawDice(){
    const box = $('gm-dice'); if(!box) return;
    box.style.setProperty('--s', (diceCount <= 2 ? 92 : diceCount <= 4 ? 76 : 64) + 'px');
    box.innerHTML = Array.from({ length: diceCount }, (_, i) => cubeHtml(i)).join('');
    applySkin();
  }
  function rollDice(){
    if(rolling) return;
    rolling = true;
    const final = Array.from({ length: diceCount }, () => 1 + rand(6));
    const dur = FAST ? 40 : 1100;
    $('gm-sum').textContent = '…';
    $('gm-dice').querySelectorAll('.gm-cube').forEach((c, i) => {
      const k = [2 + rand(2), 2 + rand(3), 1 + rand(2)];
      c.style.transitionDuration = (dur / 1000 + i * (FAST ? 0 : 0.08)) + 's';
      c.style.transform = rotCss(TOP_ROT[final[i]], k);
      c.dataset.v = final[i];
      const hop = c.parentNode; hop.classList.remove('go'); void hop.offsetWidth; hop.classList.add('go');
    });
    const t0 = Date.now();
    const iv = setInterval(() => { noise(0.05, 0.1); buzz(10); if(Date.now() - t0 > dur * 0.8) clearInterval(iv); }, FAST ? 15 : 90);
    later(() => {
      rolling = false;
      const sum = final.reduce((a, b) => a + b, 0);
      $('gm-sum').textContent = diceCount > 1 ? `Tổng: ${sum}  (${final.join(' + ')})` : `Ra mặt ${sum}`;
      diceHist.unshift(diceCount > 1 ? `${final.join('+')}=${sum}` : String(sum)); diceHist = diceHist.slice(0, 6);
      $('gm-hist').textContent = 'Các lượt trước: ' + diceHist.slice(1).join(' · ');
      beep(660, 0.12, 'triangle'); beep(880, 0.15, 'triangle', 0.1, 0.1);
    }, dur + diceCount * 80 + 60);
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

  let ledRaf = 0, ledPhase = 0, wheelHL = -1, lastLed = 0;
  function stopWheelAnim(){ if(wheelRaf){ cancelAnimationFrame(wheelRaf); wheelRaf = 0; } if(ledRaf){ cancelAnimationFrame(ledRaf); ledRaf = 0; } wheelSpinning = false; }
  function startLeds(){
    if(ledRaf) cancelAnimationFrame(ledRaf);
    (function f(now){
      if(screen !== 'wheel' || !$('gm-canvas')){ ledRaf = 0; return; }
      if(now - lastLed > 90){ lastLed = now; ledPhase++; if(!wheelSpinning) drawWheel(now); }
      ledRaf = requestAnimationFrame(f);
    })(performance.now());
  }
  function showWheel(){
    clearTimers(); screen = 'wheel'; wheelHL = -1;
    render(`${topBar('🎡 Vòng quay may mắn')}
      <div class="gm-wheelstage">
        <div class="gm-wheelbox"><div class="gm-pointer" id="gm-pointer"></div><canvas id="gm-canvas" width="640" height="640"></canvas></div>
        <div class="gm-result" id="gm-result"></div>
        <button class="gm-spinbtn" id="gm-spin">🎡 QUAY!</button>
      </div>
      <div class="gm-panel" style="margin-top:14px">
        <label>Các ô trên vòng quay (mỗi dòng một ô, tối đa 12 ô)</label>
        <textarea id="gm-items" rows="6">${esc(wheelItems.join('\n'))}</textarea>
        <label style="margin-top:10px;font-weight:600"><input type="checkbox" id="gm-remove" ${removeWinner ? 'checked' : ''}> Loại ô vừa trúng khỏi vòng quay</label>
        <button class="gm-mini" id="gm-reset" style="margin-top:8px;color:#1b3a2f;background:#eef3ef;border-color:#c5d3cb">Khôi phục danh sách mẫu</button>
      </div>`);
    bindBack();
    drawWheel();
    startLeds();
    $('gm-items').addEventListener('input', () => {
      const v = $('gm-items').value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 12);
      if(v.length >= 2){ wheelItems = v; store('wheel', v); wheelHL = -1; drawWheel(); }
    });
    $('gm-remove').addEventListener('change', (e) => { removeWinner = e.target.checked; store('wheelRemove', removeWinner); });
    $('gm-reset').addEventListener('click', () => { wheelItems = WHEEL_DEFAULT.slice(); store('wheel', wheelItems); wheelHL = -1; $('gm-items').value = wheelItems.join('\n'); drawWheel(); });
    $('gm-spin').addEventListener('click', spinWheel);
  }
  function shade(hex, f){
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const m = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  }
  function drawWheel(now){
    const cv = $('gm-canvas'); if(!cv) return;
    const c = cv.getContext('2d'), W = cv.width, M = W / 2, Rw = M - 52, n = wheelItems.length, s = (Math.PI * 2) / n, t = now || performance.now();
    c.clearRect(0, 0, W, W);
    // vành vàng
    const rim = c.createRadialGradient(M, M, Rw - 4, M, M, M - 4);
    rim.addColorStop(0, '#8a5a00'); rim.addColorStop(.35, '#ffd86b'); rim.addColorStop(.7, '#d69a1b'); rim.addColorStop(1, '#6b4300');
    c.beginPath(); c.arc(M, M, M - 4, 0, Math.PI * 2); c.fillStyle = rim; c.fill();
    // các ô
    c.save(); c.translate(M, M); c.rotate(wheelAngle);
    for(let i = 0; i < n; i++){
      const col = WHEEL_COLORS[i % WHEEL_COLORS.length];
      const g = c.createRadialGradient(0, 0, 30, 0, 0, Rw);
      g.addColorStop(0, shade(col, -.35)); g.addColorStop(.55, col); g.addColorStop(1, shade(col, .18));
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, Rw, i * s, (i + 1) * s); c.closePath();
      c.fillStyle = g; c.fill(); c.lineWidth = 4; c.strokeStyle = '#ffe9a8'; c.stroke();
      c.save(); c.rotate(i * s + s / 2); c.textAlign = 'right'; c.textBaseline = 'middle';
      const label = wheelItems[i]; c.font = `800 ${n > 8 ? 30 : 36}px 'Trebuchet MS',Arial,sans-serif`;
      let txt = label; while(txt.length > 3 && c.measureText(txt).width > Rw - 90) txt = txt.slice(0, -2);
      txt = txt === label ? txt : txt + '…';
      c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineJoin = 'round'; c.strokeText(txt, Rw - 26, 0);
      c.fillStyle = '#fff'; c.fillText(txt, Rw - 26, 0); c.restore();
    }
    // nhấp nháy ô trúng
    if(wheelHL >= 0 && wheelHL < n){
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, Rw, wheelHL * s, (wheelHL + 1) * s); c.closePath();
      c.fillStyle = `rgba(255,255,255,${(0.22 + 0.2 * Math.sin(t / 140)).toFixed(3)})`; c.fill();
    }
    c.restore();
    // đèn LED quanh vành
    const bulbs = 28;
    for(let i = 0; i < bulbs; i++){
      const a = (i / bulbs) * Math.PI * 2, x = M + Math.cos(a) * (Rw + 24), y = M + Math.sin(a) * (Rw + 24);
      const on = (i + ledPhase) % 3 === 0 || (wheelSpinning && (i + ledPhase) % 2 === 0);
      c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2);
      c.fillStyle = on ? '#fffbd0' : '#a8681a'; c.shadowColor = on ? '#ffd84a' : 'transparent'; c.shadowBlur = on ? 18 : 0; c.fill(); c.shadowBlur = 0;
      c.lineWidth = 2; c.strokeStyle = '#6b4300'; c.stroke();
    }
    // trục giữa
    const hub = c.createRadialGradient(M - 8, M - 10, 4, M, M, 44);
    hub.addColorStop(0, '#fff6c8'); hub.addColorStop(.5, '#f2b705'); hub.addColorStop(1, '#8a5a00');
    c.beginPath(); c.arc(M, M, 44, 0, Math.PI * 2); c.fillStyle = hub; c.fill(); c.lineWidth = 6; c.strokeStyle = '#5b3a00'; c.stroke();
    c.fillStyle = '#7a1f1f'; c.font = '700 40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', M, M + 2);
  }
  function winnerIndex(angle){
    const n = wheelItems.length, s = (Math.PI * 2) / n, two = Math.PI * 2;
    const a = (((Math.PI * 1.5 - angle) % two) + two) % two;
    return Math.min(n - 1, Math.floor(a / s));
  }
  function flickPointer(){
    const p = $('gm-pointer'); if(!p) return;
    p.classList.remove('flick'); void p.offsetWidth; p.classList.add('flick');
  }
  function spinWheel(){
    if(wheelSpinning) return;
    if(wheelItems.length < 2){ $('gm-result').textContent = 'Cần ít nhất 2 ô'; return; }
    wheelSpinning = true; wheelHL = -1; $('gm-result').textContent = ''; $('gm-result').classList.remove('pop'); $('gm-spin').disabled = true;
    const start = wheelAngle, extra = (5 + rand(4)) * Math.PI * 2 + (rand(1000) / 1000) * Math.PI * 2, dur = FAST ? 120 : 5200;
    const t0 = performance.now();
    let lastIdx = winnerIndex(start);
    (function frame(now){
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3.2);
      wheelAngle = start + extra * e; ledPhase++; drawWheel(now);
      const idx = winnerIndex(wheelAngle);
      if(idx !== lastIdx){ lastIdx = idx; beep(900 + (1 - p) * 300, 0.03, 'square', 0.06); flickPointer(); }
      if(p < 1){ wheelRaf = requestAnimationFrame(frame); return; }
      wheelRaf = 0; wheelSpinning = false;
      const w = winnerIndex(wheelAngle); wheelHL = w;
      const res = $('gm-result'); res.textContent = '🎉 ' + wheelItems[w]; void res.offsetWidth; res.classList.add('pop');
      $('gm-spin').disabled = false;
      beep(660, 0.15, 'triangle'); beep(880, 0.15, 'triangle', 0.1, 0.12); beep(1100, 0.25, 'triangle', 0.1, 0.24); buzz([80, 40, 80]);
      try{ if(typeof launchConfetti === 'function') launchConfetti(); }catch(e){}
      if(removeWinner && wheelItems.length > 2){
        wheelItems.splice(w, 1); store('wheel', wheelItems);
        later(() => { if(screen === 'wheel'){ wheelHL = -1; $('gm-items').value = wheelItems.join('\n'); drawWheel(); } }, FAST ? 30 : 2200);
      }
    })(t0);
  }

  /* ---------- Đá gà mini ---------- */
  const rf = () => rand(1000000) / 1000000;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const CH_NAMES = ['Gà Lửa', 'Gà Sấm', 'Gà Bão', 'Gà Thép', 'Gà Băng', 'Gà Vàng', 'Gà Đen', 'Gà Ngọc'];
  const CH_HUES = [0, 205, 120, 45, 255, 320, 80, 165];
  const SPECIALS = {
    revive:  { name: 'Hồi Sinh', desc: 'hồi 35% máu một lần khi gần gục' },
    flurry:  { name: 'Mổ Liên Hoàn', desc: '4 cú mổ liên tiếp' },
    phantom: { name: 'Ảo Ảnh', desc: 'né 3 đòn kế tiếp' },
    steel:   { name: 'Gồng Thép', desc: 'giảm một nửa sát thương 4 đòn kế tiếp' },
    thunder: { name: 'Cú Đá Sấm Sét', desc: 'cú đá cực mạnh làm đối thủ choáng' },
    crow:    { name: 'Gáy Uy Lực', desc: 'rút 60% năng lượng và làm yếu đòn của đối thủ' }
  };
  const SP_KEYS = Object.keys(SPECIALS);
  const STAT_DEFS = [['str', 'Sức mạnh', '#e53935'], ['spd', 'Tốc độ', '#fb8c00'], ['hp', 'Máu', '#43a047'], ['en', 'Năng lượng', '#1e88e5']];
  let flock = [];
  let selected = new Set();
  let chickenCount = +store('chickCount') || 4;
  function newChicken(idx, keepName){
    const w = [rf() + .15, rf() + .15, rf() + .15, rf() + .15], sum = w.reduce((x, y) => x + y, 0);
    const v = w.map((x) => clamp(Math.round(34 + (96 * x) / sum * 1.0), 30, 100));
    return { name: keepName || CH_NAMES[idx % CH_NAMES.length], hue: CH_HUES[idx % CH_HUES.length], str: v[0], spd: v[1], hp: v[2], en: v[3], sp: SP_KEYS[rand(SP_KEYS.length)] };
  }
  function makeFlock(n){
    const old = flock.map((c) => c.name);
    flock = Array.from({ length: n }, (_, i) => newChicken(i, old[i] && old[i] !== CH_NAMES[i % CH_NAMES.length] ? old[i] : null));
    selected = new Set();
  }

  /* Mô phỏng một trận: trả về danh sách sự kiện để phát hoạt hình (hoặc bỏ qua) */
  function simulate(A, B){
    const f = [A, B].map((c) => ({ c, maxHp: 120 + c.hp * 2, maxEn: 40 + c.en * 0.9, gauge: rf() * 40, used: false, phantom: 0, steel: 0, weak: 0, stun: false, dealt: 0, sp: '' }));
    f.forEach((x) => { x.hp = x.maxHp; x.en = x.maxEn; });
    const ev = [];
    const snap = () => ({ hp: f.map((x) => Math.round(x.hp)), en: f.map((x) => Math.round(x.en)) });
    function strike(i, mult, unavoidable){
      const a = f[i], d = f[1 - i];
      const dodge = clamp(0.08 + (d.c.spd - a.c.spd) / 300, 0.03, 0.35);
      let miss = false, dmg = 0, crit = false;
      if(d.phantom > 0){ d.phantom--; miss = true; }
      else if(!unavoidable && rf() < dodge) miss = true;
      if(!miss){
        crit = rf() < 0.1;
        dmg = a.c.str * 0.5 * (0.7 + 0.6 * rf()) * mult * (crit ? 1.8 : 1);
        if(a.weak > 0) dmg *= 0.7;
        if(d.steel > 0){ dmg *= 0.5; d.steel--; }
        dmg = Math.max(1, Math.round(dmg)); d.hp = Math.max(0, d.hp - dmg); a.dealt += dmg;
      }
      if(a.weak > 0) a.weak--;
      return { miss, dmg, crit };
    }
    let guard = 0, winner = -1;
    while(winner < 0 && guard++ < 600){
      const t = Math.min(...f.map((x) => (100 - x.gauge) / x.c.spd));
      f.forEach((x) => { x.gauge += t * x.c.spd; });
      const r0 = f[0].gauge, r1 = f[1].gauge;
      const i = r0 > r1 ? 0 : r1 > r0 ? 1 : rand(2);
      f[i].gauge = Math.max(0, f[i].gauge - 100);
      const me = f[i], op = f[1 - i];
      if(me.stun){ me.stun = false; ev.push({ t: 'stun', who: i, ...snap() }); continue; }
      const key = me.c.sp;
      // tuyệt chiêu ẩn
      let used = false;
      if(!me.used){
        if(key === 'revive'){
          if(me.hp < me.maxHp * 0.3){ me.used = used = true; me.hp = Math.min(me.maxHp, me.hp + me.maxHp * 0.35); me.sp = key; ev.push({ t: 'special', who: i, key, ...snap() }); }
        }else if(me.en >= 20 && rf() < (me.hp < me.maxHp * 0.5 ? 0.34 : 0.16)){
          me.used = used = true; me.sp = key; me.en -= 20;
          if(key === 'flurry'){
            ev.push({ t: 'special', who: i, key, ...snap() });
            for(let k = 0; k < 4 && op.hp > 0; k++){ const h = strike(i, 0.6); ev.push({ t: 'attack', who: i, ...h, ...snap() }); }
          }else if(key === 'phantom'){ me.phantom = 3; ev.push({ t: 'special', who: i, key, ...snap() }); }
          else if(key === 'steel'){ me.steel = 4; ev.push({ t: 'special', who: i, key, ...snap() }); }
          else if(key === 'thunder'){ const h = strike(i, 2.4, true); op.stun = true; ev.push({ t: 'special', who: i, key, ...snap() }); ev.push({ t: 'attack', who: i, ...h, ...snap() }); }
          else if(key === 'crow'){ op.en = Math.max(0, op.en * 0.4); op.weak = 3; ev.push({ t: 'special', who: i, key, ...snap() }); }
        }
      }
      if(!used){
        if(me.en < 12){ me.en = Math.min(me.maxEn, me.en + me.maxEn * 0.3); ev.push({ t: 'rest', who: i, ...snap() }); }
        else{ me.en -= 12; const h = strike(i, 1); ev.push({ t: 'attack', who: i, ...h, ...snap() }); }
      }
      if(op.hp <= 0) winner = i;
    }
    if(winner < 0) winner = f[0].hp / f[0].maxHp >= f[1].hp / f[1].maxHp ? 0 : 1;
    ev.push({ t: 'end', winner, ...snap() });
    return { ev, winner, maxHp: f.map((x) => x.maxHp), maxEn: f.map((x) => x.maxEn), dealt: f.map((x) => x.dealt), used: f.map((x) => x.sp) };
  }

  function statBars(c){
    return STAT_DEFS.map(([k, label, col]) => `<div class="gm-stat"><span>${label}</span><u><i style="width:${c[k]}%;background:${col}"></i></u><b>${c[k]}</b></div>`).join('') +
      '<div class="gm-secret">❓ Tuyệt chiêu bí mật</div>';
  }

  function showChickens(){
    clearTimers(); screen = 'chicken';
    if(flock.length !== chickenCount) makeFlock(chickenCount);
    const cards = flock.map((c, i) => `<div class="gm-chk ${selected.has(i) ? 'sel' : ''}" data-i="${i}">
        <div class="em" data-act="sel" style="--hue:${c.hue}deg" title="Chạm để chọn">🐓</div>
        <div class="info"><input class="nm" maxlength="14" value="${esc(c.name)}" data-i="${i}"><div class="gm-secret">❓ Chỉ số và tuyệt chiêu bí mật</div></div>
        <button class="re" data-act="re" data-i="${i}" title="Tạo lại con gà này">🎲</button></div>`).join('');
    render(`${topBar('🐓 Đá gà mini')}
      <div class="gm-panel">
        <p style="margin:0 0 10px;font-size:.85rem;line-height:1.5">Mỗi chú gà có các chỉ số (sức mạnh, tốc độ, máu, năng lượng) và một tuyệt chiêu, tất cả đều <b>ẩn</b>, chỉ lộ dần khi gà ra đòn và sau trận. Hãy đoán xem con nào thắng. Game vui, không cá cược.</p>
        <label>Số gà</label>
        <div class="gm-seg" id="gm-ccount">${[2, 3, 4, 5, 6, 7, 8].map((n) => `<button data-n="${n}" class="${n === chickenCount ? 'on' : ''}">${n}</button>`).join('')}</div>
        <button class="gm-mini" id="gm-newall" style="margin-top:10px;color:#1b3a2f;background:#eef3ef;border-color:#c5d3cb">🎲 Tạo gà mới (đổi hết)</button>
      </div>
      ${cards}
      <div class="gm-ctl" id="gm-cmodes"></div>
      <p class="gm-hint">Chạm vào con gà để chọn 2 con đấu riêng. Gõ tên để đặt tên.</p>`);
    bindBack();
    const modes = $('gm-cmodes');
    function drawModes(){
      modes.innerHTML = flock.length === 2
        ? '<button class="pri" id="gm-go">⚔ Bắt đầu trận đấu</button>'
        : `<button class="pri" id="gm-go">🏆 Giải đấu (${flock.length} gà)</button><button id="gm-pair" ${selected.size === 2 ? '' : 'disabled style="opacity:.5"'}>⚔ Đấu cặp đã chọn</button>`;
      $('gm-go').addEventListener('click', () => startTournament());
      const p = $('gm-pair'); if(p) p.addEventListener('click', () => { if(selected.size === 2) startMatches([[...selected][0], [...selected][1]], true); });
    }
    drawModes();
    $('gm-ccount').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { chickenCount = +b.dataset.n; store('chickCount', chickenCount); makeFlock(chickenCount); showChickens(); }));
    $('gm-newall').addEventListener('click', () => { const names = flock.map((c) => c.name); flock = flock.map((c, i) => newChicken(i, names[i])); showChickens(); beep(520, 0.1, 'triangle'); });
    root.querySelectorAll('.gm-chk').forEach((card) => {
      const i = +card.dataset.i;
      card.querySelector('.em').addEventListener('click', () => {
        if(selected.has(i)) selected.delete(i); else { if(selected.size >= 2) selected.delete([...selected][0]); selected.add(i); }
        root.querySelectorAll('.gm-chk').forEach((x) => x.classList.toggle('sel', selected.has(+x.dataset.i))); drawModes(); beep(600, 0.05, 'triangle', 0.08);
      });
      card.querySelector('input.nm').addEventListener('input', (e) => { flock[i].name = e.target.value; });
      card.querySelector('.re').addEventListener('click', () => { const nm = flock[i].name; flock[i] = newChicken(i, nm); selected = new Set(); showChickens(); });
    });
  }

  /* Giải đấu loại trực tiếp hoặc một trận đơn */
  let tour = null;
  function startTournament(){
    const order = flock.map((_, i) => i).sort(() => rf() - 0.5);
    tour = { round: 1, pending: [], winners: [], bye: null, single: false, results: [] };
    planRound(order);
    nextMatch();
  }
  function planRound(ids){
    tour.pending = []; tour.bye = null;
    const a = ids.slice();
    if(a.length % 2){ tour.bye = a.pop(); }
    for(let k = 0; k < a.length; k += 2) tour.pending.push([a[k], a[k + 1]]);
    tour.total = tour.pending.length; tour.idx = 0;
  }
  function startMatches(pair, single){
    tour = { round: 1, pending: [pair], winners: [], bye: null, single: !!single, results: [], total: 1, idx: 0 };
    nextMatch();
  }
  function nextMatch(){
    if(!tour.pending.length){
      const ids = tour.winners.slice(); if(tour.bye !== null) ids.push(tour.bye);
      if(ids.length === 1) return showChampion(ids[0]);
      tour.round++; tour.winners = []; planRound(ids.sort(() => rf() - 0.5));
    }
    const [ia, ib] = tour.pending.shift(); tour.idx++;
    playMatch(ia, ib);
  }
  function playMatch(ia, ib){
    clearTimers(); screen = 'chicken-fight';
    const A = flock[ia], B = flock[ib];
    const sim = simulate(A, B);
    const head = tour.single ? 'Trận đấu cặp' : `Vòng ${tour.round} · trận ${tour.idx}/${tour.total}` + (tour.bye !== null ? ` · ${esc(flock[tour.bye].name)} được đặc cách` : '');
    const side = (c, k, cls) => `<div class="gm-cside ${cls}" id="gm-c${k}">
        <div class="nm">${esc(c.name)}</div>
        <div class="bar hp"><i id="hp${k}"></i></div><div class="hpnum" id="hpn${k}"></div>
        <div class="bar en"><i id="en${k}"></i></div>
        <div class="chick" id="ch${k}" style="--hue:${c.hue}deg">🐓</div></div>`;
    render(`${topBar('🐓 Đá gà mini')}
      <p style="text-align:center;margin:0 0 8px;font-weight:700">${head}</p>
      <div class="gm-arena">${side(A, 0, 'left')}<div class="gm-vs">VS</div>${side(B, 1, 'right')}<div class="gm-sp" id="gm-sp"></div></div>
      <div class="gm-log" id="gm-log"></div>
      <div class="gm-ctl" id="gm-fctl"><button class="pri" id="gm-play">▶ Bắt đầu</button></div>`);
    bindBack();
    const log = (txt) => { const l = $('gm-log'); if(!l) return; const d = document.createElement('div'); d.textContent = txt; l.appendChild(d); l.scrollTop = l.scrollHeight; };
    const setBars = (e) => {
      for(let k = 0; k < 2; k++){
        $('hp' + k).style.width = (e.hp[k] / sim.maxHp[k] * 100) + '%'; $('hpn' + k).textContent = `${e.hp[k]} / ${sim.maxHp[k]}`;
        $('en' + k).style.width = clamp(e.en[k] / sim.maxEn[k] * 100, 0, 100) + '%';
      }
    };
    setBars({ hp: sim.maxHp, en: sim.maxEn });
    const names = [A.name, B.name];
    const speed = { v: 1 };
    let stepI = 0, finished = false;
    function pop(k, text, cls){
      const el = document.createElement('div'); el.className = 'gm-dmg ' + (cls || ''); el.textContent = text;
      $('gm-c' + k).appendChild(el); later(() => el.remove(), 1000);
    }
    function anim(k, cls, ms){ const el = $('ch' + k); if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); later(() => el.classList.remove(cls), ms); }
    function finish(){
      if(finished) return; finished = true;
      const w = sim.winner, l = 1 - w, ia2 = [ia, ib];
      tour.winners.push(ia2[w]);
      const dead = $('ch' + l), win = $('ch' + w); if(dead) dead.classList.add('dead'); if(win) win.classList.add('win');
      setBars(sim.ev[sim.ev.length - 1]);
      const st2 = (c) => `Sức mạnh ${c.str} · Tốc độ ${c.spd} · Máu ${c.hp} · Năng lượng ${c.en}`;
      const revealed = sim.used.map((u, k) => u ? `${names[k]} đã dùng tuyệt chiêu ${SPECIALS[u].name} (${SPECIALS[u].desc}).` : `${names[k]} chưa kịp dùng tuyệt chiêu bí mật.`);
      const l2 = $('gm-log'); if(l2){ l2.innerHTML = ''; log(`🏆 ${names[w]} thắng! Gây ${sim.dealt[w]} sát thương, đối thủ gây ${sim.dealt[l]}.`); log(`📊 ${names[0]}: ${st2(A)}`); log(`📊 ${names[1]}: ${st2(B)}`); revealed.forEach(log); }
      beep(660, 0.15, 'triangle'); beep(880, 0.2, 'triangle', 0.1, 0.12); buzz([60, 40, 100]);
      const last = !tour.pending.length && (tour.winners.length + (tour.bye !== null ? 1 : 0)) === 1;
      $('gm-fctl').innerHTML = `<button class="pri" id="gm-next">${tour.single ? 'Về danh sách gà' : last ? '🏆 Xem nhà vô địch' : 'Trận kế tiếp →'}</button>`;
      $('gm-next').addEventListener('click', () => { if(tour.single) showChickens(); else nextMatch(); });
    }
    function step(){
      if(finished) return;
      const e = sim.ev[stepI++]; if(!e){ finish(); return; }
      const k = e.who, o = 1 - k;
      if(e.t === 'attack'){
        anim(k, 'atk', 450);
        later(() => {
          if(e.miss){ pop(o, 'Né!', 'miss'); log(`${names[o]} né được đòn của ${names[k]}.`); beep(700, 0.08, 'sine', 0.08); }
          else{ anim(o, 'hurt', 350); pop(o, '-' + e.dmg, e.crit ? 'crit' : ''); log(`${names[k]} ${e.crit ? 'đá CHÍ MẠNG' : 'mổ'} ${names[o]} mất ${e.dmg} máu.`); noise(0.08, e.crit ? 0.22 : 0.12); buzz(e.crit ? 40 : 15); }
          setBars(e);
        }, 220 / speed.v);
      }else if(e.t === 'special'){
        const sp = SPECIALS[e.key], el = $('gm-sp'); el.textContent = `✨ ${names[k]}: ${sp.name}!`; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
        log(`✨ ${names[k]} tung tuyệt chiêu ${sp.name}: ${sp.desc}.`); beep(440, 0.1, 'sawtooth', 0.12); beep(880, 0.25, 'triangle', 0.12, 0.1); anim(k, 'atk', 450); setBars(e);
      }else if(e.t === 'rest'){ log(`${names[k]} thở dốc, lấy lại sức.`); setBars(e); }
      else if(e.t === 'stun'){ log(`${names[k]} đang choáng, mất lượt!`); setBars(e); }
      else if(e.t === 'end'){ later(finish, 500 / speed.v); return; }
      later(step, (e.t === 'special' ? 1500 : 800) / speed.v);
    }
    $('gm-play').addEventListener('click', () => {
      $('gm-fctl').innerHTML = '<button id="gm-fast">⏩ Nhanh x2</button><button id="gm-skip">⏭ Bỏ qua</button>';
      $('gm-fast').addEventListener('click', () => { speed.v = speed.v === 1 ? 2.2 : 1; $('gm-fast').textContent = speed.v === 1 ? '⏩ Nhanh x2' : '⏩ Đang nhanh'; });
      $('gm-skip').addEventListener('click', () => { clearTimers(); finish(); });
      log(`🔔 ${names[0]} gặp ${names[1]}!`); step();
    });
  }

  function showChampion(idx){
    clearTimers(); screen = 'chicken-end';
    const c = flock[idx];
    const reveal = flock.map((x) => `<div class="gm-chk" style="--hue:${x.hue}deg"><div class="em" style="cursor:default">🐓</div><div class="info"><b>${esc(x.name)}</b>${statBars(x).replace('❓ Tuyệt chiêu bí mật', '✨ ' + SPECIALS[x.sp].name + ': ' + SPECIALS[x.sp].desc)}</div></div>`).join('');
    render(`${topBar('🏆 Nhà vô địch')}
      <div class="gm-panel" style="text-align:center">
        <div style="font-size:4.5rem;line-height:1.1;filter:hue-rotate(${c.hue}deg)">🐓</div>
        <div style="font-size:1.5rem;font-weight:900;margin:4px 0">🏆 ${esc(c.name)}</div>
        <div style="font-size:.85rem">là nhà vô địch!</div>
      </div>
      <div class="gm-panel"><label>Chỉ số và tuyệt chiêu của các chú gà</label>${reveal}</div>
      <div class="gm-ctl"><button class="pri" id="gm-again3">Đấu lại với đội hình này</button><button id="gm-newflock">🎲 Tạo gà mới</button></div>`);
    bindBack();
    beep(660, 0.15, 'triangle'); beep(880, 0.15, 'triangle', 0.1, 0.12); beep(1100, 0.3, 'triangle', 0.1, 0.24);
    try{ if(typeof launchConfetti === 'function') launchConfetti(); }catch(e){}
    $('gm-again3').addEventListener('click', startTournament);
    $('gm-newflock').addEventListener('click', () => { const names = flock.map((x) => x.name); flock = flock.map((x, i) => newChicken(i, names[i])); showChickens(); });
  }

  /* ---------- Cổng vào ---------- */
  window.renderGames = function(){
    root = $('view-games'); if(!root) return;
    injectCss();
    if(!root.dataset.ready){ root.dataset.ready = '1'; showMenu(); }
  };
  window.leaveGames = function(){ clearTimers(); };
  window.__games = { simulate, newChicken, SPECIALS, openGame, showMenu, get screen(){ return screen; }, winnerIndex, get wheelItems(){ return wheelItems; } };
})();
