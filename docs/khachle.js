/* ==========================================================================
   Danh sách hệ khách lẻ (chỉ quản trị viên)
   - Dữ liệu có tên, SĐT, địa chỉ, mã khách hàng nên KHÔNG nằm trong mã nguồn
     công khai: lưu ở Firestore `private_docs/khach_le`, luật chỉ cho quản trị đọc/ghi.
   - Nhập/cập nhật từ file Excel (.xlsx) ngay trong app (bộ đọc xlsx tự viết bên dưới,
     không dùng thư viện ngoài), thêm/sửa/xoá từng hệ bằng tay.
   - Không đưa vào chỉ mục tìm kiếm tài liệu và không gửi cho Nắng AI.
   ========================================================================== */
(function(){
  const DOC = () => fbDb.collection('private_docs').doc('khach_le');
  let data = null;          // { rows: [...], updatedAt, by }
  let loading = false, query = '', editing = null;

  const isAdmin = () => typeof session !== 'undefined' && !!session && session.role === 'admin';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
  const num = (v) => { if(v == null || v === '') return null; const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
  const fmt = (n, d = 2) => n == null ? '' : (+n.toFixed(d)).toLocaleString('vi-VN');
  const toast = (t) => { if(typeof showToast === 'function') showToast(t); };

  /* ---------- Đọc file .xlsx (zip + XML) ---------- */
  async function unzip(buf){
    const dv = new DataView(buf), u8 = new Uint8Array(buf), files = {};
    let e = buf.byteLength - 22;
    while(e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if(e < 0) throw new Error('Không phải file .xlsx');
    let p = dv.getUint32(e + 16, true); const n = dv.getUint16(e + 10, true);
    const td = new TextDecoder();
    for(let i = 0; i < n; i++){
      if(dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
      const off = dv.getUint32(p + 42, true), name = td.decode(u8.subarray(p + 46, p + 46 + nl));
      files[name] = { method, csize, off };
      p += 46 + nl + xl + cl;
    }
    return async (name) => {
      const f = files[name]; if(!f) return null;
      const start = f.off + 30 + dv.getUint16(f.off + 26, true) + dv.getUint16(f.off + 28, true);
      const raw = u8.subarray(start, start + f.csize);
      if(f.method === 0) return td.decode(raw);
      if(f.method !== 8) throw new Error('Kiểu nén không hỗ trợ');
      const ds = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(ds).text();
    };
  }
  const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');
  const colIdx = (ref) => { let n = 0; for(const ch of ref.replace(/\d+/g, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  async function readXlsx(buf){
    const get = await unzip(buf);
    const ss = [];
    const sst = await get('xl/sharedStrings.xml');
    if(sst) xml(sst).querySelectorAll('si').forEach((si) => ss.push([...si.getElementsByTagName('t')].map((t) => t.textContent).join('')));
    // trang tính đầu tiên theo workbook.xml
    let path = 'xl/worksheets/sheet1.xml';
    try{
      const wb = xml(await get('xl/workbook.xml')), rels = xml(await get('xl/_rels/workbook.xml.rels'));
      const first = wb.getElementsByTagName('sheet')[0];
      const rid = first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
      const rel = [...rels.getElementsByTagName('Relationship')].find((r) => r.getAttribute('Id') === rid);
      if(rel){ const t = rel.getAttribute('Target'); path = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, ''); }
    }catch(e){}
    const sh = await get(path); if(!sh) throw new Error('Không thấy trang tính');
    const rows = [];
    xml(sh).querySelectorAll('sheetData > row').forEach((r) => {
      const ri = +r.getAttribute('r') - 1, row = [];
      r.querySelectorAll('c').forEach((c) => {
        const t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0];
        let val = null;
        if(t === 's') val = v ? ss[+v.textContent] : null;
        else if(t === 'inlineStr') val = [...c.getElementsByTagName('t')].map((x) => x.textContent).join('');
        else if(t === 'str') val = v ? v.textContent : null;
        else if(t === 'b') val = v ? v.textContent === '1' : null;
        else if(v) val = +v.textContent;
        row[colIdx(c.getAttribute('r'))] = val;
      });
      rows[ri] = row;
    });
    return rows;
  }

  /* ---------- Chuyển bảng thành danh sách hệ ---------- */
  function phoneOf(v){
    if(v == null) return '';
    let s = typeof v === 'number' ? String(v) : String(v).trim();
    if(typeof v === 'number' && s.length === 9) s = '0' + s;     // Excel làm mất số 0 đầu
    return s.replace(/^[.\s]+/, '');
  }
  function toSystems(rows){
    const hi = rows.findIndex((r) => r && r.some((c) => /khach hang/.test(norm(c))));
    if(hi < 0) throw new Error('Không thấy dòng tiêu đề có cột "KHÁCH HÀNG"');
    const H = rows[hi].map((c) => norm(c));
    const all = (re) => H.map((h, i) => (re.test(h || '') ? i : -1)).filter((i) => i >= 0);
    const brands = all(/^hang$/);
    const C = {
      stt: all(/^stt$/)[0], name: all(/khach hang/)[0], addr: all(/thong tin/)[0], phone: all(/^so dt|dien thoai|sdt/)[0],
      kwp: all(/^cong suat ?\(kw\)/)[0], pw: all(/cong suat pin/)[0], pn: all(/so luong pin/)[0], pb: brands[0],
      roof: all(/dien tich mai/)[0], store: all(/pin luu tru/)[0], ikw: all(/cong suat inverter/)[0], ib: brands[1], ic: all(/so inverter/)[0], code: all(/ma k\/?h|ma khach/)[0],
    };
    const val = (r, k) => (C[k] == null ? null : r[C[k]]);
    const out = [];
    for(let i = hi + 1; i < rows.length; i++){
      const r = rows[i]; if(!r) continue;
      const name = String(val(r, 'name') || '').trim();
      const panel = { w: num(val(r, 'pw')), n: num(val(r, 'pn')), brand: String(val(r, 'pb') || '').trim() };
      const hasPanel = panel.w || panel.n || panel.brand;
      if(!name){
        if(hasPanel && out.length) out[out.length - 1].panels.push(panel);   // dòng phụ: hệ có 2 loại tấm pin
        continue;
      }
      out.push({
        name, addr: String(val(r, 'addr') || '').trim(), phone: phoneOf(val(r, 'phone')),
        kwp: num(val(r, 'kwp')), panels: hasPanel ? [panel] : [], roof: num(val(r, 'roof')), storage: num(val(r, 'store')),
        invKw: num(val(r, 'ikw')), invBrand: String(val(r, 'ib') || '').trim(), invCount: num(val(r, 'ic')), code: String(val(r, 'code') || '').trim(), note: '',
      });
    }
    return out;
  }

  /* ---------- Firestore ---------- */
  async function load(force){
    if(!isAdmin() || typeof fbDb === 'undefined' || !fbDb) return;
    if(data && !force) return;
    loading = true; render();
    try{ const s = await DOC().get(); data = s.exists ? s.data() : { rows: [] }; if(!Array.isArray(data.rows)) data.rows = []; }
    catch(e){ data = { rows: [], err: /permission/i.test(e && e.message) ? 'perm' : 'net' }; }
    loading = false; render();
  }
  async function save(rows, msg){
    try{
      await DOC().set({ rows, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), by: (session && session.name) || '' });
      data = { rows, updatedAt: new Date() }; toast(msg || 'Đã lưu.'); render(); return true;
    }catch(e){ toast(/permission/i.test(e && e.message) ? 'Không có quyền lưu: cần dán lại luật Firestore mới (xem HUONG_DAN.md).' : 'Không lưu được: ' + (e && e.message || e)); return false; }
  }

  /* ---------- Bảng vật tư một công trình ("Dự án: …", cột STT / VẬT TƯ / ĐƠN VỊ / SỐ LƯỢNG / NGUỒN / GHI CHÚ) ---------- */
  const vnNum = (s) => num(String(s || '').replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
  function isVatTu(rows){ return rows.some((r) => r && r.some((c) => norm(c) === 'vat tu') && r.some((c) => norm(c) === 'stt')); }
  function parseVatTu(rows){
    const hi = rows.findIndex((r) => r && r.some((c) => norm(c) === 'vat tu'));
    const H = rows[hi].map(norm), col = (re) => H.findIndex((h) => re.test(h || ''));
    const C = { stt: col(/^stt$/), name: col(/^vat tu$/), unit: col(/don vi/), qty: col(/so luong/), src: col(/nguon/), note: col(/ghi chu/) };
    const cells = [].concat(...rows.slice(0, hi).map((r) => (r || []).filter((c) => c != null).map(String)));
    const proj = cells.find((c) => /^du an\s*:/.test(norm(c)));
    const title = cells.find((c) => /^bang vat tu/.test(norm(c))) || '';
    const sys = { name: proj ? proj.replace(/^[^:]*:\s*/, '').trim() : '', title, summary: [], materials: [], mnotes: [], panels: [] };
    // 2 dòng tóm tắt ngay trên tiêu đề: giá trị + mô tả
    const pre = [];
    for(let i = hi - 1; i >= 0 && pre.length < 2; i--){
      const r = rows[i]; if(!r || !r.some((c) => c != null && String(c).trim() !== '')) continue;
      if(r.some((c) => /^(du an|bang vat tu|cong ty)/.test(norm(c)))) break;
      pre.unshift(r);
    }
    const vals = pre.length === 2 ? pre[0] : [], labs = pre.length === 2 ? pre[1] : [];
    for(let i = 0; i < Math.max(vals.length, labs.length); i++){
      const v = vals[i] == null ? '' : String(vals[i]).trim(), l = labs[i] == null ? '' : String(labs[i]).trim();
      if(!v && !l) continue;
      sys.summary.push({ v, l });
      if(/kwp/i.test(v)) sys.kwp = vnNum(v);
      else if(/kwh/i.test(v)){ sys.storage = vnNum(v); if(l) sys.storageName = l; }
      else if(/\bkw\b/i.test(v)){ sys.invKw = vnNum(v); sys.invBrand = l.replace(/inverter|hybrid|\b\d\s*p(ha)?\b/gi, '').replace(/\s+/g, ' ').trim(); }
      else if(/string/i.test(v)) sys.strings = (v + (l ? ': ' + l : '')).trim();
      const pm = /(\d+)\s*tấm\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s*W\b/i.exec(l);
      if(pm) sys.panels = [{ n: +pm[1], brand: pm[2].trim(), w: vnNum(pm[3]) }];
    }
    let sec = null, mode = 'items';
    for(let i = hi + 1; i < rows.length; i++){
      const r = rows[i]; if(!r) continue;
      const first = r.find((c) => c != null && String(c).trim() !== '');
      if(first == null) continue;
      const f = norm(first);
      if(f === 'nguon'){ mode = 'skip'; continue; }
      if(f === 'ghi chu'){ mode = 'notes'; continue; }
      if(mode === 'notes'){ sys.mnotes.push(String(first).replace(/^[•\-\s]+/, '').trim()); continue; }
      if(mode !== 'items') continue;
      const stt = r[C.stt];
      if(typeof stt === 'number' || /^\d+$/.test(String(stt || '').trim())){
        if(!sec){ sec = { sec: 'Vật tư', items: [] }; sys.materials.push(sec); }
        sec.items.push({ name: String(r[C.name] || '').trim(), unit: String(r[C.unit] || '').trim(), qty: r[C.qty] == null ? null : (num(r[C.qty]) ?? String(r[C.qty])), src: String(r[C.src] || '').trim(), note: String(r[C.note] || '').trim() });
      } else {
        sec = { sec: String(first).replace(/^\d+\s+/, '').replace(/\s+/g, ' ').trim(), items: [] }; sys.materials.push(sec);
      }
    }
    sys.materials = sys.materials.filter((s) => s.items.length);
    if(!sys.name) throw new Error('Không thấy dòng "Dự án: …" trong bảng vật tư');
    return sys;
  }

  // Ghép theo tên khách (không phân biệt dấu/hoa thường): cập nhật hệ có sẵn, thêm hệ mới, không xoá hệ nào
  const key = (s) => norm(s).replace(/^(anh|chi|chu|co|ong|ba|em)\s+/, '').replace(/[^a-z0-9]/g, '');
  function upsert(rows, inc){
    const out = rows.slice(); let added = 0, updated = 0;
    inc.forEach((r) => {
      const i = out.findIndex((x) => key(x.name) === key(r.name));
      const clean = {}; Object.keys(r).forEach((k) => { const v = r[k]; if(v != null && v !== '' && !(Array.isArray(v) && !v.length)) clean[k] = v; });
      if(i < 0){ out.push(Object.assign({ name: r.name, addr: '', phone: '', code: '', panels: [], note: '' }, clean)); added++; }
      else { out[i] = Object.assign({}, out[i], clean); updated++; }
    });
    return { rows: out, added, updated };
  }

  async function importFiles(files){
    let inc = [], kinds = [];
    for(const file of files){
      try{
        const rows = await readXlsx(await file.arrayBuffer());
        if(isVatTu(rows)){ const s = parseVatTu(rows); inc.push(s); kinds.push(`vật tư "${s.name}"`); }
        else { const list = toSystems(rows); inc = inc.concat(list); kinds.push(`${list.length} hệ từ "${file.name}"`); }
      }catch(e){ toast(`Không đọc được "${file.name}": ` + (e && e.message || e)); return; }
    }
    if(!inc.length){ toast('File không có dòng dữ liệu nào.'); return; }
    const r = upsert((data && data.rows) || [], inc);
    await save(r.rows, `Đã nhập ${kinds.join(', ')}: thêm ${r.added}, cập nhật ${r.updated} hệ.`);
  }

  function openMaterials(i){
    const r = data.rows[i]; if(!r || !r.materials) return;
    let m = document.getElementById('kl-modal');
    if(!m){ m = document.createElement('div'); m.id = 'kl-modal'; m.className = 'modal-backdrop'; document.body.appendChild(m); }
    let n = 0;
    m.innerHTML = `<div class="modal kl-mat" style="position:relative; max-width:720px;">
      <button class="close-x" type="button" data-kl="close">✕</button>
      <h2>📦 ${esc(r.title || 'Bảng vật tư')}</h2>
      <p class="form-hint">Dự án: <b>${esc(r.name)}</b></p>
      ${r.summary && r.summary.length ? `<div class="kl-tags">${r.summary.map((s) => `<span><b>${esc(s.v)}</b> ${esc(s.l)}</span>`).join('')}</div>` : ''}
      <div class="kl-tbl-wrap"><table class="kl-tbl"><thead><tr><th>#</th><th>Vật tư</th><th>ĐV</th><th>SL</th><th>Nguồn</th><th>Ghi chú</th></tr></thead><tbody>
      ${r.materials.map((s) => `<tr class="kl-sec"><td colspan="6">${esc(s.sec)}</td></tr>` + s.items.map((it) => `<tr><td>${++n}</td><td>${esc(it.name)}</td><td>${esc(it.unit)}</td><td class="kl-qty${it.qty == null ? ' kl-miss' : ''}">${it.qty == null ? '?' : esc(it.qty)}</td><td>${esc(it.src)}</td><td>${esc(it.note)}</td></tr>`).join('')).join('')}
      </tbody></table></div>
      ${r.mnotes && r.mnotes.length ? `<div class="kl-sum">${r.mnotes.map((x) => '• ' + esc(x)).join('<br>')}</div>` : ''}
      <div class="kl-acts"><button type="button" class="secondary" data-kl="print">🖨 In / lưu PDF</button></div>
    </div>`;
    m.classList.add('show'); m.style.display = 'flex';
  }

  /* ---------- Giao diện ---------- */
  function stats(rows){
    const kwp = rows.reduce((a, r) => a + (r.kwp || 0), 0), st = rows.reduce((a, r) => a + (r.storage || 0), 0);
    const group = (key) => { const m = {}; rows.forEach((r) => { const v = key(r); if(!v) return; const k = norm(v).replace(/\s/g, ''); (m[k] = m[k] || { name: v, n: 0 }).n++; }); return Object.values(m).sort((a, b) => b.n - a.n); };
    return { kwp, st, nStore: rows.filter((r) => r.storage).length, inv: group((r) => r.invBrand), pan: group((r) => (r.panels[0] || {}).brand) };
  }
  const tel = (p) => { const d = String(p || '').replace(/[^\d+]/g, ''); return d.length >= 9 ? d : ''; };
  function card(r, i){
    const t = tel(r.phone);
    const pan = r.panels.map((p) => `${p.n || '?'} tấm ${p.w ? p.w + 'W' : ''} ${esc(p.brand)}`).join(' + ');
    return `<div class="kl-card">
      <div class="kl-top"><b>${esc(r.name)}</b><span class="kl-kwp">${r.kwp ? fmt(r.kwp) + ' kWp' : ''}</span></div>
      ${r.addr ? `<div class="kl-line">📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.addr)}" target="_blank" rel="noopener">${esc(r.addr)}</a></div>` : ''}
      ${r.phone ? `<div class="kl-line">📞 ${t ? `<a href="tel:${t}">${esc(r.phone)}</a>` : esc(r.phone)}</div>` : ''}
      ${r.code ? `<div class="kl-line">🧾 Mã KH: <b>${esc(r.code)}</b></div>` : ''}
      <div class="kl-tags">
        ${pan ? `<span>☀️ ${pan}</span>` : ''}
        ${r.invBrand || r.invKw ? `<span>🔌 ${r.invCount && r.invCount > 1 ? r.invCount + '× ' : ''}${esc(r.invBrand)} ${r.invKw ? fmt(r.invKw) + 'kW' : ''}</span>` : ''}
        ${r.storage ? `<span>🔋 ${fmt(r.storage)} kWh</span>` : ''}
        ${r.roof ? `<span>🏠 ${fmt(r.roof, 0)} m²</span>` : ''}
      </div>
      ${r.note ? `<div class="kl-line kl-note">📝 ${esc(r.note)}</div>` : ''}
      ${r.strings ? `<div class="kl-line">🔗 ${esc(r.strings)}</div>` : ''}
      <div class="kl-acts">${r.materials && r.materials.length ? `<button type="button" class="secondary" data-kl="mat" data-i="${i}">📦 Vật tư (${r.materials.reduce((a, s) => a + s.items.length, 0)} mục)</button>` : ''}<button type="button" class="secondary" data-kl="edit" data-i="${i}">✏️ Sửa</button></div>
    </div>`;
  }

  function render(){
    const sec = document.getElementById('kl-section');
    if(!sec) return;
    sec.style.display = isAdmin() ? '' : 'none';
    const box = document.getElementById('kl-body');
    if(!box || !sec.classList.contains('open')) return;
    if(loading){ box.innerHTML = '<p class="form-hint">Đang tải…</p>'; return; }
    if(!data){ box.innerHTML = ''; load(); return; }
    if(data.err === 'perm'){ box.innerHTML = '<p class="form-hint">⚠ Firestore chưa cho phép đọc mục này. Dán lại toàn bộ <b>firestore.rules</b> vào Firebase (Firestore → Rules → Publish) rồi tải lại.</p>'; return; }
    if(data.err === 'net'){ box.innerHTML = '<p class="form-hint">⚠ Không tải được (mạng). <button type="button" class="secondary" data-kl="reload">Thử lại</button></p>'; return; }
    const rows = data.rows, q = norm(query);
    const list = rows.map((r, i) => [r, i]).filter(([r]) => !q || norm([r.name, r.addr, r.phone, r.code, r.invBrand, (r.panels || []).map((p) => p.brand).join(' '), r.note].join(' ')).includes(q));
    const s = stats(rows);
    box.innerHTML = `
      <p class="form-hint">🔒 Chỉ quản trị viên thấy mục này. Dữ liệu lưu trên Firestore, không nằm trong mã nguồn công khai.</p>
      <div class="kl-bar">
        <label class="secondary kl-file">📥 Nhập từ Excel<input type="file" accept=".xlsx" id="kl-file" multiple hidden></label>
        <button type="button" class="secondary" data-kl="add">➕ Thêm hệ</button>
      </div>
      ${rows.length ? `
      <div class="st-top">
        <div class="st-box"><b>${rows.length}</b><span>hệ</span></div>
        <div class="st-box"><b>${fmt(s.kwp, 1)}</b><span>kWp tổng</span></div>
        <div class="st-box"><b>${fmt(s.st, 1)}</b><span>kWh lưu trữ (${s.nStore} hệ)</span></div>
      </div>
      <div class="kl-sum">🔌 ${s.inv.map((x) => `${esc(x.name)}: ${x.n}`).join(' · ')}<br>☀️ ${s.pan.map((x) => `${esc(x.name)}: ${x.n}`).join(' · ')}</div>
      <input type="search" id="kl-q" class="kl-q" placeholder="🔍 Tìm tên, địa chỉ, SĐT, mã KH, hãng…" value="${esc(query)}">
      <div class="kl-list">${list.map(([r, i]) => card(r, i)).join('') || '<p class="form-hint">Không tìm thấy.</p>'}</div>`
      : '<p class="form-hint">Chưa có dữ liệu. Bấm "Nhập từ Excel" và chọn file danh sách hệ khách lẻ hoặc bảng vật tư công trình (chọn được nhiều file).</p>'}`;
    const qi = box.querySelector('#kl-q');
    if(qi) qi.oninput = () => { query = qi.value; const pos = qi.selectionStart; render(); const n = document.getElementById('kl-q'); if(n){ n.focus(); n.setSelectionRange(pos, pos); } };
    const f = box.querySelector('#kl-file'); if(f) f.onchange = () => { if(f.files.length) importFiles([...f.files]); f.value = ''; };
  }

  /* ---------- Thêm / sửa / xoá một hệ ---------- */
  const FIELDS = [
    ['name', 'Khách hàng *', 'text'], ['addr', 'Địa chỉ', 'text'], ['phone', 'Số điện thoại', 'tel'], ['code', 'Mã khách hàng', 'text'],
    ['kwp', 'Công suất hệ (kWp)', 'number'], ['panels', 'Tấm pin (VD: 24x585 Jinko; 9x620 Trina)', 'text'], ['roof', 'Diện tích mái (m²)', 'number'],
    ['storage', 'Pin lưu trữ (kWh)', 'number'], ['invKw', 'Công suất inverter (kW)', 'number'], ['invBrand', 'Hãng inverter', 'text'], ['invCount', 'Số inverter', 'number'], ['note', 'Ghi chú', 'text'],
  ];
  const panelsText = (ps) => (ps || []).map((p) => `${p.n || ''}x${p.w || ''} ${p.brand || ''}`.trim()).join('; ');
  const parsePanels = (s) => String(s || '').split(';').map((x) => x.trim()).filter(Boolean).map((x) => {
    const m = /^(\d+)?\s*[x×*]\s*(\d+(?:[.,]\d+)?)?\s*(.*)$/i.exec(x);
    return m ? { n: num(m[1]), w: num(m[2]), brand: m[3].trim() } : { n: null, w: null, brand: x };
  });
  function openEdit(i){
    editing = i;
    const r = i == null ? { panels: [] } : data.rows[i];
    let m = document.getElementById('kl-modal');
    if(!m){ m = document.createElement('div'); m.id = 'kl-modal'; m.className = 'modal-backdrop'; document.body.appendChild(m); }
    m.innerHTML = `<div class="modal" style="position:relative; max-width:520px;">
      <button class="close-x" type="button" data-kl="close">✕</button>
      <h2>${i == null ? '➕ Thêm hệ khách lẻ' : '✏️ Sửa hệ'}</h2>
      <form id="kl-form" class="kl-form">
        ${FIELDS.map(([k, label, type]) => `<label>${label}<input name="${k}" type="${type === 'number' ? 'text' : type}" ${type === 'number' ? 'inputmode="decimal"' : ''} value="${esc(k === 'panels' ? panelsText(r.panels) : (r[k] == null ? '' : r[k]))}"></label>`).join('')}
        <div class="kl-acts">
          <button type="submit" class="primary">💾 Lưu</button>
          ${i == null ? '' : '<button type="button" class="secondary kl-del" data-kl="del">🗑 Xoá hệ này</button>'}
        </div>
      </form></div>`;
    m.classList.add('show'); m.style.display = 'flex';
    m.querySelector('#kl-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target), o = {};
      FIELDS.forEach(([k, , type]) => { const v = String(fd.get(k) || '').trim(); o[k] = k === 'panels' ? parsePanels(v) : type === 'number' ? num(v) : v; });
      if(!o.name){ toast('Nhập tên khách hàng.'); return; }
      const rows = data.rows.slice();
      if(editing == null) rows.push(o); else rows[editing] = Object.assign({}, rows[editing], o);
      if(await save(rows, editing == null ? `Đã thêm "${o.name}".` : 'Đã lưu thay đổi.')) closeEdit();
    };
  }
  function printMaterials(){
    const box = document.querySelector('#kl-modal .kl-mat'); if(!box) return;
    const w = window.open('', '_blank'); if(!w){ toast('Trình duyệt chặn cửa sổ in.'); return; }
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Bảng vật tư</title><style>body{font:14px system-ui,sans-serif;padding:16px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px 6px;text-align:left}.kl-sec td{background:#eee;font-weight:700}.kl-tags span{display:inline-block;margin:0 10px 6px 0}button,.close-x{display:none}</style>${box.innerHTML}`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  }
  function closeEdit(){ const m = document.getElementById('kl-modal'); if(m){ m.classList.remove('show'); m.style.display = 'none'; } editing = null; }

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-kl]'); if(!b) return;
    const a = b.dataset.kl;
    if(a === 'edit') openEdit(+b.dataset.i);
    else if(a === 'add') openEdit(null);
    else if(a === 'close') closeEdit();
    else if(a === 'reload') load(true);
    else if(a === 'mat') openMaterials(+b.dataset.i);
    else if(a === 'print') printMaterials();
    else if(a === 'del'){
      const r = data.rows[editing]; if(!r || !confirm(`Xoá hệ "${r.name}"?`)) return;
      const rows = data.rows.filter((_, j) => j !== editing);
      if(await save(rows, `Đã xoá "${r.name}".`)) closeEdit();
    }
  });

  function mount(){
    const toc = document.getElementById('toc-list');
    if(!toc || document.getElementById('kl-section')) return;
    const sec = document.createElement('div');
    sec.className = 'toc-item kl-section'; sec.id = 'kl-section'; sec.style.display = 'none';
    sec.innerHTML = `<div class="toc-head" id="kl-head">
        <span class="toc-num">🔒</span>
        <span class="toc-titles"><div class="toc-title">Danh sách hệ khách lẻ</div><div class="toc-sub">Chỉ quản trị viên · thông tin khách, thông số hệ</div></span>
        <span class="toc-chev">▾</span></div>
      <div class="toc-body" style="max-height:none;"><div class="toc-inner" id="kl-body"></div></div>`;
    toc.after(sec);
    sec.querySelector('#kl-head').onclick = () => { sec.classList.toggle('open'); render(); };
  }

  if(typeof window.enterApp === 'function'){
    const orig = window.enterApp;
    window.enterApp = function(){ const r = orig.apply(this, arguments); try{ data = null; query = ''; mount(); render(); }catch(e){} return r; };
  }
  if(document.readyState !== 'loading') mount(); else document.addEventListener('DOMContentLoaded', mount);

  window.KhachLe = { readXlsx, toSystems, render, load };
})();
