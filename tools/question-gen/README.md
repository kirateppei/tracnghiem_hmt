# Bộ câu hỏi hq1–hq150 (không có câu tính toán)

- `text_q.py`: 109 câu hỏi chữ; `img_q.py`: 38 câu có hình + 3 câu có video (mỗi dòng ghi tên cảnh vẽ).
- `scenes.html`: các cảnh mô phỏng vẽ bằng SVG (màn hình biến tần, ảnh nhiệt, ảnh EL, đồng hồ đo, lắp đặt sai…) và 3 video (`SV`).
- `shot.js` chụp cảnh ra PNG, `vid.js` xuất khung hình rồi ghép video bằng ffmpeg (6 khung/giây, h264).
- `build.py` đổi hình sang webp, chép vào `docs/media/`, xáo đáp án và nối vào `docs/questions.js` (đã chạy một lần, chạy lại sẽ thêm trùng).
Hình là mô phỏng, không phải ảnh chụp thật. Có ảnh/video thật từ công trình thì thêm câu hỏi qua tab Quản trị.

## Bộ hq151–hq181: cách dùng máy đo (31/10/2026)
- `meter_q.py`: 30 câu (1 câu trùng đã bỏ) về ampe kìm, máy đo cách điện, camera nhiệt, máy đo điện trở đất.
- 14 câu dùng **ảnh thật từ công trình** do công ty gửi (đã cắt bỏ dấu thời gian/địa điểm, làm mờ bản đồ, tọa độ GPS và khuôn mặt người) — ảnh gốc không lưu trong repo; 1 ảnh máy Kyoritsu 3005A là ảnh sản phẩm.
- 2 câu dùng hình mô phỏng `earth3p` (đo điện trở đất 3 cực).

## hq182–hq187: ảnh thật ampe kìm SEW 3900 CL đo điện áp DC tại cực tủ pin (`meter_q2.py`, chạy bằng build2.py đổi tên file câu hỏi).
## hq188–hq193: súng đo nhiệt hồng ngoại Hioki FT3700 (`meter_q3.py`, ảnh sản phẩm do công ty gửi).
## hq194–hq198: máy đo điện trở đất Kyoritsu 4105A (`meter_q4.py`, ảnh sản phẩm do công ty gửi).
## hq199–hq207: nhận biết và sử dụng biến tần Huawei, GoodWe (`inv_q.py`, ảnh sản phẩm đã cắt bỏ logo và huy hiệu của đại lý).
## hq208–hq216: hệ hybrid LuxPower/Senergy, đọc app giám sát (`hyb_q.py`; ảnh công trình đã làm mờ mặt người, bản đồ, dấu thời gian; ảnh lắp đặt đã cắt số điện thoại quảng cáo).
## hq217–hq229: tủ tụ bù, tủ phân phối ACB/MCCB, phát quang và phun cỏ nhà máy (`site_q.py`; ảnh công trình đã làm mờ bản đồ, dấu thời gian, cắt watermark Timemark).
