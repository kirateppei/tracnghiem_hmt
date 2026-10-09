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

  function slide(f0, f1, dur, type, vol, delay){
    if(muted) return;
    const c = ctx(); if(!c) return;
    try{
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + (delay || 0);
      o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    }catch(e){}
  }
  const nz = (ms, dur, vol) => setTimeout(() => noise(dur, vol), ms);
  function sfx(n){
    switch(n){
      case 'peck': slide(280, 90, 0.1, 'triangle', 0.24); noise(0.05, 0.14); break;
      case 'kick': slide(190, 50, 0.2, 'sine', 0.32); noise(0.1, 0.22); slide(900, 300, 0.05, 'square', 0.06, 0.01); break;
      case 'crit': slide(230, 40, 0.32, 'sawtooth', 0.3); noise(0.2, 0.32); slide(1300, 200, 0.12, 'square', 0.1); slide(160, 50, 0.3, 'sine', 0.3, 0.08); break;
      case 'miss': noise(0.15, 0.07); slide(450, 1300, 0.15, 'sine', 0.06); break;
      case 'flap': nz(0, 0.05, 0.12); nz(70, 0.05, 0.1); nz(140, 0.05, 0.08); break;
      case 'squawk': slide(950, 430, 0.16, 'sawtooth', 0.11); slide(880, 380, 0.2, 'sawtooth', 0.11, 0.19); break;
      case 'crow': slide(480, 800, 0.2, 'sawtooth', 0.13); slide(800, 780, 0.25, 'sawtooth', 0.13, 0.2); slide(780, 340, 0.5, 'sawtooth', 0.13, 0.46); break;
      case 'heal': [523, 659, 784, 1047, 1319].forEach((f, k) => slide(f, f * 1.01, 0.22, 'sine', 0.12, k * 0.09)); break;
      case 'thunder': noise(0.55, 0.38); slide(130, 40, 0.55, 'sawtooth', 0.32); slide(2200, 120, 0.3, 'square', 0.08); break;
      case 'steel': slide(1500, 950, 0.3, 'square', 0.06); slide(2300, 1600, 0.25, 'triangle', 0.1, 0.05); slide(700, 650, 0.35, 'triangle', 0.08, 0.1); break;
      case 'phantom': slide(300, 950, 0.5, 'sine', 0.11); slide(950, 280, 0.55, 'sine', 0.08, 0.15); break;
      case 'flurry': for(let k = 0; k < 7; k++){ slide(320, 110, 0.05, 'triangle', 0.2, k * 0.1); } break;
      case 'win': [660, 880, 1100].forEach((f, k) => slide(f, f * 1.02, 0.2, 'triangle', 0.1, k * 0.12)); break;
    }
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
  #view-games .gm-chk .em{ font-size:2.6rem; line-height:1; flex:none; width:54px; text-align:center; cursor:pointer; }
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
  #view-games .gm-cside .chick{ width:130px; height:118px; margin:6px auto 0; transition:transform .12s; transform:scaleX(var(--flip,1)); transform-origin:50% 90%; }
  #view-games .gm-cside.left{ --flip:1; } #view-games .gm-cside.right{ --flip:-1; }
  #view-games .gm-cside .chick svg{ width:100%; height:100%; overflow:visible; display:block; animation:gm-bob 1.1s ease-in-out infinite; }
  @keyframes gm-bob{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-4px); } }
  #view-games .gm-cside .chick.atk{ animation:gm-atk .45s; }
  @keyframes gm-atk{ 0%{ transform:scaleX(var(--flip)) translateX(0); } 40%{ transform:scaleX(var(--flip)) translateX(75px) rotate(8deg); } 100%{ transform:scaleX(var(--flip)) translateX(0); } }
  #view-games .gm-cside .chick.atk .wing{ animation:gm-flap .2s 2; }
  @keyframes gm-flap{ 0%,100%{ transform:rotate(0); } 50%{ transform:rotate(-28deg); } }
  #view-games .gm-cside .chick .wing{ transform-box:fill-box; transform-origin:20% 25%; }
  #view-games .gm-cside .chick.hurt{ animation:gm-hurt .35s; }
  @keyframes gm-hurt{ 0%,100%{ opacity:1; transform:scaleX(var(--flip)) translateX(0); filter:none; } 25%{ opacity:.6; transform:scaleX(var(--flip)) translateX(-12px) rotate(-6deg); filter:brightness(2) saturate(.4); } 60%{ opacity:1; transform:scaleX(var(--flip)) translateX(6px); } }
  #view-games .gm-cside .chick.dead{ transform:scaleX(var(--flip)) rotate(80deg) translateY(10px); opacity:.65; filter:grayscale(.6); }
  #view-games .gm-cside .chick.dead svg{ animation:none; }
  #view-games .gm-cside .chick.win{ animation:gm-win .6s infinite alternate; }
  @keyframes gm-win{ from{ transform:scaleX(var(--flip)) translateY(0); } to{ transform:scaleX(var(--flip)) translateY(-16px) rotate(-4deg); } }
  /* hiệu ứng tuyệt chiêu riêng */
  #view-games .gm-fx{ position:absolute; inset:0; pointer-events:none; z-index:6; overflow:hidden; }
  #view-games .gm-fx .p{ position:absolute; font-size:1.6rem; line-height:1; }
  #view-games .gm-arena.flash{ animation:gm-flash .5s; }
  @keyframes gm-flash{ 0%,100%{ filter:none; } 15%{ filter:brightness(3.2); } 40%{ filter:brightness(1.4); } 55%{ filter:brightness(2.6); } }
  #view-games .gm-arena.quake{ animation:gm-quake .5s; }
  @keyframes gm-quake{ 0%,100%{ transform:translate(0,0); } 20%{ transform:translate(-7px,4px); } 40%{ transform:translate(6px,-5px); } 60%{ transform:translate(-5px,3px); } 80%{ transform:translate(4px,-2px); } }
  #view-games .gm-cside .chick.heal{ filter:drop-shadow(0 0 10px #69f0ae) drop-shadow(0 0 22px #00e676); }
  #view-games .gm-cside .chick.phantom{ opacity:.6; filter:drop-shadow(-26px 0 rgba(200,230,255,.55)) drop-shadow(26px 0 rgba(200,230,255,.55)); animation:gm-sway .5s ease-in-out infinite alternate; }
  @keyframes gm-sway{ from{ transform:scaleX(var(--flip)) translateX(-12px); } to{ transform:scaleX(var(--flip)) translateX(12px); } }
  #view-games .gm-cside .chick.steel{ filter:grayscale(.55) brightness(1.25) contrast(1.1) drop-shadow(0 0 8px #cfd8dc) drop-shadow(0 0 16px #90a4ae); }
  #view-games .gm-cside .chick.flurry{ animation:gm-flurry .9s; }
  @keyframes gm-flurry{ 0%,100%{ transform:scaleX(var(--flip)) translateX(0); } 12%{ transform:scaleX(var(--flip)) translateX(70px); } 24%{ transform:scaleX(var(--flip)) translateX(8px); } 36%{ transform:scaleX(var(--flip)) translateX(70px); } 48%{ transform:scaleX(var(--flip)) translateX(8px); } 60%{ transform:scaleX(var(--flip)) translateX(70px); } 72%{ transform:scaleX(var(--flip)) translateX(8px); } 84%{ transform:scaleX(var(--flip)) translateX(70px); } }
  #view-games .gm-cside .chick.thunder{ animation:gm-thunder 1s; }
  @keyframes gm-thunder{ 0%{ transform:scaleX(var(--flip)) translateY(0) rotate(0); filter:none; } 30%{ transform:scaleX(var(--flip)) translateY(-60px) rotate(-12deg); filter:drop-shadow(0 0 14px #fff176); } 55%{ transform:scaleX(var(--flip)) translate(90px,10px) rotate(14deg); filter:drop-shadow(0 0 20px #fff176); } 100%{ transform:scaleX(var(--flip)) translate(0,0); filter:none; } }
  #view-games .gm-cside .chick.crow{ animation:gm-crow 1.2s; }
  @keyframes gm-crow{ 0%{ transform:scaleX(var(--flip)) scale(1); } 25%{ transform:scaleX(var(--flip)) scale(1.35) translateY(-14px) rotate(-14deg); } 70%{ transform:scaleX(var(--flip)) scale(1.35) translateY(-14px) rotate(-14deg); } 100%{ transform:scaleX(var(--flip)) scale(1); } }
  #view-games .gm-cside .chick.stunned{ filter:saturate(.5); }
  #view-games .gm-cside .stars{ position:absolute; left:0; right:0; top:46px; font-size:1.3rem; letter-spacing:4px; animation:gm-spin 1s linear infinite; display:none; }
  #view-games .gm-cside .stars.on{ display:block; }
  @keyframes gm-spin{ 0%{ transform:translateX(-10px); } 50%{ transform:translateX(10px); } 100%{ transform:translateX(-10px); } }
  #view-games .gm-ring{ position:absolute; border:4px solid rgba(255,235,120,.85); border-radius:50%; width:30px; height:30px; margin:-15px 0 0 -15px; animation:gm-wave 1s ease-out forwards; }
  @keyframes gm-wave{ from{ transform:scale(.4); opacity:1; } to{ transform:scale(9); opacity:0; } }
  #view-games .gm-bolt{ position:absolute; top:-10px; width:46px; height:230px; margin-left:-23px; animation:gm-boltz .55s forwards; filter:drop-shadow(0 0 10px #fff176) drop-shadow(0 0 22px #ffd600); }
  @keyframes gm-boltz{ 0%{ opacity:0; transform:scaleY(.2); transform-origin:top; } 15%{ opacity:1; transform:scaleY(1); } 70%{ opacity:1; } 100%{ opacity:0; } }
  #view-games .gm-rise{ animation:gm-rise 1.4s ease-out forwards; }
  @keyframes gm-rise{ from{ transform:translateY(0) scale(.6); opacity:0; } 20%{ opacity:1; } to{ transform:translateY(-120px) scale(1.3); opacity:0; } }
  #view-games .gm-streak{ position:absolute; height:5px; width:60px; border-radius:3px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.9)); animation:gm-streak .5s forwards; }
  @keyframes gm-streak{ from{ transform:translateX(0); opacity:1; } to{ transform:translateX(70px); opacity:0; } }
  #view-games svg[data-tier="1"]{ filter:drop-shadow(0 0 4px rgba(120,230,160,.8)); }
  #view-games svg[data-tier="2"]{ filter:drop-shadow(0 0 6px rgba(190,140,255,.95)) drop-shadow(0 0 12px rgba(255,236,130,.7)); }
  #view-games svg[data-tier="3"]{ filter:drop-shadow(0 0 7px #ffd54a) drop-shadow(0 0 18px #ff9800); }
  #view-games svg[data-tier="4"]{ filter:drop-shadow(0 0 8px #fff59d) drop-shadow(0 0 20px #e040fb) drop-shadow(0 0 30px #ffd740); animation:gm-aura 1.6s ease-in-out infinite alternate; }
  @keyframes gm-aura{ from{ filter:drop-shadow(0 0 6px #fff59d) drop-shadow(0 0 14px #e040fb); } to{ filter:drop-shadow(0 0 12px #fff59d) drop-shadow(0 0 28px #e040fb) drop-shadow(0 0 40px #ffd740); } }
  #view-games .tw{ transform-box:fill-box; transform-origin:center; animation:gm-tw 1.4s ease-in-out infinite; }
  @keyframes gm-tw{ 0%,100%{ opacity:.15; transform:scale(.4) rotate(0); } 50%{ opacity:1; transform:scale(1.2) rotate(45deg); } }
  #view-games .gm-tier{ font-size:.78rem; font-weight:900; letter-spacing:1px; margin-top:3px; }
  #view-games .gm-tier.t0{ color:#78909c; } #view-games .gm-tier.t1{ color:#2e9e5b; } #view-games .gm-tier.t2{ color:#8e44ff; } #view-games .gm-tier.t3{ color:#e29a00; text-shadow:0 0 6px rgba(255,200,0,.6); } #view-games .gm-tier.t4{ color:#d500f9; text-shadow:0 0 8px rgba(255,214,0,.8); }
  #view-games .gm-chk .em svg{ width:54px; height:48px; display:block; overflow:visible; }
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
  // Skin gà: hạng 0 thường, 1 hiếm, 2 sử thi, 3 huyền thoại. Tên gà mặc định = tên skin (đổi màu thì đổi tên theo).
  const SKINS_CH = [
    { id: 'nau',    name: 'Gà Nâu',          tier: 0, body: '#8d5a2b', wing: '#5d3a1a', hackle: '#d9a441', t1: '#2e7d32', t2: '#455a64', t3: '#5d4037', comb: '#e53935', pat: 'none' },
    { id: 'xam',    name: 'Gà Xám',          tier: 0, body: '#9e9e9e', wing: '#616161', hackle: '#e0e0e0', t1: '#424242', t2: '#757575', t3: '#bdbdbd', comb: '#e53935', pat: 'spots' },
    { id: 'trang',  name: 'Gà Trắng',        tier: 0, body: '#f2f2ec', wing: '#cfd8dc', hackle: '#fff8e1', t1: '#e0e0e0', t2: '#cfd8dc', t3: '#eceff1', comb: '#e53935', pat: 'none' },
    { id: 'vang',   name: 'Gà Vàng',         tier: 0, body: '#fbc02d', wing: '#f57f17', hackle: '#fff59d', t1: '#e65100', t2: '#ef6c00', t3: '#ff9800', comb: '#e53935', pat: 'stripes' },
    { id: 'lua',    name: 'Gà Lửa',          tier: 1, body: '#d84315', wing: '#8d2a0b', hackle: '#ffb300', t1: '#ff6f00', t2: '#e53935', t3: '#ffca28', comb: '#b71c1c', pat: 'flames' },
    { id: 'bang',   name: 'Gà Băng',         tier: 1, body: '#4fc3f7', wing: '#0277bd', hackle: '#e1f5fe', t1: '#b3e5fc', t2: '#81d4fa', t3: '#29b6f6', comb: '#ec407a', pat: 'spots' },
    { id: 'rung',   name: 'Gà Rừng',         tier: 1, body: '#2e7d32', wing: '#1b5e20', hackle: '#c5e1a5', t1: '#00bfa5', t2: '#1de9b6', t3: '#64ffda', comb: '#e53935', pat: 'stripes' },
    { id: 'sam',    name: 'Gà Sấm',          tier: 2, body: '#1e40af', wing: '#12286e', hackle: '#ffd54a', t1: '#0ea5e9', t2: '#22d3ee', t3: '#6366f1', comb: '#ef4444', pat: 'bolt' },
    { id: 'dem',    name: 'Gà Bóng Đêm',     tier: 2, body: '#37474f', wing: '#151515', hackle: '#9575cd', t1: '#00e5ff', t2: '#651fff', t3: '#1de9b6', comb: '#aa00ff', pat: 'scales' },
    { id: 'ngoc',   name: 'Gà Ngọc',         tier: 2, body: '#00897b', wing: '#004d40', hackle: '#b2dfdb', t1: '#00bfa5', t2: '#1de9b6', t3: '#64ffda', comb: '#e53935', pat: 'scales' },
    { id: 'phuong', name: 'Gà Phượng Hoàng', tier: 3, body: '#e53935', wing: '#ff6f00', hackle: '#ffeb3b', t1: '#ff1744', t2: '#ff9100', t3: '#ffea00', comb: '#ffd600', pat: 'flames' },
    { id: 'kim',    name: 'Gà Hoàng Kim',    tier: 3, body: '#ffc107', wing: '#ff8f00', hackle: '#fff8e1', t1: '#ffd54f', t2: '#ffb300', t3: '#fff176', comb: '#d50000', pat: 'scales' },
    { id: 'rong',   name: 'Gà Rồng',         tier: 3, body: '#00c853', wing: '#00695c', hackle: '#ffd740', t1: '#00e5ff', t2: '#76ff03', t3: '#ffd600', comb: '#d50000', pat: 'scales' },
    { id: 'than',   name: 'Gà Thần Đế',      tier: 4, body: '#6a1b9a', wing: '#ffd54a', hackle: '#fff9c4', t1: '#ff4081', t2: '#ffd740', t3: '#40c4ff', comb: '#ffd600', pat: 'cosmic' }
  ];
  const skinById = (id) => SKINS_CH.find((k) => k.id === id) || SKINS_CH[0];
  const TIER_NAMES = ['Thường', 'Hiếm', 'Sử thi', 'Huyền thoại', 'Thần thoại'];
  const TIER_BUDGET = [[188, 214], [214, 240], [240, 266], [266, 292], [292, 322]];   // tổng 4 chỉ số theo hạng: hạng cao mạnh hơn
  const SPECIALS = {
    revive:  { name: 'Hồi Sinh', desc: 'hồi một phần lớn máu một lần khi gần gục' },
    flurry:  { name: 'Mổ Liên Hoàn', desc: 'chuỗi cú mổ liên tiếp rất khó né' },
    phantom: { name: 'Ảo Ảnh', desc: 'né nhiều đòn kế tiếp' },
    steel:   { name: 'Gồng Thép', desc: 'giảm mạnh sát thương nhiều đòn kế tiếp' },
    thunder: { name: 'Cú Đá Sấm Sét', desc: 'cú đá cực mạnh không thể né, làm đối thủ choáng' },
    crow:    { name: 'Gáy Uy Lực', desc: 'rút năng lượng và làm yếu hẳn đòn của đối thủ' }
  };
  const SP_KEYS = Object.keys(SPECIALS);
  const STAT_DEFS = [['str', 'Sức mạnh', '#e53935'], ['spd', 'Tốc độ', '#fb8c00'], ['hp', 'Máu', '#43a047'], ['en', 'Năng lượng', '#1e88e5']];
  let flock = [];
  let selected = new Set();
  let chickenCount = +store('chickCount') || 4;
  // tỉ lệ xuất hiện: 1 sao 45%, 2 sao 30%, 3 sao 16%, 4 sao 7%, 5 sao 2%
  const TIER_RATES = [0.45, 0.30, 0.16, 0.07, 0.02];
  function pickTier(){ let r = rf(), acc = 0; for(let t = 0; t < TIER_RATES.length; t++){ acc += TIER_RATES[t]; if(r < acc) return t; } return 0; }
  function newChicken(idx, keepName, usedNames, forceTier){
    const tier = forceTier === undefined ? pickTier() : forceTier;
    const pool = SKINS_CH.filter((k) => k.tier === tier), sk = pool[rand(pool.length)];
    const [lo, hi] = TIER_BUDGET[tier], budget = lo + rf() * (hi - lo);
    let extra = budget - 120; const v = [30, 30, 30, 30];
    for(let pass = 0; pass < 3 && extra > 0.5; pass++){
      const open = v.map((x, i) => i).filter((i) => v[i] < 100), w = open.map(() => rf() + 0.2), sum = w.reduce((x, y) => x + y, 0);
      let spent = 0; open.forEach((i, k) => { const add = Math.min(100 - v[i], extra * w[k] / sum); v[i] += add; spent += add; }); extra -= spent;
    }
    const st = v.map((x) => Math.round(x));
    let name = keepName;
    if(!name){
      name = sk.name; const used = usedNames || [];
      let n = 2; while(used.indexOf(name) >= 0) name = sk.name + ' ' + (n++);
    }
    return { name, skin: sk.id, tier, edited: !!keepName, str: st[0], spd: st[1], hp: st[2], en: st[3], sp: SP_KEYS[rand(SP_KEYS.length)] };
  }
  function makeFlock(n){
    flock = []; selected = new Set();
    for(let i = 0; i < n; i++) flock.push(newChicken(i, null, flock.map((c) => c.name)));
  }
  // đổi hết hoặc đổi một con: tên tự đổi theo skin mới, trừ khi người dùng đã tự gõ tên
  function rerollChicken(i){
    const old = flock[i], used = flock.filter((_, k) => k !== i).map((c) => c.name);
    flock[i] = newChicken(i, old.edited ? old.name : null, used);
  }

  /* Mô phỏng một trận: trả về danh sách sự kiện để phát hoạt hình (hoặc bỏ qua) */
  function simulate(A, B){
    const f = [A, B].map((c) => ({ c, maxHp: 210 + c.hp * 1.9, maxEn: 60 + c.en * 0.6, gauge: rf() * 40, used: false, phantom: 0, steel: 0, weak: 0, stun: false, dealt: 0, sp: '' }));
    f.forEach((x) => { x.hp = x.maxHp; x.en = x.maxEn; });
    const ev = [];
    const snap = () => ({ hp: f.map((x) => Math.round(x.hp)), en: f.map((x) => Math.round(x.en)) });
    function strike(i, mult, unavoidable, dodgeScale){
      const a = f[i], d = f[1 - i];
      const dodge = clamp(0.08 + (d.c.spd - a.c.spd) / 300, 0.03, 0.35) * (dodgeScale === undefined ? 1 : dodgeScale);
      let miss = false, dmg = 0, crit = false;
      if(d.phantom > 0){ d.phantom--; miss = true; }
      else if(!unavoidable && rf() < dodge) miss = true;
      if(!miss){
        crit = rf() < 0.14;
        dmg = (14 + a.c.str * 0.32) * (0.55 + 0.9 * rf()) * mult * (crit ? 1.8 : 1);
        if(a.weak > 0) dmg *= 0.55;
        if(d.steel > 0){ dmg *= 0.4; d.steel--; }
        dmg = Math.max(1, Math.round(dmg)); d.hp = Math.max(0, d.hp - dmg); a.dealt += dmg;
      }
      if(a.weak > 0) a.weak--;
      return { miss, dmg, crit };
    }
    // gà yếu hơn được tuyệt chiêu mạnh hơn và dễ tung hơn (để có cửa lật kèo)
    const score = (c) => c.str + c.spd + c.hp + c.en;
    f.forEach((x, k) => { x.u = clamp((score(f[1 - k].c) - score(x.c)) / 55, 0, 1.5); });
    let guard = 0, winner = -1;
    while(winner < 0 && guard++ < 600){
      const t = Math.min(...f.map((x) => (100 - x.gauge) / x.c.spd));
      f.forEach((x) => { x.gauge += t * x.c.spd; });
      const r0 = f[0].gauge, r1 = f[1].gauge;
      const i = r0 > r1 ? 0 : r1 > r0 ? 1 : rand(2);
      f[i].gauge = Math.max(0, f[i].gauge - 100);
      const me = f[i], op = f[1 - i];
      if(me.stun){ me.stun = false; ev.push({ t: 'stun', who: i, ...snap() }); continue; }
      const key = me.c.sp, boost = 1 + 1.6 * me.u;
      // tuyệt chiêu ẩn
      let used = false;
      if(!me.used){
        const behind = me.hp / me.maxHp < op.hp / op.maxHp;
        if(key === 'revive'){
          if(me.hp < me.maxHp * (0.3 + 0.1 * me.u)){ me.used = used = true; me.hp = Math.min(me.maxHp, me.hp + me.maxHp * 0.5 * boost); me.sp = key; ev.push({ t: 'special', who: i, key, ...snap() }); }
        }else if(me.en >= 20 && rf() < clamp((me.hp < me.maxHp * 0.5 ? 0.34 : 0.16) + 0.3 * me.u + (behind ? 0.12 : 0), 0, 0.9)){
          me.used = used = true; me.sp = key; me.en -= 20;
          ev.push({ t: 'special', who: i, key, ...snap() });
          if(key === 'flurry'){
            const n = 4 + Math.round(2 * me.u);
            for(let k = 0; k < n && op.hp > 0; k++){ const h = strike(i, 0.75 * boost, false, 0.45); ev.push({ t: 'attack', who: i, ...h, ...snap() }); }
          }else if(key === 'phantom'){ me.phantom = 3 + Math.round(2 * me.u); }
          else if(key === 'steel'){ me.steel = 5 + Math.round(2 * me.u); }
          else if(key === 'thunder'){ const h = strike(i, 3.0 * boost, true); op.stun = true; ev.push({ t: 'attack', who: i, ...h, ...snap() }); }
          else if(key === 'crow'){ op.en = Math.max(0, op.en * (0.4 - 0.2 * me.u)); op.weak = 4 + Math.round(2 * me.u); }
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


  let svgUid = 0;
  function chickSvg(c){
    const p = skinById(c.skin), u = 'ck' + (++svgUid), tier = p.tier;
    const dk = shade(p.body, -.4);
    const pat = {
      none: '',
      spots: `<g fill="${dk}" opacity=".4"><ellipse cx="118" cy="142" rx="6" ry="4.5"/><ellipse cx="140" cy="154" rx="5" ry="4"/><ellipse cx="100" cy="128" rx="4" ry="3.5"/><ellipse cx="160" cy="148" rx="4" ry="3.5"/><ellipse cx="128" cy="124" rx="3.5" ry="3"/></g>`,
      stripes: `<path d="M84 122 Q100 150 96 164 M100 114 Q118 148 112 166 M118 112 Q136 146 128 168 M136 116 Q152 146 146 168" fill="none" stroke="${dk}" stroke-width="4.5" stroke-linecap="round" opacity=".4"/>`,
      bolt: `<path d="M120 100 L102 132 L116 132 L106 160 L136 120 L121 120 L132 100Z" fill="#fff176" stroke="#f9a825" stroke-width="2" stroke-linejoin="round"/>`,
      flames: `<path d="M84 166 Q82 146 94 136 Q94 150 104 152 Q102 138 114 128 Q114 148 124 154 Q126 140 138 134 Q136 150 148 156 Q154 148 162 142 Q160 164 150 168Z" fill="#ffb300" stroke="#e65100" stroke-width="1.5" opacity=".92"/><path d="M96 166 Q96 152 106 146 Q106 158 114 160 Q116 150 124 146 Q124 160 132 164Z" fill="#fff59d" opacity=".9"/>`,
      cosmic: `<g opacity=".95"><circle cx="104" cy="130" r="2.6" fill="#fff"/><circle cx="128" cy="118" r="2" fill="#ffe082"/><circle cx="142" cy="150" r="2.8" fill="#fff"/><circle cx="116" cy="156" r="2" fill="#80d8ff"/><circle cx="160" cy="128" r="2.2" fill="#fff"/><circle cx="90" cy="150" r="1.8" fill="#ffe082"/><path d="M96 118 Q130 100 152 124 Q130 112 108 132" fill="none" stroke="#ea80fc" stroke-width="2.5" opacity=".7"/></g>`,
      scales: `<g fill="none" stroke="${dk}" stroke-width="2" opacity=".5" stroke-linecap="round"><path d="M82 126 q6 9 12 0 q6 9 12 0 q6 9 12 0 q6 9 12 0 q6 9 12 0 q6 9 12 0"/><path d="M88 140 q6 9 12 0 q6 9 12 0 q6 9 12 0 q6 9 12 0 q6 9 12 0"/><path d="M82 154 q6 9 12 0 q6 9 12 0 q6 9 12 0 q6 9 12 0 q6 9 12 0 q6 9 12 0"/></g>`
    }[p.pat] || '';
    const gold = tier >= 1 ? `<rect x="104" y="170" width="10" height="5" rx="2" fill="#ffd54a" stroke="#b8860b"/><rect x="147" y="170" width="10" height="5" rx="2" fill="#ffd54a" stroke="#b8860b"/>` : '';
    const tail4 = tier >= 2 ? `<path d="M70 104 C22 88 6 30 40 -6 C50 40 64 70 94 92Z" fill="${shade(p.t1, .15)}" stroke="${shade(p.t1, -.4)}" stroke-width="2"/>` : '';
    const wingStroke = tier >= 2 ? '#ffd54f' : shade(p.wing, -.5);
    const halo = tier >= 4 ? `<ellipse cx="178" cy="2" rx="30" ry="7" fill="none" stroke="#fff59d" stroke-width="5"/><ellipse cx="178" cy="2" rx="30" ry="7" fill="none" stroke="#ffd54a" stroke-width="2"/>` : '';
    const tail5 = tier >= 4 ? `<path d="M72 100 C26 70 14 12 52 -14 C58 30 70 60 96 86Z" fill="${shade(p.t2, .1)}" stroke="${shade(p.t2, -.4)}" stroke-width="2"/>` : '';
    const crown = tier >= 3 ? `<path d="M158 36 L160 12 L169 27 L178 8 L187 27 L196 12 L198 38Z" fill="#ffd54a" stroke="#b8860b" stroke-width="2.5" stroke-linejoin="round"/><circle cx="178" cy="26" r="3.5" fill="#e53935" stroke="#7f0000"/><circle cx="163" cy="30" r="2.4" fill="#29b6f6"/><circle cx="193" cy="30" r="2.4" fill="#29b6f6"/>` : '';
    const spark = tier >= 3 ? (tier >= 4 ? [[26, 40], [200, 20], [14, 120], [214, 100], [60, 10], [120, 6], [210, 150], [8, 170]] : [[26, 40], [200, 20], [14, 120], [214, 100]]).map(([x, y], k) => `<path class="tw" style="animation-delay:${k * 0.35}s" d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5Z" transform="translate(${x} ${y})" fill="#fffde7" stroke="#ffd54f" stroke-width="1"/>`).join('') : '';
    return `<svg viewBox="0 0 230 200" data-tier="${tier}" aria-hidden="true"><defs>
      <linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(p.body, .3)}"/><stop offset=".55" stop-color="${p.body}"/><stop offset="1" stop-color="${shade(p.body, -.3)}"/></linearGradient>
      <linearGradient id="${u}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(p.wing, .25)}"/><stop offset="1" stop-color="${shade(p.wing, -.3)}"/></linearGradient>
      <linearGradient id="${u}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(p.hackle, .2)}"/><stop offset="1" stop-color="${shade(p.hackle, -.15)}"/></linearGradient></defs>
      <ellipse cx="125" cy="192" rx="66" ry="7" fill="rgba(0,0,0,.3)"/>
      <g stroke="#f9a825" stroke-width="7" stroke-linecap="round" fill="none"><path d="M112 160 L108 186"/><path d="M146 160 L152 186"/></g>
      <g stroke="#f9a825" stroke-width="5" stroke-linecap="round" fill="none"><path d="M108 186 L90 190 M108 186 L108 194 M108 186 L124 191"/><path d="M152 186 L134 190 M152 186 L152 194 M152 186 L170 191"/></g>
      ${gold}
      <path d="M110 150 L100 156 L112 160Z" fill="${tier >= 1 ? '#ffd54a' : '#e0e0e0'}" stroke="#9e9e9e" stroke-width="1.5"/>
      ${tail5}${tail4}
      <path d="M72 112 C14 112 -6 56 22 14 C36 52 56 76 92 98Z" fill="${p.t1}" stroke="${shade(p.t1, -.4)}" stroke-width="2"/>
      <path d="M72 120 C20 132 -8 98 6 54 C34 78 56 98 94 112Z" fill="${p.t2}" stroke="${shade(p.t2, -.4)}" stroke-width="2"/>
      <path d="M74 128 C34 160 0 140 -2 104 C28 112 58 116 94 124Z" fill="${p.t3}" stroke="${shade(p.t3, -.4)}" stroke-width="2"/>
      <path d="M68 108 Q66 70 120 68 Q182 72 186 122 Q182 168 128 170 Q70 168 68 108Z" fill="url(#${u}b)" stroke="${shade(p.body, -.5)}" stroke-width="3"/>
      <ellipse cx="156" cy="132" rx="22" ry="26" fill="${shade(p.body, .35)}" opacity=".5"/>
      ${pat}
      <g class="wing"><path d="M92 108 Q140 94 160 128 Q148 158 104 150 Q80 128 92 108Z" fill="url(#${u}w)" stroke="${wingStroke}" stroke-width="${tier >= 2 ? 3.5 : 2.5}"/>
        <path d="M104 118 Q132 112 146 130 M100 130 Q124 126 138 142 M98 142 Q116 140 126 150" fill="none" stroke="${shade(p.wing, -.45)}" stroke-width="2.2" stroke-linecap="round"/></g>
      <path d="M134 78 Q166 58 182 80 Q176 112 150 118 Q132 106 134 78Z" fill="url(#${u}h)" stroke="${shade(p.hackle, -.4)}" stroke-width="2.5"/>
      <path d="M140 86 L146 106 M150 82 L156 108 M160 80 L164 104" stroke="${shade(p.hackle, -.35)}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="172" cy="56" r="23" fill="${shade(p.hackle, .1)}" stroke="${shade(p.hackle, -.45)}" stroke-width="3"/>
      <ellipse cx="176" cy="62" rx="12" ry="10" fill="${p.comb}" opacity=".9"/>
      ${crown}${halo}
      <path d="M154 40 Q148 22 160 28 Q162 12 174 24 Q186 14 188 32 Q176 40 154 40Z" fill="${p.comb}" stroke="${shade(p.comb, -.4)}" stroke-width="2.5" stroke-linejoin="round" ${tier >= 3 ? 'opacity="0"' : ''}/>
      <circle cx="178" cy="53" r="7.5" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="180" cy="54" r="4" fill="#111"/><circle cx="181.5" cy="52" r="1.4" fill="#fff"/>
      <path d="M170 44 L186 47" stroke="#222" stroke-width="3" stroke-linecap="round"/>
      <path d="M192 52 L218 60 L192 64Z" fill="#ffc107" stroke="#c77800" stroke-width="2" stroke-linejoin="round"/>
      <path d="M192 64 L212 69 L192 71Z" fill="#f57c00" stroke="#c77800" stroke-width="2" stroke-linejoin="round"/>
      <path d="M188 72 Q194 92 183 90 Q180 80 186 72Z" fill="${p.comb}" stroke="${shade(p.comb, -.4)}" stroke-width="2"/>
      ${spark}
    </svg>`;
  }
  const stars = (c) => '★'.repeat((c.tier || 0) + 1);
  function statBars(c){
    return STAT_DEFS.map(([k, label, col]) => `<div class="gm-stat"><span>${label}</span><u><i style="width:${c[k]}%;background:${col}"></i></u><b>${c[k]}</b></div>`).join('') +
      '<div class="gm-secret">❓ Tuyệt chiêu bí mật</div>';
  }

  function showChickens(){
    clearTimers(); screen = 'chicken';
    if(flock.length !== chickenCount) makeFlock(chickenCount);
    const cards = flock.map((c, i) => `<div class="gm-chk ${selected.has(i) ? 'sel' : ''}" data-i="${i}">
        <div class="em" data-act="sel" title="Chạm để chọn">${chickSvg(c)}</div>
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
    $('gm-newall').addEventListener('click', () => { for(let i = 0; i < flock.length; i++) rerollChicken(i); selected = new Set(); showChickens(); beep(520, 0.1, 'triangle'); });
    root.querySelectorAll('.gm-chk').forEach((card) => {
      const i = +card.dataset.i;
      card.querySelector('.em').addEventListener('click', () => {
        if(selected.has(i)) selected.delete(i); else { if(selected.size >= 2) selected.delete([...selected][0]); selected.add(i); }
        root.querySelectorAll('.gm-chk').forEach((x) => x.classList.toggle('sel', selected.has(+x.dataset.i))); drawModes(); beep(600, 0.05, 'triangle', 0.08);
      });
      card.querySelector('input.nm').addEventListener('input', (e) => { flock[i].name = e.target.value; flock[i].edited = true; });
      card.querySelector('.re').addEventListener('click', () => { rerollChicken(i); selected = new Set(); showChickens(); });
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
        <div class="chick" id="ch${k}">${chickSvg(c)}</div><div class="stars" id="stars${k}">⭐ ⭐ ⭐</div></div>`;
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
    // căn thời lượng trận 20-30 giây (ở tốc độ thường): mỗi sự kiện có trọng số, quy ra giây theo tổng trọng số
    const EW = { attack: 1, special: 1.8, rest: 0.7, stun: 0.7, end: 0 };
    const totalW = sim.ev.reduce((x, e) => x + (EW[e.t] || 1), 0) || 1;
    const targetSec = 20 + rf() * 10;
    const unit = clamp(targetSec / totalW, 0.5, 1.6) * 1000;
    let stepI = 0, finished = false;
    function pop(k, text, cls){
      const el = document.createElement('div'); el.className = 'gm-dmg ' + (cls || ''); el.textContent = text;
      $('gm-c' + k).appendChild(el); later(() => el.remove(), 1000);
    }
    const arenaEl = () => root.querySelector('.gm-arena');
    const fxBox = () => { const a = arenaEl(); let f = a && a.querySelector('.gm-fx'); if(!f && a){ f = document.createElement('div'); f.className = 'gm-fx'; a.appendChild(f); } return f; };
    function center(k){
      const a = arenaEl().getBoundingClientRect(), r = $('ch' + k).getBoundingClientRect();
      return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2, w: r.width, h: r.height };
    }
    function spawn(html, x, y, cls, ms, style){
      const f = fxBox(); if(!f) return null;
      const el = document.createElement('div'); el.className = 'p ' + (cls || ''); el.innerHTML = html;
      el.style.left = x + 'px'; el.style.top = y + 'px'; if(style) el.style.cssText += style;
      f.appendChild(el); later(() => el.remove(), ms || 1400); return el;
    }
    function holdClass(k, cls, ms){ const el = $('ch' + k); if(!el) return; el.classList.add(cls); later(() => { const e2 = $('ch' + k); if(e2) e2.classList.remove(cls); }, ms); }
    function shakeArena(cls, ms){ const a = arenaEl(); if(!a) return; a.classList.remove(cls); void a.offsetWidth; a.classList.add(cls); later(() => a.classList.remove(cls), ms); }
    function playSpecial(key, k, o){
      const c = center(k), q = center(o), dir = k === 0 ? 1 : -1;
      sfx(key === 'revive' ? 'heal' : key);
      if(key === 'revive'){
        holdClass(k, 'heal', 1800);
        ['💚', '✨', '✚', '💚', '✨', '✚', '💖'].forEach((t, n) => spawn(t, c.x - 50 + n * 16 + (n % 2) * 6, c.y + 20 - (n % 3) * 8, 'gm-rise', 1500, `animation-delay:${n * 0.12}s;`));
      }else if(key === 'flurry'){
        holdClass(k, 'flurry', 950);
        for(let n = 0; n < 8; n++) spawn('', c.x + dir * 30, c.y - 36 + n * 11, 'gm-streak', 600, `width:${50 + n * 4}px;${dir < 0 ? 'transform:scaleX(-1);' : ''}animation-delay:${n * 0.1}s;`);
        for(let n = 0; n < 4; n++) spawn('💢', q.x - 25 + (n % 2) * 40, q.y - 40 + n * 12, 'gm-rise', 1000, `animation-delay:${0.2 + n * 0.2}s;`);
      }else if(key === 'phantom'){
        holdClass(k, 'phantom', 3200);
        spawn('👻', c.x - 12, c.y - 70, 'gm-rise', 1500); spawn('💨', c.x + dir * 40, c.y, 'gm-rise', 1200);
      }else if(key === 'steel'){
        holdClass(k, 'steel', 3600);
        spawn('🛡️', c.x - 18, c.y - 78, 'gm-rise', 1600, 'font-size:2.4rem;');
        [0, 1, 2].forEach((n) => spawn('✨', c.x - 40 + n * 40, c.y - 30 + (n % 2) * 30, 'gm-rise', 1200, `animation-delay:${n * 0.2}s;`));
      }else if(key === 'thunder'){
        holdClass(k, 'thunder', 1000);
        const a = arenaEl(); shakeArena('flash', 600); later(() => shakeArena('quake', 500), 450);
        later(() => { spawn('<svg viewBox="0 0 46 230"><path d="M30 0 L8 96 L26 96 L6 230 L40 70 L22 70 L38 0Z" fill="#fffde7" stroke="#ffd600" stroke-width="3" stroke-linejoin="round"/></svg>', q.x, 0, 'gm-bolt', 700); spawn('⚡', q.x - 18, q.y - 10, 'gm-rise', 1000, 'font-size:2.4rem;'); }, 380);
        const st = $('stars' + o); if(st) st.classList.add('on');
        holdClass(o, 'stunned', 3000);
      }else if(key === 'crow'){
        holdClass(k, 'crow', 1250);
        for(let n = 0; n < 4; n++) later(() => { const cc = center(k); spawn('', cc.x + dir * 50, cc.y - 24, 'gm-ring', 1000); }, 220 + n * 230);
        spawn('Ò Ó O…!', c.x - 40 + dir * 20, c.y - 92, 'gm-rise', 1600, 'font-size:1.5rem;font-weight:900;color:#fff176;text-shadow:0 2px 0 #b71c1c;white-space:nowrap;');
        later(() => { holdClass(o, 'hurt', 400); }, 700);
      }
    }
    function anim(k, cls, ms){ const el = $('ch' + k); if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); later(() => el.classList.remove(cls), ms); }
    function finish(){
      if(finished) return; finished = true;
      const w = sim.winner, l = 1 - w, ia2 = [ia, ib];
      tour.winners.push(ia2[w]);
      const dead = $('ch' + l), win = $('ch' + w); if(dead) dead.classList.add('dead'); if(win) win.classList.add('win');
      [0, 1].forEach((q) => { const st = $('stars' + q); if(st) st.classList.remove('on'); });
      setBars(sim.ev[sim.ev.length - 1]);
      const st2 = (c) => `Sức mạnh ${c.str} · Tốc độ ${c.spd} · Máu ${c.hp} · Năng lượng ${c.en}`;
      const revealed = sim.used.map((u, k) => u ? `${names[k]} đã dùng tuyệt chiêu ${SPECIALS[u].name} (${SPECIALS[u].desc}).` : `${names[k]} chưa kịp dùng tuyệt chiêu bí mật.`);
      const l2 = $('gm-log'); if(l2){ l2.innerHTML = ''; log(`🏆 ${names[w]} thắng! Gây ${sim.dealt[w]} sát thương, đối thủ gây ${sim.dealt[l]}.`); log(`📊 ${names[0]} (${stars(A)}): ${st2(A)}`); log(`📊 ${names[1]} (${stars(B)}): ${st2(B)}`); revealed.forEach(log); }
      sfx('win'); later(() => sfx('crow'), 500); buzz([60, 40, 100]);
      const last = !tour.pending.length && (tour.winners.length + (tour.bye !== null ? 1 : 0)) === 1;
      $('gm-fctl').innerHTML = `<button class="pri" id="gm-next">${tour.single ? 'Về danh sách gà' : last ? '🏆 Xem nhà vô địch' : 'Trận kế tiếp →'}</button>`;
      $('gm-next').addEventListener('click', () => { if(tour.single) showChickens(); else nextMatch(); });
    }
    function step(){
      if(finished) return;
      const e = sim.ev[stepI++]; if(!e){ finish(); return; }
      const k = e.who, o = 1 - k;
      if(e.t === 'attack'){
        anim(k, 'atk', 450); sfx('flap');
        later(() => {
          if(e.miss){ pop(o, 'Né!', 'miss'); log(`${names[o]} né được đòn của ${names[k]}.`); sfx('miss'); }
          else{
            anim(o, 'hurt', 350); pop(o, '-' + e.dmg, e.crit ? 'crit' : ''); log(`${names[k]} ${e.crit ? 'đá CHÍ MẠNG' : rand(2) ? 'mổ' : 'đá'} ${names[o]} mất ${e.dmg} máu.`);
            sfx(e.crit ? 'crit' : (rand(2) ? 'peck' : 'kick')); if(rand(3) === 0 || e.crit) later(() => sfx('squawk'), 120); buzz(e.crit ? 40 : 15);
          }
          setBars(e);
        }, 220 / speed.v);
      }else if(e.t === 'special'){
        const sp = SPECIALS[e.key], el = $('gm-sp'); el.textContent = `✨ ${names[k]}: ${sp.name}!`; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
        log(`✨ ${names[k]} tung tuyệt chiêu ${sp.name}: ${sp.desc}.`); playSpecial(e.key, k, o); setBars(e);
      }else if(e.t === 'rest'){ log(`${names[k]} thở dốc, lấy lại sức.`); setBars(e); }
      else if(e.t === 'stun'){ log(`${names[k]} đang choáng, mất lượt!`); const st = $('stars' + k); if(st) later(() => st.classList.remove('on'), 700); setBars(e); }
      else if(e.t === 'end'){ later(finish, 500 / speed.v); return; }
      later(step, (EW[e.t] || 1) * unit / speed.v);
    }
    $('gm-play').addEventListener('click', () => {
      $('gm-fctl').innerHTML = '<button id="gm-fast">⏩ Nhanh x2</button>';
      $('gm-fast').addEventListener('click', () => { speed.v = speed.v === 1 ? 2.2 : 1; $('gm-fast').textContent = speed.v === 1 ? '⏩ Nhanh x2' : '⏩ Đang nhanh'; });
      log(`🔔 ${names[0]} gặp ${names[1]}!`); step();
    });
  }

  function showChampion(idx){
    clearTimers(); screen = 'chicken-end';
    const c = flock[idx];
    const reveal = flock.map((x) => `<div class="gm-chk"><div class="em" style="cursor:default">${chickSvg(x)}</div><div class="info"><b>${esc(x.name)} <span class="gm-tier t${x.tier}">${stars(x)}</span></b>${statBars(x).replace('❓ Tuyệt chiêu bí mật', '✨ ' + SPECIALS[x.sp].name + ': ' + SPECIALS[x.sp].desc)}</div></div>`).join('');
    render(`${topBar('🏆 Nhà vô địch')}
      <div class="gm-panel" style="text-align:center">
        <div style="width:150px;height:130px;margin:0 auto">${chickSvg(c)}</div>
        <div style="font-size:1.5rem;font-weight:900;margin:4px 0">🏆 ${esc(c.name)}</div>
        <div style="font-size:.85rem">là nhà vô địch!</div>
      </div>
      <div class="gm-panel"><label>Chỉ số và tuyệt chiêu của các chú gà</label>${reveal}</div>
      <div class="gm-ctl"><button class="pri" id="gm-again3">Đấu lại với đội hình này</button><button id="gm-newflock">🎲 Tạo gà mới</button></div>`);
    bindBack();
    beep(660, 0.15, 'triangle'); beep(880, 0.15, 'triangle', 0.1, 0.12); beep(1100, 0.3, 'triangle', 0.1, 0.24);
    try{ if(typeof launchConfetti === 'function') launchConfetti(); }catch(e){}
    $('gm-again3').addEventListener('click', startTournament);
    $('gm-newflock').addEventListener('click', () => { for(let i = 0; i < flock.length; i++) rerollChicken(i); showChickens(); });
  }

  /* ---------- Cổng vào ---------- */
  window.renderGames = function(){
    root = $('view-games'); if(!root) return;
    injectCss();
    if(!root.dataset.ready){ root.dataset.ready = '1'; showMenu(); }
  };
  window.leaveGames = function(){ clearTimers(); };
  window.__games = { chickSvg, SKINS_CH, get flock(){ return flock; }, simulate, newChicken, SPECIALS, openGame, showMenu, get screen(){ return screen; }, winnerIndex, get wheelItems(){ return wheelItems; } };
})();
