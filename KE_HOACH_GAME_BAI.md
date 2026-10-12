# Kế hoạch: game bài, ví điểm ảo, chơi online (CHƯA LÀM — đã chốt phương án)

File này tổng hợp mọi quyết định để các phiên làm việc sau không phải đọc lại cuộc trò chuyện dài.
Khi bắt đầu một đợt, đọc file này, làm đúng phần của đợt, rồi cập nhật mục "Tiến độ" ở cuối.

## 1. Phạm vi game
Bốn game bài, 2–6 người (Tiến lên và Phỏm 4 người, có thể lấp ghế trống bằng máy):
- **Tiến lên miền Nam**, **Phỏm (Tá lả)**, **Cào liêng**, **Poker Texas Hold'em**.
- Chơi với máy (offline) và chơi online giữa các thành viên (tối thiểu 2 người vào bàn).
- Mỗi game có nút **📖 Luật** (trang luật theo cấu hình bàn đang dùng).

## 2. Quyết định đã chốt (từ người dùng)
- Không ai được thấy bài của người khác, **kể cả chủ phòng** → cần "người chia bài" không phải người chơi.
- Điểm ảo **do admin cấp**, không nạp thật, không quy đổi ra tiền hay quà (ghi rõ trong app).
- Thắng máy **không** ăn điểm ví. Chơi với máy dùng "điểm tập chơi" riêng, không dính ví, không dùng được ở bàn online.
- **Không** giới hạn thua mỗi ngày, **không** giới hạn giờ chơi.
- Bàn online tối thiểu **2 người**.
- **Đủ luật nâng cao** (xem mục 6).
- Nói chuyện trong phòng: **dùng Zalo** (không làm voice riêng trong app): nút "Mời qua Zalo" (chia sẻ mã/đường dẫn phòng) và nút "Mở nhóm Zalo" (admin dán đường dẫn nhóm Zalo vào cấu hình). Không cần TURN, không cần cập nhật APK. Ghi chú: hai app khó cùng dùng micro trên một số máy Android, nên chọn Zalo hoặc voice riêng, không làm cả hai.

## 3. Kiến trúc
**Bot chia bài** (Node.js, Firebase Admin SDK) chạy trên **một máy do admin quản lý** (máy chưa chọn: PC công ty luôn bật / mini PC / VPS). Không dùng máy của người chơi, không dùng Cloud Functions (tránh gói Blaze).
- Bot nghe các phòng trên Firestore, xáo bài (ngẫu nhiên mật mã), ghi **bài riêng từng người** vào kho chỉ người đó đọc được.
- Kiểm luật từng nước đi, xử thắng thua, chuyển điểm, ghi sổ cái, hẹn giờ lượt (hết giờ → bỏ lượt hoặc máy chơi thay), thay người thoát bằng máy.
- Chỉ **một bot chạy tại một thời điểm**: bot giữ "hợp đồng thuê" ở `system/dealer` (ghi nhịp mỗi vài giây). Bản khác tự dừng. App hiện "Người chia bài: đang chạy/đã tắt".
- Khóa quản trị (service account) chỉ nằm trên máy bot, **tuyệt đối không đưa lên GitHub**. Bot chạy tự khởi động lại (pm2 hoặc Windows Service), có hướng dẫn cài.
- Logic luật viết thành **mô-đun JS thuần dùng chung** (đặt tên gợi ý `docs/cards-engine.js`, dùng được cả ở trình duyệt và Node): dùng cho chơi với máy và cho bot kiểm luật. Một nơi sửa luật.

### Dữ liệu Firestore (gợi ý)
- `wallets/{uid}`: số dư. Người chơi chỉ **đọc** của mình; chỉ bot và admin ghi. Có cờ `frozen`.
- `ledger/{id}`: sổ cái chỉ-thêm (ai, +/- bao nhiêu, ván/phòng nào, lý do, thời gian). Admin xem tất cả, người chơi xem của mình.
- `config/games`: luật bàn do admin chỉnh (mục 5). Mọi người đọc, chỉ admin ghi.
- `rooms/{id}`: trạng thái công khai (người ngồi, lượt, bài đã đánh, pot…). Người trong phòng đọc.
- `rooms/{id}/hands/{uid}`: bài riêng. **Chỉ chính uid đó đọc**; chỉ bot ghi.
- `rooms/{id}/actions/{id}`: hành động người chơi gửi (đánh, bỏ lượt, tăng, theo…); bot đọc, kiểm, áp dụng. Người chơi chỉ ghi vào mục của chính mình.
- Luật Firestore mới: người chơi không được ghi `wallets`, `ledger`, `hands`, trạng thái phòng; admin sửa được ví và `config`.

## 4. Ví điểm do admin cấp
- Admin nạp/trừ điểm từng tài khoản (có ghi chú), xem lịch sử, đóng băng ví. Màn hình ở tab Quản trị ("Ví điểm").
- Vào phòng: **mang điểm vào bàn** trong khoảng tối thiểu–tối đa admin đặt; điểm khóa trong bàn đến khi rời phòng, hết ván thì hoàn phần còn lại về ví.
- Rời giữa ván: mất phần đã cược trong ván; máy chơi thay ghế đến hết ván.
- Tổng điểm luôn bảo toàn: bot tính thắng thua rồi ghi sổ một lần, có kiểm tra tổng bằng 0 trước khi ghi.

## 5. Luật bàn do admin chỉnh (`config/games`)
- Mức cược mỗi ván cho phép (ví dụ 1.000 / 5.000 / 20.000).
- Giới hạn điểm mang vào phòng (tối thiểu, tối đa), cược tối đa mỗi ván.
- Hệ số thưởng (chặt heo, tứ quý, tới trắng, ù, sáp…) tính theo mức cược.
- Poker: mù nhỏ/mù lớn, mức tăng tối thiểu. Cào liêng: mức cược chung mỗi ván.
- Bật/tắt từng game. Link nhóm Zalo.

## 6. Luật đầy đủ cần làm
**Tiến lên miền Nam:** đơn/đôi/sám/tứ quý/sảnh (≥3, không có 2)/đôi thông (≥3 đôi); thứ tự 3<…<K<A<2, chất ♠<♣<♦<♥; ai có 3♠ đi trước (nếu không thì ván sau người thắng đi); chặt heo (3 đôi thông chặt 1 heo; tứ quý chặt heo và đôi heo; 4 đôi thông chặt heo, đôi heo, tứ quý); chặt chồng; **tới trắng** (4 heo, 6 đôi, sảnh rồng, tứ quý 3); **thối heo / thối tứ quý / thối đôi thông**; hạng nhất–nhì–ba–bét chia điểm; bỏ lượt thì bỏ cả vòng; kết thúc khi còn một người chưa hết bài.
**Phỏm (Tá lả):** 9 lá (người đi đầu 10); bốc hoặc **ăn** bài vừa đánh của người trước (ăn phải tạo phỏm và hạ phỏm ăn); phỏm = ≥3 cùng số hoặc ≥3 liên tiếp cùng chất (A là 1); 4 vòng đánh; **ù** (tròn/khan/có ăn); điểm rác = tổng điểm lá lẻ; **gửi bài** vào phỏm đã hạ; **đền** (ăn bài cuối làm người khác ù, ăn đủ 3 phỏm); thứ hạng theo điểm rác.
**Cào liêng:** 3 lá, xếp hạng sáp > liêng > ba tiên (JQK) > điểm 9…0 (A=1, 10/J/Q/K=0, lấy tổng chia 10 lấy dư); hòa so lá cao nhất rồi chất; lật từng lá.
**Poker Texas Hold'em:** mù xoay vị trí, 4 vòng (preflop, flop, turn, river), theo/tăng/bỏ/all-in, mức tăng tối thiểu, **side pot** nhiều tầng, chia pot khi hòa (lẻ chip cho người gần nút nhất), xếp hạng tay bài đầy đủ (thùng phá sảnh → bài cao), đồng hồ lượt, bỏ bài khi hết giờ.

## 7. Các đợt làm (mỗi đợt một phiên mới, đọc file này đầu tiên)
1. **Bộ luật dùng chung + bộ kiểm thử.** Tiến lên, Phỏm, Cào liêng, Poker (luật đầy đủ). Máy chơi (AI) cho từng game. Kiểm thử: máy tự chơi hàng nghìn ván không lỗi; điểm bảo toàn; các tình huống luật (chặt, side pot, ù…).
2. **Giao diện chơi với máy** cho cả 4 game (điểm tập chơi), trang 📖 Luật, tích hợp menu trò chơi. Bài vẽ 2D (nhẹ). Màn hình nhỏ phải hiển thị rõ 13 lá, vuốt chọn nhiều lá, gợi ý nước đi, hoàn tác chọn nhầm.
3. **Bot chia bài + ví/sổ cái/luật bàn + màn Quản trị ví** + luật Firestore mới + hướng dẫn cài bot (Windows/Linux/VPS) + tín hiệu "người chia bài".
4. **Phòng chơi online** giữa thành viên (tạo/vào phòng bằng mã, ghế, sẵn sàng, mang điểm vào bàn, rời/thoát, máy thay người thoát, chơi lại).
5. **Tích hợp Zalo:** nút Mời qua Zalo (chia sẻ), nút Mở nhóm Zalo (link admin cấu hình).

### Ước tính token (gói Pro 20 USD, nên chia đợt)
Đợt 1: 200–350k · Đợt 2: 150–250k · Đợt 3: 150–250k · Đợt 4: 200–350k · Đợt 5: 15–30k. Tổng khoảng 0,7–1,2 triệu.
Mẹo tiết kiệm: mỗi đợt một phiên mới, ít chụp màn hình, không chạy bộ kiểm thử đầy đủ sau mỗi sửa nhỏ, không dùng nhiều tác nhân song song.

## 8. Việc người dùng cần làm (khi tới đợt tương ứng)
- Chọn **máy chạy bot** (PC công ty luôn bật / mini PC / VPS) và cài Node.js trên máy đó.
- Tải **khóa quản trị Firebase (service account)** đặt trên máy bot (mình hướng dẫn từng bước), không đưa lên GitHub.
- Dán lại `firestore.rules` mới vào Firebase (Rules → Publish).
- Dán link nhóm Zalo vào cấu hình (đợt 5).
- Thử bằng ≥2 điện thoại thật khi xong đợt 4 (môi trường làm việc không có điện thoại thật nên chỉ kiểm thử được luật và logic).

## 9. Rủi ro đã thống nhất
- Điểm có thể bị dùng như tiền thật giữa đồng nghiệp: app không ngăn được; nên có chính sách nội bộ và dòng "không quy đổi".
- Không có máy chủ chống gian lận tuyệt đối ngoài bot; sổ cái giúp admin phát hiện và chỉnh lại. Hai tài khoản của một người ngồi cùng bàn để thông đồng: chỉ chặn được một phần (một thiết bị không vào cùng bàn hai lần).
- Bot tắt thì chơi online dừng (chơi với máy vẫn dùng được).

## 10. Tiến độ
- [x] Chốt phương án (file này).
- [ ] Đợt 1  - [ ] Đợt 2  - [ ] Đợt 3  - [ ] Đợt 4  - [ ] Đợt 5
