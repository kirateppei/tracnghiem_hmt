# Tích hợp game "Run now: HMT"

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
<button class="gm-card" data-g="runner"><span class="ico">🏃</span><b>Run now: HMT</b><small>Chạy 3 làn giữa các tòa nhà điện mặt trời, nhặt tia nắng, phá kỷ lục kWh</small></button>
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

**d)** Thêm `runner.js` và `runner-logic.js` không cần vào danh sách precache nào (service worker đang cache theo `?v=`); `bump_version.py` đổi `?v=` khi docs/ đổi.

## 4. Luật chơi, điểm, kỷ lục

- Kiểu Subway Surfers: đường 3 làn, camera sau lưng, hai bên là cánh đồng pin mặt trời, nhà cao tầng, cột điện. Điều khiển (chỉ vuốt, chạm đơn thuần không làm gì): **vuốt trái/phải = đổi làn**, vuốt lên = nhảy hết cỡ (vuốt lên lần hai khi đang bay = nhảy đôi), vuốt xuống = trượt (đang bay thì lao xuống rồi trượt). Bàn phím: `←`/`A`, `→`/`D` đổi làn, `Space`/`↑`/`W` nhảy, `↓`/`S` trượt, `P` tạm dừng.
- Tốc độ: 7,5 m/s lúc đầu, tăng tuyến tính theo quãng đường tới 17 m/s ở 2400 m (≈ 3 phút 26 giây chạy).
- Chướng ngại (mỗi cái chiếm một làn): **nhà thấp mái pin mặt trời** cao 1,3 m dài 10–26 m (từ 80 m, mỗi cụm tối đa 2 trong 3 làn): nhảy (kể cả nhảy ngắn) để lên mái và chạy trên đó, hết mái thì rơi; đâm thẳng vào tường hoặc rẽ vào sườn khi đang ở dưới đất thì thua; **tia sét giật** (từ 150 m, 1–2 làn mỗi cụm): vòng cảnh báo trên đường, nhảy/trượt đều không qua, chỉ đổi làn; biến tần (inverter) năng lượng mặt trời kiểu GoodWe/Sungrow/Huawei, nhảy qua hoặc nhảy lên mặt trên chạy tiếp (từ đầu); **máng đi dây điện** vắt ngang cả 3 làn (từ 120 m), phải trượt, hai đầu nối ra dàn pin và biến tần ngoài đường; tấm pin vỡ, nhảy (≥ 100 m); giàn dây điện, **phải trượt** (≥ 250 m); kền kền bay ngang, trượt hoặc nhảy hết cỡ (≥ 500 m). Đâm sườn tòa nhà khi đổi làn cũng thua. Sinh đường luôn có chỗ qua được (kiểm chứng ở mục 8).
- Vật phẩm: nam châm 10 s, khiên "cầu chì" chịu một cú va chạm (đâm tòa nhà thì bị bật lại làn cũ), **huy hiệu logo HMT = nhân đôi tốc độ ghi điểm trong 8 s, **xe đạp 🚲 = 10 s đạp xe: tốc độ x2, kWh mỗi mét x2, tia nắng nhặt được x2; đâm chướng ngại thì hỏng xe (không thua), hết giờ cũng được an toàn 1 s**** (hiện "x2" trên HUD).
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

Hai nhân vật Nam/Nữ (nữ nhỏ hơn, tóc đuôi ngựa thò ra dưới mũ), cùng đồng phục vàng cam, mũ bảo hộ vàng có đèn pin và quai cằm, vạch phản quang bạc, túi ngực/túi đùi, cầu vai, đai đồ nghề kèm túi và bộ đàm, bảo vệ đầu gối, giày bảo hộ. Logo công ty (`docs/logo.png`) chỉ là phù hiệu nhỏ ở ngực trái như áo cầu thủ; dòng chữ "HIỆP MINH THỊNH" nhỏ ở lưng áo. Lựa chọn lưu ở `gm_runner_char`.

Thêm skin: thêm một mục vào `SKINS` đầu `docs/runner.js`, rồi gọi `api.setSkin('id')`:

```js
export const SKINS = {
  dongphuc: { name: 'Đồng phục vàng cam', shirt: '#ff9a1f', shirt2: '#f08a10', pants: '#f58a12', helmet: '#ffd21a',
              band: '#dfe3e8', boots: '#3a2f2a', glove: '#3d3d44', belt: '#5a3a1e', skin: '#e6b08a' },
  // moi: { name: '...', shirt: '#...', ... }
};
```

Texture áo được vẽ từ màu của skin (`shirtTextures`), nên đổi màu là đủ. Muốn phụ kiện mới (kính, găng, áo khoác...) thì thêm khối trong `buildCharacter`. Chuyện khóa/mở skin (theo hạng, theo kỷ lục...) do bên tích hợp quyết định: gọi `setSkin` sau khi mở game. Hiện chưa có giao diện chọn skin.

## 7. Hằng số dễ chỉnh theo phản hồi

Chưa thử được cảm giác điều khiển trên điện thoại thật; các số này nằm ở đầu tệp để chỉnh nhanh.

`docs/runner.js` → `UI`:

| Hằng số | Mặc định | Ý nghĩa |
|---|---|---|
| `SWIPE_PX` / `SWIPE_RATIO` | 24 / 1.0 | Vuốt tối thiểu bao nhiêu điểm ảnh, và độ lệch hướng chính so với hướng kia, thì tính là vuốt (đổi làn/trượt/nhảy) |
| `TAP_DELAY_MS` | 55 | Chờ sau khi chạm để phân biệt chạm (nhảy) với vuốt; tăng nếu hay nhảy nhầm khi vuốt, giảm nếu thấy nhảy bị trễ |
| `CYCLE_M` | 2000 | Chu kỳ bầu trời sáng → trưa → hoàng hôn → đêm (mét) |
| `VIS_W` | 8.6 | Bề ngang cảnh nhìn thấy (m) tại chỗ nhân vật; nhỏ hơn = nhân vật to hơn (camera gần hơn) |
| `DRAW_DIST` | 105 | Nhìn xa bao nhiêu mét |

`docs/runner-logic.js` → `CFG`:

| Hằng số | Mặc định | Ý nghĩa |
|---|---|---|
| `V0`, `VMAX`, `RAMP_DIST` | 7.5, 17, 2400 | Tốc độ đầu/cuối và quãng đường để đạt tốc độ tối đa |
| `JUMP_H`, `G` | 2.8, 52 | Độ cao nhảy (m) và trọng lực (lớn hơn = nhảy gọn hơn, thời gian bay ≈ 0,66 s) |
| `DOUBLE_K` | 0.9 | Lực nhảy đôi so với nhảy thường |
| `JUMP_CUT`, `JUMP_MIN_T` | 0.5, 0.08 | Chạm nhanh thì nhảy thấp (~1,6 m); giữ lâu nhảy hết cỡ |
| `LANE_W`, `LANE_SPEED` | 2.0, 7 | Bề rộng làn (m) và tốc độ đổi làn (làn/giây, 7 ≈ 0,14 s/làn) |
| `JUMP_BUF` | 0.12 | Bấm nhảy sớm trước khi chạm đất vẫn tính (s) |
| `SLIDE_T` | 0.55 | Thời gian một lần trượt (s) |
| `GAP_K`, `GAP_ADD` | 0.6, 2 | Khoảng trống giữa hai cụm chướng ngại = GAP_K × tốc độ + GAP_ADD (đủ để đổi 2 làn) |
| `BUILD_MIN`/`BUILD_MAX`, `UNLOCK` | 10/26, … | Chiều dài tòa nhà và quãng đường mở khóa từng loại chướng ngại |
| `MAGNET_T`, `BOOST_T`, `COINS_PER_POINT` | 10, 8, 2 | Thời gian vật phẩm và quy đổi tia nắng ra điểm |

Nếu đổi `G`, `JUMP_H`, `SLIDE_T`, `LANE_SPEED`, `GAP_K` hoặc các thông số tốc độ thì chạy lại `node tools/runner-test/logic.test.mjs` để chắc đường vẫn luôn qua được.

## 8. Kiểm thử đã làm

- `node tools/runner-test/logic.test.mjs` (không cần trình duyệt): tốc độ tăng đúng và thời gian đạt tối đa; độ cao nhảy/nhảy đôi/nhảy ngắn; đổi làn; va chạm với thùng (chỉ đúng làn), giàn dây (nhảy và nhảy đôi đều không qua được, trượt qua được), tòa nhà (đâm thẳng, nhảy, đâm sườn, né sang làn trống); khiên; nam châm hút từ làn bên; huy hiệu x2; công thức điểm và kỷ lục; mở khóa chướng ngại theo quãng đường; tòa nhà dài 10–26 m, mỗi cụm tối đa 2 làn, các cụm cách nhau ≥ 6 m. **3000 đường chạy** với nhiều hạt giống và nhiều đoạn tốc độ (0–5000 m), người máy chơi tối ưu (đổi làn tránh nhà, nhảy ngắn qua thùng/pin, trượt dưới dây, kền kền thì trượt hoặc nhảy) **không thua lần nào**; một ván liền 12 km cũng không thua.
- `node tools/runner-test/browser.mjs <thư-mục-ảnh>` (Chromium + WebGL phần mềm): màn chờ nam/nữ, chạy ban ngày/đêm/hoàng hôn, các vật cản và vật phẩm, hết pin, bảng xếp hạng (dữ liệu giả trong bộ nhớ), chạm = nhảy, vuốt trái/phải = đổi làn, vuốt xuống = trượt, phím P, chơi lại, tự dọn dẹp khi gỡ container, không có lỗi console.

**Chưa kiểm thử được:** cảm giác điều khiển trên điện thoại thật (độ nhạy vuốt/chạm, độ khó), hiệu năng trên máy yếu (mới thử WebGL phần mềm), âm thanh thật (chỉ kiểm tra gọi hàm), việc đọc/ghi Firestore thật và luật Firestore (chỉ viết, chưa chạy trên Firebase), âm lượng và rung.


## 9. Giao diện toàn màn hình

`showRunner()` trong `docs/games.js` tạo lớp phủ `#gm-runner-full` (position:fixed, phủ kín cửa sổ, z-index rất cao), khóa cuộn trang và gọi Fullscreen API nếu trình duyệt cho phép; rời game (nút ← Thoát, đổi tab) thì `dispose` gỡ lớp phủ và thoát toàn màn hình.


## 10. Cập nhật: bảng Top 100, hồi sinh, độ khó

- **Bảng xếp hạng**: top 100 theo Tháng này / Năm nay / Tất cả, 10 trang × 10 dòng. Mỗi ván lọt top 100 của ít nhất một bảng ghi **một tài liệu mới** vào `runner_scores` (một người có thể nhiều dòng). Bảng "tất cả" sắp theo `best`; bảng tháng/năm lấy tối đa 500 dòng có `ts` trong kỳ rồi sắp theo điểm ở máy (chỉ cần chỉ mục một trường). Ngưỡng top 100 của các bảng được nhớ 5 phút để mỗi ván không đọc lại cả ba bảng. Hợp đồng module: `loadBoard(period)` với period = `'month' | 'year' | 'all'`; `submitScore(rec)` trả `'skip'` nếu không lọt top (không phải lỗi). Luật Firestore: `runner_scores` chỉ cho tạo (id tự sinh), **phải dán lại `firestore.rules`**.
- **Hồi sinh**: `opt.getQuestion()` trả `{ q, options[], correct, explain }` (games.js lấy ngẫu nhiên từ `questions`, bỏ câu có ảnh/video). Chết lần đầu trong ván: hiện câu hỏi 20 giây; đúng thì chạy tiếp (bất khả xâm phạm 2,5 s, chướng ngại sát phía trước bị phá), sai hoặc hết giờ thì hết pin. Không truyền `getQuestion` thì không có hồi sinh.
- **Độ khó** tăng: `V0` 9,5, `VMAX` 23, `RAMP_DIST` 1800; khoảng trống giữa cụm ngắn hơn (`GAP_K` 0,46, `GAP_ADD` 1,4); chướng ngại mở khóa sớm hơn (`UNLOCK`); nhiều cụm 2–3 làn và máng cáp hơn. Người máy tối ưu vẫn qua 3000 đường không thua.
- **Skin**: mốc mở khóa x10 (600 / 1200 / 2000 / 3000 / 5000).
- Khi đang đạp xe mà trượt, nhân vật cúi rạp trên xe.
