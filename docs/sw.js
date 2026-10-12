/* Service worker: cho phép mở app và làm bài khi mất mạng.
   - Trang chính (index.html) và version.json: lấy từ mạng trước, mất mạng thì dùng bản đã lưu.
   - Script có ?v=..., ảnh/video/nhạc, biểu tượng: dùng bản đã lưu trước (script đổi ?v= khi có bản mới).
   - Firebase SDK (gstatic): lưu lại để mở được khi offline.
   Dữ liệu Firestore (đăng nhập, bảng xếp hạng) không đi qua đây. */
const CACHE = 'dmt-static-v1';
const SDK_HOST = 'www.gstatic.com';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for(const k of await caches.keys()){ if(k.startsWith('dmt-static-') && k !== CACHE) await caches.delete(k); }
    await self.clients.claim();
  })());
});

async function put(cache, req, res){
  try{
    if(!res || !(res.ok || res.type === 'opaque')) return;
    await cache.put(req, res.clone());
    // Bỏ các bản cũ của cùng một file khi đổi ?v=
    const u = new URL(req.url);
    if(u.searchParams.has('v')){
      for(const old of await cache.keys()){
        const o = new URL(old.url);
        if(o.pathname === u.pathname && o.search !== u.search) await cache.delete(old);
      }
    }
  }catch(e){}
}

async function networkFirst(req, key){
  const cache = await caches.open(CACHE);
  try{
    const res = await fetch(req);
    put(cache, key || req, res);
    return res;
  }catch(e){
    const hit = await cache.match(key || req, { ignoreSearch: false });
    if(hit) return hit;
    throw e;
  }
}

async function cacheFirst(req){
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if(hit) return hit;
  const res = await fetch(req);
  await put(cache, req, res);
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const u = new URL(req.url);
  const same = u.origin === self.location.origin;
  if(same){
    // Âm thanh/video dùng Range: để trình duyệt tự xử lý khi có yêu cầu từng phần
    if(req.headers.has('range')) return;
    if(u.pathname.endsWith('/version.json')){ e.respondWith(networkFirst(req, new Request(u.origin + u.pathname))); return; }
    if(req.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('/index.html')){
      e.respondWith(networkFirst(req, new Request(u.origin + u.pathname)));
      return;
    }
    if(/\.(js|webp|png|jpg|jpeg|svg|mp3|mp4|webmanifest|ico)$/i.test(u.pathname)){ e.respondWith(cacheFirst(req)); return; }
    return;
  }
  if(u.hostname === SDK_HOST && u.pathname.startsWith('/firebasejs/')){ e.respondWith(cacheFirst(req)); }
});
