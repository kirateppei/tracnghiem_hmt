# Tích hợp game "Chạy năng lượng"

Trạng thái: **module đã xong và kiểm thử riêng, CHƯA gắn vào trang chính.** Nhánh `game-chay-nang-luong` không sửa `docs/games.js`, `docs/index.html`, `docs/app.js`. Việc gắn vào menu Trò chơi làm sau khi duyệt, theo hướng dẫn dưới đây.

## 1. Các tệp mới

| Tệp | Vai trò |
|---|---|
| `docs/runner.js` | Module ES: dựng cảnh 3D (Three.js r170 có sẵn ở `docs/vendor/`), nhân vật, giao diện phủ (màn chờ, HUD, tạm dừng, hết pin, xếp hạng), điều khiển, âm thanh. Tự đủ, không đụng Firebase. |
| `docs/runner-logic.js` | Luật chơi thuần (không DOM/Three): tốc độ, sinh đường, va chạm, điểm, người máy chơi thử. Node import được để kiểm thử. |
| `tools/runner-test/logic.test.mjs` | Kiểm thử logic bằng Node (không cần trình duyệt). |
| `tools/runner-test/browser.mjs` | Kiểm thử trình duyệt giả lập + chụp ảnh. |
| `firestore.rules` | Đã thêm luật cho `runner_scores` (xem mục 5). |

`runner.js` nạp `runner-logic.js` kèm đúng chuỗi `?v=` của chính nó, nên chỉ cần import `runner.js?v=...` như cách `games.js` đang nạp `g3d.js`.

## 2. Hợp đồng module

```js
// docs/runner.js
export function supported(): boolean;
export function runner(container: HTMLElement, opt: {
  sfx?: { beep(freq,dur,type,vol,delay), noise(dur,vol), buzz(pattern) },   // không truyền = im lặng
  loadBoard?: () => Promise<Array<{uid,name,photo,best,kwh,coins}>>,
  submitScore?: (rec:{best,kwh,coins}) => Promise<void>,                    // từ chối (reject) = chỉ lưu cục bộ
  me?: { uid, name, photo },
  onExit?: () => void,                                                      // có truyền thì hiện nút "← Thoát"
  seed?: number,                                                            // chỉ để kiểm thử: cố định đường chạy
}): { dispose(), pause(), resume(), restart(), setCharacter('m'|'f'), setSkin(id), skins, debug };
export const SKINS;   // sổ đăng ký skin
```

- Container nên có **chiều cao** (ví dụ `height: calc(100dvh - 150px); min-height: 420px`). Nếu thấp hơn 200 px, module tự đặt ~72% chiều cao cửa sổ.
- Không có WebGL: `runner()` tự hiện "Game này cần đồ họa 3D (WebGL)" trong container và trả bộ điều khiển rỗng (không có bản 2D dự phòng).
- Tự dọn dẹp khi `dispose()` hoặc khi container bị gỡ khỏi trang (kiểm tra mỗi khung hình). Tự tạm dừng khi trang bị ẩn (`visibilitychange`), phím `P`, nút ⏸.
- Giới hạn pixel ratio ≤ 2 (tự hạ về 1 nếu máy quá chậm), không bật bóng đổ thật (bóng giả dưới chân), tái sử dụng khối đường/vật thể (pool).
- localStorage: `gm_runner_best` (điểm cao nhất, số), `gm_runner_bestrec` (`{kwh,coins}` của ván kỷ lục), `gm_runner_char` (`"m"`/`"f"`), `gm_runner_synced` (kỷ lục đã gửi lên bảng xếp hạng).

## 3. Mã cần thêm vào `docs/games.js`

Các tên `beep`, `noise`, `buzz`, `views`, `clearTimers`, `disposeViews`, `render`, `showMenu`, `$` đều đã có trong `games.js`; `fbDb` và `session` là biến toàn cục của `auth.js` (như `leaderboard.js` đang dùng).

**a) Thẻ menu** (trong `showMenu()`, cạnh các thẻ khác của `.gm-menu`):

```js
<button class="gm-card" data-g="runner"><span class="ico">🏃</span><b>Chạy năng lượng</b><small>Chạy trên mái nhà, nhặt tia nắng, phá kỷ lục kWh</small></button>
```

Dòng ghi chú cuối menu ("kết quả không tính vào bảng xếp hạng") nên sửa lại cho đúng, vì game này có bảng xếp hạng riêng.

**b) Trong `openGame(g)`:**

```js
if(g === 'runner') return showRunner();
```

**c) Hàm mở game** (đặt gần `load3d`):

```js
let RN = null;
function loadRunner(){
  if(!RN) RN = import('./runner.js?v=' + (window.APP_VERSION || '0')).catch(() => null);
  return RN;
}
function runnerBoard(){
  if(typeof fbDb === 'undefined' || !fbDb) return Promise.resolve([]);
  return fbDb.collection('runner_scores').orderBy('best', 'desc').limit(20).get().then((snap) =>
    snap.docs.map((d) => { const x = d.data(); return { uid: x.uid || d.id, name: x.name, photo: x.photo || '', best: x.best | 0, kwh: x.kwh | 0, coins: x.coins | 0 }; }));
}
function runnerSubmit(rec){
  if(typeof fbDb === 'undefined' || !fbDb || typeof session === 'undefined' || !session) return Promise.reject(new Error('offline'));
  const doc = { uid: session.uid, name: String(session.name || 'Ẩn danh').slice(0, 80), best: rec.best | 0, kwh: rec.kwh | 0, coins: rec.coins | 0,
                ts: firebase.firestore.FieldValue.serverTimestamp() };
  if(session.photo && session.photo.length <= 300 && /^https:\/\/[a-z0-9.-]+\.googleusercontent\.com\//.test(session.photo)) doc.photo = session.photo;
  return fbDb.collection('runner_scores').doc(session.uid).set(doc);   // luật Firestore chỉ nhận khi điểm mới >= điểm cũ
}
function showRunner(){
  clearTimers(); screen = 'runner';
  render('<div id="gm-runner" style="height:calc(100dvh - 150px);min-height:420px"></div>');
  loadRunner().then((m) => {
    if(!m || screen !== 'runner') return;
    const v = m.runner($('gm-runner'), {
      sfx: { beep, noise, buzz },                       // đã tôn trọng nút tắt tiếng chung của games.js
      loadBoard: runnerBoard,
      submitScore: runnerSubmit,
      me: (typeof session !== 'undefined' && session) ? { uid: session.uid, name: session.name, photo: session.photo } : null,
      onExit: showMenu,
    });
    views.push(v);                                       // disposeViews()/clearTimers() sẽ gọi v.dispose() khi rời màn hình
  });
}
```

Không cần thêm gì vào `window.leaveGames`: nó đã gọi `clearTimers()` → `disposeViews()`. Nếu import thất bại (mất mạng, trình duyệt cũ không hỗ trợ top-level await), nên hiện thông báo trong `#gm-runner` thay vì để trống.

**d)** Thêm `runner.js` và `runner-logic.js` không cần vào danh sách precache nào (service worker đang cache theo `?v=`); `bump_version.py` đổi `?v=` khi docs/ đổi. `logo.png` đã có sẵn.

## 4. Luật chơi, điểm, kỷ lục

- Điều khiển: chạm = nhảy (giữ lâu nhảy cao hơn), chạm lần hai khi đang bay = nhảy đôi, vuốt xuống = trượt (đang bay thì lao xuống rồi trượt). Bàn phím: `Space`/`↑`/`W` nhảy, `↓`/`S` trượt, `P` tạm dừng.
- Tốc độ: 7,5 m/s lúc đầu, tăng tuyến tính theo quãng đường tới 17 m/s ở 2400 m (≈ 3 phút 26 giây chạy).
- Chướng ngại: hố; thùng đồ nghề (từ đầu); tấm pin vỡ (≥ 100 m); giàn dây điện, **phải trượt** (≥ 250 m); chim bay thấp, trượt hoặc nhảy hết cỡ (≥ 500 m). Sinh đường luôn có chỗ qua được (kiểm chứng ở mục 6).
- Vật phẩm: nam châm 10 s, khiên "cầu chì" chịu một cú va chạm, pin sạc nhân đôi tốc độ ghi điểm 8 s.
- **Công thức điểm**
  - `kWh = floor(quãng đường / 10)` (1 kWh mỗi 10 m; trong lúc có pin sạc, mỗi mét tính gấp đôi).
  - `Điểm cuối = kWh + floor(số tia nắng / 2)` (cứ 2 tia nắng cộng 1 điểm).
  - Kỷ lục = điểm cuối cao nhất, lưu ở `gm_runner_best`. Chỉ ván có điểm **lớn hơn** kỷ lục mới được gửi lên bảng xếp hạng.
- Bảng xếp hạng: top 20, đánh dấu dòng của mình; nếu mình chưa có trên bảng mà có kỷ lục trên máy thì hiện thêm dòng "Kỷ lục trên máy này". Nếu `submitScore` bị từ chối (ví dụ luật chưa cập nhật) thì chỉ báo nhẹ "Kỷ lục đã lưu trên máy này", không hiện lỗi. Khi mở màn chờ, nếu kỷ lục trên máy chưa gửi lên thì module gửi lặng lẽ một lần.

## 5. Luật Firestore (bắt buộc dán lại khi tích hợp)

Đoạn luật đã được ghi vào `firestore.rules` trên nhánh này. Khi tích hợp, **phải dán lại toàn bộ `firestore.rules` vào Firebase**: *Firestore Database → Rules → dán → Publish*. Chưa dán thì game vẫn chạy, kỷ lục chỉ lưu trên máy.

```
function validRunner() {
  let d = request.resource.data;
  return d.keys().hasAll(['uid', 'name', 'best', 'kwh', 'coins', 'ts'])
    && d.keys().hasOnly(['uid', 'name', 'photo', 'best', 'kwh', 'coins', 'ts'])
    && (!('photo' in d) || (d.photo is string && d.photo.size() <= 300
        && d.photo.matches('^https://[a-z0-9.-]+\\.googleusercontent\\.com/.*')))
    && d.uid == request.auth.uid
    && d.ts == request.time
    && d.name is string && d.name.size() <= 80
    && d.best is int && d.kwh is int && d.coins is int
    && d.best >= 0 && d.best <= 10000000
    && d.kwh >= 0 && d.kwh <= 10000000
    && d.coins >= 0 && d.coins <= 10000000
    && d.best >= d.kwh && d.best <= d.kwh + d.coins;
}
match /runner_scores/{uid} {
  allow read: if isMember();
  allow create: if isMember() && uid == request.auth.uid && validRunner();
  allow update: if isMember() && uid == request.auth.uid && validRunner()
    && request.resource.data.best >= resource.data.best;
  allow delete: if isAdmin();
}
```

Mỗi người một tài liệu có id = uid. Luật chỉ kiểm khóa, kiểu, giới hạn và quan hệ `kWh ≤ điểm ≤ kWh + tia nắng`; không chống được người cố tình gửi số giả hợp lệ (cũng như bảng `results` hiện có), vì ván chơi chạy hoàn toàn trên máy.

Lưu ý: bảng xếp hạng đọc bằng `orderBy('best','desc').limit(20)` trên một trường nên Firestore tự lập chỉ mục, không cần tạo chỉ mục thêm.

## 6. Nhân vật và cách thêm skin sau

Hai nhân vật Nam/Nữ (nữ nhỏ hơn, tóc đuôi ngựa thò ra dưới mũ), cùng đồng phục vàng cam, vạch phản quang bạc, mũ bảo hộ, đai đồ nghề; áo có logo `docs/logo.png` và chữ "HIỆP MINH THỊNH" vẽ lên texture canvas. Không dùng logo EVN hay hãng khác. Lựa chọn lưu ở `gm_runner_char`.

Thêm skin: thêm một mục vào `SKINS` đầu `docs/runner.js`, rồi gọi `api.setSkin('id')`:

```js
export const SKINS = {
  dongphuc: { name: 'Đồng phục vàng cam', shirt: '#ff9a1f', shirt2: '#f08a10', pants: '#f58a12', helmet: '#f5f5f0',
              band: '#dfe3e8', boots: '#3a2f2a', glove: '#3d3d44', belt: '#5a3a1e', skin: '#e6b08a', logo: true },
  // moi: { name: '...', shirt: '#...', ... }
};
```

Texture áo được vẽ từ màu của skin (`shirtTextures`), nên đổi màu là đủ. Muốn phụ kiện mới (kính, găng, áo khoác...) thì thêm khối trong `buildCharacter`. Chuyện khóa/mở skin (theo hạng, theo kỷ lục...) do bên tích hợp quyết định: gọi `setSkin` sau khi mở game. Hiện chưa có giao diện chọn skin.

## 7. Hằng số dễ chỉnh theo phản hồi

Chưa thử được cảm giác điều khiển trên điện thoại thật; các số này nằm ở đầu tệp để chỉnh nhanh.

`docs/runner.js` → `UI`:

| Hằng số | Mặc định | Ý nghĩa |
|---|---|---|
| `SWIPE_PX` / `SWIPE_RATIO` | 24 / 1.0 | Vuốt xuống tối thiểu bao nhiêu điểm ảnh, và độ dọc so với ngang, thì tính là trượt |
| `CYCLE_M` | 2000 | Chu kỳ bầu trời sáng → trưa → hoàng hôn → đêm (mét) |
| `VIS_W_LAND` / `VIS_W_PORT` | 17 / 12.5 | Bề ngang cảnh nhìn thấy (m) ở màn ngang/dọc; nhỏ hơn = nhân vật to hơn nhưng thấy chướng ngại muộn hơn |
| `PLAYER_X`, `GROUND_Y` | 0.24, 0.28 | Vị trí nhân vật theo chiều ngang và mặt mái theo chiều cao màn hình |

`docs/runner-logic.js` → `CFG`:

| Hằng số | Mặc định | Ý nghĩa |
|---|---|---|
| `V0`, `VMAX`, `RAMP_DIST` | 7.5, 17, 2400 | Tốc độ đầu/cuối và quãng đường để đạt tốc độ tối đa |
| `JUMP_H`, `G` | 2.8, 52 | Độ cao nhảy (m) và trọng lực (lớn hơn = nhảy gọn hơn, thời gian bay ≈ 0,66 s) |
| `DOUBLE_K` | 0.9 | Lực nhảy đôi so với nhảy thường |
| `JUMP_CUT`, `JUMP_MIN_T` | 0.5, 0.08 | Chạm nhanh thì nhảy thấp (~1,6 m); giữ lâu nhảy hết cỡ |
| `COYOTE` | 0.1 | Ân hạn ở mép mái (s) |
| `JUMP_BUF` | 0.12 | Bấm nhảy sớm trước khi chạm đất vẫn tính (s) |
| `SLIDE_T` | 0.55 | Thời gian một lần trượt (s) |
| `REACT` | 0.25 | Khoảng nghỉ tối thiểu giữa hai chướng ngại (giây × tốc độ) |
| `ROOF_MIN`/`ROOF_MAX`, `UNLOCK` | 6/14, … | Chiều dài mái và quãng đường mở khóa từng loại chướng ngại |
| `MAGNET_T`, `BOOST_T`, `COINS_PER_POINT` | 10, 8, 2 | Thời gian vật phẩm và quy đổi tia nắng ra điểm |

Nếu đổi `G`, `JUMP_H`, `SLIDE_T`, `REACT` hoặc các thông số tốc độ thì chạy lại `node tools/runner-test/logic.test.mjs` để chắc đường vẫn luôn qua được.

## 8. Kiểm thử đã làm

- `node tools/runner-test/logic.test.mjs` (không cần trình duyệt): tốc độ tăng đúng và thời gian đạt tối đa; độ cao nhảy/nhảy đôi/nhảy ngắn; ân hạn mép mái; va chạm với thùng, giàn dây (nhảy và nhảy đôi đều không qua được, trượt qua được), hố; khiên; nam châm; pin sạc; công thức điểm và kỷ lục; mở khóa chướng ngại theo quãng đường; mái 6–14 m, hố 2–4,5 m, các vùng bay/trượt không chồng nhau. **3000 đường chạy** với nhiều hạt giống và nhiều đoạn tốc độ (0–5000 m), người máy chơi tối ưu (nhảy ngắn qua thùng/pin, nhảy hết cỡ qua hố, trượt dưới dây, chim thì trượt hoặc nhảy) **không thua lần nào**; một ván liền 12 km cũng không thua.
- `node tools/runner-test/browser.mjs <thư-mục-ảnh>` (Chromium + WebGL phần mềm): màn chờ nam/nữ, chạy ban ngày/đêm/hoàng hôn, nhặt vật phẩm, hết pin, bảng xếp hạng (dữ liệu giả trong bộ nhớ), chạm = nhảy, vuốt = trượt, phím P, chơi lại, tự dọn dẹp khi gỡ container, không có lỗi console.

**Chưa kiểm thử được:** cảm giác điều khiển trên điện thoại thật (độ nhạy vuốt/chạm, độ khó), hiệu năng trên máy yếu (mới thử WebGL phần mềm), âm thanh thật (chỉ kiểm tra gọi hàm), việc đọc/ghi Firestore thật và luật Firestore (chỉ viết, chưa chạy trên Firebase), âm lượng và rung.
